import requests, subprocess, json

GIT_URL = subprocess.check_output(["git", "remote", "get-url", "origin"], cwd="/home/work/.openclaw/workspace/signal").decode().strip()
TOKEN = ***"//")[1].split("@")[0]
REPO = "signal-ai-news/signal"

# Check recent runs
resp = requests.get(f"https://api.github.com/repos/{REPO}/actions/runs?per_page=5", headers={"Authorization": f"token {TOKEN}"})
data = resp.json()
print("=== RECENT RUNS ===")
for run in data['workflow_runs']:
    print(f"  #{run['run_number']} | {run['conclusion']} | {run['name']} | {run['created_at']}")

# Check workflows
print("\n=== WORKFLOWS ===")
resp2 = requests.get(f"https://api.github.com/repos/{REPO}/actions/workflows", headers={"Authorization": f"token {TOKEN}"})
for wf in resp2.json().get('workflows', []):
    print(f"  {'✅' if wf['state']=='active' else '❌'} {wf['name']} | state: {wf['state']}")
