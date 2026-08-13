---
name: categorize-tracks
description: >
  Automatic categorization tool for RTTTL tracks based on track names.
  Use when needing to assign categories to large collections of uncategorized music tracks.
  Applies keyword-based pattern matching to identify genres like pop, classical, movie-tv, game, etc.
license: MIT
metadata:
  author: explooosion
  version: "1.0.0"
  scriptPath: scripts/categorize_tracks.py
---

# RTTTL Track Auto-Categorization

Apply this skill when you need to automatically assign categories to RTTTL music tracks based on their names. This tool uses intelligent keyword matching to categorize tracks without analyzing audio data, making it efficient for large-scale processing.

---

## Overview

**Script Location**: `/scripts/categorize_tracks.py`

**Purpose**: Automatically assigns category tags to RTTTL tracks in collection JSON files based on track name pattern matching.

**Key Features**:
- Processes all JSON files in `public/collections/` directory
- Uses regex-based keyword matching for 8 category types
- Conservative approach: only categorizes when confident
- Preserves existing categories (no overwriting)
- Dry-run mode to preview changes before applying

---

## Available Categories

The script supports 8 categories defined in `src/constants/categories.ts`:

| Category | Description | Example Keywords |
|----------|-------------|------------------|
| `pop` | Popular music | Beatles, ABBA, Michael Jackson, Take On Me |
| `classical` | Classical music | Beethoven, Mozart, Canon, Fur Elise, Symphony |
| `movie-tv` | Movies & TV shows | Star Wars, James Bond, Batman, X-Files, Simpsons |
| `game` | Video games | Mario, Zelda, Tetris, Sonic, Final Fantasy |
| `holiday` | Holiday music | Christmas, Birthday, Jingle Bell, Santa |
| `folk` | Folk & traditional | Scottish, Auld Lang Syne, Traditional, Danny Boy |
| `alert` | Alert tones | Alarm, Beep, Nokia, SMS, Ringtone |
| `original` | Original compositions | Platform-specific creations |

---

## Usage

### Interactive Mode (Recommended)

```bash
python3 scripts/categorize_tracks.py
```

**Process**:
1. **Phase 1**: Dry-run analysis (no file modifications)
   - Shows statistics for each collection
   - Displays sample changes (first 10)
   - Provides total summary

2. **Phase 2**: User confirmation prompt
   - Enter `y` to apply changes
   - Enter `n` or anything else to cancel

3. **Phase 3**: Apply changes (if confirmed)
   - Updates all collection JSON files
   - Preserves JSON formatting
   - Reports completion status

### Command Output Example

```
============================================================
RTTTL Track Auto-Categorization Tool
============================================================

Available categories:
  - pop: Pop Music
  - classical: Classical Music
  - movie-tv: Movie/TV
  ...

Processing picaxe.json...
  Total: 11121 tracks
  Already categorized: 0
  Newly categorized: 998
  Uncategorized: 10123

  Example changes (showing first 10):
    - James Bond: movie-tv
    - TakeOnMe: pop
    - Beethoven: classical
    ...

Summary
============================================================
Total tracks: 11145
Already categorized: 24 (0.2%)
Will categorize: 998 (9.0%)
Uncategorized: 10123 (90.8%)

Apply changes and write to files? (y/N):
```

---

## Categorization Rules

### Keyword Matching Strategy

1. **Case-Insensitive**: All matching is performed in lowercase
2. **Regex-Based**: Uses Python regex for flexible pattern matching
3. **Priority Order**: Categories are checked in defined order (holiday → movie-tv → game → classical → alert → folk → pop)
4. **Multiple Categories**: A track can be assigned multiple categories if it matches multiple keyword patterns

### Category Keywords (Selected Examples)

#### Holiday
- Christmas-related: `christmas`, `xmas`, `jingle bell`, `santa`, `silent night`
- Other holidays: `birthday`, `happy birthday`, `halloween`, `easter`

#### Movie-TV
- Star Wars: `star wars`, `imperial march`, `darth vader`, `jedi`
- James Bond: `james bond`, `007`, `dr no`, `goldfinger`
- Classic TV: `simpsons`, `x-files`, `knight rider`, `macgyver`, `star trek`
- Batman, Superman, Indiana Jones, Back to the Future, etc.

#### Game
- `mario`, `zelda`, `tetris`, `sonic`, `pokemon`, `final fantasy`
- `doom`, `street fighter`, `mega man`, `castlevania`

#### Classical
- Composers: `beethoven`, `mozart`, `bach`, `chopin`, `vivaldi`, `tchaikovsky`
- Forms: `symphony`, `concerto`, `sonata`, `waltz`, `minuet`, `fugue`
- Famous works: `canon`, `bolero`, `swan lake`, `nutcracker`, `fur elise`

#### Pop
- Artists: `beatles`, `abba`, `queen`, `michael jackson`, `madonna`
- Songs: `take on me`, `billie jean`, `thriller`, `stairway to heaven`
- Dance/Electronic: `techno`, `trance`, `house`, `disco`

#### Folk
- Regional: `scotland`, `scottish`, `irish`, `swedish`, `norwegian`
- Traditional: `folk`, `traditional`, `anthem`, `auld lang syne`, `danny boy`
- Nordic names: `maamme`, `byssan lull` (Finnish/Swedish folk songs)

#### Alert
- `alarm`, `alert`, `beep`, `buzzer`, `notification`, `siren`
- `nokia`, `sms`, `ringtone`, `door bell`, `phone`

---

## Technical Details

### Processing Flow

```python
1. Load all *.json files from public/collections/
2. For each track in each collection:
   a. Check if track already has categories
   b. If not, normalize track name (lowercase)
   c. Match against keyword patterns
   d. Assign matched categories
3. Validate JSON format
4. Write back to files (if confirmed)
```

