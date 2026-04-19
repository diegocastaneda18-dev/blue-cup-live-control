# Blue Cup Live Control PRD

## Product
Blue Cup Live Control

## Purpose
A tournament control and live scoring platform for Las Marías Blue Cup.

## Goals
- Real-time leaderboard
- Catch submission with evidence
- Committee review workflow
- Public standings
- Auditability
- Multi-year reuse for future editions

## Users
- Admin
- Committee
- Captain
- Team member
- Public viewer

## Core Modules
- Tournament management
- Teams and boats
- Catch submission
- Catch media upload
- Committee review
- Scoring engine
- Live leaderboard
- Public site
- Reports and exports
- Audit log

## MVP Scope
### In
- Auth and roles
- Tournament creation
- Team/boat registration
- Catch submission
- Media upload
- Review queue
- Approve/reject/request more evidence/penalize
- Real-time leaderboard
- Public standings
- Audit logs
- CSV export

### Out
- AI species recognition
- Streaming integration
- Complex payment processing
- Sponsor analytics
- Native mobile app v1

## Catch Types
- Release
- Weigh-in

## Catch Statuses
- draft
- submitted
- pending_review
- more_evidence_required
- approved
- rejected
- protested
- penalized
- official

## Business Rules
- No official catch edits without audit trail
- Scoring must be configurable by tournament
- Public leaderboard must show preliminary vs official
- Committee decisions must be logged
- Server timestamps are source of truth
- Evidence requirements vary by catch type

## Success Metrics
- 90%+ catches digitally submitted
- < 3 seconds leaderboard refresh after approval
- 100% critical actions logged
- Reduced dispute handling time