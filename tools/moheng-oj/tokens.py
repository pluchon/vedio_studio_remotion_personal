"""登录管理员与演示学员，把令牌写入同目录的 tokens.json（不打印，已被 .gitignore 忽略）

用法：python tools/moheng-oj/tokens.py [学员手机号，默认 13800000002]
"""
from __future__ import annotations

import json
import os
import sys

import oj

phone = sys.argv[1] if len(sys.argv) > 1 else "13800000002"
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "tokens.json")
with open(out, "w", encoding="utf-8") as f:
    json.dump({"b": oj.admin_login(), "c": oj.user_login(phone)}, f)
print("令牌已写入 tokens.json")
