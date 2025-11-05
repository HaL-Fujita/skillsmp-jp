#!/usr/bin/env python3
"""
GitHub APIを使ってClaudeスキルデータを収集するスクリプト

使い方:
    python scripts/fetch_skills.py

必要な環境変数:
    GITHUB_TOKEN: GitHub Personal Access Token（オプション、レート制限を緩和）
    OPENAI_API_KEY: OpenAI APIキー（オプション、高品質翻訳用）
    TRANSLATION_METHOD: 翻訳方法 (googletrans/openai/none) デフォルト: googletrans
"""

import json
import os
import sys
import time
from datetime import datetime
from typing import List, Dict, Any, Optional
import urllib.request
import urllib.error

# GitHub API設定
GITHUB_API_BASE = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

# 翻訳設定
TRANSLATION_METHOD = os.getenv("TRANSLATION_METHOD", "googletrans")  # googletrans, openai, none
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

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


def get_last_commit_date(repo_full_name: str, path: str) -> Optional[str]:
    """特定パスの最終コミット日を取得"""
    try:
        url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/commits?path={path}&per_page=1"
        commits = github_api_request(url, allow_404=True)

        if commits and len(commits) > 0:
            commit_date = commits[0]['commit']['committer']['date']
            # ISO 8601形式 (2024-01-15T10:30:00Z) を YYYY-MM-DD形式に変換
            return commit_date.split('T')[0]
        return None
    except Exception as e:
        print(f"  Warning: Could not fetch commit date: {e}")
        return None


def get_repo_statistics(repo_full_name: str) -> Dict[str, Any]:
    """リポジトリの詳細統計情報を取得"""
    print(f"  Fetching repository statistics...")

    # 基本的なリポジトリ情報
    repo_url = f"{GITHUB_API_BASE}/repos/{repo_full_name}"
    repo_data = github_api_request(repo_url, allow_404=True)

    if not repo_data:
        return {}

    # コントリビューター数を取得
    contributors_url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/contributors?per_page=1"
    try:
        req = urllib.request.Request(contributors_url)
        if GITHUB_TOKEN:
            req.add_header("Authorization", f"token {GITHUB_TOKEN}")
        req.add_header("User-Agent", "skillsmp-jp-fetcher")

        with urllib.request.urlopen(req) as response:
            # Linkヘッダーから総コントリビューター数を取得
            link_header = response.headers.get('Link', '')
            contributors_count = 1
            if 'rel="last"' in link_header:
                import re
                match = re.search(r'page=(\d+)>; rel="last"', link_header)
                if match:
                    contributors_count = int(match.group(1))
    except Exception as e:
        print(f"  Warning: Could not fetch contributors count: {e}")
        contributors_count = None

    # プルリクエスト数を取得（オープン）
    pulls_url = f"{GITHUB_API_BASE}/repos/{repo_full_name}/pulls?state=open&per_page=1"
    try:
        req = urllib.request.Request(pulls_url)
        if GITHUB_TOKEN:
            req.add_header("Authorization", f"token {GITHUB_TOKEN}")
        req.add_header("User-Agent", "skillsmp-jp-fetcher")

        with urllib.request.urlopen(req) as response:
            link_header = response.headers.get('Link', '')
            open_pulls_count = 0
            if 'rel="last"' in link_header:
                import re
                match = re.search(r'page=(\d+)>; rel="last"', link_header)
                if match:
                    open_pulls_count = int(match.group(1))
    except Exception as e:
        print(f"  Warning: Could not fetch pull requests count: {e}")
        open_pulls_count = None

    statistics = {
        "stars": repo_data.get("stargazers_count", 0),
        "forks": repo_data.get("forks_count", 0),
        "watchers": repo_data.get("watchers_count", 0),
        "openIssues": repo_data.get("open_issues_count", 0),
        "openPullRequests": open_pulls_count,
        "contributors": contributors_count,
        "language": repo_data.get("language", "Unknown"),
        "license": repo_data.get("license", {}).get("name", None) if repo_data.get("license") else None,
        "size": repo_data.get("size", 0),  # KB単位
        "defaultBranch": repo_data.get("default_branch", "main"),
        "createdAt": repo_data.get("created_at", "").split('T')[0] if repo_data.get("created_at") else None,
        "pushedAt": repo_data.get("pushed_at", "").split('T')[0] if repo_data.get("pushed_at") else None,
    }

    print(f"    ⭐ Stars: {statistics['stars']:,} | 🍴 Forks: {statistics['forks']:,} | 👥 Contributors: {statistics['contributors'] or 'N/A'}")

    return statistics


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


def translate_with_googletrans(text: str) -> Optional[str]:
    """googletransライブラリを使って翻訳"""
    try:
        from googletrans import Translator
        translator = Translator()
        result = translator.translate(text, src='en', dest='ja')
        time.sleep(0.5)  # レート制限対策
        return result.text
    except ImportError:
        print("  Warning: googletrans not installed. Run: pip install googletrans==4.0.0-rc1")
        return None
    except Exception as e:
        print(f"  Warning: Translation failed with googletrans: {e}")
        return None


