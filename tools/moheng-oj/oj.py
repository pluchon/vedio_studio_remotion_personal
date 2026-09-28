"""本地墨衡 OJ 的小工具：执行 SQL、管理员登录、学员登录（验证码从 Redis 读取），令牌只写入文件不打印"""
from __future__ import annotations

import json
import re
import subprocess
import urllib.error
import urllib.request

GW = "http://127.0.0.1:19090"
SEED_SQL = r"C:\JavaCode\items\online_oj\deploy\db_sql\oj_init.sql"


def http(method: str, url: str, token: str | None = None, body: object = None) -> tuple[int, dict]:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(req, timeout=90) as resp:
            status, raw = resp.status, resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as e:
        status, raw = e.code, e.read().decode("utf-8", errors="replace")
    try:
        return status, json.loads(raw)
    except ValueError:
        return status, {"_raw": raw[:300]}


def sql(query: str) -> list[list[str]]:
    proc = subprocess.run(
        ["docker", "exec", "-e", "Q=" + query, "oj-mysql", "sh", "-c",
         'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" --default-character-set=utf8mb4 bitoj_dev -N -B -e "$Q"'],
        capture_output=True, text=True, encoding="utf-8")
    err = "\n".join(l for l in proc.stderr.splitlines() if "Using a password" not in l)
    if proc.returncode != 0 or err.strip():
        raise RuntimeError("SQL 失败: " + err + " | " + query[:200])
    return [line.split("\t") for line in proc.stdout.splitlines()]


def redis(*args: str) -> str:
    proc = subprocess.run(
        ["docker", "exec", "oj-redis", "sh", "-c", 'redis-cli -a "$REDIS_PASSWORD" --no-auth-warning "$@"', "sh", *args],
        capture_output=True, text=True, encoding="utf-8")
    if proc.returncode != 0:
        raise RuntimeError("redis 失败: " + proc.stderr)
    return proc.stdout.strip()


def admin_login() -> str:
    seed = open(SEED_SQL, encoding="utf-8").read()
    m = re.search(r"管理端\s*(\S+)\s*/\s*(\S+?)[；;]", seed)
    _, js = http("POST", GW + "/system/sysUser/login", body={"userAccount": m.group(1), "password": m.group(2)})
    if js.get("code") != 1000:
        raise RuntimeError("管理员登录失败: " + str(js.get("msg")))
    return js["data"]


def user_login(phone: str) -> str:
    _, js = http("POST", GW + "/friend/user/send-code", body={"phone": phone})
    if js.get("code") != 1000:
        raise RuntimeError("发送验证码失败: " + str(js.get("msg")))
    raw = redis("GET", "sms_code:" + phone)
    code = re.sub(r"\D", "", raw)
    if not code:
        raise RuntimeError("Redis 里没有验证码")
    _, js = http("POST", GW + "/friend/user/login", body={"phone": phone, "code": code})
    if js.get("code") != 1000:
        raise RuntimeError("学员登录失败: " + str(js.get("msg")))
    return js["data"]
