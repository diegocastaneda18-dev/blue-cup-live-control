# System Overview

## High-level apps
- Web app: public pages + admin + committee + participant responsive views
- API app: auth, data, scoring, realtime, audit

## Core domains
- Users/Roles
- Tournament
- Teams/Boats
- Catches
- Reviews
- Leaderboard
- Protests
- Notifications
- Audit

## Realtime events
- catch.submitted
- catch.updated
- catch.reviewed
- leaderboard.updated
- protest.opened
- tournament.status.changed

## Roles
- admin
- committee
- captain
- team_member
- public_view

## Source of truth
- PostgreSQL for persistent state
- API server for validation and scoring
- WebSocket broadcast for real-time views

## Critical flows
1. Admin creates tournament
2. Admin loads teams and boats
3. Captain submits catch + media
4. Committee reviews catch
5. Approved catch affects scoring
6. Leaderboard recalculates
7. Public site updates in realtime