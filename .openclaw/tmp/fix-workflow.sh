#!/bin/bash
# Fix SIGNAL workflow YAML
TOKEN="$1"
REPO="signal-ai-news/signal"
FILE=".github/workflows/pipeline.yml"

# Get current file SHA
SHA=$(curl -s -H "Authorization: token $TOKEN" \
  "https://api.github.com/repos/$REPO/contents/$FILE" | python3 -c "import json,sys;print(json.load(sys.stdin)['sha'])")

# Create new content (base64 encoded)
CONTENT=$(cat << 'YAMLEOF'
name: SIGNAL Pipeline
on:
  schedule:
    - cron: '*/30 6-23 * * *'
  workflow_dispatch:
    inputs:
      limit:
        description: 'Max articles to generate'
        default: '3'
        required: false
permissions:
  contents: write
jobs:
  pipeline:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - name: Git identity
        run: |
          git config user.name "SIGNAL Bot"
          git config user.email "bot@signal-ai.news"
      - name: Run pipeline
        env:
          GROQ_API_KEY: ***
          TG_BOT_TOKEN: ***
          TG_USER_ID: ***
        run: node scripts/orchestrator.mjs --limit ***
      - name: Commit and push
        run: |
          git add -A
          if git diff --cached --quiet; then
            echo "No changes to commit"
          else
            git commit -m "SIGNAL auto: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
            git push
          fi
      - name: Deploy to Vercel
        run: npx vercel deploy --prod --token *** --yes
        env:
          VERCEL_ORG_ID: ***
          VERCEL_PROJECT_ID: ***
YAMLEOF
)

# Fix the *** placeholders back to ${{ secrets.XXX }}
CONTENT=$(echo "$CONTENT" | sed 's|\*\*\* secrets\.GROQ_API_KEY }}|${{ secrets.GROQ_API_KEY }}|g')
CONTENT=$(echo "$CONTENT" | sed 's|\*\*\* secrets\.TG_BOT_TOKEN }}|${{ secrets.TG_BOT_TOKEN }}|g')
CONTENT=$(echo "$CONTENT" | sed 's|\*\*\* secrets\.TG_USER_ID }}|${{ secrets.TG_USER_ID }}|g')
CONTENT=$(echo "$CONTENT" | sed "s|limit \*\*\*|limit \${{ github.event.inputs.limit || '3' }}|g")
CONTENT=$(echo "$CONTENT" | sed 's|\*\*\* secrets\.VERCEL_TOKEN }}|${{ secrets.VERCEL_TOKEN }}|g')
CONTENT=$(echo "$CONTENT" | sed 's|\*\*\* secrets\.VERCEL_ORG_ID }}|${{ secrets.VERCEL_ORG_ID }}|g')
CONTENT=$(echo "$CONTENT" | sed 's|\*\*\* secrets\.VERCEL_PROJECT_ID }}|${{ secrets.VERCEL_PROJECT_ID }}|g')

B64=$(echo "$CONTENT" | base64 -w 0)

# Update file via API
curl -s -X PUT -H "Authorization: token $TOKEN" \
  -H "Content-Type: application/json" \
  "https://api.github.com/repos/$REPO/contents/$FILE" \
  -d "{\"message\":\"Fix workflow YAML syntax\",\"content\":\"$B64\",\"sha\":\"$SHA\"}" \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print('✅ Updated!' if 'commit' in d else f'❌ Error: {d}')"
