# データ収集スクリプト

GitHub APIを使ってClaudeスキルのデータを自動収集し、自動翻訳するスクリプトです。

## 機能

- ✅ GitHub APIから最新のスキルデータを取得
- ✅ 自動翻訳（googletrans または OpenAI API）
- ✅ 日本語と英語の両方を保存

## 使い方

### 1. 基本的な実行（自動翻訳あり - googletrans）

```bash
cd /mnt/c/Users/bestg/codes/skillsmp-jp

# googletransライブラリをインストール（初回のみ）
pip3 install googletrans==4.0.0-rc1

# スクリプトを実行
python3 scripts/fetch_skills.py
```

デフォルトで `googletrans` を使って自動翻訳されます。

**注意**:
- GitHub Tokenなしの場合、APIのレート制限（60リクエスト/時）があります
- googletransは無料ですが、時々不安定になることがあります

### 2. OpenAI APIを使った高品質翻訳

より高品質な翻訳が必要な場合は、OpenAI APIを使用できます。

```bash
# 環境変数を設定
export TRANSLATION_METHOD=openai
export OPENAI_API_KEY=your_openai_api_key_here

# スクリプトを実行
python3 scripts/fetch_skills.py
```

### 3. 翻訳なしで実行

翻訳せずに英語のままデータを取得する場合:

```bash
TRANSLATION_METHOD=none python3 scripts/fetch_skills.py
```

### 4. GitHub Tokenを使った実行（推奨）

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

または、すべての環境変数を一度に設定:

```bash
GITHUB_TOKEN=your_token TRANSLATION_METHOD=googletrans python3 scripts/fetch_skills.py
```

## 環境変数

| 変数名 | 説明 | デフォルト値 | 必須 |
|--------|------|-------------|------|
| `GITHUB_TOKEN` | GitHub Personal Access Token | なし | ❌ |
| `TRANSLATION_METHOD` | 翻訳方法 (googletrans/openai/none) | googletrans | ❌ |
| `OPENAI_API_KEY` | OpenAI APIキー | なし | ❌ (openai使用時のみ) |

## 出力

スクリプトは以下のファイルを生成します:

- `data/skills.json` - 収集したスキルデータ（日本語 + 英語の両方）

### 出力フォーマット

```json
{
  "id": "anthropics-algorithmic-art",
  "name": "アルゴリズミックアート",
  "nameEn": "Algorithmic Art",
  "description": "p5.jsを使用してシード付きランダム性と...",
  "descriptionEn": "Creating algorithmic art using p5.js with seeded randomness...",
  "category": "開発者ツール",
  "categoryEn": "Developer Tools",
  "author": "anthropics",
  "stars": 15347,
  "tags": ["p5.js", "generative-art"],
  "githubUrl": "https://github.com/anthropics/skills/tree/main/algorithmic-art"
}
```

## スクリプトの動作

1. GitHub APIで `anthropics/skills` リポジトリにアクセス
2. 各スキルディレクトリから `SKILL.md` ファイルを取得
3. YAMLフロントマターから名前、説明、カテゴリ、タグを抽出
4. **自動翻訳**: 名前と説明を日本語に翻訳（googletrans または OpenAI API）
5. リポジトリのメタデータ（Stars数、更新日など）を収集
6. 日本語と英語の両方のデータを `data/skills.json` に保存

## トラブルシューティング

### "Rate limit exceeded" エラー

GitHub Tokenを設定してください（上記参照）。

### "googletrans not installed" エラー

googletransライブラリをインストールしてください:

```bash
pip3 install googletrans==4.0.0-rc1
```

### 翻訳が失敗する場合

1. **googletransが不安定な場合**:
   - OpenAI APIを使用してください（より安定）
   - または `TRANSLATION_METHOD=none` で翻訳なしで実行

2. **OpenAI APIエラーの場合**:
   - `OPENAI_API_KEY` が正しく設定されているか確認
   - APIキーの残高を確認
   - `TRANSLATION_METHOD=googletrans` に切り替え

### "No repositories found" エラー

- インターネット接続を確認
- GitHub APIのステータスを確認: https://www.githubstatus.com/

### その他のエラー

エラーメッセージとURLを確認して、GitHub APIのドキュメントを参照してください:
https://docs.github.com/en/rest

## 依存関係

### 必須
- Python 3.7+
- urllib (標準ライブラリ)

### オプション
- `googletrans==4.0.0-rc1` (googletrans翻訳を使用する場合)
- OpenAI APIキー (OpenAI翻訳を使用する場合)
