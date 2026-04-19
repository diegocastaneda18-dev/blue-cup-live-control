# API reference (MVP)

Base URL: `http://localhost:4000`

## Auth

- `POST /auth/login`
  - body: `{ email, password }`
  - returns: `{ accessToken, user }`
- `GET /auth/me` (Bearer token)

## Users

- `GET /users` (admin)

## Tournaments

- `GET /tournaments`
- `GET /tournaments/:id`
- `POST /tournaments` (admin)
- `PATCH /tournaments/:id/official` (admin)

## Teams / boats

- `GET /teams/tournament/:tournamentId`
- `GET /teams/me/dashboard` (captain/team_member)
- `POST /teams` (admin)
- `POST /teams/boat` (admin)

## Catches (participant)

- `POST /catches` (captain/team_member)
- `POST /catches/media` (captain/team_member)
- `GET /catches/me` (captain/team_member)
- `PATCH /catches/:catchId/official` (admin)

## Committee review

- `GET /committee/catches/pending?tournamentId=...` (committee/admin)
- `POST /committee/catches/:catchId/review` (committee/admin)

## Leaderboard

- `GET /leaderboard?tournamentId=...`

## Exports

- `GET /exports/:tournamentId/results.csv` (admin)

## WebSocket events

Socket.IO namespace: `/live`

- **`leaderboard.refresh`**
  - payload: `{ tournamentId }`
- **`catch.event`**
  - payload: `{ tournamentId, type: "catch_submitted", catchId }`

