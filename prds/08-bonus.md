# PRD 08 — Bonus Features

## Context
Subject §V. Evaluated **only if the mandatory part (PRDs 00–07) is fully implemented and defect-free**.

---

## Candidate scope

### B1 — OmniAuth (OAuth sign-in)
Add OAuth alongside password auth (Google, GitHub, 42…).

### B2 — Personal photo gallery
Drag-and-drop upload, crop/rotate/filter in-browser.

### B3 — Interactive user map
Leaflet/MapLibre map of nearby users with precise GPS.

### B4 — Audio/video chat
WebRTC video/audio between connected users, signalled over the existing WebSocket.

### B5 — Real-life date scheduling
Propose/accept/decline in-app events within a conversation.

---

## Non-goals
- Anything that compromises the mandatory security posture.
- Features that alter mandatory UX in ways that would fail peer evaluation.

---

## User Stories

### B1 — OmniAuth
| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| BO-1 | new visitor | to sign up with my Google account | I can register without creating a new password |
| BO-2 | existing user | to link my OAuth account to my existing Matcha account | I can log in via Google and password |
| BO-3 | OAuth user | my profile data (name, avatar) to be pre-filled from the provider | onboarding is faster |

### B2 — Photo gallery
| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| BO-4 | logged-in user | to drag photos onto an upload zone | uploading is intuitive |
| BO-5 | logged-in user | to crop and rotate a picture before saving | my photos look good |
| BO-6 | logged-in user | to apply a filter to a photo | I can personalise my gallery |

### B3 — Interactive map
| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| BO-7 | logged-in user | to see a map of nearby users | I can explore by geography visually |
| BO-8 | logged-in user | to click a pin to open a profile preview | I can act on map results quickly |

### B4 — Audio/video chat
| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| BO-9 | connected user | to start a video call with my match | we can meet face-to-face online |
| BO-10 | connected user | to accept or decline an incoming call | I control when I'm visible on camera |

### B5 — Date scheduling
| # | As a… | I want… | So that… |
|---|-------|---------|----------|
| BO-11 | connected user | to propose a date/time for a real meetup | we can organise a real meeting |
| BO-12 | connected user | to accept or decline a meetup proposal | I confirm plans that suit me |

---

## Tasks

### B1 — OmniAuth
- [ ] Add migration `create-oauth-accounts-table` — id, user_id FK, provider (enum), provider_user_id, access_token_hash, created_at; unique `(provider, provider_user_id)`
- [ ] `OAuthRepository` — `findByProvider`, `link(userId, provider, providerUserId)`, `findUserByProvider`
- [ ] `AuthService.loginWithOAuth(provider, providerProfile)` — find or create user, link OAuth account, return session
- [ ] Routes: `GET /api/auth/oauth/[provider]` (redirect) + `GET /api/auth/oauth/[provider]/callback` (exchange code, set session)
- [ ] UI: OAuth buttons on `/login` and `/register` pages
- [ ] Pre-fill name + avatar from provider during registration

### B2 — Photo gallery
- [ ] Extend `user_pictures` — relax the hard 5-picture cap for gallery vs. profile (add `scope` enum: `profile` | `gallery`)
- [ ] `GalleryService.upload(userId, file, scope)` — MIME + size check, store, create DB row
- [ ] `GalleryService.edit(userId, pictureId, operations)` — apply crop/rotate/filter via Sharp server-side or canvas client-side
- [ ] Routes: `GET/POST /api/users/me/gallery`, `PATCH /api/users/me/gallery/[id]`
- [ ] UI: drag-and-drop zone (dnd-kit), in-browser editor (react-image-crop / Fabric.js), filter strip

### B3 — Interactive map
- [ ] Route: `GET /api/users/map?lat=&lng=&radius=` — returns user clusters + individual pins (privacy: randomise precise coords)
- [ ] UI: `/map` page — Leaflet/MapLibre integration, cluster at high zoom, profile popover on pin click
- [ ] GPS: request high-accuracy position; update `user_locations` with source=`gps`

### B4 — Audio/video chat
- [ ] WebRTC signalling via existing WS: events `call.offer`, `call.answer`, `call.ice-candidate`, `call.end`
- [ ] `CallService` — verify connection before allowing call initiation; emit signalling events
- [ ] UI: call modal overlay, local + remote video streams, mute/camera toggle, end-call button
- [ ] Fallback: display "call not supported" gracefully if browser doesn't support RTCPeerConnection

### B5 — Date scheduling
- [ ] Migration `create-date-proposals-table` — id, conversation_id FK, proposer_id FK, proposed_at (timestamptz), location_text, status (enum: pending | accepted | declined), created_at, updated_at
- [ ] `DateService` — `propose`, `respond(userId, proposalId, status)`, `list(conversationId)`
- [ ] Routes: `POST /api/conversations/[id]/dates`, `PATCH /api/conversations/[id]/dates/[dateId]`, `GET /api/conversations/[id]/dates`
- [ ] UI: "Plan a date" button in chat composer; proposal card in thread; accept/decline buttons for recipient

---

## Acceptance criteria
- Each bonus implemented is opt-in and does not regress mandatory flows.
- Bonus features follow the same Route → Service → Repository layering rules.
- Each implemented bonus has its Tasks section checked and this PRD updated.
- No new security vulnerabilities introduced.

---

## Open questions
- Which bonuses to build is a product decision taken after mandatory is fully green.
- B4 WebRTC: TURN server needed for NAT traversal — decide provider before implementation.
