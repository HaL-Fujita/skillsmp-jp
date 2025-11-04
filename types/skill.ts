// スキルの型定義

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
  downloads?: number;
  updatedAt: string;
  tags: string[];
  githubUrl?: string;
  installCommand?: string;
}

export interface Category {
  id: string;
  name: string;
  nameEn: string;
  count: number;
}

export type SortOption = 'stars' | 'updatedAt' | 'name';
export type SortOrder = 'asc' | 'desc';
