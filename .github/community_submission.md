# Community Song Submission

Welcome! 🎵 This is the place to submit your original or favourite RTTTL tracks.
Approved submissions will be added to the **Community collection** on RTTTL Hub.

---

## Guidelines

- One track per comment is preferred (multiple tracks per song are allowed for polyphonic / multi-motor)
- `name` and `tracks` are **required**
- `artist` and `categories` are optional but appreciated
- Only valid RTTTL strings are accepted

### Available categories

`pop` · `classical` · `movie-tv` · `game` · `holiday` · `folk` · `alert` · `original`

---

## Comment Template

Please copy the template below and fill it in:

```json
{
  "name": "Your Song Title",
  "artist": "Your Name or Handle",
  "categories": ["original"],
  "tracks": [
    "SongTitle:d=4,o=5,b=120:c,e,g,c6"
  ]
}
```

For **multi-track / polyphonic** songs, add more entries to `tracks`:

```json
{
  "name": "Für Elise (Dual Motor)",
  "artist": "Robby",
  "categories": ["classical"],
  "tracks": [
    "Track1:d=8,o=5,b=100:e6,d#6,e6,d#6,e6,b,d6,c6,4a",
    "Track2:d=8,o=4,b=100:4p,4p,a,e5,a5,a,e5,a5"
  ]
}
```

---

## Notes

- Submissions are reviewed before being merged
- If your RTTTL string is sourced from elsewhere, please mention the original source in your comment
- Questions? Feel free to ask in this thread
