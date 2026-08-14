# Track Statistics - Operational Definition

## 1. Overview

This document defines the implementation approach for tracking play counts and like counts for RTTTL tracks. The system follows industry best practices for real-time statistics tracking with client-side updates and eventual consistency.

## 2. Data Model

### 2.1 Firestore Collections

#### `track_stats` (Public Read, Server Write)
```typescript
{
  trackId: string;           // Document ID
  playCount: number;         // Total plays across all users
  likeCount: number;         // Total likes (unique users)
  lastPlayedAt: Timestamp;   // Last play timestamp
  lastLikedAt: Timestamp;    // Last like timestamp
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `user_track_interactions` (User Private)
```typescript
{
  id: string;                // Auto-generated
  userId: string;            // Indexed
  trackId: string;           // Indexed
  lastPlayedAt: Timestamp;   // Last time user played this track
  playCount: number;         // How many times this user played
  hasLiked: boolean;         // Whether user liked this track
  likedAt?: Timestamp;       // When user liked (if hasLiked = true)
}
// Composite Index: [userId, trackId]
```

#### `pending_stats_updates` (Server Only)
```typescript
{
  id: string;                // Auto-generated
  trackId: string;           // Indexed
  type: 'play' | 'like' | 'unlike';
  userId?: string;           // Optional (for deduplication)
  createdAt: Timestamp;
}
// TTL Index: createdAt (auto-delete after 24 hours)
```

### 2.2 Client-Side State

```typescript
interface TrackStatsCache {
  [trackId: string]: {
    playCount: number;
    likeCount: number;
    localPlays: number;      // Optimistic increment before sync
    localLikes: number;      // Optimistic increment before sync
    lastSynced: number;      // Timestamp
  }
}
```

## 3. Core Behaviors

### 3.1 Play Count Tracking

#### Trigger Point
- When user clicks play button on a track
- Location: `player_store.ts` → `playItem()` function

#### Client-Side Flow
1. User clicks play → immediate UI update (+1 to local count)
2. Debounce 3 seconds (prevent spam)
3. Create `pending_stats_updates` document
4. Mark user interaction in `user_track_interactions`

#### Server-Side (Cloud Function)
- Triggered by: `pending_stats_updates` onCreate
- Action: Aggregate and update `track_stats.playCount`
- Cleanup: Delete processed `pending_stats_updates` docs

#### Deduplication Strategy
- Client: 3-second debounce per track
- Server: Use userId + trackId to prevent double counting within 1 minute

### 3.2 Like Count Tracking

#### Trigger Point
- When user clicks heart icon
- Location: `favorite_button.tsx` → `toggleFavorite()` function

#### Client-Side Flow
1. User clicks heart → immediate UI update (toggle)
2. Update `user_favorites` collection (existing behavior)
3. Create `pending_stats_updates` with type 'like' or 'unlike'
4. Update `user_track_interactions.hasLiked`

#### Server-Side (Cloud Function)
- Triggered by: `pending_stats_updates` onCreate
- Action: Increment/decrement `track_stats.likeCount`
- Validation: Check `user_track_interactions` to prevent duplicates

#### Idempotency
- Server maintains set of userId+trackId combinations
- Ignore duplicate like/unlike operations within 1 hour

## 4. Implementation Phases

### Phase 1: Foundation (Current Task)
- [x] Define data models in `firestore_schema.ts`
- [ ] Update Firestore security rules
- [ ] Create stats service (`track_stats_service.ts`)
- [ ] Add stats store (`track_stats_store.ts`)

### Phase 2: Client Integration
- [ ] Integrate play tracking in `player_store.ts`
- [ ] Integrate like tracking in `favorite_button.tsx`
- [ ] Display real-time stats in `track_row.tsx`
- [ ] Add optimistic UI updates

### Phase 3: Server-Side (Future)
- [ ] Cloud Function: Aggregate play counts
- [ ] Cloud Function: Aggregate like counts
- [ ] Scheduled cleanup of old pending updates
- [ ] Analytics dashboard (optional)

## 5. Security Rules

```javascript
// Read access: public
match /track_stats/{trackId} {
  allow read: if true;
  allow write: if false; // Server only
}

// User interactions: private per user
match /user_track_interactions/{docId} {
  allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
  allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow delete: if false; // Never delete (for analytics)
}

