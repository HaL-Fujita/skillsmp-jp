import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Vercel Cron Jobs用のAPIエンドポイント
 *
 * このエンドポイントは、Vercel Cronから定期的に呼び出され、
 * スクレイピングスクリプトを実行します。
 *
 * セキュリティ: CRON_SECRET環境変数で認証
 */
export async function GET(request: NextRequest) {
  // Cron Secretで認証（本番環境では必須）
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // 本番環境ではCRON_SECRETを必須にする
  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret) {
      console.error('❌ CRON_SECRET is not set in production');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn('⚠️  Unauthorized access attempt to /api/scrape');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  try {
    console.log('🚀 Starting scraper from Vercel Cron...');

    // スクレイピングスクリプトを実行
    const { stdout, stderr } = await execAsync('npm run scrape', {
      cwd: process.cwd(),
      env: {
        ...process.env,
        // Vercel環境変数からAPIキーを取得
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      },
      maxBuffer: 10 * 1024 * 1024, // 10MB
      timeout: 30 * 60 * 1000, // 30分タイムアウト
    });

    console.log('✅ Scraper completed successfully');
    console.log('Output:', stdout);

    if (stderr) {
      console.warn('Warnings:', stderr);
    }

    return NextResponse.json({
      success: true,
      message: 'Scraping completed successfully',
      output: stdout,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Scraper failed:', error);

    return NextResponse.json(
      {
        error: 'Scraping failed',
        message: error.message,
        stderr: error.stderr,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// POSTメソッドでも対応（手動実行用）
export async function POST(request: NextRequest) {
  return GET(request);
}
