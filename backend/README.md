# BLINK Backend (Ephemeral)

Privacy-first ephemeral messaging API for the BLINK frontend.

> **Be present. Leave no history.**

Messages are readable for at most **60 minutes**, the countdown starts on the **first recipient read**, and expired messages (plus their photos) are **hard-deleted** from PostgreSQL and disk. There is no soft delete, no archive and no message content in logs.

---

## Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 20+ (TypeScript, strict) |
| Framework | Express 4 |
| Database | PostgreSQL 16 + Prisma 6 |
| Realtime | Socket.IO 4 (JWT-authenticated) |
| Auth | JWT access (15 m) + rotating refresh (7 d), bcrypt (12 rounds) |
| Validation | Zod on every request body, query and route param |
| Uploads | Multer + Sharp (2 MB, JPEG/PNG/WebP, metadata stripped) |
| Rate limiting | Redis-backed fixed window, in-memory fallback |
| Jobs | Exact-time expiry timers + 30 s sweeper + hourly cleanup |
| Logging | Winston (metadata only) |
| Tests | Jest + Supertest |

The backend lives in `BLINK/backend` and is independent from `BLINK/frontend`.

---

## Requirements

- Node.js **20+**
- PostgreSQL **16** (use a **UTF-8** database — names and messages may contain emoji)
- Redis **7** (optional in development — rate limiting falls back to an in-memory limiter)

Docker is optional; a `docker-compose.yml` with PostgreSQL, Redis and the API is included.

---

## Quick start

```bash
cd backend
npm install

# .env.example is the template. A local .env with random JWT secrets has
# already been generated in this workspace; point DATABASE_URL at your database.
cp .env.example .env   # only if .env does not exist

npx prisma migrate deploy   # applies prisma/migrations/0001_init
npm run db:seed             # optional demo data
npm run dev                 # http://localhost:5000
```

Seed credentials (development only): users `pkdev`, `aryan`, `maya`, password `BlinkDev123!`.

> **Windows note:** if your shell exports `PORT=0`, start with `PORT=5000 npm run dev` (dotenv does not override existing environment variables).

### With Docker

```bash
docker compose up -d --build
docker compose exec api npx prisma db seed
```

The API applies `prisma migrate deploy` on start. PostgreSQL is exposed on `5432`, Redis on `6379`, the API on `5000`.

---

## Environment variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development` / `test` / `production` |
| `PORT` | no | `5000` | Must be 1–65535 |
| `API_URL` | no | `http://localhost:<PORT>` | Public API origin |
| `PUBLIC_APP_URL` | no | `http://localhost:5173` | Used to build invite links |
| `CORS_ORIGIN` | no | `http://localhost:5173` | Comma-separated allow-list; no `*` in production |
| `DATABASE_URL` | **yes** | — | PostgreSQL connection string |
| `REDIS_URL` | no | — | Enables distributed rate limiting |
| `JWT_ACCESS_SECRET` | **yes** | — | ≥ 32 chars; must differ from refresh secret |
| `JWT_REFRESH_SECRET` | **yes** | — | ≥ 32 chars |
| `JWT_ACCESS_EXPIRY` | no | `15m` | |
| `JWT_REFRESH_EXPIRY` | no | `7d` | |
| `BCRYPT_ROUNDS` | no | `12` | Allowed 10–15 |
| `UPLOAD_DIR` | no | `./uploads` | Ephemeral local storage |
| `MAX_FILE_SIZE_BYTES` | no | `2097152` | 2 MB |
| `MESSAGE_CLEANUP_INTERVAL_MS` | no | `30000` | Sweeper interval |
| `LOG_LEVEL` | no | `info` | |
| `RATE_LIMIT_ENABLED` | no | `true` | Tests set this to `false` |

Generate production secrets with e.g. `openssl rand -hex 48`. Rotating them invalidates all sessions (by design).

---

## Scripts

```bash
npm run dev              # tsx watch
npm run build            # tsc -> dist/
npm start                # node dist/server.js
npm run typecheck        # source + test typecheck, no emit
npm test                 # Jest (integration suites skip without opt-in)
npm run test:unit
npm run test:integration # requires RUN_INTEGRATION_TESTS=true and a DB
npm run prisma:migrate   # create/apply migrations in development
npm run prisma:deploy    # apply committed migrations
npm run db:seed
```

---

## Project structure