// Pending updates: authenticated users can create
match /pending_stats_updates/{docId} {
  allow read: if false;
  allow create: if isAuthenticated();
  allow update, delete: if false; // Server only
}
```

## 6. Performance Considerations

### 6.1 Caching Strategy
- **Client Cache**: 5-minute TTL for stats display
- **Firestore Cache**: Use snapshot listeners for real-time updates
- **Initial Load**: Batch fetch stats for visible tracks only

### 6.2 Debouncing
- **Plays**: 3-second debounce per track
- **Likes**: Instant (no debounce needed - toggle operation)

### 6.3 Batch Operations
- Fetch stats for 20 tracks at once (pagination size)
- Use `whereIn` queries with trackId array

### 6.4 Optimistic Updates
- Immediately update UI (+1 play/like)
- Roll back on error
- Reconcile with server on next sync

## 7. Edge Cases

### 7.1 Anonymous Users
- **Decision**: Track plays, but no user attribution
- **Implementation**: Allow `userId` to be null in `pending_stats_updates`

### 7.2 Rapid Clicking
- **Client**: Debounce prevents multiple pending docs
- **Server**: Deduplication based on userId + trackId + timestamp window

### 7.3 Offline Mode
- **Client**: Queue updates in localStorage
- **On reconnect**: Flush queue to `pending_stats_updates`

### 7.4 Unlike Operation
- **Validation**: Check if user previously liked (hasLiked = true)
- **Action**: Decrement likeCount, set hasLiked = false
- **Edge Case**: Prevent negative likeCount (server validation)

## 8. Migration Strategy

### 8.1 Existing Favorites
- Run one-time script to initialize `user_track_interactions` for existing favorites
- Set `hasLiked = true` for all existing favorite entries
- Initialize `track_stats.likeCount` from favorites count

### 8.2 Mock Data Transition
- Phase 1: Continue using `generateMockStats()` alongside real data
- Phase 2: Gradually replace mock with real stats as data accumulates
- Phase 3: Remove mock data generator after 1 month

## 9. Testing Checklist

- [ ] Play tracking works for single-track items
- [ ] Play tracking works for multi-track items
- [ ] Like tracking increments count correctly
- [ ] Unlike tracking decrements count correctly
- [ ] Debouncing prevents spam
- [ ] Optimistic UI updates work
- [ ] Error rollback works
- [ ] Offline queue works
- [ ] Stats display updates in real-time
- [ ] Batch loading performs well with 100+ tracks

## 10. Monitoring & Metrics

### Key Metrics to Track
- Average play-through rate (completed plays / total plays)
- Like rate (likes / plays)
- Most played tracks (top 100)
- Most liked tracks (top 100)
- User engagement rate (users with >5 plays)

### Error Monitoring
- Failed stats updates
- Duplicate operations detected
- Negative count incidents
- Timeout rates for batch operations

## 11. API Design

### Service Layer (`track_stats_service.ts`)

```typescript
// Fetch stats for multiple tracks
async function getTrackStats(trackIds: string[]): Promise<Map<string, TrackStats>>

// Record a play event
async function recordPlay(trackId: string, userId?: string): Promise<void>

// Record a like event
async function recordLike(trackId: string, userId: string): Promise<void>

// Record an unlike event
async function recordUnlike(trackId: string, userId: string): Promise<void>

// Get user's interaction with a track
async function getUserTrackInteraction(
  userId: string, 
  trackId: string
): Promise<UserTrackInteraction | null>

// Batch fetch user interactions
async function getUserTrackInteractions(
  userId: string, 
  trackIds: string[]
): Promise<Map<string, UserTrackInteraction>>
```

### Store Layer (`track_stats_store.ts`)

```typescript
interface TrackStatsStore {
  // Cache of stats by trackId
  statsCache: Map<string, CachedTrackStats>;
  
  // Pending operations (for offline mode)
  pendingOperations: PendingStatsOperation[];
  
  // Actions
  loadStats: (trackIds: string[]) => Promise<void>;
  recordPlayOptimistic: (trackId: string) => void;
  recordLikeOptimistic: (trackId: string) => void;
  recordUnlikeOptimistic: (trackId: string) => void;
  syncPendingOperations: () => Promise<void>;
  getStatsForTrack: (trackId: string) => TrackStats | null;
}
```

## 12. Timeline

- **Week 1**: Data model + Security rules + Service layer
- **Week 2**: Client integration + Optimistic updates
- **Week 3**: Testing + Bug fixes
- **Week 4**: Cloud Functions + Server-side aggregation
- **Week 5**: Monitoring + Performance optimization

## 13. Success Criteria

✅ Play counts increment correctly for all track types
✅ Like counts increment/decrement correctly
✅ UI updates appear instant (optimistic)
✅ No duplicate counting issues
✅ Offline mode queues operations correctly
✅ Real-time updates work across multiple clients
✅ Performance: < 200ms for stats display
✅ Scalability: Supports 10,000+ tracks
