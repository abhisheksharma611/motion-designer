import datetime
import json
import re
import sys

GAP = 600


def parse(ts):
    return datetime.datetime.fromisoformat(ts.replace("Z", "+00:00"))


path = sys.argv[1]
until = parse(sys.argv[sys.argv.index("--until") + 1]) if "--until" in sys.argv else None
events, messages, marks = [], {}, {}
start = None
for line in open(path, errors="ignore"):
    try:
        d = json.loads(line)
    except json.JSONDecodeError:
        continue
    if "timestamp" not in d:
        continue
    t = parse(d["timestamp"])
    if until and t > until:
        break
    if start is None:
        if d.get("type") != "user":
            continue
        start = t
    events.append(t)
    if d.get("type") != "assistant":
        continue
    m = d.get("message", {})
    u = m.get("usage") or {}
    messages[m.get("id") or d.get("uuid")] = (t, u, [c for c in m.get("content") or [] if isinstance(c, dict) and c.get("type") == "tool_use"])


events.sort()


def totals(at):
    active = sum(g for g in ((b - a).total_seconds() for a, b in zip(events, events[1:]) if b <= at) if 0 < g < GAP)
    out = read = calls = 0
    for t, u, tools in messages.values():
        if t > at:
            continue
        out += u.get("output_tokens") or 0
        read += (u.get("input_tokens") or 0) + (u.get("cache_creation_input_tokens") or 0) + (u.get("cache_read_input_tokens") or 0)
        calls += len(tools)
    return {"secs": round(active), "out": out, "read": read, "calls": calls}


for t, u, tools in sorted(messages.values(), key=lambda m: m[0]):
    for c in tools:
        cmd = str((c.get("input") or {}).get("command", ""))
        if re.search(r"bash\s+\S*doctor\.sh", cmd) and "doctor" not in marks:
            marks["doctor"] = totals(t)
        if re.search(r"bash\s+\S*new_film\.sh\s", cmd) and "build" not in marks:
            marks["build"] = totals(t)
end = events[-1]
stats = {"session": path.rsplit("/", 1)[-1].split(".")[0], "from": start.isoformat(), "until": end.isoformat(), **totals(end), "marks": marks}
print("window.STATS = " + json.dumps(stats) + ";")
