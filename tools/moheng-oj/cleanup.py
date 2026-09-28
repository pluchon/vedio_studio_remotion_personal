"""删除拍 ai.json 期间写入的数据：AI 辅导会话与消息、赛后复盘、难题分析缓存、当日 AI 辅导次数

用法：python tools/moheng-oj/cleanup.py "<开拍前记下的时间，如 2026-09-28 11:37:00>"
只删演示学员（13800000002）在该时间之后的记录。
"""
from __future__ import annotations

import sys

import oj

if len(sys.argv) < 2:
    sys.exit('用法：python tools/moheng-oj/cleanup.py "YYYY-MM-DD HH:MM:SS"')
start = sys.argv[1]
USER_ID = "1700000000000000002"

sessions = oj.sql(f"select session_id from tb_ai_chat_session where user_id = {USER_ID} and create_time >= '{start}'")
if sessions:
    ids = ",".join(r[0] for r in sessions)
    print("删除 AI 辅导消息:", oj.sql(f"delete from tb_ai_chat_message where session_id in ({ids}); select row_count()"))
    print("删除 AI 辅导会话:", oj.sql(f"delete from tb_ai_chat_session where session_id in ({ids}); select row_count()"))
print("删除赛后复盘:", oj.sql(f"delete from tb_exam_review where user_id = {USER_ID} and create_time >= '{start}'; select row_count()"))
print("删除难题分析缓存:", oj.redis("DEL", "overview:hard_analysis"))
print("删除当日 AI 辅导次数:", oj.redis("DEL", f"ai:tutor:quota:{USER_ID}:{start[:10].replace('-', '')}"))
print("残留会话:", oj.sql(f"select count(1) from tb_ai_chat_session where create_time >= '{start}'"))
