# Firestore Setup Guide

This document explains how to initialize and configure Cloud Firestore for this project.

## Configuration Files

The project includes the following Firebase configuration files:

- `firebase.json` - Firebase project configuration and Emulator settings
- `.firebaserc` - Firebase project ID (defaults to `rtttl-hub`)
- `firestore.rules` - Firestore security rules
- `src/types/firestore_schema.ts` - TypeScript type definitions for all collections

## 1. Enable Firestore

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. In the left menu, select **Firestore Database**
4. Click **Create Database**
5. Choose **Start in production mode** (we will use custom rules)
6. Select a Cloud Firestore location (recommended: `asia-east1` or `us-central1`)

## 2. Deploy Security Rules

Security rules are defined in `firestore.rules`. To deploy:

### Quick Start

The project is pre-configured with Firebase. Simply:

```bash
# 1. Login to Firebase (first time only)
npm run firebase:login

# 2. Verify project ID in .firebaserc
# Default is "rtttl-hub", edit .firebaserc if needed

# 3. Deploy rules
npm run firebase:deploy:rules
```

### Using npm scripts (Recommended)

```bash
# Login to Firebase (first time only)
npm run firebase:login

# Initialize Firebase project (if not already initialized)
firebase init firestore

# Deploy rules
npm run firebase:deploy:rules
```

### Using Firebase CLI

```bash
# Install Firebase CLI (if not already installed)
npm install -g firebase-tools

# Login
firebase login

# Initialize Firebase project (if not already initialized)
firebase init firestore

# Deploy rules
firebase deploy --only firestore:rules
```

### Using Firebase Console

1. Go to Firebase Console > Firestore Database > Rules
2. Copy the contents of `firestore.rules`
3. Paste and publish

## 3. Collection Structure

All collection schemas are defined in `src/types/firestore_schema.ts`. Below is a summary:

### users

Stores user profile information and settings.

- **Document ID**: `{userId}` (Firebase Auth UID)
- **Fields**: See `FirestoreUser` interface

```typescript
{
  uid: string;              // Firebase Auth UID
  displayName: string;      // User's display name
  email: string;            // User's email
  photoURL: string | null;  // Google profile photo
  customPhotoURL: string | null; // Custom uploaded avatar
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### user_creations

Stores user-created RTTTL compositions.

- **Document ID**: `{creationId}` (auto-generated)
- **Index**: `userId` (ascending)
- **Fields**: See `FirestoreUserCreation` interface

```typescript
{
  id: string;               // Unique creation ID
  userId: string;           // Creator's UID
  title: string;            // Composition title
  artist: string;           // Artist name (usually empty)
  code: string;             // RTTTL code
  tracks?: string[];        // Multi-track codes (optional)
  categories?: string[];    // Category tags (optional)
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### user_favorites

Stores a user's favorited tracks.

- **Document ID**: `{userId}` (Firebase Auth UID)
- **Fields**: See `FirestoreUserFavorites` interface

```typescript
{
  userId: string;           // User's UID (document ID)
  favorites: string[];      // Array of favorited track IDs
  updatedAt: Timestamp;
}
```

### track_stats

Stores aggregate statistics for tracks (Cloud Functions only).

- **Document ID**: `{trackId}`
- **Write Access**: Cloud Functions only
- **Fields**: See `FirestoreTrackStats` interface

```typescript
{
  trackId: string;          // Unique track identifier
  playCount: number;        // Total play count
  likeCount: number;        // Total like count
  lastPlayedAt?: Timestamp; // Last play timestamp
  lastLikedAt?: Timestamp;  // Last like timestamp
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## 4. Indexes

The following indexes will be automatically created on first query, or can be manually created in Firebase Console:

### user_creations
- Single field index: `userId` (ascending)

## 5. Features

### User Creations
- All creations are automatically synced to Firestore after user login
- Create/update/delete operations sync in real-time
- Offline modifications are stored locally and synced upon login

### User Favorites
- Toggle favorite status by clicking the heart icon
- 1-second debounce mechanism prevents excessive requests from rapid clicking
- Favorite data syncs automatically on login/logout

### Security
- Users can only read/write their own data
- Creations can be read by all authenticated users (prepared for future sharing feature)
- Favorites data is completely private

## 6. Local Testing

Use Firestore Emulator for local development:

### Quick Start (Recommended)

```bash
# Start Firebase Emulator
npm run firebase:emulator
```

The emulator will start on the following ports:
- Firestore: `localhost:8080`
- Emulator UI: `localhost:4000`

### Full Setup

```bash
# Initialize emulator (first time only)
firebase init emulators

# Start emulator
npm run firebase:emulator
```

### Enable Emulator in Code

Add to `src/lib/firebase.ts`:

```typescript
import { connectFirestoreEmulator } from "firebase/firestore";

// Add after initialization
if (import.meta.env.DEV && location.hostname === "localhost") {
  connectFirestoreEmulator(db, "localhost", 8080);
  console.log("🔧 Using Firestore Emulator");
}
```

### Testing Workflow

#### Option 1: Using Environment Scripts (Recommended)

1. **Start Emulator** (in one terminal):
   ```bash
   npm run firebase:emulator
   ```

2. **Start Development Server with Emulator** (in another terminal):
   ```bash
   npm run dev:local
   ```
   
   Or to test against production Firebase:
   ```bash
   npm run dev:prod
   ```

3. **Access Emulator UI**:
   - Open `http://localhost:4000`
   - View and manage test data

#### Option 2: Using Environment Variable

You can also set the environment variable in your `.env.local` file:

```bash
# .env.local
VITE_USE_EMULATOR=true
```

Then run:
```bash
npm run dev
```

#### Available Scripts

- `npm run dev` - Standard development mode (reads from `.env.local`)
- `npm run dev:local` - Force use Firebase Emulator
- `npm run dev:prod` - Force use production Firebase
- `npm run firebase:emulator` - Start Firebase Emulator

#### After Testing

- Emulator data is not persisted
- Each restart provides a fresh environment
- Switch between local/prod by changing the npm script

## 7. Monitoring & Quotas

- Go to Firebase Console > Firestore Database > Usage
- Free tier daily limits:
  - Reads: 50,000
  - Writes: 20,000
  - Deletes: 20,000
  - Storage: 1 GB

## 8. Troubleshooting

### Permission Errors

If you encounter `permission-denied` errors:
1. Verify the latest security rules are deployed
2. Confirm the user is logged in
3. Check the browser console for detailed error messages

### Sync Failures

If data is not syncing:
1. Check network connection
2. Verify Firebase configuration is correct
3. Review browser console errors

### High-Frequency Clicking

The favorites feature implements debouncing:
- Consecutive clicks will sync 1 second after the last click
- Local state updates immediately (smooth UX)
- Prevents malicious or accidental high-frequency requests
