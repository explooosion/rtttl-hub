# RTTTL Hub

An online RTTTL ringtone platform built with React + TypeScript. Explore collections of retro ringtones — browse the PICAXE library of 11,000+ tones, discover community creations, and compose your own chiptunes directly in your browser.

🌐 **Live site:** https://robby570.tw/rtttl-hub/

## Features

- **Multi-collection architecture** — PICAXE (11K+ tones) and Community collections
- **Web Audio playback** — Play tones in-browser using the Web Audio API, no plugins needed
- **Real-time waveform** — Visual seek bar synchronized with playback
- **RTTTL editor** — Edit and preview ringtone code with instant audio feedback
- **Create & manage tones** — Add custom tones with title, artist, category tagging, and free-form notes
- **Favorites** — Save and manage favorites with persistent local storage
- **Listened history** — Tracks which tones you have played
- **Creator profiles** — Dedicated pages for community contributors listing their works
- **Search, sort & filter** — Full-text search, A–Z letter sidebar, category filter, and multiple sort modes
- **Dark / light / system theme** — Persistent theme preference
- **i18n** — English and Traditional Chinese (zh-TW) interfaces
- **Cookie consent & legal pages** — Terms, Privacy Policy, Cookie Policy
- **Account system** — Register, log in, manage profile and password

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4**
- **Zustand** — global state (player, collection, favorites, listened, auth, theme)
- **React Router v7** (HashRouter for GitHub Pages compatibility)
- **i18next** + react-i18next
- **@tanstack/react-virtual** — virtualized large lists
- **Web Audio API** — tone synthesis

## Data Source

The PICAXE collection is sourced from the [PICAXE RTTTL collection](https://picaxe.com/rtttl-ringtones-for-tune-command/) and is used for non-commercial, educational purposes only. The original data remains the property of its respective authors.

## License

MIT © [explooosion](https://github.com/explooosion)
