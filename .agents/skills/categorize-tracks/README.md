# Track Auto-Categorization Skill

Automatically assigns category tags to RTTTL tracks based on intelligent keyword pattern matching.

## Quick Start

```bash
python3 scripts/categorize_tracks.py
```

## Documentation

See [SKILL.md](./SKILL.md) for comprehensive documentation including:
- Usage instructions
- Category definitions & keyword patterns
- Best practices & considerations
- Verification steps
- Troubleshooting guide

## Key Features

- 🎯 8 category types (pop, classical, movie-tv, game, holiday, folk, alert, original)
- 🔍 Regex-based keyword matching
- 🛡️ Conservative approach (only categorizes when confident)
- 📊 Dry-run mode with preview before applying
- 🌍 Multi-language support (English, Nordic languages)
- ⚡ Efficient processing of 11k+ tracks

## When to Use

- Importing new large collections without categories
- Bulk categorization of uncategorized tracks
- Initial data processing from external sources

## Results

Typical categorization rate: **9-15%** of tracks (intentionally conservative to avoid false positives)

Example from PICAXE collection (11,121 tracks):
- ✅ 998 categorized (9.0%)
- Pop: 313 | Movie-TV: 244 | Classical: 143 | Holiday: 99 | Folk: 90 | Alert: 72 | Game: 47
