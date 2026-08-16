# Backend Codebase Roadmap: Promotify One

This document serves as an orientation guide for navigating and understanding the Node.js Express backend (`backend/`).

---

## 1. File Map

### Root & Configuration
- [`backend/package.json`](file:///c:/Users/Andre/Development/promotify/backend/package.json) — Backend dependencies (`express`, `cors`, `dotenv`, `@supabase/supabase-js`, `tsx`) and run scripts.
- [`backend/tsconfig.json`](file:///c:/Users/Andre/Development/promotify/backend/tsconfig.json) — Node.js TypeScript compiler configuration for the backend.
- [`backend/src/index.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/index.ts) — Express entry point; sets up CORS, JSON parsing, health check, and mounts domain routers on port 3000.
- [`backend/src/config/supabase.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/config/supabase.ts) — Initializes the server-side `supabaseAdmin` client with environment key resolution.
- [`backend/src/types/backend.types.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/types/backend.types.ts) — TypeScript data models (`Team`, `FacebookGroup`, `PostLog`, `Profile`, `AuthenticatedRequest`).

### Middleware
- [`backend/src/middleware/auth.middleware.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/middleware/auth.middleware.ts) — `requireAuth` middleware; validates incoming Supabase JWT Bearer tokens and attaches `req.user`.

### Routes (HTTP Routing)
- [`backend/src/routes/team.routes.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/routes/team.routes.ts) — Routes for team CRUD, member management, and team-nested `/groups` and `/posts`.
- [`backend/src/routes/group.routes.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/routes/group.routes.ts) — Direct group entity routes (`PUT /api/groups/:id`, `DELETE /api/groups/:id`, `GET /api/groups/:id/history`).
- [`backend/src/routes/post.routes.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/routes/post.routes.ts) — Direct post entity routes (`DELETE /api/posts/:id`).

### Controllers (HTTP Request / Response)
- [`backend/src/controllers/team.controller.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/controllers/team.controller.ts) — Parses requests, calls `teamService`, and formats JSON responses for team endpoints.
- [`backend/src/controllers/group.controller.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/controllers/group.controller.ts) — Parses requests, calls `groupService`, and formats JSON responses for group endpoints.
- [`backend/src/controllers/post.controller.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/controllers/post.controller.ts) — Parses requests, calls `postService`, and formats JSON responses for post log endpoints.

### Services (Business Logic & Authorization Rules)
- [`backend/src/services/team.service.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/services/team.service.ts) — Enforces team creation transactions, admin permission checks, and email invitation lookups.
- [`backend/src/services/group.service.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/services/group.service.ts) — Validates team membership before allowing group creation, edits, or deletion.
- [`backend/src/services/post.service.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/services/post.service.ts) — Manages posting permissions, daily post counts, timeline retrieval, and delete authorization.

### Repositories (Database Queries via Supabase)
- [`backend/src/repositories/team.repository.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/repositories/team.repository.ts) — Direct database queries for `teams` and `team_members` tables.
- [`backend/src/repositories/group.repository.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/repositories/group.repository.ts) — Direct database queries for the `facebook_groups` table.
- [`backend/src/repositories/post.repository.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/repositories/post.repository.ts) — Direct database queries for `post_logs` (daily logs, counts, history).
- [`backend/src/repositories/profile.repository.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/repositories/profile.repository.ts) — Database lookup for `profiles` by email or ID.

---

## 2. Trace Order (Recommended Reading Order)

1. [`backend/src/index.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/index.ts) — Start here to see how the server initializes, middleware runs, and routes are mounted.
2. [`backend/src/middleware/auth.middleware.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/middleware/auth.middleware.ts) — Understand how JWT tokens from the frontend are verified and attached to `req.user`.
3. [`backend/src/routes/team.routes.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/routes/team.routes.ts) — See the full URL layout and REST hierarchy for teams, groups, and posts.
4. [`backend/src/controllers/team.controller.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/controllers/team.controller.ts) — See how an incoming HTTP request is received, extracted, and forwarded.
5. [`backend/src/services/team.service.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/services/team.service.ts) — See how business rules (admin checks, validations) are enforced before touching data.
6. [`backend/src/repositories/team.repository.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/repositories/team.repository.ts) — See how queries interact directly with the PostgreSQL database.
7. [`backend/src/config/supabase.ts`](file:///c:/Users/Andre/Development/promotify/backend/src/config/supabase.ts) — Inspect how database connection credentials are instantiated.
