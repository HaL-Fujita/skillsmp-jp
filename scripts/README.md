# データ収集スクリプト

SkillsMP.com APIを使ってClaudeスキルのデータを自動収集し、自動翻訳するスクリプトです。

## 機能

- ✅ SkillsMP.com APIから最新のスキルデータを取得
- ✅ **差分更新**: 変更されたスキルのみを翻訳・更新（高速化 & コスト削減）
- ✅ 自動翻訳（OpenAI API）
- ✅ 日本語と英語の両方を保存
- ✅ 自動Git commit & push

## 使い方

### 1. 基本的な実行（差分更新 + OpenAI翻訳）

```bash
cd /mnt/c/Users/bestg/codes/skillsmp-jp

# .envファイルにOpenAI APIキーを設定（初回のみ）
echo "OPENAI_API_KEY=your_openai_api_key_here" > .env

# スクリプトを実行（差分のみを更新）
npm run scrape
```

**差分更新の動作:**
- 既存の `data/skills.json` を読み込み
- SkillsMP.com APIから最新データを取得
- 変更されたスキルのみを翻訳（新規追加 + 更新分）
- 変更がない場合は翻訳をスキップ

### 2. データ更新 + Git自動commit & push

```bash
# スクレイピング → コミット → プッシュを一括実行
npm run scrape:push
```

これにより以下が自動実行されます:
1. 差分更新スクリプトを実行
2. 変更があれば自動でGitにコミット
3. GitHubにプッシュ

### 3. 手動でコミット・プッシュのみ

```bash
# スクレイピング済みのデータをコミット・プッシュ
npm run push
```

## 環境変数

| 変数名 | 説明 | デフォルト値 | 必須 |
|--------|------|-------------|------|
| `OPENAI_API_KEY` | OpenAI APIキー（翻訳に使用） | なし | ✅ |

`.env`ファイルに設定することを推奨:
```bash
OPENAI_API_KEY=sk-proj-xxxxx
```

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

## スクリプトの動作（差分更新）

1. **既存データの読み込み**: `data/skills.json` から現在のデータを読み込む
2. **最新データの取得**: SkillsMP.com APIから全スキルを取得
3. **差分検出**:
   - 新規追加されたスキル
   - 更新されたスキル（stars, forks, updatedAt等の変更を検出）
   - 削除されたスキル
   - 変更なしのスキル
4. **効率的な翻訳**: 新規・更新されたスキルのみを翻訳（OpenAI API）
5. **データマージ**: 既存の翻訳済みデータと新規翻訳データを統合
6. **保存**: `data/skills.json` に保存

### 差分更新のメリット

- ⚡ **高速化**: 変更がない場合は翻訳をスキップ
- 💰 **コスト削減**: 新規・更新分のみ翻訳するため、OpenAI APIコストを大幅削減
- 🔄 **信頼性**: 既存の翻訳は保持され、新規分のみ更新

## トラブルシューティング

### OpenAI APIエラー

- `OPENAI_API_KEY` が `.env` ファイルに正しく設定されているか確認
- APIキーの残高を確認
- APIのレート制限に注意

### "No changes detected" が表示される

これは正常な動作です。変更がない場合は翻訳をスキップして処理を終了します。

### Git push が失敗する

- リモートリポジトリへのアクセス権限を確認
- ブランチが正しいか確認
- `git remote -v` でリモートURLを確認

### その他のエラー

エラーメッセージを確認して、SkillsMP.com APIのステータスを確認してください:
https://skillsmp.com/api/skills

## 依存関係

### 必須
- Node.js 20+
- npm
- OpenAI APIキー

### パッケージ
- `next` - Next.jsフレームワーク
- `openai` - OpenAI API クライアント
- `tsx` - TypeScript実行環境
- `dotenv` - 環境変数管理
