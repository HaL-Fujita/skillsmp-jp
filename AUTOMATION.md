# 自動実行（スケジュール実行）の設定ガイド

このドキュメントでは、スクレイピングスクリプトを自動的に定期実行する3つの方法を説明します。

## 📋 目次

1. [GitHub Actions（推奨）](#1-github-actions推奨)
2. [ローカルCron（開発環境）](#2-ローカルcron開発環境)
3. [Vercel Cron Jobs（Vercelデプロイ時）](#3-vercel-cron-jobsvercelデプロイ時)

---

## 1. GitHub Actions（推奨）

**最も簡単で信頼性が高い方法です。**

### ✅ メリット

- 無料（月2,000分のアクション時間）
- サーバー不要
- 自動的にGitにプッシュ
- ログが見やすい
- 手動実行も可能

### 🚀 セットアップ手順

#### ステップ1: GitHub Secretsを設定

1. GitHubリポジトリを開く
   ```
   https://github.com/HaL-Fujita/skillsmp-jp
   ```

2. **Settings** → **Secrets and variables** → **Actions** を開く

3. **New repository secret** をクリック

4. Secretを追加：
   - **Name**: `OPENAI_API_KEY`
   - **Value**: あなたのOpenAI APIキー（`sk-proj-xxx...`）
   - **Add secret** をクリック

#### ステップ2: 動作確認

1. **Actions** タブを開く
   ```
   https://github.com/HaL-Fujita/skillsmp-jp/actions
   ```

2. **Scrape Skills from SkillsMP.com** を選択

3. **Run workflow** ボタンをクリック

4. 実行を確認

### 📅 実行スケジュール

```yaml
# .github/workflows/scrape-skills.yml
schedule:
  - cron: '0 9 * * *'  # 毎日午前9時（UTC）/ 午後6時（JST）
```

#### スケジュールの変更

cron式を変更することで、実行タイミングを調整できます：

```yaml
# 毎日午前0時（UTC）/ 午前9時（JST）
- cron: '0 0 * * *'

# 毎週月曜日の午前9時（UTC）
- cron: '0 9 * * 1'

# 毎月1日の午前9時（UTC）
- cron: '0 9 1 * *'

# 1日3回（午前0時、8時、16時 UTC）
- cron: '0 0,8,16 * * *'
```

### 🔍 ログの確認

1. **Actions** タブを開く
2. 最新の実行をクリック
3. **scrape** ジョブをクリック
4. 各ステップの詳細を確認

---

## 2. ローカルCron（開発環境）

**ローカルPC上で定期実行する場合に使用します。**

### ⚠️ 注意事項

- PCが起動している必要がある
- 開発・テスト用途向け
- 本番環境ではGitHub Actionsを推奨

### Windows (WSL2/Ubuntu)

#### セットアップ

```bash
# crontabを編集
crontab -e

# エディタが開いたら、以下を追加
# 毎日午前9時に実行
0 9 * * * cd /mnt/c/Users/bestg/codes/skillsmp-jp && /usr/bin/npm run scrape:push >> /tmp/skillsmp-scrape.log 2>&1

# 保存して終了（viの場合: Esc → :wq）
```

#### 動作確認

```bash
# cronサービスの状態確認
service cron status

# cronサービスを起動（停止している場合）
sudo service cron start

# ログを確認
tail -f /tmp/skillsmp-scrape.log
```

### macOS

#### セットアップ

```bash
# crontabを編集
crontab -e

# 以下を追加
0 9 * * * cd ~/codes/skillsmp-jp && npm run scrape:push >> /tmp/skillsmp-scrape.log 2>&1
```

#### 動作確認

```bash
# cron jobを確認
crontab -l

# ログを確認
tail -f /tmp/skillsmp-scrape.log
```

### Windows タスクスケジューラ

#### セットアップ

1. **タスクスケジューラ**を開く
   - Windows検索で「タスクスケジューラ」と入力

2. **タスクの作成**をクリック

3. **全般**タブ：
   - 名前: `SkillsMP Scraper`
   - 説明: `SkillsMPからスキルデータを自動取得`

4. **トリガー**タブ：
   - **新規** をクリック
   - トリガーの開始: **スケジュールに従う**
   - 設定: **毎日**
   - 開始時刻: `09:00:00`
   - **OK**

5. **操作**タブ：
   - **新規** をクリック
   - 操作: **プログラムの開始**
   - プログラム: `C:\Program Files\nodejs\npm.cmd`
   - 引数: `run scrape:push`
   - 開始: `C:\Users\bestg\codes\skillsmp-jp`
   - **OK**

6. **OK** をクリックして保存

---

## 3. Vercel Cron Jobs（Vercelデプロイ時）

**Vercelにデプロイしている場合に使用します。**

### ✅ メリット

- Vercel環境と統合
- サーバーレス実行
- 簡単な設定

### ⚠️ 制限事項

- 実行時間: 最大10秒（Hobby）/ 60秒（Pro）
- 翻訳処理（10-15分）は**実行できません**
- データ取得のみ（翻訳なし）に適しています

### 🚀 セットアップ手順

#### ステップ1: Vercel環境変数を設定

1. Vercelダッシュボードを開く
   ```
   https://vercel.com/dashboard
   ```

2. プロジェクトを選択

3. **Settings** → **Environment Variables**

4. 以下の環境変数を追加：
   - **OPENAI_API_KEY**: あなたのAPIキー（オプション）
   - **CRON_SECRET**: ランダムな文字列（セキュリティ用）
     ```bash
     # 生成方法
     openssl rand -hex 32
     ```

#### ステップ2: デプロイ

```bash
# Vercel CLIでデプロイ
vercel

# または、GitHubにプッシュすれば自動デプロイ
git push origin main
```

#### ステップ3: 動作確認

```bash
# 手動でAPIエンドポイントを呼び出し
curl -X POST https://your-app.vercel.app/api/scrape \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### 📅 Cronスケジュール

`vercel.json`で設定：

```json
{
  "crons": [
    {
      "path": "/api/scrape",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## 🔄 各方法の比較

| 項目 | GitHub Actions | ローカルCron | Vercel Cron |
|------|----------------|-------------|-------------|
| **無料** | ✅ 2,000分/月 | ✅ 完全無料 | ⚠️ 制限あり |
| **翻訳対応** | ✅ 対応 | ✅ 対応 | ❌ タイムアウト |
| **サーバー** | 不要 | PC必要 | 不要 |
| **セットアップ** | 簡単 | 中程度 | 簡単 |
| **ログ確認** | 見やすい | コマンドライン | Vercelログ |
| **推奨度** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |

---

## 📝 推奨設定

### プロダクション環境

- **GitHub Actions**を使用
- OPENAI_API_KEYをSecretに設定
- 毎日自動実行

### 開発・テスト環境

- **ローカルCron**を使用
- 頻度を高めに設定（例: 1時間ごと）
- ログをリアルタイムで確認

---

## ❓ トラブルシューティング

### GitHub Actionsが実行されない

1. **Secretが設定されているか確認**
   - Settings → Secrets and variables → Actions

2. **Actionsが有効か確認**
   - Settings → Actions → General
   - "Allow all actions and reusable workflows" を選択

3. **手動実行でテスト**
   - Actions → Scrape Skills → Run workflow

### ローカルCronが動かない

```bash
# cronサービスが起動しているか確認
service cron status

# cronログを確認
grep CRON /var/log/syslog

# 手動でコマンドをテスト
cd /mnt/c/Users/bestg/codes/skillsmp-jp && npm run scrape:push
```

### Vercel Cronがタイムアウトする

- Vercel Cron Jobsの実行時間制限により、翻訳処理は実行できません
- 翻訳なしで実行するか、GitHub Actionsを使用してください

---

## 🎯 次のステップ

1. **GitHub Secretsを設定**（推奨）
2. **手動でテスト実行**
3. **翌日の自動実行を確認**
4. **必要に応じてスケジュールを調整**

ご不明な点があれば、GitHubのIssuesでお気軽にお尋ねください！