```
backend/
├── prisma/
│   ├── schema.prisma          # 10 models + enums, expiresAt indexed
│   ├── migrations/0001_init/  # initial PostgreSQL migration (generated offline)
│   └── seed.ts                # idempotent demo data
├── src/
│   ├── server.ts              # HTTP + Socket.IO bootstrap, graceful shutdown
│   ├── app.ts                 # middleware stack and route mounting
│   ├── config/                # env, Prisma, Redis, Winston, Socket.IO
│   ├── modules/
│   │   ├── auth/              # register, login, refresh rotation, logout
│   │   ├── users/             # profile, search, avatar upload/serving
│   │   ├── friends/           # requests, friendships, removal
│   │   ├── rooms/             # private/group rooms, admin, membership
│   │   ├── messages/          # send, history, read receipts, delete, photos
│   │   ├── uploads/           # short-lived pre-send photo uploads
│   │   ├── notifications/     # friend/room notifications
│   │   └── invites/           # invite links
│   ├── websocket/             # socket auth, handlers, typed emitter
│   ├── jobs/                  # 30 s expiry sweep, hourly cleanup
│   ├── services/              # expiration math, image storage, expiry scheduler
│   ├── middleware/            # auth, authorization, validation, limits, errors
│   ├── utils/                 # tokens, passwords, sanitizer, constants
│   └── types/                 # Express + Socket.IO contracts
├── tests/unit/                # expiration, tokens, hashing, sanitizer, links
├── tests/integration/         # auth, messaging lifecycle, rooms
├── Dockerfile
└── docker-compose.yml
```

---

## Data model

| Model | Purpose |
|---|---|
| `User` | Handle, display name, bio, avatar path, timer preference, invite code |
| `RefreshToken` | SHA-256 hash of the refresh JWT, rotated on every refresh |
| `Room` | `PRIVATE` / `GROUP`, timer (1/5/15/30/60), admin, optional group avatar |
| `RoomMember` | Membership + `ADMIN`/`MEMBER` role |
| `Message` | Text, internal photo path, `sentAt`, `firstReadAt`, `firstReadBy`, `expiresAt` |
| `MessageRead` | One row per reader (unique per message/user) |
| `Friendship` | Mutual friendship rows |
| `FriendRequest` | `PENDING` / `ACCEPTED` / `REJECTED` |
| `Notification` | Type + generic copy + ids; never message content |
| `MediaUpload` | 10-minute photo attachment awaiting a message |

`Room.dmKey` is a sorted `userA:userB` key with a unique index, guaranteeing exactly one private room per pair even under concurrent creation.

---

## API

All responses are wrapped:

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "FORBIDDEN", "message": "..." } }
```

Validation failures return **422** with field details. Authenticated routes require `Authorization: Bearer <accessToken>`.

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | `{ username, displayName, password }` → user + tokens |
| POST | `/api/auth/login` | — | `{ username, password }` → user + tokens |
| POST | `/api/auth/refresh` | — | `{ refreshToken }` → rotated token pair (single use) |
| POST | `/api/auth/logout` | — | `{ refreshToken }` → revoke that session |
| GET | `/api/auth/me` | ✔ | Current profile |

Access tokens live 15 minutes. Refresh tokens are JWTs whose SHA-256 hash is stored; the raw token is never persisted.

### Users & avatars

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/users/me` | ✔ | Own profile incl. `defaultTimerMinutes`, `inviteLink` |
| PATCH | `/api/users/me` | ✔ | `displayName`, `bio`, `defaultTimerMinutes` |
| GET | `/api/users/search?q=` | ✔ | Username/display-name search, max 20 |
| GET | `/api/users/:userId` | ✔ | Public profile |
| POST | `/api/users/me/avatar` | ✔ | Multipart `photo`, ≤ 2 MB |
| GET | `/api/users/:userId/avatar` | — | Uploaded avatar or generated initials SVG |

### Friends & invites

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/friends` | ✔ | Friends + private-room unread counts |
| GET | `/api/friends/requests` | ✔ | `{ incoming, outgoing }` pending requests |
| POST | `/api/friends/request` | ✔ | `{ userId }` |
| POST | `/api/friends/accept/:requestId` | ✔ | Creates mutual friendship |
| POST | `/api/friends/reject/:requestId` | ✔ | |
| DELETE | `/api/friends/:friendId` | ✔ | Removes both directions |
| GET | `/api/invites/link` | ✔ | `{ inviteCode, inviteLink }` |
| POST | `/api/invites/accept/:inviteCode` | ✔ | Adds mutual friendship |

### Rooms

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/rooms` | ✔ | Rooms with last-message preview and unread count |
| POST | `/api/rooms/private` | ✔ | `{ recipientId }` — friends only, reuses the pair room |
| POST | `/api/rooms/group` | ✔ | `{ name, memberIds, timerMinutes?, avatarUrl? }` — creator is admin |
| GET | `/api/rooms/:roomId` | ✔ | Room + member profiles |
| PATCH | `/api/rooms/:roomId/timer` | ✔ | Any member; new messages inherit it |
| GET | `/api/rooms/:roomId/members` | ✔ | |
| POST | `/api/rooms/:roomId/members` | ✔ admin | `{ memberIds }`, group only, max 50 |
| DELETE | `/api/rooms/:roomId/members/:userId` | ✔ admin | Cannot remove the admin |
| DELETE | `/api/rooms/:roomId/leave` | ✔ | Admin role transfers; last member deletes the room |
| GET | `/api/rooms/:roomId/avatar` | — | Generated SVG for groups without a custom avatar |

