import skills from '@/data/skills.json';
import type { Skill } from '@/types/skill';

export default function Home() {
  const skillsData = skills as Skill[];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Claude Codeスキルマーケットプレイス 🇯🇵
          </h1>
          <p className="text-gray-600 mt-2">
            高品質なClaudeスキルとプラグインを発見・共有
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 統計情報 */}
        <div className="mb-8">
          <p className="text-lg text-gray-700">
            <span className="font-semibold">{skillsData.length}</span> 個のスキルが利用可能
          </p>
        </div>

        {/* スキル一覧 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skillsData.map((skill) => (
            <div
              key={skill.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
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
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
