# Blue Cup Live Control

Production-oriented MVP for Las Marías Blue Cup.

## Purpose
A tournament control platform with:
- participant catch submission
- committee review
- real-time leaderboard
- public standings
- audit logs

## Stack
- Monorepo with pnpm + turborepo
- apps/web = Next.js + TypeScript + Tailwind
- apps/api = NestJS + Prisma + PostgreSQL + Socket.IO

## Getting started

### Prereqs
- Node.js >= 20
- pnpm
- Docker Desktop (for Postgres/MinIO)

### Install
```bash
pnpm install
```

### Environment
Copy `.env.example` to `.env` and adjust values if needed.

### Start infrastructure (Postgres + MinIO)
```bash
pnpm db:up
```

### Run database migrations (API)
```bash
pnpm --filter @bluecup/api prisma:migrate
pnpm --filter @bluecup/api prisma:generate
```

### Dev
Run everything:
```bash
pnpm dev
```

Or just one app:
```bash
pnpm api:dev
pnpm web:dev
```

### Ports (defaults)
- `apps/web`: 3003
- `apps/participant`: 3000
- `apps/admin`: 3001
- `apps/public`: 3002
- `apps/api`: 4000

## MVP Phases
1. Monorepo setup
2. Auth and roles
3. Tournament and team management
4. Catch submission
5. Committee review
6. Scoring and leaderboard
7. Protests and exports