### Messages

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/rooms/:roomId/messages?limit=&before=` | ✔ | `{ messages, hasMore }`, newest last |
| POST | `/api/rooms/:roomId/messages` | ✔ | `{ text?, photoUrl? }` |
| POST | `/api/rooms/:roomId/messages/read` | ✔ | Locks `firstReadAt`, adds reader, `{ readCount }` |
| DELETE | `/api/rooms/:roomId/messages/:messageId` | ✔ sender | Hard delete before expiry |
| POST | `/api/rooms/:roomId/messages/photo` | ✔ | Multipart `photo` → `{ photoUrl, expiresAt }` |
| GET | `/api/rooms/:roomId/messages/:messageId/photo` | ✔ | Authenticated photo stream |
| GET | `/api/uploads/:uploadId` | ✔ owner | Preview an unattached upload |
| GET | `/api/notifications` | ✔ | Notifications (newest first) |
| PATCH | `/api/notifications/:id/read` | ✔ | |
| GET | `/api/health` | — | Liveness |

### Message DTO

```jsonc
{
  "id": "…",
  "roomId": "…",
  "senderId": "…",
  "senderName": "Aryan",
  "senderAvatar": "/api/users/…/avatar?v=…",
  "text": "be present, leave no history",
  "photoUrl": "/api/rooms/…/messages/…/photo",   // omitted when no photo
  "sentAt": 1783000000000,                       // epoch ms
  "firstReadAt": 1783000060000,                  // null until first recipient read
  "firstReadBy": "user-id",
  "readBy": ["user-id"],
  "timerDurationMs": 300000,
  "expiresAt": 1783000360000,                    // server-authoritative
  "status": "delivered"                          // or "read"
}
```

`isOutgoing` is intentionally **not** included: one broadcast cannot contain viewer-specific flags. Derive it on the client with `message.senderId === currentUser.id`. `expiresAt` and `readBy` are additive fields the current frontend does not yet use.

Photo URLs require the bearer token, so render them through `fetch(...)` → `URL.createObjectURL(blob)` rather than an `<img src>`.

---

## Real-time (Socket.IO)

Connect to the same origin. Authenticate either with `auth: { token }` on the handshake or by emitting `ws:authenticate` immediately; unauthenticated sockets are disconnected after 5 seconds. On success the server joins the socket to every room it belongs to and to its private user channel.

### Client → server

| Event | Payload | Notes |
|---|---|---|
| `ws:authenticate` | `{ token }` | Ack `{ ok, data: { user } }` |
| `ws:join_room` | `{ roomId }` | Membership checked |
| `ws:leave_room` | `{ roomId }` | |
| `ws:send_message` | `{ roomId, text?, photoUrl? }` | 30/min per socket; ack returns the message |
| `ws:mark_read` | `{ roomId }` | 60/min per socket |
| `ws:typing` | `{ roomId }` | Throttled to 1/s per room, never persisted |

### Server → client

| Event | Payload |
|---|---|
| `ws:authenticated` | `{ user }` |
| `ws:new_message` | `Message` |
| `ws:message_read` | `{ roomId, messageId, readBy, firstReadAt?, firstReadBy? }` |
| `ws:message_expired` | `{ roomId, messageId }` |
| `ws:message_deleted` | `{ roomId, messageId }` |
| `ws:room_timer_updated` | `{ roomId, timerMinutes }` |
| `ws:member_joined` | `{ roomId, user }` |
| `ws:member_left` | `{ roomId, userId }` |
| `ws:typing` | `{ roomId, userId, username }` |
| `ws:notification` | `{ type, data }` |

Room events are emitted to the room channel. Server-side joins keep added members in sync without a re-join, and removed members are detached immediately.

---

## Expiration engine

```
ABSOLUTE_CEILING = sentAt + 60 minutes

