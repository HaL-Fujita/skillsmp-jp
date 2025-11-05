#!/bin/bash
#
# スクレイピング後のデータを自動的にGitにコミット・プッシュするスクリプト
#
# 使い方:
#   bash scripts/commit-and-push.sh
#   または
#   npm run scrape:push
#

set -e  # エラーが発生したら終了

echo "🔍 Checking for changes in data/skills.json..."

# data/skills.jsonに変更があるかチェック
if git diff --quiet data/skills.json; then
  echo "✅ No changes detected in skills data"
  exit 0
fi

echo "📝 Changes detected! Preparing to commit..."

# data/skills.jsonの統計情報を取得
SKILL_COUNT=$(jq length data/skills.json)
echo "📊 Total skills: $SKILL_COUNT"

# 現在の日時を取得（JST）
TIMESTAMP=$(TZ=Asia/Tokyo date "+%Y-%m-%d %H:%M:%S JST")

# コミットメッセージを作成
COMMIT_MESSAGE="chore: update skills data ($SKILL_COUNT skills)

Updated skills data from SkillsMP.com

- Total skills: $SKILL_COUNT
- Updated at: $TIMESTAMP

🤖 Generated with Claude Code
"

# Gitの設定を確認
if ! git config user.name > /dev/null 2>&1; then
  echo "⚙️  Setting git user.name..."
  git config user.name "Automated Scraper"
fi

if ! git config user.email > /dev/null 2>&1; then
  echo "⚙️  Setting git user.email..."
  git config user.email "scraper@skillsmp-jp.local"
fi

# ステージング
echo "➕ Adding data/skills.json..."
git add data/skills.json

# コミット
echo "💾 Committing changes..."
git commit -m "$COMMIT_MESSAGE"

# 現在のブランチを取得
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📤 Pushing to $CURRENT_BRANCH..."

# プッシュ
git push origin "$CURRENT_BRANCH"

echo "✅ Successfully pushed changes to GitHub!"
echo ""
echo "🔗 View your repository:"
git remote get-url origin | sed 's/\.git$//'
