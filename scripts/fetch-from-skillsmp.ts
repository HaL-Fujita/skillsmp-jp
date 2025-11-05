#!/usr/bin/env tsx
/**
 * SkillsMP.com API Scraper with Translation
 *
 * skillsmp.comの公開APIから全スキルデータを取得し、
 * OpenAI APIで日本語に翻訳してJSONファイルに保存します。
 *
 * 使い方:
 *   OPENAI_API_KEY=sk-xxx npm run scrape:skillsmp
 *   または
 *   OPENAI_API_KEY=sk-xxx npx tsx scripts/fetch-from-skillsmp.ts
 *
 * 環境変数:
 *   OPENAI_API_KEY - OpenAI APIキー（翻訳を有効にする場合は必須）
 */

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import {
  translateWithOpenAI,
  batchTranslateParallel,
  isTranslationEnabled,
  getTranslationStats
} from './translator';

// 環境変数を読み込み
config();

// ====================================
// 型定義
// ====================================

// SkillsMP API レスポンスの型
interface SkillsMPSkill {
  id: string;
  name: string;
  author: string;
  authorAvatar: string;
  description: string;
  githubUrl: string;
  stars: number;
  forks: number;
  category: string;
  language: string;
  updatedAt: number; // Unix timestamp
  homepage: string | null;
  hasMarketplace: boolean;
}

interface SkillsMPResponse {
  skills: SkillsMPSkill[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search: string | null;
    sortBy: string | null;
    marketplaceOnly: boolean;
  };
}

// 出力用の型（既存のSkill型に準拠）
interface OutputSkill {
  id: string;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  category: string;
  categoryEn: string;
  author: string;
  authorAvatar?: string;
  stars: number;
  forks?: number;
  downloads?: number | null;
  updatedAt: string;
  tags: string[];
  githubUrl: string;
  installCommand?: string | null;
  language?: string;
  homepage?: string | null;
  hasMarketplace?: boolean;
}

// ====================================
// 設定
// ====================================

const API_BASE_URL = 'https://skillsmp.com/api/skills';
const SKILLS_PER_PAGE = 100; // 最大100
const OUTPUT_FILE = path.join(__dirname, '../data/skills.json');
const DELAY_BETWEEN_REQUESTS = 500; // ミリ秒

// カテゴリの英語→日本語マッピング
const CATEGORY_MAP: Record<string, string> = {
  'developer-tools': '開発者ツール',
  'web-app-development': 'Web & アプリ開発',
  'testing-qa': 'テスト & QA',
  'documents-content': 'ドキュメント & コンテンツ',
  'database-data': 'データベース & データ',
  'api-backend': 'API & バックエンド',
  'devops-infrastructure': 'DevOps & インフラ',
  'security-monitoring': 'セキュリティ & 監視',
  'scientific-computing': '科学計算',
  'ai-ml': 'AI & 機械学習',
  'claude-ecosystem': 'Claudeエコシステム',
  'other': 'その他',
};

// ====================================
// ユーティリティ関数
// ====================================

/**
 * 指定ミリ秒待機
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Unix timestampをYYYY-MM-DD形式に変換
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toISOString().split('T')[0];
}

/**
 * カテゴリスラッグを日本語に変換
 */
function translateCategory(slug: string): string {
  return CATEGORY_MAP[slug] || slug;
}

/**
 * スキル名からタグを生成（簡易版）
 */
function generateTags(skill: SkillsMPSkill): string[] {
  const tags: string[] = [];

  // 言語をタグに追加
  if (skill.language) {
    tags.push(skill.language);
  }

  // カテゴリをタグに追加
  if (skill.category) {
    const categoryName = translateCategory(skill.category);
    tags.push(categoryName);
  }

  // marketplace対応の場合
  if (skill.hasMarketplace) {
    tags.push('Marketplace対応');
  }

  return tags.slice(0, 5); // 最大5個
}

// ====================================
// メイン処理
// ====================================

/**
 * APIから1ページ分のスキルを取得
 */
