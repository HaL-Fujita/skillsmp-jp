#!/usr/bin/env python3
"""
GitHub APIを使ってClaudeスキルデータを収集するスクリプト

使い方:
    python scripts/fetch_skills.py

必要な環境変数:
    GITHUB_TOKEN: GitHub Personal Access Token（オプション、レート制限を緩和）
"""

import json
import os
import sys
from datetime import datetime
from typing import List, Dict, Any
import urllib.request
import urllib.error

# GitHub API設定
GITHUB_API_BASE = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

# カテゴリマッピング（英語→日本語）
CATEGORY_MAP = {
    "Developer Tools": "開発者ツール",
    "Web & App Development": "Web & アプリ開発",
    "Data Science": "データサイエンス",
    "Database": "データベース",
    "DevOps": "DevOps",
    "Documentation": "ドキュメント",
    "Testing": "テスト",
    "Security": "セキュリティ",
    "Utilities": "ユーティリティ",
    "Agents & Automation": "エージェント & 自動化",
    "Documents & Content": "ドキュメント & コンテンツ",
    "API & Backend": "API & バックエンド",
    "DevOps & Infrastructure": "DevOps & インフラ",
    "Testing & QA": "テスト & QA",
    "Skills & Workflow": "スキル & ワークフロー",
}


def github_api_request(url: str, allow_404: bool = False) -> Dict[str, Any]:
    """GitHub APIリクエストを送信"""
    headers = {
        "Accept": "application/vnd.github.v3+json",
        "User-Agent": "skillsmp-jp-fetcher",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"

    req = urllib.request.Request(url, headers=headers)

    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 404 and allow_404:
            return {}
        print(f"Error: {e.code} - {e.reason}")
        print(f"URL: {url}")
        if e.code == 403:
            print("Rate limit exceeded. Set GITHUB_TOKEN environment variable.")
        if not allow_404:
            sys.exit(1)
        return {}


def get_anthropics_skills_repo() -> Dict[str, Any]:
    """anthropics/skillsリポジトリの情報を取得"""
    print("Fetching anthropics/skills repository...")
    url = f"{GITHUB_API_BASE}/repos/anthropics/skills"
    return github_api_request(url)


def get_repo_contents(repo_full_name: str, path: str = "") -> List[Dict[str, Any]]:
    """リポジトリの特定パスの内容を取得"""
    url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/contents/{path}"
    return github_api_request(url)


def fetch_skill_md(repo_full_name: str, skill_path: str) -> Dict[str, Any]:
    """スキルディレクトリからSKILL.mdを取得してパース"""
    import base64
    import re

    try:
        # SKILL.mdを取得
        url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/contents/{skill_path}/SKILL.md"
        content_data = github_api_request(url, allow_404=True)

        if not content_data:
            return {}

        if content_data.get("encoding") == "base64":
            content = base64.b64decode(content_data["content"]).decode("utf-8")

            # YAMLフロントマターを抽出
            match = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
            if match:
                yaml_content = match.group(1)
                data = {}
                for line in yaml_content.split("\n"):
                    if ":" in line:
                        key, value = line.split(":", 1)
                        data[key.strip()] = value.strip().strip('"\'')
                return data
    except Exception as e:
        print(f"  Warning: Could not fetch SKILL.md: {e}")

    return {}


def create_skill_data(repo: Dict[str, Any], skill_name: str, skill_data: Dict[str, Any]) -> Dict[str, Any]:
    """スキルデータを作成"""
    # IDを生成
    skill_id = f"{repo['owner']['login']}-{skill_name}".lower().replace("_", "-")

    # カテゴリを日本語に変換
    category_en = skill_data.get("category", "Developer Tools")
    category_ja = CATEGORY_MAP.get(category_en, "開発者ツール")

    # タグを生成
    tags = []
    if skill_data.get("tags"):
        tags = [tag.strip() for tag in skill_data.get("tags", "").split(",")][:5]

    # スキルデータ
    skill = {
        "id": skill_id,
        "name": skill_data.get("name", skill_name),
        "nameEn": skill_data.get("name", skill_name),
        "description": skill_data.get("description", ""),
        "descriptionEn": skill_data.get("description", ""),
        "category": category_ja,
        "categoryEn": category_en,
        "author": repo["owner"]["login"],
        "stars": repo["stargazers_count"],
        "downloads": None,
        "updatedAt": datetime.now().strftime("%Y-%m-%d"),
        "tags": tags if tags else ["skill"],
        "githubUrl": f"{repo['html_url']}/tree/main/{skill_name}",
        "installCommand": None,
    }

    return skill


def main():
    """メイン処理"""
    print("Claude Skills Data Fetcher")
    print("=" * 50)

    # anthropics/skillsリポジトリを取得
    repo = get_anthropics_skills_repo()
    print(f"Repository: {repo['full_name']}")
    print(f"Stars: {repo['stargazers_count']}")
    print()

    # リポジトリのルートディレクトリを取得
    print("Fetching skills list...")
    contents = get_repo_contents(repo["full_name"], "")

    # スキルディレクトリを探す
    skill_dirs = []
    for item in contents:
        if item["type"] == "dir" and not item["name"].startswith("."):
            skill_dirs.append(item["name"])

    print(f"Found {len(skill_dirs)} potential skill directories")
    print()

    # 各スキルディレクトリからデータを抽出
    skills = []
    for i, skill_name in enumerate(skill_dirs[:50], 1):  # 最大50個
        print(f"Processing [{i}/{min(len(skill_dirs), 50)}]: {skill_name}")

        # SKILL.mdを取得
        skill_data = fetch_skill_md(repo["full_name"], skill_name)

        if skill_data and skill_data.get("name"):
            skill = create_skill_data(repo, skill_name, skill_data)
            skills.append(skill)
            print(f"  ✓ {skill['name']} ({skill['category']})")
        else:
            print(f"  ✗ No valid SKILL.md found")

    # JSONファイルに保存
    output_path = os.path.join(os.path.dirname(__file__), "..", "data", "skills.json")
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(skills, f, ensure_ascii=False, indent=2)

    print(f"\n✓ Successfully saved {len(skills)} skills to {output_path}")
    print(f"\nCategories:")
    categories = {}
    for skill in skills:
        categories[skill["category"]] = categories.get(skill["category"], 0) + 1
    for cat, count in sorted(categories.items()):
        print(f"  {cat}: {count}")


if __name__ == "__main__":
    main()
