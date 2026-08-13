#!/usr/bin/env python3
"""
自動為 RTTTL 曲目分配分類
根據曲目名稱判斷合適的分類
"""

import json
import re
from pathlib import Path
from typing import List, Set

# 可用的分類
CATEGORIES = {
    "pop": "流行音樂",
    "classical": "古典音樂",
    "movie-tv": "電影/電視",
    "game": "遊戲",
    "holiday": "節日",
    "folk": "民謠",
    "alert": "提示音",
    "original": "原創"
}

# 分類關鍵字映射（優先級由上到下）
CATEGORY_KEYWORDS = {
    "holiday": [
        # 聖誕節
        r"christmas", r"xmas", r"x-mas", r"jingle\s*bell", r"santa", r"silent\s*night",
        r"joy\s*to\s*the\s*world", r"we\s*wish\s*you", r"rudolph", r"frosty",
        r"deck\s*the\s*hall", r"carol", r"noel",
        # 其他節日
        r"birthday", r"happy\s*birthday", r"auld\s*lang\s*syne", r"new\s*year",
        r"easter", r"halloween", r"thanksgiving"
    ],
    
    "movie-tv": [
        # 電影
        r"star\s*wars", r"imperial\s*march", r"darth\s*vader", r"jedi",
        r"james\s*bond", r"007", r"dr\.?\s*no", r"goldfinger",
        r"mission\s*impossible", r"indiana\s*jones", r"raiders",
        r"back\s*to\s*the\s*future", r"batman", r"superman", r"spiderman",
        r"lion\s*king", r"frozen", r"aladdin", r"beauty\s*and\s*the\s*beast",
        r"titanic", r"godfather", r"das\s*boot", r"harry\s*potter",
        r"lord\s*of\s*the\s*rings", r"pirates\s*of\s*the\s*caribbean",
        r"rocky", r"terminator", r"jurassic", r"ghostbusters",
        # 電視
        r"simpsons", r"flintstones", r"friends", r"seinfeld",
        r"x-files", r"dallas", r"mash", r"cheers",
        r"knight\s*rider", r"macgyver", r"a-team", r"airwolf",
        r"magnum", r"miami\s*vice", r"dukes\s*of\s*hazzard",
        r"dallas", r"dynasty", r"90210", r"baywatch",
        r"postman\s*pat", r"sesame", r"muppet",
        r"addams\s*family", r"munsters", r"beverly\s*hills",
        r"twin\s*peaks", r"x\s*files", r"dr\.?\s*who", r"doctor\s*who",
        r"star\s*trek", r"enterprise", r"highlander",
        r"allo\s*allo", r"fawlty\s*towers", r"monty\s*python"
    ],
    
    "game": [
        r"mario", r"zelda", r"tetris", r"pac-?man", r"sonic",
        r"final\s*fantasy", r"pokemon", r"minecraft", r"doom",
        r"mortal\s*kombat", r"street\s*fighter", r"mega\s*man",
        r"castlevania", r"metroid", r"donkey\s*kong", r"kirby",
        r"contra", r"gradius", r"bubble\s*bobble",
        r"game\s*over", r"level\s*up", r"power\s*up"
    ],
    
    "classical": [
        # 作曲家
        r"beethoven", r"mozart", r"bach", r"chopin", r"vivaldi",
        r"tchaikovsky", r"brahms", r"schubert", r"handel", r"haydn",
        r"debussy", r"liszt", r"wagner", r"verdi", r"puccini",
        r"strauss", r"mahler", r"rachmaninoff", r"schumann",
        # 古典作品
        r"symphony", r"concerto", r"sonata", r"prelude", r"nocturne",
        r"etude", r"waltz", r"minuet", r"fugue", r"canon",
        r"requiem", r"mass", r"overture", r"suite", r"rhapsody",
        r"blue\s*danube", r"swan\s*lake", r"nutcracker", r"bolero",
        r"four\s*seasons", r"spring", r"summer", r"autumn", r"winter",
        r"fur\s*elise", r"moonlight", r"pathetique", r"eroica",
        r"eine\s*kleine", r"nachtmusik", r"william\s*tell",
        r"marriage\s*of\s*figaro", r"magic\s*flute", r"don\s*giovanni",
        r"carmen", r"la\s*traviata", r"rigoletto", r"nabucco",
        r"barber\s*of\s*seville", r"clair\s*de\s*lune"
    ],
    
    "alert": [
        r"alarm", r"alert", r"beep", r"buzzer", r"ring\s*tone",
        r"notification", r"siren", r"warning", r"sos",
        r"reveille", r"taps", r"bugle", r"call",
        r"nokia", r"sms", r"message", r"email",
        r"door\s*bell", r"phone", r"mobile"
    ],
    
    "folk": [
        # 各國民謠標記
        r"folk", r"traditional", r"anthem", r"national",
        # 蘇格蘭/愛爾蘭
        r"scotland", r"scottish", r"auld\s*lang\s*syne", r"danny\s*boy",
        r"irish", r"ireland", r"molly\s*malone",
        # 其他國家
        r"yankee\s*doodle", r"dixie", r"camptown", r"oh\s*susanna",
        r"amazing\s*grace", r"swing\s*low", r"when\s*the\s*saints",
        r"greensleeves", r"scarborough", r"house\s*of\s*the\s*rising",
        # 北歐
        r"finlandia", r"swedish", r"norwegian", r"danish",
        # 其他語言的民謠（芬蘭語等）
        r"maamme", r"isontalonAntti", r"josetsasoita",
        r"koskameillaon", r"lastenliikenne", r"pieniankanpoi",
        r"porsaitaaidin", r"rosvoroope", r"byssan\s*lull"
    ],
    
    "pop": [
        # 流行藝人/樂團
        r"beatles", r"abba", r"queen", r"michael\s*jackson",
        r"madonna", r"elton\s*john", r"eagles", r"led\s*zeppelin",
        r"pink\s*floyd", r"rolling\s*stones", r"aerosmith",
        r"bon\s*jovi", r"guns\s*n\s*roses", r"u2", r"nirvana",
        r"spice\s*girls", r"backstreet", r"nsync", r"britney",
        # 流行歌曲
        r"imagine", r"yesterday", r"hey\s*jude", r"let\s*it\s*be",
        r"bohemian\s*rhapsody", r"we\s*are\s*the\s*champions",
        r"stairway\s*to\s*heaven", r"hotel\s*california",
        r"sweet\s*child", r"smells\s*like", r"wonderwall",
        r"dancing\s*queen", r"mamma\s*mia", r"waterloo",
        r"take\s*on\s*me", r"africa", r"toto", r"eye\s*of\s*the\s*tiger",
        r"we\s*will\s*rock\s*you", r"another\s*one\s*bites",
        r"billie\s*jean", r"thriller", r"beat\s*it",
        r"livin\s*on\s*a\s*prayer", r"sweet\s*home\s*alabama",
        r"smoke\s*on\s*the\s*water", r"highway\s*to\s*hell",
        # 舞曲/電子
        r"techno", r"trance", r"house", r"dance", r"disco",
        r"blue\s*monday", r"sandstorm", r"rhythm\s*is\s*a\s*dancer",
        r"better\s*off\s*alone", r"children", r"dj", r"remix"
    ]
}

