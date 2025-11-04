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


def github_api_request(url: str) -> Dict[str, Any]:
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
        print(f"Error: {e.code} - {e.reason}")
        print(f"URL: {url}")
        if e.code == 403:
            print("Rate limit exceeded. Set GITHUB_TOKEN environment variable.")
        sys.exit(1)


def search_skill_repos() -> List[Dict[str, Any]]:
    """Claudeスキルのリポジトリを検索"""
    print("Searching for Claude skill repositories...")

    # 検索クエリ: marketplace.jsonを含むリポジトリ
    query = "filename:marketplace.json claude skill"
    url = f"{GITHUB_API_BASE}/search/code?q={urllib.parse.quote(query)}&per_page=100"

    result = github_api_request(url)
    repos = []

    # リポジトリ情報を収集
    seen_repos = set()
    for item in result.get("items", []):
        repo_url = item["repository"]["url"]
        if repo_url not in seen_repos:
            seen_repos.add(repo_url)
            repo_data = github_api_request(repo_url)
            repos.append(repo_data)

    print(f"Found {len(repos)} repositories")
    return repos


def fetch_marketplace_json(repo: Dict[str, Any]) -> Dict[str, Any]:
    """リポジトリからmarketplace.jsonを取得"""
    contents_url = repo["contents_url"].replace("{+path}", "marketplace.json")

    try:
        content_data = github_api_request(contents_url)
        if content_data.get("encoding") == "base64":
            import base64
            content = base64.b64decode(content_data["content"]).decode("utf-8")
            return json.loads(content)
    except Exception as e:
        print(f"Error fetching marketplace.json from {repo['full_name']}: {e}")

    return {}


def extract_skill_data(repo: Dict[str, Any], marketplace_data: Dict[str, Any]) -> Dict[str, Any]:
    """リポジトリとmarketplace.jsonからスキルデータを抽出"""
    # IDを生成（リポジトリ名をスラッグ化）
    skill_id = repo["full_name"].replace("/", "-").lower()

    # カテゴリを日本語に変換
    category_en = marketplace_data.get("category", "Developer Tools")
    category_ja = CATEGORY_MAP.get(category_en, "開発者ツール")

    # 更新日時
    updated_at = repo.get("updated_at", repo.get("pushed_at", datetime.now().isoformat()))
    updated_date = updated_at.split("T")[0]

    # タグを生成
    tags = []
    if repo.get("language"):
        tags.append(repo["language"].lower())
    tags.extend(marketplace_data.get("tags", [])[:5])  # 最大5個

    # スキルデータ
    skill = {
        "id": skill_id,
        "name": marketplace_data.get("name", repo["name"]),
        "nameEn": marketplace_data.get("name", repo["name"]),
        "description": marketplace_data.get("description", repo.get("description", "")),
        "descriptionEn": marketplace_data.get("description", repo.get("description", "")),
        "category": category_ja,
        "categoryEn": category_en,
        "author": repo["owner"]["login"],
        "stars": repo["stargazers_count"],
        "downloads": None,  # GitHub APIでは取得不可
        "updatedAt": updated_date,
        "tags": tags,
        "githubUrl": repo["html_url"],
        "installCommand": marketplace_data.get("install_command"),
    }

    return skill


def main():
    """メイン処理"""
    print("Claude Skills Data Fetcher")
    print("=" * 50)

    # GitHub APIでスキルリポジトリを検索
    repos = search_skill_repos()

    if not repos:
        print("No repositories found. Exiting.")
        sys.exit(1)

    # 各リポジトリからスキルデータを抽出
    skills = []
    for i, repo in enumerate(repos[:50], 1):  # 最大50個
        print(f"Processing [{i}/{min(len(repos), 50)}]: {repo['full_name']}")

        # marketplace.jsonを取得
        marketplace_data = fetch_marketplace_json(repo)

        if marketplace_data:
            skill = extract_skill_data(repo, marketplace_data)
            skills.append(skill)
            print(f"  ✓ {skill['name']} ({skill['category']})")
        else:
            print(f"  ✗ No marketplace.json found")

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
