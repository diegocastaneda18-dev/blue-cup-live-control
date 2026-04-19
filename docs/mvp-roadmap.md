# MVP roadmap

## Next (high value / low risk)

- **Categories/species/rules CRUD**
  - Admin endpoints + UI pickers in participant submit flow
- **Catch detail endpoints**
  - `GET /committee/catches/:id` with media + rule context
- **Storage abstraction**
  - S3 presigned upload for photo/video
  - virus/mime checks, size limits, server-side metadata validation
- **Audit log browsing**
  - `GET /audit?entity=&entityId=&from=&to=` (admin)

## Tournament-grade features

- **Protests**
  - create protest (captain), resolve/dismiss (committee)
  - public display of protested status (preliminary only)
- **Penalties**
  - apply team penalties (committee/admin)
  - show penalties line items in exports
- **Officialization workflow**
  - admin lock tournament
  - batch mark official + export signed results

## Public experience polish

- Team pages with rosters + boat
- Highlights feed from approved catches media
- Sponsor blocks / tournament branding configuration

## Engineering hardening

- E2E tests (Playwright) + API tests
- Rate limiting, request logging, structured logs
- Background jobs (BullMQ) for exports and media processing

