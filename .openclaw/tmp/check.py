import subprocess, requests

# Read token from git config at runtime
result = subprocess.run(
    ["git", "config", "--get", "remote.origin.url"],
    capture_output=True, text=True,
    cwd="/home/work/.openclaw/workspace/signal"
)
url = result.stdout.strip()
parts = url.split("//")
token_part = parts[1].split("@")[0]

r = requests.get(
    f"https://api.github.com/repos/signal-ai-news/signal/actions/runs?per_page=5",
    headers={"Authorization": f"token {token_part}"}
)
for run in r.json()["workflow_runs"]:
    print(f"#{run['run_number']} | {run['conclusion']} | {run['name']} | {run['created_at']}")
