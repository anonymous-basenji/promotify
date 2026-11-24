# Promotify Backend

Express 5 + TypeScript API for Promotify. It sits in front of Supabase and handles auth checks, team permissions, and validation for teams, Facebook groups, post logs, and saved text snippets.

## Stack

- **Express 5**: HTTP server and routing
- **Supabase** (`@supabase/supabase-js`): Postgres database and auth, accessed **as the signed-in user** (anon key + their access token), so RLS applies
- **Zod**: request body validation
- **express-rate-limit**: rate limiting (production only)
- **tsx**: runs TypeScript directly, with no build step

## Running it

From the repo root (npm workspaces):

```bash
npm run dev:backend      # tsx watch on backend/src/index.ts
npm run dev              # backend + frontend together
npm run typecheck        # tsc --noEmit for backend and frontend
```

Or from `backend/`: `npm run dev`, `npm start`, `npm run typecheck`.

The server listens on `BACKEND_PORT` (default `3000`). When `VERCEL` is set it doesn't call `listen()` and just exports the app.

### Environment variables

These are loaded with `dotenv` from the current directory and from the repo-root `.env`. See the root `.env.example`.

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` (or `SUPABASE_PROJECT_URL`) | yes | Supabase project URL. A trailing `/rest/v1` is stripped. |
| `SUPABASE_ANON_KEY` (or `VITE_SUPABASE_ANON_PUBLIC_KEY`) | yes | Public anon key, the same one the frontend uses. The server throws at startup if it's missing. |
| `BACKEND_PORT` | no | Local port (default `3000`) |
| `NODE_ENV` | no | Rate limiting is only on when this is `production` |
| `VERCEL` | no | Set by Vercel. Turns off `app.listen()`. |

The backend's URL and key must belong to the **same Supabase project** as the frontend's (`VITE_SUPABASE_PROJECT_URL` / `VITE_SUPABASE_ANON_PUBLIC_KEY`). Otherwise the user tokens the frontend gets won't verify. The anon key can be either the legacy `anon` JWT or the newer publishable key (`sb_publishable_...`). Never put a secret / `service_role` key in a `VITE_` variable, because those get bundled into the browser.

`tsx watch` doesn't reload on `.env` changes, so restart the dev server after editing it.

### Local Supabase

`supabase/config.toml` configures a local stack (API on `http://127.0.0.1:54321`). It needs Docker running:

```bash
npx supabase start    # prints the local API URL and publishable/anon key
npx supabase status
```

Local Supabase has its own keys and an empty database built from `supabase/migrations`. To use it, point **both** frontend and backend URLs and keys at it. Google login locally also needs `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` / `_SECRET` and `http://127.0.0.1:54321/auth/v1/callback` added as an authorized redirect URI in Google Cloud.

### Deployment (Vercel)

[`api/index.ts`](../api/index.ts) re-exports the Express app as a Vercel serverless function. [`vercel.json`](../vercel.json) rewrites `/api/(.*)` to that function and everything else to the frontend SPA. Every route is mounted both with and without the `/api` prefix (e.g. `/api/teams` and `/teams`), so the same app works locally and behind the rewrite.

## Project structure

```
backend/
├── package.json
├── tsconfig.json
└── src/
    ├── index.ts                 # App setup: CORS, JSON body, rate limit, route mounting
    ├── config/
    │   └── supabase.ts          # supabaseAuth (token checks) + per-request user client via db()
    ├── middleware/
    │   └── auth.middleware.ts   # requireAuth: checks the Supabase bearer token
    ├── routes/                  # URL → controller mapping
    │   ├── team.routes.ts       # /api/teams/...
    │   ├── group.routes.ts      # /api/groups/...
    │   └── post.routes.ts       # /api/posts/...
    ├── controllers/             # Parse params, validate the body with Zod, shape the HTTP response
    │   ├── team.controller.ts
    │   ├── group.controller.ts
    │   └── post.controller.ts
    ├── services/                # Business rules: membership and role checks
    │   ├── team.service.ts
    │   ├── group.service.ts
    │   └── post.service.ts
    ├── repositories/            # Supabase queries; also attach profiles to rows
    │   ├── team.repository.ts   # teams, team_members, team_snippets, team_images
    │   ├── group.repository.ts  # facebook_groups
    │   ├── post.repository.ts   # post_logs
    │   └── profile.repository.ts
    ├── types/
    │   └── backend.types.ts     # Domain types + AuthenticatedRequest
    └── utils/
        └── handle-error.ts      # Shared error → HTTP response mapping
```

