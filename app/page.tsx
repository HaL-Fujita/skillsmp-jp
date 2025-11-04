'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import skills from '@/data/skills.json';
import type { Skill } from '@/types/skill';

export default function Home() {
  const skillsData = skills as Skill[];
  const [activeTab, setActiveTab] = useState<'popular' | 'latest'>('popular');

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

  // 人気スキル（スター順）
  const popularSkills = useMemo(() => {
    return [...skillsData]
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 8);
  }, [skillsData]);

  // 新着スキル（更新日順）
  const latestSkills = useMemo(() => {
    return [...skillsData]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 8);
  }, [skillsData]);

  const displayedSkills = activeTab === 'popular' ? popularSkills : latestSkills;

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

      {/* 人気 & 新着スキルセクション */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            注目のスキル
          </h3>

          {/* タブ */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab('popular')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'popular'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                人気スキル
              </div>
            </button>
            <button
              onClick={() => setActiveTab('latest')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === 'latest'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                新着スキル
              </div>
            </button>
          </div>
        </div>

        {/* スキルカード */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayedSkills.map((skill) => (
            <Link
              key={skill.id}
              href={`/skills/${skill.id}`}
              className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all p-6 cursor-pointer border-2 border-transparent hover:border-blue-500"
            >
              <div className="flex justify-between items-start mb-3">
                <h4 className="text-lg font-semibold text-gray-900 line-clamp-2">
                  {skill.name}
                </h4>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {skill.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {skill.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center text-yellow-500">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {skill.stars.toLocaleString()}
                </div>
                <span className="text-gray-500">
                  {new Date(skill.updatedAt).toLocaleDateString('ja-JP')}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* もっと見るボタン */}
        <div className="text-center mt-8">
          <Link
            href="/skills"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors border-2 border-blue-600"
          >
            すべてのスキルを見る
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
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
