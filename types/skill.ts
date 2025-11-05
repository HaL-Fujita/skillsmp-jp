// スキルの型定義

export interface GitHubStatistics {
  forks: number;
  watchers: number;
  openIssues: number;
  openPullRequests: number | null;
  contributors: number | null;
  language: string;
  license: string | null;
  size: number; // KB単位
  createdAt: string | null;
  pushedAt: string | null;
}

export interface Skill {
  id: string;
  name: string;
  nameEn: string; // 元の英語名
  description: string;
  descriptionEn: string; // 元の英語説明
  category: string;
  categoryEn: string; // 元の英語カテゴリ
  author: string;
  stars: number;
  downloads?: number | null;
  updatedAt: string;
  tags: string[];
  githubUrl?: string;
  installCommand?: string | null;
  github?: GitHubStatistics | null; // GitHub統計情報
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  count: number;
}

export type SortOption = 'stars' | 'updatedAt' | 'name';
export type SortOrder = 'asc' | 'desc';
