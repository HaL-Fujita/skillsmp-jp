'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import skills from '@/data/skills.json';
import type { Skill } from '@/types/skill';

export default function Home() {
  const skillsData = skills as Skill[];
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'stars' | 'updatedAt'>('stars');

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

  // 検索、カテゴリフィルタリング、ソート
  const filteredSkills = useMemo(() => {
    let filtered = skillsData;

    // カテゴリフィルター
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(
        (skill) => skill.category === selectedCategory
      );
    }

    // 検索フィルター
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (skill) =>
          skill.name.toLowerCase().includes(query) ||
          skill.description.toLowerCase().includes(query) ||
          skill.tags.some((tag) => tag.toLowerCase().includes(query)) ||
          skill.category.toLowerCase().includes(query)
      );
    }

    // ソート
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'stars') {
        return b.stars - a.stars;
      } else {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });

    return sorted;
  }, [searchQuery, selectedCategory, sortBy, skillsData]);

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
      <section className="bg-gradient-to-b from-blue-50 to-white py-16 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            すべてのスキルを指先に
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            コミュニティが構築した{skillsData.length}個の無料AIプラグイン、ツール、ワークフローを閲覧
          </p>
        </div>
      </section>

      {/* カテゴリ別ブラウズセクション */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h3 className="text-2xl font-bold text-gray-900 mb-6">
          カテゴリ別に閲覧
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {categories.map((category) => (
            <button
              key={category.name}
              onClick={() => {
                setSelectedCategory(category.name);
                // スキル一覧までスクロール
                document.getElementById('skills-list')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-6 text-left border border-gray-200 hover:border-blue-500"
            >
              <h4 className="text-lg font-bold text-gray-900 mb-2">
                {category.name}
              </h4>
              <p className="text-gray-600 text-sm">
                {category.count}個のスキル
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* メインコンテンツ */}
      <main id="skills-list" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 scroll-mt-20">
        {/* 検索窓 */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="スキル名、説明、タグ、カテゴリで検索..."
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* フィルターとソート */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-700">
                カテゴリ:
              </h2>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                すべて
              </button>
              {categories.map((category) => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>

            {/* ソート */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                並び替え:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'stars' | 'updatedAt')}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="stars">人気順（Stars）</option>
                <option value="updatedAt">最近更新された順</option>
              </select>
            </div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="mb-8">
          <p className="text-lg text-gray-700">
            <span className="font-semibold">{filteredSkills.length}</span> 個のスキルが利用可能
            {(searchQuery || selectedCategory !== 'all') && (
              <span className="text-gray-500 ml-2">
                （全{skillsData.length}個中）
              </span>
            )}
          </p>
        </div>

        {/* スキル一覧 */}
        {filteredSkills.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSkills.map((skill) => (
              <Link
                key={skill.id}
                href={`/skills/${skill.id}`}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {skill.name}
                  </h3>
                  <div className="flex items-center text-yellow-500">
                    <svg
                      className="w-5 h-5 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    {skill.stars}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4">
                  {skill.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {skill.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span className="px-2 py-1 bg-gray-100 rounded">
                    {skill.category}
                  </span>
                  <span>{new Date(skill.updatedAt).toLocaleDateString('ja-JP')}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              「{searchQuery}」に一致するスキルが見つかりませんでした
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
