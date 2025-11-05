# SkillsMP Japan - Claude Code Skills マーケットプレイス（日本語版）

Claude Code Skills の日本語マーケットプレイス。[SkillsMP.com](https://skillsmp.com/) から全スキルデータを自動取得し、日本語で提供します。

## 🌟 特徴

- 📦 **2,277個以上のスキル**を掲載
- 🔄 **毎日自動更新** - GitHub Actionsによる定期スクレイピング
- 🇯🇵 **日本語対応** - カテゴリやUIを日本語化
- ⚡ **高速検索** - 名前、説明、タグでリアルタイム検索
- 📊 **詳細な統計** - スター数、フォーク数、最終更新日
- 🎨 **レスポンシブデザイン** - モバイルからデスクトップまで対応

## 🚀 クイックスタート

### 開発環境のセットアップ

```bash
# リポジトリをクローン
git clone <repository-url>
cd skillsmp-jp

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

### スキルデータの取得

```bash
# SkillsMP.com から最新データを取得
npm run scrape

# または直接実行
npx tsx scripts/fetch-from-skillsmp.ts
```

## 📂 プロジェクト構成

```
skillsmp-jp/
├── app/                          # Next.js App Router
│   ├── page.tsx                 # ホームページ
│   ├── skills/                  # スキル関連ページ
│   │   ├── page.tsx            # スキル一覧
│   │   └── [id]/page.tsx       # スキル詳細
│   └── layout.tsx              # ルートレイアウト
├── data/
│   └── skills.json             # スキルデータ（2,277件）
├── scripts/
│   ├── fetch-from-skillsmp.ts  # スクレイピングスクリプト（TypeScript）
│   ├── fetch_skills.py         # 旧スクリプト（Python、非推奨）
│   └── README.md               # スクリプト説明
├── types/
│   └── skill.ts                # TypeScript型定義
├── .github/
│   └── workflows/
│       └── scrape-skills.yml   # 自動スクレイピング設定
└── public/                      # 静的アセット
```

## 🔧 スクレイピング機能

### 自動更新

このプロジェクトは、GitHub Actions を使用して**毎日自動的に**最新のスキルデータを取得します。

- **実行スケジュール**: 毎日午前9時（UTC）/ 午後6時（JST）
- **データソース**: [SkillsMP.com API](https://skillsmp.com/api/skills)
- **自動コミット**: データが更新された場合のみ自動コミット・プッシュ

### 手動実行

#### コマンドライン

```bash
# スキルデータを取得
npm run scrape

# または
npm run scrape:skillsmp
```

#### GitHub Actions（手動トリガー）

1. GitHubリポジトリの「Actions」タブを開く
2. 「Scrape Skills from SkillsMP.com」ワークフローを選択
3. 「Run workflow」ボタンをクリック

### スクレイピングの仕組み

```typescript
// 1. APIから全ページを取得（最大100件/ページ）
for (page = 1; page <= totalPages; page++) {
  const response = await fetch(
    `https://skillsmp.com/api/skills?page=${page}&limit=100`
  );
  // ...
}

// 2. データを変換
const transformedSkills = rawSkills.map(skill => ({
  id: skill.id,
  name: skill.name,
  description: skill.description,
  category: translateCategory(skill.category),
  stars: skill.stars,
  forks: skill.forks,
  updatedAt: formatDate(skill.updatedAt),
  // ...
}));

// 3. JSONファイルに保存
fs.writeFileSync('data/skills.json', JSON.stringify(transformedSkills, null, 2));
```

### 取得データの詳細

各スキルには以下の情報が含まれます：

| フィールド | 説明 | 例 |
|-----------|------|-----|
| `id` | 一意のID | `anthropics-skills-brand-guidelines-skill-md` |
| `name` | スキル名 | `brand-guidelines` |
| `description` | 説明 | `Brand identity and guidelines management` |
| `category` | カテゴリ（日本語） | `開発者ツール` |
| `author` | 作者 | `anthropics` |
| `authorAvatar` | アバターURL | `https://avatars.githubusercontent.com/...` |
| `stars` | GitHubスター数 | `2393` |
| `forks` | フォーク数 | `148` |
| `updatedAt` | 最終更新日 | `2025-11-04` |
| `githubUrl` | GitHubリポジトリURL | `https://github.com/...` |
| `language` | 実装言語 | `Python`, `TypeScript` |
| `hasMarketplace` | Marketplace対応 | `true`/`false` |

## 📊 データ統計

現在のデータ（2025年11月5日時点）：

- **総スキル数**: 2,277
- **トップカテゴリ**:
  - 開発者ツール: 564
  - Web & アプリ開発: 398
  - テスト & QA: 240
- **トップ言語**:
  - Python: 1,115
  - Shell: 377
  - TypeScript: 262

## 🛠 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **UI**: React 19 + Tailwind CSS 4
- **言語**: TypeScript 5
- **スクレイピング**: Node.js fetch API
- **CI/CD**: GitHub Actions
- **ホスティング**: Vercel（推奨）

## 📜 利用可能なスクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバーを起動（localhost:3000） |
| `npm run build` | 本番ビルドを作成 |
| `npm start` | 本番サーバーを起動 |
| `npm run lint` | ESLintを実行 |
| `npm run scrape` | スキルデータを取得 |

## 🔍 カテゴリ一覧

1. **開発者ツール** (`developer-tools`) - 564スキル
2. **Web & アプリ開発** (`web-app-development`) - 398スキル
3. **テスト & QA** (`testing-qa`) - 240スキル
4. **ドキュメント & コンテンツ** (`documents-content`) - 211スキル
5. **データベース & データ** (`database-data`) - 190スキル
6. **API & バックエンド** (`api-backend`) - 173スキル
7. **DevOps & インフラ** (`devops-infrastructure`) - 125スキル
8. **セキュリティ & 監視** (`security-monitoring`) - 83スキル
9. **科学計算** (`scientific-computing`) - 80スキル
10. **AI & 機械学習** (`ai-ml`) - 76スキル
11. **Claudeエコシステム** (`claude-ecosystem`) - 46スキル
12. **その他** (`other`) - 91スキル

## 🚢 デプロイ

### Vercelにデプロイ

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=<your-repo-url>)

または手動でデプロイ：

```bash
# Vercel CLIをインストール
npm i -g vercel

# デプロイ
vercel
```

### 環境変数

現在、特別な環境変数は不要です。すべて公開APIを使用しています。

## 🤝 コントリビューション

コントリビューションを歓迎します！

1. このリポジトリをフォーク
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。

## 🔗 関連リンク

- [SkillsMP.com](https://skillsmp.com/) - 元データソース
- [Claude Code 公式ドキュメント](https://docs.claude.com/claude-code)
- [Anthropic Skills リポジトリ](https://github.com/anthropics/skills)

## ❓ FAQ

### Q: データはどのくらいの頻度で更新されますか？

A: GitHub Actionsにより、毎日自動的に更新されます。手動で `npm run scrape` を実行して即座に更新することもできます。

### Q: スキルを追加するには？

A: このサイトは [SkillsMP.com](https://skillsmp.com/) からデータを取得しています。スキルを追加したい場合は、GitHub でスキルを公開し、SkillsMP.com に登録される必要があります。

### Q: オフラインで動作しますか？

A: はい。データは静的JSONファイルとして保存されているため、ビルド後はオフラインでも動作します。

### Q: 他の言語に翻訳できますか？

A: 現在は日本語のみですが、i18n対応を追加することで他の言語にも対応可能です。

---

**Made with ❤️ for the Claude Code community**