unread (firstReadAt == null): expiresAt = ABSOLUTE_CEILING
read:                         expiresAt = min(ABSOLUTE_CEILING, firstReadAt + timerDurationMs)
expired when:                 now >= expiresAt
```

- `timerDurationMs` is copied from the room's timer at send time; changing the room timer only affects **new** messages.
- `firstReadAt` / `firstReadBy` are written with `updateMany({ where: { firstReadAt: null } })`, so concurrent readers cannot overwrite the first read.
- Reading a message recalculates `expiresAt` and re-arms its deletion timer.
- A `setTimeout` per active message emits `ws:message_expired` at the exact instant; the 30-second PostgreSQL sweep is the safety net after restarts or missed timers.
- Deletion unlinks the photo, hard-deletes the row, cancels timers and broadcasts the expiry. No archive table exists.
- Room timers are validated to `1 | 5 | 15 | 30 | 60`; the 60-minute ceiling is a constant, not an environment option.

---

## Security

- **Passwords:** bcrypt, 12 rounds, 72-byte cap, timing-equalized login for unknown users. `bcryptjs` is the pure-JS bcrypt implementation with identical hashes — no native build toolchain required.
- **Sessions:** 15-minute HS256 access tokens; 7-day refresh JWTs stored only as SHA-256 hashes and rotated atomically (reuse → 401).
- **Authorization:** every room/message operation re-checks membership server-side; admin-only mutations are also guarded at the route layer. Non-members receive 403.
- **Validation:** Zod schemas on every body, query and param; unknown keys rejected with `.strict()`. Text is markup-stripped and length-capped before storage.
- **Uploads:** image MIME allow-list, 2 MB cap, dimension limits, Sharp re-encode strips EXIF/GPS metadata, randomized filenames, no public directory, path traversal prevented. Files are deleted with their message.
- **HTTP:** Helmet (nosniff, DENY framing, no-referrer, HSTS in production, restrictive CSP), strict CORS allow-list without wildcards, `x-powered-by` disabled.
- **Rate limits:** auth 5/min/IP, refresh 30/min, API 100/min, message send 30/min per user, uploads 10–20/min. Redis-backed when configured.
- **Privacy:** no request bodies or message text in logs; notifications contain ids and generic copy only; avatars are local or generated (no third-party image requests), and photos are served only to room members with `Cache-Control: private, no-store`.
- **WebSocket:** JWT required within 5 seconds, membership checks on join, per-socket event throttles, room detachment on removal.

CORS allows requests with no `Origin` header (non-browser clients). Browser origins must be listed in `CORS_ORIGIN`.

---

## Tests

```bash
npm run test:unit        # no database required
npm test                 # integration suites skip unless opted in
```

Integration suites need a disposable PostgreSQL database:

```bash
RUN_INTEGRATION_TESTS=true \
DATABASE_URL=postgresql://blink_user:blink_pass@localhost:5432/blink_test \
npx prisma migrate deploy
RUN_INTEGRATION_TESTS=true \
DATABASE_URL=postgresql://blink_user:blink_pass@localhost:5432/blink_test \
npm run test:integration
```

They cover register → login → refresh rotation → logout, unauthorized access, message send → first read → shortened expiry → delete, non-member 403s, hard-delete on sweep, private-room reuse, group admin permissions, member removal and leaving.

Unit tests cover the expiration math (including the ceiling), password hashing, token typing and tamper rejection, sanitizer behavior, upload URL parsing, and image re-encoding/dimension/cleanup behavior.

---

## Frontend integration notes

1. Store the access token in memory; keep the refresh token in `httpOnly` handling on your side. Refresh proactively before 15 minutes.
2. Replace `localStorage` usage in `ChatContext` with `GET /api/rooms`, `GET /api/rooms/:id/messages`, `POST …/messages` and `POST …/read`.
3. Derive `isOutgoing` from `senderId === me.id`.
4. Count down from the server-provided `expiresAt`; do not recompute from `firstReadAt` alone.
5. On `ws:message_expired` / `ws:message_deleted`, run the particle animation and remove the message locally.
6. Open the socket with `auth: { token }`, then rely on automatic room joins.
7. Render message photos via an authenticated `fetch` + blob URL.
8. Notifications exist in the API but are deliberately free of message previews.

---

## Known limitations / deliberate deviations

- **No S3 driver.** Storage is local disk behind `src/services/storage.service.ts`; add an S3 adapter there for multi-instance production. The upload/delete contract is already isolated.
- **Single Socket.IO instance.** A Redis adapter is not wired; run one API instance or add `@socket.io/redis-adapter` before horizontal scaling.
- **Redis is optional.** Without it, rate limits are per-process only.
- **Group avatars** accept an optional external HTTPS URL, while user avatars are uploaded or generated locally.
- **No push notifications or email verification** — out of scope for the ephemeral core.
- The initial migration (`0001_init`) was generated with `prisma migrate diff` and then applied by `prisma migrate deploy` against a UTF-8 PostgreSQL cluster during verification; keep using `prisma migrate dev` for future schema changes.
- `package.json#prisma` seed config is used (Prisma 6); Prisma 7 requires `prisma.config.ts`.
