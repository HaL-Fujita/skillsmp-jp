/**
 * Translation utility using OpenAI API
 */

import OpenAI from 'openai';

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
 * OpenAI APIを使ってテキストを日本語に翻訳
 */
export async function translateWithOpenAI(text: string): Promise<string> {
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
  } catch (error) {
    console.error(`❌ Translation error: ${error}`);
    return text; // エラー時は元のテキストを返す
  }
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
 * 翻訳が有効かチェック
 */
export function isTranslationEnabled(): boolean {
  return !!process.env.OPENAI_API_KEY;
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