def normalize_name(name: str) -> str:
    """正規化曲目名稱以便匹配"""
    return name.lower().strip()

def categorize_track(name: str, existing_categories: List[str]) -> List[str]:
    """
    根據曲目名稱判斷分類
    
    Args:
        name: 曲目名稱
        existing_categories: 現有分類（保留）
    
    Returns:
        分類列表
    """
    # 如果已經有分類，保留現有分類
    if existing_categories:
        return existing_categories
    
    normalized = normalize_name(name)
    matched_categories: Set[str] = set()
    
    # 按優先級檢查分類關鍵字
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if re.search(keyword, normalized):
                matched_categories.add(category)
                break  # 找到一個關鍵字就跳到下一個分類
    
    # 如果沒有匹配到任何分類，返回空列表（不強制分類）
    return sorted(list(matched_categories))

def process_collection(file_path: Path, dry_run: bool = True) -> dict:
    """
    處理單個收藏文件
    
    Args:
        file_path: JSON 文件路徑
        dry_run: 如果為 True，只顯示變更不寫入
    
    Returns:
        統計資訊
    """
    print(f"\n處理 {file_path.name}...")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    stats = {
        "total": len(data),
        "already_categorized": 0,
        "newly_categorized": 0,
        "uncategorized": 0,
        "changes": []
    }
    
    for item in data:
        name = item.get("name", "")
        existing = item.get("categories", [])
        
        if existing:
            stats["already_categorized"] += 1
        else:
            new_categories = categorize_track(name, existing)
            
            if new_categories:
                stats["newly_categorized"] += 1
                item["categories"] = new_categories
                stats["changes"].append({
                    "name": name,
                    "categories": new_categories
                })
            else:
                stats["uncategorized"] += 1
    
    # 顯示統計
    print(f"  總計: {stats['total']} 個曲目")
    print(f"  已有分類: {stats['already_categorized']}")
    print(f"  新增分類: {stats['newly_categorized']}")
    print(f"  無法分類: {stats['uncategorized']}")
    
    # 顯示部分變更範例
    if stats["changes"]:
        print(f"\n  範例變更（顯示前 10 個）:")
        for change in stats["changes"][:10]:
            print(f"    - {change['name']}: {', '.join(change['categories'])}")
        if len(stats["changes"]) > 10:
            print(f"    ... 還有 {len(stats["changes"]) - 10} 個")
    
    # 寫入文件
    if not dry_run:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✓ 已更新 {file_path.name}")
    
    return stats

