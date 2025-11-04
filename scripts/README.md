# データ収集スクリプト

GitHub APIを使ってClaudeスキルのデータを自動収集するスクリプトです。

## 使い方

### 1. 基本的な実行（GitHub Token無し）

```bash
cd /mnt/c/Users/bestg/codes/skillsmp-jp
python3 scripts/fetch_skills.py
```

**注意**: GitHub Tokenなしの場合、APIのレート制限（60リクエスト/時）があります。

### 2. GitHub Tokenを使った実行（推奨）

レート制限を緩和するため、GitHub Personal Access Tokenを使用できます。

#### GitHub Tokenの作成方法

1. GitHub にログイン
2. Settings → Developer settings → Personal access tokens → Tokens (classic)
3. "Generate new token (classic)" をクリック
4. スコープ: `public_repo` を選択
5. Tokenをコピー

#### 実行方法

```bash
# 環境変数でTokenを設定
export GITHUB_TOKEN=your_github_token_here

# スクリプトを実行
cd /mnt/c/Users/bestg/codes/skillsmp-jp
python3 scripts/fetch_skills.py
```

または、Windows（WSL）の場合:

```bash
GITHUB_TOKEN=your_github_token_here python3 scripts/fetch_skills.py
```

## 出力

スクリプトは以下のファイルを生成します:

- `data/skills.json` - 収集したスキルデータ（JSONフォーマット）

## スクリプトの動作

1. GitHub APIで `marketplace.json` を含むリポジトリを検索
2. 各リポジトリから `marketplace.json` を取得
3. リポジトリのメタデータ（Stars数、更新日など）を収集
4. カテゴリを日本語に変換
5. `data/skills.json` に保存

## トラブルシューティング

### "Rate limit exceeded" エラー

GitHub Tokenを設定してください（上記参照）。

### "No repositories found" エラー

- インターネット接続を確認
- GitHub APIのステータスを確認: https://www.githubstatus.com/

### その他のエラー

エラーメッセージとURLを確認して、GitHub APIのドキュメントを参照してください:
https://docs.github.com/en/rest