def translate_with_openai(text: str) -> Optional[str]:
    """OpenAI APIを使って翻訳"""
    if not OPENAI_API_KEY:
        print("  Warning: OPENAI_API_KEY not set")
        return None

    try:
        import json

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {OPENAI_API_KEY}"
        }

        data = {
            "model": "gpt-3.5-turbo",
            "messages": [
                {"role": "system", "content": "あなたは技術文書の翻訳を専門とする翻訳者です。英語のテキストを自然な日本語に翻訳してください。"},
                {"role": "user", "content": f"以下の英語テキストを日本語に翻訳してください：\n\n{text}"}
            ],
            "temperature": 0.3
        }

        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers=headers
        )

        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode())
            translated = result['choices'][0]['message']['content'].strip()
            time.sleep(0.5)  # レート制限対策
            return translated

    except Exception as e:
        print(f"  Warning: Translation failed with OpenAI: {e}")
        return None


def translate_text(text: str, method: str = TRANSLATION_METHOD) -> str:
    """テキストを指定された方法で翻訳"""
    if not text or method == "none":
        return text

    translated = None

    if method == "openai":
        translated = translate_with_openai(text)
    elif method == "googletrans":
        translated = translate_with_googletrans(text)

    # 翻訳失敗時は元のテキストを返す
    return translated if translated else text


def create_skill_data(repo: Dict[str, Any], skill_name: str, skill_data: Dict[str, Any], updated_at: Optional[str] = None, statistics: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
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

    # 英語データを取得
    name_en = skill_data.get("name", skill_name)
    description_en = skill_data.get("description", "")

    # 日本語に翻訳
    if TRANSLATION_METHOD != "none":
        print(f"    Translating '{name_en}'...")
        name_ja = translate_text(name_en)
        description_ja = translate_text(description_en)
    else:
        name_ja = name_en
        description_ja = description_en

    # スキルデータ
    skill = {
        "id": skill_id,
        "name": name_ja,
        "nameEn": name_en,
        "description": description_ja,
        "descriptionEn": description_en,
        "category": category_ja,
        "categoryEn": category_en,
        "author": repo["owner"]["login"],
        "stars": statistics.get("stars", repo["stargazers_count"]) if statistics else repo["stargazers_count"],
        "downloads": None,
        "updatedAt": updated_at if updated_at else datetime.now().strftime("%Y-%m-%d"),
        "tags": tags if tags else ["skill"],
        "githubUrl": f"{repo['html_url']}/tree/main/{skill_name}",
        "installCommand": None,
        # GitHub統計情報
        "github": {
            "forks": statistics.get("forks", 0) if statistics else 0,
            "watchers": statistics.get("watchers", 0) if statistics else 0,
            "openIssues": statistics.get("openIssues", 0) if statistics else 0,
            "openPullRequests": statistics.get("openPullRequests", 0) if statistics else 0,
            "contributors": statistics.get("contributors") if statistics else None,
            "language": statistics.get("language", "Unknown") if statistics else "Unknown",
            "license": statistics.get("license") if statistics else None,
            "size": statistics.get("size", 0) if statistics else 0,
            "createdAt": statistics.get("createdAt") if statistics else None,
            "pushedAt": statistics.get("pushedAt") if statistics else None,
        } if statistics else None,
    }

    return skill


def main():
    """メイン処理"""
    print("Claude Skills Data Fetcher with Auto-Translation")
    print("=" * 50)
    print(f"Translation Method: {TRANSLATION_METHOD}")
    if TRANSLATION_METHOD == "openai":
        print(f"OpenAI API Key: {'Set' if OPENAI_API_KEY else 'Not Set'}")
    print()

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

    # リポジトリ全体の統計情報を1回取得
    print("Fetching repository statistics (this may take a moment)...")
    repo_statistics = get_repo_statistics(repo["full_name"])
    print()

    # 各スキルディレクトリからデータを抽出
    skills = []
    for i, skill_name in enumerate(skill_dirs[:50], 1):  # 最大50個
        print(f"Processing [{i}/{min(len(skill_dirs), 50)}]: {skill_name}")

        # SKILL.mdを取得
        skill_data = fetch_skill_md(repo["full_name"], skill_name)

        if skill_data and skill_data.get("name"):
            # 最終更新日を取得
            print(f"  Fetching metadata...")
            updated_at = get_last_commit_date(repo["full_name"], skill_name)

            skill = create_skill_data(repo, skill_name, skill_data, updated_at, repo_statistics)
            skills.append(skill)
            print(f"  ✓ {skill['name']} ({skill['category']}) - Stars: {skill['stars']:,} / Updated: {skill['updatedAt']}")
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
