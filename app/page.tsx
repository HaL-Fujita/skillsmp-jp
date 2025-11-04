'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import skills from '@/data/skills.json';
import type { Skill } from '@/types/skill';

export default function Home() {
  const skillsData = skills as Skill[];

  // カテゴリ一覧とカウントを取得
  const categories = useMemo(() => {
    const categoryMap = new Map<string, number>();
    skillsData.forEach((skill) => {
      categoryMap.set(
        skill.category,
        (categoryMap.get(skill.category) || 0) + 1
      );
    });
    return Array.from(categoryMap.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [skillsData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Claude Codeスキルマーケットプレイス 🇯🇵
              </h1>
            </Link>
          </div>
        </div>
      </header>

      {/* ヒーローセクション */}
      <section className="bg-gradient-to-b from-blue-50 to-white py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            すべてのスキルを指先に
          </h2>
          <p className="text-xl md:text-2xl text-gray-600 mb-12">
            コミュニティが構築した{skillsData.length}個の無料AIプラグイン、ツール、ワークフローを閲覧
          </p>
          <Link
            href="/skills"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
          >
            すべてのスキルを見る
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </Link>
        </div>
      </section>

      {/* カテゴリ別ブラウズセクション */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          カテゴリ別に閲覧
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={`/skills?category=${encodeURIComponent(category.name)}`}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-8 text-left border-2 border-transparent hover:border-blue-500 group"
            >
              <div className="flex items-start justify-between mb-4">
                <h4 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {category.name}
                </h4>
                <svg
                  className="w-6 h-6 text-gray-400 group-hover:text-blue-600 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
              <p className="text-gray-600 text-lg">
                {category.count}個のスキル
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600">
            © 2025 Claude Codeスキルマーケットプレイス. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
