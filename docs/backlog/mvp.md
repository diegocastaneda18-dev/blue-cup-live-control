# MVP Backlog

## Phase 1 - Foundation
- Set up monorepo
- Set up Next.js app
- Set up NestJS app
- Configure Prisma + PostgreSQL
- Add auth module
- Add role guards
- Add shared types package
- Add shared UI package

## Phase 2 - Tournament setup
- Tournament model
- Team model
- Boat model
- Team member model
- Admin CRUD for tournament
- Admin CRUD for teams and boats

## Phase 3 - Catch workflow
- Catch model
- Catch media model
- Submit catch endpoint
- Upload media endpoint
- Catch history page
- Pending review queue

## Phase 4 - Review workflow
- Review model
- Approve/reject/request more evidence/penalize actions
- Audit log creation
- Committee dashboard

## Phase 5 - Scoring and leaderboard
- Species model
- Category model
- Scoring rule model
- Scoring engine service
- Leaderboard queries
- WebSocket events
- Public leaderboard page

## Phase 6 - Finalization
- Export CSV
- Official standings state
- Protest model
- Public highlights feed
- Seed data
- Smoke tests