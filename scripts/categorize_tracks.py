#!/usr/bin/env python3
"""
Automatic category assignment for RTTTL tracks
Determines appropriate categories based on track names
"""

import json
import re
from pathlib import Path
from typing import List, Set

# Available categories
CATEGORIES = {
    "pop": "Pop Music",
    "classical": "Classical Music",
    "movie-tv": "Movie/TV",
    "game": "Games",
    "holiday": "Holidays",
    "folk": "Folk Music",
    "alert": "Alerts",
    "original": "Original"
}

# Category keyword mapping (priority from top to bottom)
CATEGORY_KEYWORDS = {
    "holiday": [
        # Christmas
        r"christmas", r"xmas", r"x-mas", r"jingle\s*bell", r"santa", r"silent\s*night",
        r"joy\s*to\s*the\s*world", r"we\s*wish\s*you", r"rudolph", r"frosty",
        r"deck\s*the\s*hall", r"carol", r"noel",
        # Other holidays
        r"birthday", r"happy\s*birthday", r"auld\s*lang\s*syne", r"new\s*year",
        r"easter", r"halloween", r"thanksgiving"
    ],
    
    "movie-tv": [
        # Movies
        r"star\s*wars", r"imperial\s*march", r"darth\s*vader", r"jedi",
        r"james\s*bond", r"007", r"dr\.?\s*no", r"goldfinger",
        r"mission\s*impossible", r"indiana\s*jones", r"raiders",
        r"back\s*to\s*the\s*future", r"batman", r"superman", r"spiderman",
        r"lion\s*king", r"frozen", r"aladdin", r"beauty\s*and\s*the\s*beast",
        r"titanic", r"godfather", r"das\s*boot", r"harry\s*potter",
        r"lord\s*of\s*the\s*rings", r"pirates\s*of\s*the\s*caribbean",
        r"rocky", r"terminator", r"jurassic", r"ghostbusters",
        # TV Shows
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
        # Composers
        r"beethoven", r"mozart", r"bach", r"chopin", r"vivaldi",
        r"tchaikovsky", r"brahms", r"schubert", r"handel", r"haydn",
        r"debussy", r"liszt", r"wagner", r"verdi", r"puccini",
        r"strauss", r"mahler", r"rachmaninoff", r"schumann",
        # Classical works
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
        # Folk music markers from various countries
        r"folk", r"traditional", r"anthem", r"national",
        # Scottish/Irish
        r"scotland", r"scottish", r"auld\s*lang\s*syne", r"danny\s*boy",
        r"irish", r"ireland", r"molly\s*malone",
        # Other countries
        r"yankee\s*doodle", r"dixie", r"camptown", r"oh\s*susanna",
        r"amazing\s*grace", r"swing\s*low", r"when\s*the\s*saints",
        r"greensleeves", r"scarborough", r"house\s*of\s*the\s*rising",
        # Nordic countries
        r"finlandia", r"swedish", r"norwegian", r"danish",
        # Other language folk songs (e.g., Finnish)
        r"maamme", r"isontalonAntti", r"josetsasoita",
        r"koskameillaon", r"lastenliikenne", r"pieniankanpoi",
        r"porsaitaaidin", r"rosvoroope", r"byssan\s*lull"
    ],
    
    "pop": [
        # Pop artists/bands
        r"beatles", r"abba", r"queen", r"michael\s*jackson",
        r"madonna", r"elton\s*john", r"eagles", r"led\s*zeppelin",
        r"pink\s*floyd", r"rolling\s*stones", r"aerosmith",
        r"bon\s*jovi", r"guns\s*n\s*roses", r"u2", r"nirvana",
        r"spice\s*girls", r"backstreet", r"nsync", r"britney",
        # Pop songs
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
        # Dance/Electronic
        r"techno", r"trance", r"house", r"dance", r"disco",
        r"blue\s*monday", r"sandstorm", r"rhythm\s*is\s*a\s*dancer",
        r"better\s*off\s*alone", r"children", r"dj", r"remix"
    ]
}

def normalize_name(name: str) -> str:
    """Normalize track name for matching"""
    return name.lower().strip()

def categorize_track(name: str, existing_categories: List[str]) -> List[str]:
    """
    Determine categories based on track name
    
    Args:
        name: Track name
        existing_categories: Existing categories (preserved)
    
    Returns:
        List of categories
    """
    # If already categorized, preserve existing categories
    if existing_categories:
        return existing_categories
    
    normalized = normalize_name(name)
    matched_categories: Set[str] = set()
    
    # Check category keywords by priority
    for category, keywords in CATEGORY_KEYWORDS.items():
        for keyword in keywords:
            if re.search(keyword, normalized):
                matched_categories.add(category)
                break  # Move to next category after finding one keyword
    
    # If no match, return empty list (no forced categorization)
    return sorted(list(matched_categories))

def process_collection(file_path: Path, dry_run: bool = True) -> dict:
    """
    Process a single collection file
    
    Args:
        file_path: JSON file path
        dry_run: If True, only show changes without writing
    
    Returns:
        Statistics
    """
    print(f"\nProcessing {file_path.name}...")
    
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
    
    # Display statistics
    print(f"  Total: {stats['total']} tracks")
    print(f"  Already categorized: {stats['already_categorized']}")
    print(f"  Newly categorized: {stats['newly_categorized']}")
    print(f"  Uncategorized: {stats['uncategorized']}")
    
    # Display sample changes
    if stats["changes"]:
        print(f"\n  Example changes (showing first 10):")
        for change in stats["changes"][:10]:
            print(f"    - {change['name']}: {', '.join(change['categories'])}")
        if len(stats["changes"]) > 10:
            print(f"    ... {len(stats["changes"]) - 10} more")
    
    # Write to file
    if not dry_run:
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"  ✓ Updated {file_path.name}")
    
    return stats

def main():
    """Main program"""
    collections_dir = Path('public/collections')
    
    print("=" * 60)
    print("RTTTL Track Auto-Categorization Tool")
    print("=" * 60)
    print(f"\nAvailable categories:")
    for key, desc in CATEGORIES.items():
        print(f"  - {key}: {desc}")
    
    # First run dry-run
    print("\n" + "=" * 60)
    print("Phase 1: Analyze Changes (No Write)")
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
    
    # Display summary
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"Total tracks: {total_stats['total']}")
    print(f"Already categorized: {total_stats['already_categorized']} ({total_stats['already_categorized']/total_stats['total']*100:.1f}%)")
    print(f"Will categorize: {total_stats['newly_categorized']} ({total_stats['newly_categorized']/total_stats['total']*100:.1f}%)")
    print(f"Uncategorized: {total_stats['uncategorized']} ({total_stats['uncategorized']/total_stats['total']*100:.1f}%)")
    
    # Ask for confirmation
    print("\n" + "=" * 60)
    response = input("Apply changes and write to files? (y/N): ").strip().lower()
    
    if response == 'y':
        print("\n" + "=" * 60)
        print("Phase 2: Apply Changes")
        print("=" * 60)
        
        for json_file in sorted(collections_dir.glob('*.json')):
            process_collection(json_file, dry_run=False)
        
        print("\n✓ Done! All files have been updated.")
    else:
        print("\nOperation cancelled.")

if __name__ == "__main__":
    main()
