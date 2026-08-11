# Curated Collection Submission

Know a website, GitHub repo, or resource full of RTTTL ringtones?
Submit it here and we may add it as a new **curated collection** on RTTTL Hub.

---

## Option A — Quick Submission (we handle the formatting)

Just provide the basics:

| Field | Required | Description |
|---|---|---|
| Source Name | ✅ | Display name for the collection |
| URL | ✅ | Homepage or reference page |
| Download / Data URL | ✅ | Direct link to the raw data (JSON, text file, GitHub repo, etc.) |
| Description | Optional | A short summary of what's in the collection |

**Example comment:**

```
Source Name: Nokia RTTTL Archive
URL: https://example.com/nokia-ringtones
Download URL: https://example.com/nokia-ringtones/data.txt
Description: A large archive of original Nokia-era ringtones covering pop, classical, and alerts.
```

---

## Option B — Full Submission (preferred, faster to review)

If you can export or convert the data to our schema, we can merge it much faster.
Please attach or paste a JSON file following this format:

```json
[
  {
    "name": "Song Title",
    "artist": "Artist Name",
    "categories": ["pop"],
    "tracks": [
      "SongTitle:d=4,o=5,b=120:c,e,g,c6"
    ]
  }
]
```

### Available categories

`pop` · `classical` · `movie-tv` · `game` · `holiday` · `folk` · `alert` · `original`

> Leave `categories` as `[]` if you are unsure — we will classify it during review.

---

## Notes

- Collections should contain more than a handful of tracks to be worth a dedicated collection page
- Please make sure the source is publicly accessible and redistribution is permitted
- We will credit the original source on the collection page