### Request flow

```
route → requireAuth → controller (Zod) → service (permissions) → repository (Supabase)
```

- **Routes** apply `requireAuth` to the whole router. Every endpoint except `/health` requires auth.
- **Controllers** read `req.params` and `req.user`, validate the body, and map errors to HTTP responses.
- **Services** look up the caller's role with `teamRepository.getMemberRole()` and throw errors with a `status` property (400/403/404).
- **Repositories** are the only layer that talks to Supabase. They call `db()`, which returns the current request's user client, so every query runs as the caller and **Row Level Security applies**. The service-layer checks still run first and give clearer error messages, and RLS backs them up at the database.

`db()` uses `AsyncLocalStorage`: `requireAuth` creates a client carrying the caller's token and runs the rest of the request inside it. Calling `db()` outside an authenticated request throws.

Under RLS, an update or delete on a row the policies block doesn't raise an error. It just affects zero rows. Keep this in mind when adding repository methods.

Each layer exports a plain object of async functions (`teamController`, `teamService`, `teamRepository`, …) rather than classes.

## Cross-cutting behavior

### Authentication

Send a Supabase access token with every request:

```
Authorization: Bearer <supabase_access_token>
```

`requireAuth` calls `supabaseAuth.auth.getUser(token)`, sets `req.user = { user_id, email }`, and makes a Supabase client with that token for the rest of the request. If the header is missing or malformed, or the token is invalid, the response is `401`.

### Roles

Each team member has one role: `owner`, `admin`, or `member`. In the endpoint tables below:

- **Member**: any role on the team
- **Admin**: `owner` or `admin`
- **Owner**: `owner` only

### Errors

All errors come back as JSON:

```json
{ "error": "Human readable message" }
```

