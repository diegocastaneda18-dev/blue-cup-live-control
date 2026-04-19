"use client";

import { Card } from "@bluecup/ui";

export default function RulesPage() {
  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ color: "#EAF2FF", fontSize: 20, fontWeight: 750 }}>Scoring rules panel</div>
      <Card title="MVP">
        <div style={{ color: "#A8B6CC" }}>
          Scoring rules are tournament-configurable in the database. Next step: CRUD UI + endpoints for categories/species/rules.
        </div>
      </Card>
    </div>
  );
}

You are working on Blue Cup Live Control, a tournament control platform for a sport-fishing event called Las Marías Blue Cup.

Primary goals:
- Production-oriented MVP
- Clean architecture
- Type-safe code
- Modular backend
- Fast and readable admin workflows
- Premium public leaderboard
- Mobile-friendly participant experience
- Full auditability for critical tournament actions

Core stack:
- Monorepo with pnpm + turborepo
- apps/web = Next.js + TypeScript + Tailwind
- apps/api = NestJS + Prisma + PostgreSQL + Socket.IO
- packages/types = shared types
- packages/ui = shared UI components

Non-negotiable rules:
- Never introduce any unless explicitly justified
- Prefer explicit types and schemas
- All API input must be validated
- All critical mutations must be auditable
- Keep leaderboard logic isolated from controllers
- Do not hardcode tournament rules into UI
- Use environment variables for secrets and external services
- Keep business logic out of React components where possible
- Prefer server-side truth for timestamps and scoring
- Every generated file must fit the folder structure already defined
- Do not rewrite large unrelated sections unless asked
- Before major changes, propose the plan in concise bullets
- After coding, list changed files and any remaining risks

Design direction:
- Premium nautical luxury
- Dark navy base
- Sand/gold accents
- High readability
- Clear preliminary vs official standings

When implementing features:
1. Start with types and schemas
2. Then DB model
3. Then service logic
4. Then controller/API routes
5. Then UI
6. Then tests