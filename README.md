<h1 align="center">RTTTL Hub</h1>

<p align="center">
    <img src="public/icons/favicon-512x512.png" width="160" />
    <br />
    <strong>Collect, play, and compose RTTTL ringtones — right in your browser!</strong>
</p>

<p align="center">
    <a href="https://rtttl-hub.io"><img src="https://img.shields.io/website?url=https%3A%2F%2Frtttl-hub.io&style=flat-square" alt="Website"></a>
    <a href="https://github.com/explooosion/rtttl-hub/actions/workflows/deploy.yml"><img src="https://img.shields.io/github/actions/workflow/status/explooosion/rtttl-hub/deploy.yml?style=flat-square" alt="Deploy status"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg?style=flat-square" alt="AGPL-3.0 license"></a>
    <a href="http://makeapullrequest.com"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome"></a>
</p>

<strong>NOTE: This platform is under active development and not yet officially launched. Features and content are subject to change without notice.</strong>

## Features

- A continually expanding catalogue of RTTTL ringtones spanning multiple collections, sourced from industry archives, open-source projects, and community submissions!
- A full-featured RTTTL editor and composer with syntax highlighting, multi-track lanes, waveform visualisation, A-B looping, and live audio preview — working toward a complete [Digital Audio Workstation (DAW)](https://en.wikipedia.org/wiki/Digital_audio_workstation) experience on the web, no installation required!
- Blazing-fast playback built on a purpose-built native Web Audio engine: entire tunes are pre-scheduled onto the hardware audio clock, so even thousand-note, multi-track songs play back at a buttery-smooth 60fps.
- Google sign-in via Firebase Authentication, with automatic cloud sync of your creations and favorites through Cloud Firestore.
- Full offline support — everything falls back to local storage and syncs automatically once you are back online.
- Localised into 13 languages, with dark mode and responsive layouts throughout.

## Collections

As a general rule, every collection integrated into the platform is listed here, and this section is updated whenever a new one is added. Anyone is welcome to propose a new collection — feel free to open an issue or pull request!

- **PICAXE:** The classic ringtone archive for the PICAXE `tune` command, spanning hundreds of well-known melodies. *Sourced from the [PICAXE RTTTL collection](https://picaxe.com/rtttl-ringtones-for-tune-command/)*
- **ESC Configurator:** Startup melodies for drone ESCs, contributed by the open-source community. *Sourced from the [ESC Configurator](https://esc-configurator.com/) project*
- **Skully RTTTL:** A curated set of tones from the rtttl-web-composer project. *Sourced from [rtttl-web-composer](https://github.com/ImSkully/rtttl-web-composer) by ImSkully*
- **ESPHome:** Example tunes from the ESPHome buzzer ecosystem for smart-home makers. *Sourced from the [ESPHome RTTTL component documentation](https://esphome.io/components/rtttl.html)*
- **BeepMyQuad:** Hand-arranged multi-motor RTTTL tunes for FPV quadcopter ESCs. *Sourced from [BeepMyQuad](https://beepmyquad.com/)*

## Audio Engine

- **Web Audio API:** Core tone synthesis and real-time scheduling — notes are compiled into AudioParam automation ahead of time, keeping the main thread free during playback.
- **Custom RTTTL parser & player:** Purpose-built parser and multi-track playback engine for the RTTTL format, with per-track mute/solo, seeking, and A-B loop support.

## Installation

No installation needed — just visit [https://rtttl-hub.io](https://rtttl-hub.io) in any modern browser (Chrome 110+ recommended).

## Development

Node.js 18+ and npm are required. The Firebase CLI is optional, for deploying rules.

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

For local development with Firebase features, start the emulator in one terminal and the dev server in another — or point straight at production:

```bash
npm run firebase:emulator   # Start Firebase Emulator
npm run dev:local           # Dev server with Emulator
npm run dev:prod            # Dev server with production Firebase
```

See [FIRESTORE.md](FIRESTORE.md) for detailed Firebase configuration.

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run dev:local` - Start dev server with Firebase Emulator
- `npm run dev:prod` - Start dev server with production Firebase
- `npm run sitemap` - Regenerate `public/sitemap.xml` and `public/robots.txt`
- `npm run sitemap:check` - Verify sitemap artifacts are up to date and committed
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run firebase:emulator` - Start Firebase Emulator for local testing
- `npm run firebase:deploy:rules` - Deploy Firestore security rules
- `npm run firebase:login` - Authenticate with Firebase CLI

### Sitemap Maintenance

- Sitemap and robots are generated from project routes and collection configuration via `scripts/generate-sitemap.ts`.
- Any route/collection indexing change should be followed by `npm run sitemap`, and `npm run sitemap:check` before pushing to `main` (CI enforces this in `.github/workflows/deploy.yml`).
- Google Search Console submission endpoint: `https://rtttl-hub.io/sitemap.xml`.

## License

RTTTL Hub is licensed under the terms of the [GNU Affero General Public License v3.0](LICENSE).