| Status | When |
| --- | --- |
| `400` | Zod validation failed (the first issue's message is returned) |
| `401` | Missing or invalid auth token |
| `403` | The caller isn't a team member or lacks the required role |
| `404` | Resource not found |
| `409` | Conflict, e.g. adding a user who's already a team member |
| `429` | Rate limit exceeded (production only) |
| `500` | Anything else. The real message is logged but not returned. |

### Other middleware

- **CORS**: allows `http://localhost:5173` and `https://promotify-one.vercel.app`, with credentials enabled
- **Body limit**: JSON bodies up to `16kb`
- **Rate limit**: 1000 requests per 15 minutes per IP, only when `NODE_ENV=production`

## Endpoints

All paths below are shown with the `/api` prefix. They also work without it.

### Health

| Method | Path | Auth | Response |
| --- | --- | --- | --- |
| GET | `/api/health` | none | `{ status: "ok", time: ISOString }` |

### Teams: `/api/teams`

| Method | Path | Who | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/` | any user | | `Team[]` the caller belongs to, each with `user_role` |
| POST | `/` | any user | `{ name, description?, promoText? }` | `201 Team` (the caller becomes `owner`) |
| GET | `/:teamId` | Member, or the team creator | | `Team` with `user_role` |
| PUT | `/:teamId` | Admin | `{ name?, description? }` | Updated `Team` |
| DELETE | `/:teamId` | Owner | | `{ success: true }`. Groups, post logs, members, snippets, and images cascade, and the image files are removed. |
| PATCH | `/:teamId/promo` | Admin | `{ promoText? }` | `{ success: true }` |

### Snippets (saved texts): `/api/teams/:teamId/snippets`

| Method | Path | Who | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/` | Member | | `TeamSnippet[]` (oldest first) |
| POST | `/` | Member | `{ title, content }` | `201 TeamSnippet` |
| PUT | `/:snippetId` | Admin | `{ title?, content? }` | Updated `TeamSnippet` |
| DELETE | `/:snippetId` | Admin | | `{ success: true }` |

### Promo images: `/api/teams/:teamId`

| Method | Path | Who | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/images` | Member | | `TeamImage[]` (oldest first), each with `image_url` |
| POST | `/images` | Member | `{ title, imagePath }` | `201 TeamImage` |
| DELETE | `/images/:imageId` | Admin | | `{ success: true }`. Deletes the file too, and clears the main image if it was this one. |
| PATCH | `/promo-image` | Admin | `{ imageId }` (`null` clears it) | `{ success: true }`. Sets the team's `promo_image_id`. |

The browser uploads the file straight to the `team-images` Storage bucket at `<team_id>/<uuid>.<jpg|png|webp>`, then posts that path here. The bucket is **public**: anyone with a file's URL can view it. Storage policies let members list and upload, and owners and admins delete. The bucket allows JPEG, PNG, and WebP up to 5 MB.

### Members: `/api/teams/:teamId/members`

| Method | Path | Who | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/` | Member | | `TeamMember[]` with `profile` |
| POST | `/` | Admin | `{ email, role? = "member" }` | `201 TeamMember`, or `409` if they're already a member |
| PATCH | `/:memberId` | Admin | `{ role }` | `{ success: true }` |
| DELETE | `/:memberId` | Admin, or the member removing themselves | | `{ success: true }` |

`:memberId` is the `team_member_id`, not the `user_id`.

Rules for adding and changing members:

- To be added, a user must already have a profile, which means they've signed in at least once. Otherwise the response is `404`.
- Nobody can change their own role.
- Only an owner can make someone `owner` or change an existing owner's role.
- Making someone `owner` transfers ownership: the previous owner becomes an `admin`.

### Facebook groups

| Method | Path | Who | Body | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/teams/:teamId/groups` | Member | | `FacebookGroup[]` with `creator_profile`. Only active groups, newest first. |
| POST | `/api/teams/:teamId/groups` | Member | `CreateGroup` (below) | `201 FacebookGroup` |
| PUT | `/api/groups/:groupId` | Member | Partial `CreateGroup` | `{ success: true }` |
| DELETE | `/api/groups/:groupId` | Member | | `{ success: true }` (hard delete) |

`CreateGroup` body:

```ts
{
  name: string;                 // 1–150 chars
  group_url?: string | null;    // ≤ 1000 chars
  notes?: string | null;        // ≤ 2000 chars
  member_count?: number | null; // non-negative integer
  allowed_days?: DayOfWeek[];   // defaults to all 7 days on create
}
```

### Post logs

| Method | Path | Who | Body / Query | Response |
| --- | --- | --- | --- | --- |
| GET | `/api/teams/:teamId/posts/today` | Member | `?date=YYYY-MM-DD` (defaults to today in UTC) | `Record<facebook_group_id, PostLog[]>` |
| GET | `/api/teams/:teamId/posts/counts` | Member | | `Record<facebook_group_id, number>` (all-time counts) |
| POST | `/api/teams/:teamId/posts` | Member | `{ groupId, dateStr?, notes?, postUrl? }` | `201 PostLog` with `poster_profile`. `404` if the group isn't in this team. |
| DELETE | `/api/teams/:teamId/posts` | Admin | | `{ success: true }`. Deletes every post log for the team. |
| GET | `/api/groups/:groupId/history` | Member | | `PostLog[]` with `poster_profile`, newest first |
| DELETE | `/api/groups/:groupId/posts` | Admin | | `{ success: true }`. Deletes every post log for the group. |
| DELETE | `/api/posts/:postLogId` | The user who logged the post, or Admin | | `{ success: true }` |

`dateStr` uses the `YYYY-MM-DD` format and defaults to today's date in UTC.

### Validation limits

| Field | Limit |
| --- | --- |
| Team `name` | 1–100 chars |
| Team `description` | ≤ 500 chars |
| `promoText` | ≤ 5000 chars |
| Snippet `title` | 1–150 chars |
| Snippet `content` | 1–10000 chars |
| Image `title` | 1–150 chars |
| Group `name` | 1–150 chars |
| `group_url` / `postUrl` | ≤ 1000 chars |
| `notes` | ≤ 2000 chars |

## Data model

The types are defined in [`src/types/backend.types.ts`](src/types/backend.types.ts) and the schema is in [`supabase/migrations`](../supabase/migrations).

| Table | Type | Key | Notes |
| --- | --- | --- | --- |
| `profiles` | `Profile` | `user_id` | One row per signed-in user. Looked up by email when inviting. |
| `teams` | `Team` | `team_id` | `user_id` is the creator. `promo_text` is the team's main promo copy, and `promo_image_id` is its main image. |
| `team_members` | `TeamMember` | `team_member_id` | Links `team_id` to `user_id`, with a `role` |
| `team_snippets` | `TeamSnippet` | `team_snippet_id` | Extra saved texts per team |
| `team_images` | `TeamImage` | `team_image_id` | Promo images per team. `image_path` is the Storage path. |
| `facebook_groups` | `FacebookGroup` | `facebook_group_id` | `allowed_days` = days posting is allowed. Has an `is_active` flag. |
| `post_logs` | `PostLog` | `post_log_id` | One row per post made to a group on a `posted_date` |

Repositories add the related profile to rows before returning them: `profile` on members, `creator_profile` on groups, `poster_profile` on post logs.
