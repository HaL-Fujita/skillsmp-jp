# Vercelデプロイ手順

このドキュメントでは、skillsmp-jpをVercelにデプロイして自動更新機能を有効にする手順を説明します。

## 前提条件

- GitHubアカウント
- Vercelアカウント（無料）
- OpenAI APIキー

## デプロイ手順

### 1. GitHubリポジトリの準備

プロジェクトをGitHubにプッシュします。

```bash
cd /path/to/skillsmp-jp

# まだGitリポジトリでない場合
git init
git add .
git commit -m "Initial commit"

# GitHubにリポジトリを作成してプッシュ
git remote add origin https://github.com/YOUR_USERNAME/skillsmp-jp.git
git branch -M main
git push -u origin main
```

### 2. Vercelにデプロイ

1. [Vercel](https://vercel.com)にアクセスしてログイン
2. **"Add New Project"** をクリック
3. GitHubリポジトリ `skillsmp-jp` を選択
4. **"Import"** をクリック

### 3. 環境変数の設定

Vercelのプロジェクト設定で以下の環境変数を設定します。

#### 3.1 OpenAI APIキー

1. Vercelプロジェクトの **Settings** → **Environment Variables** に移動
2. 以下を追加:

```
Name: OPENAI_API_KEY
Value: sk-proj-xxxxxxxxxxxxx（あなたのOpenAI APIキー）
Environment: Production, Preview, Development（全て選択）
```

#### 3.2 Cron Secret（セキュリティ用）

ランダムなシークレットを生成して設定します。

```bash
# ローカルで実行してシークレットを生成
openssl rand -base64 32
```

生成された文字列をコピーして、Vercelに追加:

```
Name: CRON_SECRET
Value: （生成されたランダム文字列）
Environment: Production（本番環境のみ）
```

### 4. Vercel Cron Jobsの有効化

Vercelプロジェクトの設定:

1. **Settings** → **Cron Jobs** に移動
2. 自動的に検出された `/api/scrape` のCron Jobを確認
3. スケジュール: `0 0 * * *` （毎日0時UTCに実行）
4. **Enable** をクリック

### 5. デプロイの確認

1. Vercelダッシュボードで **Deployments** を確認
2. デプロイが成功したら、URLにアクセスしてサイトを確認
3. 例: `https://skillsmp-jp.vercel.app`

## 自動更新の仕組み

### データ更新フロー

1. **毎日0時UTC（日本時間9時）** にVercel Cronが `/api/scrape` を呼び出し
2. スクレイピングスクリプトが実行され、SkillsMP.com APIから最新データを取得
3. **差分のみを翻訳**（新規・更新されたスキルのみ）
4. `data/skills.json` を更新
5. 次回ビルド時に新しいデータが反映される

### 注意点

⚠️ **重要**: Vercel Cron Jobsで実行された場合、ファイルシステムへの書き込みは永続化されません。

データの永続化には以下の方法があります:

#### オプション1: GitHub Actions（推奨）

Cron Jobの代わりにGitHub Actionsを使用してデータを更新し、GitHubにプッシュ。

`.github/workflows/update-skills.yml`:

```yaml
name: Update Skills Data

on:
  schedule:
    - cron: '0 0 * * *' # 毎日0時UTC
  workflow_dispatch: # 手動実行も可能

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run scraper
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: npm run scrape

      - name: Commit and push if changed
        run: |
          git config --local user.name "github-actions[bot]"
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git add data/skills.json
          git diff --quiet && git diff --staged --quiet || (git commit -m "chore: update skills data [skip ci]" && git push)
```

GitHubリポジトリの **Settings** → **Secrets and variables** → **Actions** で `OPENAI_API_KEY` を設定。

#### オプション2: Vercel KV/Postgres

データをVercel KVやVercel Postgresに保存（有料プランが必要な場合あり）。

## 手動更新

緊急時やテスト時に手動でデータを更新する方法:

### 方法1: ローカルで実行してプッシュ

```bash
# ローカルでスクレイピング
npm run scrape

# GitHubにプッシュ
npm run push

# Vercelが自動的に再デプロイ
```

### 方法2: API経由で実行

```bash
# Vercelデプロイ後のURLとCRON_SECRETを使用
curl -X POST https://skillsmp-jp.vercel.app/api/scrape \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

## トラブルシューティング

### デプロイが失敗する

- **Build Command**: `npm run build` が正しく設定されているか確認
- **Node.js Version**: `package.json` の engines フィールドを確認
- **環境変数**: `OPENAI_API_KEY` が正しく設定されているか確認

### Cronが実行されない

- Vercelダッシュボードの **Cron Jobs** で有効化されているか確認
- `CRON_SECRET` が正しく設定されているか確認
- Vercelのログで実行履歴を確認

### データが更新されない

- Vercel Cronでは永続化されないため、GitHub Actionsを使用することを推奨
- または、手動で `npm run scrape:push` を実行

## コスト

### Vercel（Hobby Plan - 無料）

- ✅ 無料で使用可能
- ✅ 自動デプロイ
- ✅ Cron Jobs（月100回まで無料）
- ⚠️ サーバーレス関数の実行時間制限あり

### OpenAI API

- 翻訳コスト: 新規・更新分のみ翻訳するため、通常は1日あたり数円程度
- 初回の全スキル翻訳: 約2000スキル × 翻訳コスト

### GitHub Actions（推奨）

- ✅ 完全無料（公開リポジトリの場合）
- ✅ データが永続化される

## まとめ

本番環境での推奨構成:

1. **Vercel**: フロントエンドのホスティング
2. **GitHub Actions**: データの自動更新（毎日実行）
3. **OpenAI API**: 差分翻訳

この構成により、完全無料で自動更新されるサイトを運用できます。
