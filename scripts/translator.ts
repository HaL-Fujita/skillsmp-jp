/**
 * Translation utility using OpenAI API or Google Translate
 *
 * Performance:
 * - OpenAI: 3 concurrent requests, 15-20 minutes for ~4,500 texts (rate limit safe)
 * - Google Translate: 10 concurrent requests, 5-10 minutes (free, no API key needed)
 * - Retry logic: Exponential backoff for rate limit errors
 *
 * Usage:
 * - Set OPENAI_API_KEY to use OpenAI (higher quality, daily limit 10,000)
 * - Set USE_GOOGLE_TRANSLATE=true to use Google Translate (free, unlimited)
 */

import OpenAI from 'openai';
import translate from '@vitalets/google-translate-api';

// 翻訳キャッシュ（同じテキストを何度も翻訳しないため）
const translationCache = new Map<string, string>();

let openaiClient: OpenAI | null = null;

/**
 * OpenAIクライアントを初期化
 */
function getOpenAIClient(): OpenAI | null {
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

/**
 * Google Translateを使ってテキストを日本語に翻訳
 */
async function translateWithGoogle(text: string, retries: number = 3): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // キャッシュチェック
  const cacheKey = text.toLowerCase();
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await translate(text, { from: 'en', to: 'ja' });
      const translation = result.text;

      // キャッシュに保存
      translationCache.set(cacheKey, translation);

      return translation;
    } catch (error: any) {
      lastError = error;

      // リトライ
      if (attempt < retries) {
        const waitTime = Math.pow(2, attempt) * 500; // 500ms, 1s, 2s...
        console.warn(`⚠️  Google Translate error, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries + 1})...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }

  console.error(`❌ Google Translate failed after ${retries + 1} attempts: ${lastError}`);
  return text; // エラー時は元のテキストを返す
}

/**
 * OpenAI APIを使ってテキストを日本語に翻訳（リトライロジック付き）
 */
async function translateWithOpenAIAPI(text: string, retries: number = 3): Promise<string> {
  if (!text || text.trim().length === 0) {
    return text;
  }

  // キャッシュチェック
  const cacheKey = text.toLowerCase();
  if (translationCache.has(cacheKey)) {
    return translationCache.get(cacheKey)!;
  }

  const client = getOpenAIClient();
  if (!client) {
    console.warn('⚠️  OpenAI API key not found. Skipping translation.');
    return text;
  }

  let lastError: any;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'あなたは優秀な翻訳者です。英語のテキストを自然な日本語に翻訳してください。技術用語は適切に翻訳し、固有名詞はそのまま残してください。',
          },
          {
            role: 'user',
            content: `次の英語テキストを日本語に翻訳してください。翻訳結果のみを返してください：\n\n${text}`,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      });

      const translation = response.choices[0]?.message?.content?.trim() || text;

      // キャッシュに保存
      translationCache.set(cacheKey, translation);

      return translation;
    } catch (error: any) {
      lastError = error;

      // レート制限エラーの場合は指数バックオフで待機
      if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
        const waitTime = Math.pow(2, attempt) * 1000; // 1秒, 2秒, 4秒, 8秒...
        console.warn(`⚠️  Rate limit hit, retrying in ${waitTime}ms (attempt ${attempt + 1}/${retries + 1})...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // その他のエラーの場合はリトライしない
      console.error(`❌ Translation error: ${error}`);
      break;
    }
  }

  console.error(`❌ Translation failed after ${retries + 1} attempts: ${lastError}`);
  return text; // エラー時は元のテキストを返す
}

/**
 * 適切な翻訳エンジンを選択して翻訳
 */
export async function translateWithOpenAI(text: string): Promise<string> {
  // USE_GOOGLE_TRANSLATE が設定されている場合は Google Translate を使用
  if (process.env.USE_GOOGLE_TRANSLATE === 'true') {
    return translateWithGoogle(text);
  }

  // OpenAI API が設定されている場合は OpenAI を使用
  if (process.env.OPENAI_API_KEY) {
    return translateWithOpenAIAPI(text);
  }

  // どちらも設定されていない場合は元のテキストを返す
  console.warn('⚠️  No translation service configured. Skipping translation.');
  return text;
}

/**
 * バッチ翻訳（複数のテキストを一度に翻訳）
 * レート制限を考慮して順次実行
 */
export async function batchTranslate(
  texts: string[],
  delayMs: number = 100
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < texts.length; i++) {
    const translated = await translateWithOpenAI(texts[i]);
    results.push(translated);

    // レート制限を避けるため遅延
    if (i < texts.length - 1 && delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

/**
 * 並列バッチ翻訳（高速版）
 * 複数のテキストを並列に翻訳します
 *
 * @param texts 翻訳するテキストの配列
 * @param concurrency 同時実行数（デフォルト: 10）
 * @param onProgress 進捗コールバック
 */
export async function batchTranslateParallel(
  texts: string[],
  concurrency: number = 10,
  onProgress?: (completed: number, total: number) => void
): Promise<string[]> {
  if (texts.length === 0) {
    return [];
  }

  const results: string[] = new Array(texts.length);
  let completed = 0;

  // バッチに分割
  for (let i = 0; i < texts.length; i += concurrency) {
    const batch = texts.slice(i, i + concurrency);
    const batchPromises = batch.map(async (text, batchIndex) => {
      const globalIndex = i + batchIndex;
      try {
        const translated = await translateWithOpenAI(text);
        results[globalIndex] = translated;
        completed++;
        if (onProgress) {
          onProgress(completed, texts.length);
        }
        return translated;
      } catch (error) {
        console.error(`Translation failed for index ${globalIndex}:`, error);
        results[globalIndex] = text; // フォールバック：元のテキスト
        completed++;
        if (onProgress) {
          onProgress(completed, texts.length);
        }
        return text;
      }
    });

    // バッチ内で並列実行
    await Promise.allSettled(batchPromises);

    // バッチ間で少し待機（レート制限対策）
    if (i + concurrency < texts.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return results;
}

/**
 * 翻訳が有効かチェック
 */
export function isTranslationEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY || process.env.USE_GOOGLE_TRANSLATE === 'true';
}

/**
 * 翻訳統計を取得
 */
export function getTranslationStats(): {
  cacheSize: number;
  enabled: boolean;
} {
  return {
    cacheSize: translationCache.size,
    enabled: isTranslationEnabled(),
  };
}
