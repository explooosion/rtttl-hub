# RTTTL Hub

RTTTL Hub is a browser-based audio platform dedicated to collecting, playing, and creating RTTTL ringtones. The platform curates a growing library of tones across multiple collections — sourced from industry datasets, open-source projects, and community contributors — and delivers a full-featured composition environment designed to bring [Digital Audio Workstation (DAW)](https://en.wikipedia.org/wiki/Digital_audio_workstation) capabilities to the web, with no installation required.

> **⚠️ Work in Progress** — This platform is currently under active development and not yet officially launched. Features and content are subject to change.

**Live site:** [https://rtttl-hub.io](https://rtttl-hub.io)

## Features

- **Collections** — A continually expanding catalogue spanning multiple collections, sourced from industry archives, open-source projects, and community submissions
- **RTTTL editor & composer** — Full-featured authoring environment with syntax highlighting, multi-track support, and live audio preview — working toward a complete Digital Audio Workstation (DAW) experience in the browser
- **User Authentication** — Google OAuth integration with Firebase Authentication
- **Cloud Sync** — Automatic synchronization of user creations and favorites via Cloud Firestore
- **Offline Support** — Local storage fallback with automatic sync when online

## Audio Engine

- **Web Audio API** — Core tone synthesis and real-time scheduling
- **Custom RTTTL parser & player** — Purpose-built parser and multi-track playback engine for the RTTTL format

## Data Sources

All collections integrated into the platform are listed here. This section is updated whenever a new collection is added.

- **PICAXE** — Sourced from the [PICAXE RTTTL collection](https://picaxe.com/rtttl-ringtones-for-tune-command/).
- **ESC Configurator** — Sourced from the [ESC Configurator](https://esc-configurator.com/) open-source project.
- **Skully RTTTL** — Sourced from [rtttl-web-composer](https://github.com/ImSkully/rtttl-web-composer) by ImSkully.
- **ESPHome** — Sourced from the [ESPHome RTTTL component documentation](https://esphome.io/components/rtttl.html).

## Development

### Prerequisites

- Node.js 18+ and npm
- Firebase CLI (optional, for deploying rules)

### Quick Start

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

### Firebase Setup

For local development with Firebase features:

```bash
# Start Firebase Emulator (in one terminal)
npm run firebase:emulator

# Start dev server with Emulator (in another terminal)
npm run dev:local

# Or use production Firebase
npm run dev:prod
```

See [FIRESTORE.md](FIRESTORE.md) for detailed Firebase configuration.

### Available Scripts

- `npm run dev` - Start Vite development server
- `npm run dev:local` - Start dev server with Firebase Emulator
- `npm run dev:prod` - Start dev server with production Firebase
- `npm run build` - Build for production
- `npm run test` - Run unit tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run firebase:emulator` - Start Firebase Emulator for local testing
- `npm run firebase:deploy:rules` - Deploy Firestore security rules
- `npm run firebase:login` - Authenticate with Firebase CLI

## License

This project is licensed under the [GNU Affero General Public License v3.0](LICENSE).