### Data Structure

**Input/Output Format** (`public/collections/*.json`):
```json
[
  {
    "name": "James Bond",
    "artist": "Anonymous",
    "categories": ["movie-tv"],
    "tracks": [
      "JamesBond:d=4,o=6,b=112:..."
    ]
  }
]
```

### Script Functions

| Function | Purpose |
|----------|---------|
| `normalize_name(name)` | Convert to lowercase for matching |
| `categorize_track(name, existing)` | Apply regex patterns, return categories |
| `process_collection(file, dry_run)` | Process single JSON file |
| `main()` | Orchestrate two-phase process |

---

## Best Practices & Considerations

### When to Use

✅ **Use this tool when:**
- Adding a new large collection without categories
- Initial import of external data
- Bulk categorization needed for thousands of tracks
- Track names are clear and descriptive (English or known languages)

❌ **Do NOT use when:**
- Categories are already assigned (tool preserves existing ones)
- Track names are ambiguous or meaningless codes
- Manual curation is required for accuracy
- Working with non-standard naming conventions

### Important Notes

1. **Conservative Approach**
   - Only categorizes when keyword match is confident
   - ~9% categorization rate is normal for generic collections
   - Remaining tracks need manual review or are intentionally uncategorized

2. **Non-Destructive**
   - Preserves existing categories
   - Dry-run mode shows preview before applying
   - JSON formatting maintained
   - Original files backed up by git

3. **Multi-Language Support**
   - Primarily English keywords
   - Includes Nordic language patterns (Finnish, Swedish folk songs)
   - Can be extended with more language patterns

4. **Performance**
   - Handles 11,000+ tracks in seconds
   - Regex compilation is efficient
   - No audio processing required

### Extending Categories

To add new keywords or categories:

1. **Edit `scripts/categorize_tracks.py`**
2. **Add patterns to `CATEGORY_KEYWORDS` dictionary**:
   ```python
   CATEGORY_KEYWORDS = {
       "pop": [
           r"beatles", r"abba",
           r"your\s*new\s*pattern",  # Add here
       ],
   }
   ```
3. **Test with dry-run mode**
4. **Commit changes**

---

## Verification & Validation

### After Running the Script

```bash
# 1. Verify JSON format
node -e "JSON.parse(require('fs').readFileSync('public/collections/picaxe.json', 'utf8')); console.log('✓ JSON valid');"

# 2. Check statistics
python3 -c "
import json
from collections import Counter

with open('public/collections/picaxe.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

category_counts = Counter()
categorized = uncategorized = 0

for item in data:
    cats = item.get('categories', [])
    if cats:
        categorized += 1
        for cat in cats:
            category_counts[cat] += 1
    else:
        uncategorized += 1

print(f'Total: {len(data)}')
print(f'Categorized: {categorized} ({categorized/len(data)*100:.1f}%)')
print(f'Distribution:')
for cat, count in sorted(category_counts.items(), key=lambda x: x[1], reverse=True):
    print(f'  {cat}: {count}')
"

# 3. TypeScript compilation check
npx tsc --noEmit

# 4. Run tests
npm test

# 5. Build verification
npm run build
```

---

## Historical Results (Reference)

### 2026-08-13 Categorization

**PICAXE Collection** (11,121 tracks):
- **Categorized**: 998 tracks (9.0%)
- **Distribution**:
  - Pop: 313 (31.4%)
  - Movie-TV: 244 (24.4%)
  - Classical: 143 (14.3%)
  - Holiday: 99 (9.9%)
  - Folk: 90 (9.0%)
  - Alert: 72 (7.2%)
  - Game: 47 (4.7%)

**Other Collections**:
- Community: 2 tracks (100% already categorized)
- ESPHome: 7 tracks (100% already categorized)
- Skully RTTTL: 15 tracks (100% already categorized)

**Total Across All Collections**: 11,145 tracks, 1,022 categorized (9.2%)

---

## Git Workflow

```bash
# After running the script and verifying changes:

# 1. Check changes
git status
git diff --stat public/collections/

# 2. Commit categorization results
git add public/collections/*.json scripts/categorize_tracks.py
git commit -m "feat: auto-categorize tracks based on name patterns"

# 3. Verify build
npm run build
npm test
```

---

## Troubleshooting

### Issue: Script hangs or takes too long
**Solution**: Normal for 11k+ tracks. Wait for completion (~30 seconds max).

### Issue: JSON format error after running
**Solution**: 
```bash
# Revert changes
git checkout -- public/collections/*.json

# Check Python version (requires 3.7+)
python3 --version

# Re-run script
```

### Issue: Too few tracks categorized
**Expected**: 5-15% categorization rate is normal for general collections with diverse naming conventions. This is intentional to avoid false positives.

### Issue: Want to recategorize with new rules
**Solution**:
1. Manually remove categories from tracks in JSON files
2. Update keyword patterns in script
3. Re-run script

---

## Related Files

- **Script**: `scripts/categorize_tracks.py`
- **Category Constants**: `src/constants/categories.ts`
- **Collection Data**: `public/collections/*.json`
- **Parser**: `src/utils/rtttl_parser.ts`

---

## Summary Checklist

Before running categorization:
- [ ] Backup or commit current state
- [ ] Verify Python 3.7+ installed
- [ ] Review available categories
- [ ] Understand keyword patterns

After running categorization:
- [ ] Review dry-run output
- [ ] Confirm changes when prompted
- [ ] Validate JSON format
- [ ] Check statistics
- [ ] Run TypeScript/tests/build
- [ ] Commit changes with descriptive message

---

**Remember**: This tool is designed to handle bulk categorization efficiently while maintaining a conservative approach to avoid misclassification. Manual review and adjustment may still be needed for ambiguous cases.