def main():
    """主程序"""
    collections_dir = Path('public/collections')
    
    print("=" * 60)
    print("RTTTL 曲目自動分類工具")
    print("=" * 60)
    print(f"\n可用分類:")
    for key, desc in CATEGORIES.items():
        print(f"  - {key}: {desc}")
    
    # 先執行 dry run
    print("\n" + "=" * 60)
    print("階段 1: 分析變更（不寫入）")
    print("=" * 60)
    
    total_stats = {
        "total": 0,
        "already_categorized": 0,
        "newly_categorized": 0,
        "uncategorized": 0
    }
    
    for json_file in sorted(collections_dir.glob('*.json')):
        stats = process_collection(json_file, dry_run=True)
        total_stats["total"] += stats["total"]
        total_stats["already_categorized"] += stats["already_categorized"]
        total_stats["newly_categorized"] += stats["newly_categorized"]
        total_stats["uncategorized"] += stats["uncategorized"]
    
    # 顯示總計
    print("\n" + "=" * 60)
    print("總計")
    print("=" * 60)
    print(f"總曲目數: {total_stats['total']}")
    print(f"已有分類: {total_stats['already_categorized']} ({total_stats['already_categorized']/total_stats['total']*100:.1f}%)")
    print(f"將新增分類: {total_stats['newly_categorized']} ({total_stats['newly_categorized']/total_stats['total']*100:.1f}%)")
    print(f"無法分類: {total_stats['uncategorized']} ({total_stats['uncategorized']/total_stats['total']*100:.1f}%)")
    
    # 詢問是否執行
    print("\n" + "=" * 60)
    response = input("是否要執行變更並寫入文件？(y/N): ").strip().lower()
    
    if response == 'y':
        print("\n" + "=" * 60)
        print("階段 2: 執行變更")
        print("=" * 60)
        
        for json_file in sorted(collections_dir.glob('*.json')):
            process_collection(json_file, dry_run=False)
        
        print("\n✓ 完成！所有文件已更新。")
    else:
        print("\n取消操作。")

if __name__ == "__main__":
    main()