async function fetchSkillsPage(page: number): Promise<SkillsMPResponse> {
  const url = `${API_BASE_URL}?page=${page}&limit=${SKILLS_PER_PAGE}`;

  console.log(`📡 Fetching page ${page}: ${url}`);

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

/**
 * 全ページからスキルを取得
 */
async function fetchAllSkills(): Promise<SkillsMPSkill[]> {
  const allSkills: SkillsMPSkill[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await fetchSkillsPage(page);

    allSkills.push(...response.skills);

    console.log(`✅ Page ${page}/${response.pagination.totalPages}: Got ${response.skills.length} skills (Total: ${allSkills.length}/${response.pagination.total})`);

    hasMore = response.pagination.hasNext;
    page++;

    // レート制限を避けるため、次のリクエストまで待機
    if (hasMore) {
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
  }

  return allSkills;
}

/**
 * SkillsMPのデータを出力形式に変換（翻訳なし版）
 */
function transformSkill(
  skill: SkillsMPSkill,
  nameJa?: string,
  descriptionJa?: string
): OutputSkill {
  const categoryJa = translateCategory(skill.category);

  return {
    id: skill.id,
    name: nameJa || skill.name,
    nameEn: skill.name,
    description: descriptionJa || skill.description,
    descriptionEn: skill.description,
    category: categoryJa,
    categoryEn: skill.category,
    author: skill.author,
    authorAvatar: skill.authorAvatar,
    stars: skill.stars,
    forks: skill.forks,
    downloads: null, // SkillsMP APIでは提供されていない
    updatedAt: formatDate(skill.updatedAt),
    tags: generateTags(skill),
    githubUrl: skill.githubUrl,
    installCommand: null, // SkillsMP APIでは提供されていない
    language: skill.language,
    homepage: skill.homepage,
    hasMarketplace: skill.hasMarketplace,
  };
}

/**
 * データをJSONファイルに保存
 */
function saveToFile(skills: OutputSkill[]): void {
  const dir = path.dirname(OUTPUT_FILE);

  // ディレクトリが存在しない場合は作成
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // JSONファイルに書き込み
  const jsonContent = JSON.stringify(skills, null, 2);
  fs.writeFileSync(OUTPUT_FILE, jsonContent, 'utf-8');

  console.log(`\n💾 Saved ${skills.length} skills to ${OUTPUT_FILE}`);
}

/**
 * 統計情報を表示
 */
function printStatistics(skills: OutputSkill[]): void {
  const totalSkills = skills.length;
  const categoryCounts: Record<string, number> = {};
  const languageCounts: Record<string, number> = {};

  skills.forEach(skill => {
    // カテゴリ別カウント
    categoryCounts[skill.category] = (categoryCounts[skill.category] || 0) + 1;

    // 言語別カウント
    if (skill.language) {
      languageCounts[skill.language] = (languageCounts[skill.language] || 0) + 1;
    }
  });

  console.log('\n📊 Statistics:');
  console.log(`  Total Skills: ${totalSkills}`);
  console.log(`\n  Top Categories:`);
  Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([category, count]) => {
      console.log(`    - ${category}: ${count}`);
    });

  console.log(`\n  Top Languages:`);
  Object.entries(languageCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .forEach(([language, count]) => {
      console.log(`    - ${language}: ${count}`);
    });
}

/**
 * メイン実行関数
 */
async function main(): Promise<void> {
  console.log('🚀 Starting SkillsMP.com scraper with translation...\n');

  // 翻訳機能の状態を表示
  if (isTranslationEnabled()) {
    console.log('✅ Translation enabled (using OpenAI API)\n');
  } else {
    console.log('⚠️  Translation disabled (OPENAI_API_KEY not set)\n');
  }

  try {
    // 全スキルを取得
    const rawSkills = await fetchAllSkills();

    console.log(`\n🔄 Transforming ${rawSkills.length} skills...`);

    let translatedNames: string[] = [];
    let translatedDescriptions: string[] = [];

    // 翻訳が有効な場合、並列で一括翻訳
    if (isTranslationEnabled()) {
      console.log(`\n🌐 Starting parallel translation (this will take ~10-15 minutes)...`);
      const startTime = Date.now();

      // すべてのスキル名を抽出
      const allNames = rawSkills.map(s => s.name);
      console.log(`\n📝 Translating ${allNames.length} skill names...`);

      translatedNames = await batchTranslateParallel(
        allNames,
        10, // 同時に10件翻訳
        (completed, total) => {
          if (completed % 50 === 0 || completed === total) {
            const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            const percent = ((completed / total) * 100).toFixed(1);
            console.log(`  ⏱️  Names: ${completed}/${total} (${percent}%) - ${elapsed}min elapsed`);
          }
        }
      );

      // すべてのスキル説明を抽出
      const allDescriptions = rawSkills.map(s => s.description);
      console.log(`\n📄 Translating ${allDescriptions.length} descriptions...`);

      translatedDescriptions = await batchTranslateParallel(
        allDescriptions,
        10, // 同時に10件翻訳
        (completed, total) => {
          if (completed % 50 === 0 || completed === total) {
            const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            const percent = ((completed / total) * 100).toFixed(1);
            console.log(`  ⏱️  Descriptions: ${completed}/${total} (${percent}%) - ${elapsed}min elapsed`);
          }
        }
      );

      const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      console.log(`\n✅ Translation completed in ${totalTime} minutes!`);

      // 翻訳統計を表示
      const stats = getTranslationStats();
      console.log(`📊 Translation stats: ${stats.cacheSize} unique texts cached`);
    }

    // データ変換（翻訳結果を適用）
    console.log(`\n🔄 Building skill objects...`);
    const transformedSkills: OutputSkill[] = rawSkills.map((skill, index) => {
      return transformSkill(
        skill,
        translatedNames[index],
        translatedDescriptions[index]
      );
    });

    // ファイルに保存
    saveToFile(transformedSkills);

    // 統計情報を表示
    printStatistics(transformedSkills);

    console.log('\n✨ Scraping completed successfully!');
  } catch (error) {
    console.error('\n❌ Error occurred:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
