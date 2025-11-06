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
 * 既存のスキルデータを読み込む
 */
function loadExistingSkills(): OutputSkill[] {
  if (!fs.existsSync(OUTPUT_FILE)) {
    console.log('📂 No existing data file found. Will create new one.');
    return [];
  }

  try {
    const content = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const skills = JSON.parse(content) as OutputSkill[];
    console.log(`📂 Loaded ${skills.length} existing skills from ${OUTPUT_FILE}`);
    return skills;
  } catch (error) {
    console.warn('⚠️  Failed to load existing data. Starting fresh.');
    return [];
  }
}

/**
 * スキルの差分を検出
 */
interface SkillDiff {
  added: SkillsMPSkill[];      // 新規追加されたスキル
  updated: SkillsMPSkill[];    // 更新されたスキル
  removed: string[];           // 削除されたスキルのID
  unchanged: OutputSkill[];    // 変更なしのスキル
}

function detectChanges(
  existingSkills: OutputSkill[],
  newSkills: SkillsMPSkill[]
): SkillDiff {
  const existingMap = new Map(existingSkills.map(s => [s.id, s]));
  const newMap = new Map(newSkills.map(s => [s.id, s]));

  const added: SkillsMPSkill[] = [];
  const updated: SkillsMPSkill[] = [];
  const unchanged: OutputSkill[] = [];
  const removed: string[] = [];

  // 新規追加と更新を検出
  for (const newSkill of newSkills) {
    const existing = existingMap.get(newSkill.id);

    if (!existing) {
      // 新規追加
      added.push(newSkill);
    } else {
      // 更新チェック（updatedAt, stars, forksなどを比較）
      const hasChanged =
        existing.stars !== newSkill.stars ||
        existing.forks !== newSkill.forks ||
        existing.updatedAt !== formatDate(newSkill.updatedAt) ||
        existing.nameEn !== newSkill.name ||
        existing.descriptionEn !== newSkill.description;

      if (hasChanged) {
        updated.push(newSkill);
      } else {
        unchanged.push(existing);
      }
    }
  }

  // 削除されたスキルを検出
  for (const existingId of existingMap.keys()) {
    if (!newMap.has(existingId)) {
      removed.push(existingId);
    }
  }

  return { added, updated, removed, unchanged };
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
  console.log('🚀 Starting SkillsMP.com scraper with incremental update...\n');

  // 翻訳機能の状態を表示
  if (isTranslationEnabled()) {
    console.log('✅ Translation enabled (using OpenAI API)\n');
  } else {
    console.log('⚠️  Translation disabled (OPENAI_API_KEY not set)\n');
  }

  try {
    // 既存データを読み込む
    const existingSkills = loadExistingSkills();

    // 全スキルを取得
    const rawSkills = await fetchAllSkills();

    // 差分を検出
    console.log(`\n🔍 Detecting changes...`);
    const diff = detectChanges(existingSkills, rawSkills);

    console.log(`\n📊 Change summary:`);
    console.log(`  ✨ New: ${diff.added.length}`);
    console.log(`  🔄 Updated: ${diff.updated.length}`);
    console.log(`  ❌ Removed: ${diff.removed.length}`);
    console.log(`  ✅ Unchanged: ${diff.unchanged.length}`);

    // 変更がない場合は終了
    if (diff.added.length === 0 && diff.updated.length === 0 && diff.removed.length === 0) {
      console.log(`\n✅ No changes detected. Skipping translation and save.`);
      return;
    }

    // 新規・更新されたスキルのみを翻訳
    const skillsToTranslate = [...diff.added, ...diff.updated];
    let translatedNames: Map<string, string> = new Map();
    let translatedDescriptions: Map<string, string> = new Map();

    // 翻訳が有効な場合、並列で一括翻訳
    if (isTranslationEnabled() && skillsToTranslate.length > 0) {
      // 翻訳エンジンに応じて並列数と時間を調整
      const isGoogleTranslate = process.env.USE_GOOGLE_TRANSLATE === 'true';
      const concurrency = isGoogleTranslate ? 10 : 3;
      const engineName = isGoogleTranslate ? 'Google Translate' : 'OpenAI';

      console.log(`\n🌐 Translating ${skillsToTranslate.length} changed skills with ${engineName}...`);
      const startTime = Date.now();

      // 新規・更新されたスキル名を抽出
      const namesToTranslate = skillsToTranslate.map(s => s.name);
      console.log(`\n📝 Translating ${namesToTranslate.length} skill names...`);

      const translatedNamesList = await batchTranslateParallel(
        namesToTranslate,
        concurrency,
        (completed, total) => {
          if (completed % 10 === 0 || completed === total) {
            const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            const percent = ((completed / total) * 100).toFixed(1);
            console.log(`  ⏱️  Names: ${completed}/${total} (${percent}%) - ${elapsed}min elapsed`);
          }
        }
      );

      // 結果をMapに格納
      skillsToTranslate.forEach((skill, index) => {
        translatedNames.set(skill.id, translatedNamesList[index]);
      });

      // 新規・更新されたスキル説明を抽出
      const descriptionsToTranslate = skillsToTranslate.map(s => s.description);
      console.log(`\n📄 Translating ${descriptionsToTranslate.length} descriptions...`);

      const translatedDescriptionsList = await batchTranslateParallel(
        descriptionsToTranslate,
        concurrency,
        (completed, total) => {
          if (completed % 10 === 0 || completed === total) {
            const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            const percent = ((completed / total) * 100).toFixed(1);
            console.log(`  ⏱️  Descriptions: ${completed}/${total} (${percent}%) - ${elapsed}min elapsed`);
          }
        }
      );

      // 結果をMapに格納
      skillsToTranslate.forEach((skill, index) => {
        translatedDescriptions.set(skill.id, translatedDescriptionsList[index]);
      });

      const totalTime = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      console.log(`\n✅ Translation completed in ${totalTime} minutes!`);

      // 翻訳統計を表示
      const stats = getTranslationStats();
      console.log(`📊 Translation stats: ${stats.cacheSize} unique texts cached`);
    }

    // データ変換（新規・更新分）
    console.log(`\n🔄 Building skill objects...`);
    const newTransformedSkills: OutputSkill[] = skillsToTranslate.map(skill => {
      return transformSkill(
        skill,
        translatedNames.get(skill.id),
        translatedDescriptions.get(skill.id)
      );
    });

    // 既存の翻訳済みデータと新規・更新データをマージ
    const finalSkills: OutputSkill[] = [
      ...diff.unchanged,
      ...newTransformedSkills
    ];

    // IDでソート（一貫性のため）
    finalSkills.sort((a, b) => a.id.localeCompare(b.id));

    // ファイルに保存
    saveToFile(finalSkills);

    // 統計情報を表示
    printStatistics(finalSkills);

    console.log('\n✨ Incremental update completed successfully!');
  } catch (error) {
    console.error('\n❌ Error occurred:', error);
    process.exit(1);
  }
}

// スクリプト実行
main();
