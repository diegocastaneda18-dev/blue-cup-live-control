# Implementation plan — Blue Cup Live Control (MVP)

This plan follows the requested implementation order and keeps the architecture modular so we can scale into a full tournament-grade system.

## Guiding principles

- **Server timestamps are source of truth**: submissions store `occurredAtServer` and optionally `occurredAtClient`.
- **RBAC everywhere**: JWT payload includes role and (optionally) teamId; Nest guards enforce access.
- **Audit log for critical actions**: auth events, committee decisions, approvals, status transitions, and admin writes.
- **Preliminary vs official**: leaderboard always shows both columns. Official is a deliberate admin action.
- **Media requirements**: enforced by tournament scoring rules (`ScoringRule.requiresMedia`).
- **No approved/official edits without trail**: approved/official catches disallow direct modifications in MVP.

## Phase 1 — Foundation (done in this repo)

- Monorepo layout `apps/*` + `packages/*`
- API skeleton (NestJS)
- Prisma schema for all core entities
- Auth: login + `GET /auth/me`
- Role-based guards + decorators
- Audit service writing to `AuditLog`
- Realtime gateway (`/live`) for leaderboard refreshes
- Seed data for Las Marías Blue Cup

## Phase 2 — Tournament / team management (partially implemented)

### API

- `POST /tournaments` (admin)
- `PATCH /tournaments/:id/official` (admin)
- `POST /teams` (admin)
- `POST /teams/boat` (admin)
- `GET /teams/me/dashboard` (captain/team_member)

### Next

- Admin panel UI for tournament/team CRUD (roadmap)

## Phase 3 — Catch submission (implemented)

- `POST /catches` (captain/team_member)
  - status set to `pending_review`
  - server timestamp captured automatically
- `POST /catches/media` (captain/team_member)
  - registers evidence after upload (presigned S3 upload is next step)
- `GET /catches/me` (captain/team_member)

## Phase 4 — Committee review workflow (implemented)

- `GET /committee/catches/pending` (committee/admin)
- `POST /committee/catches/:catchId/review` (committee/admin)
  - actions: approve / reject / request more evidence / penalize
  - writes `CatchReview` + audit log
  - recalculates score for approvals

## Phase 5 — Leaderboard (implemented baseline)

- `GET /leaderboard?tournamentId=...`
  - aggregates team totals for approved (preliminary) and official catches
- WebSocket events (Socket.IO):
  - `leaderboard.refresh` (emitted after review actions / official marking)
  - `catch.event` (emitted on submission)

## Phase 6 — Finalization (planned)

- Media storage abstraction:
  - S3 presigned upload endpoint
  - `CatchMedia` created after successful upload callback
- Exports:
  - `GET /exports/:tournamentId/results.csv` (admin)
  - export only official column when tournament locked
- Audit log browsing endpoint + admin UI
- Protests + penalties workflow (endpoints + UI)
- Officialization flow:
  - tournament lock
  - mark all approved catches official in bulk OR selective official mark + export

