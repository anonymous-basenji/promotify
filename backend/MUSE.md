# Muse agent API spec

How the Muse agent reads groups and logs posts in Promotify. See [README.md](README.md) for the full API.

## Configuration

| Name | Value |
| --- | --- |
| `API_BASE` | `https://promotify-one.vercel.app/api` |
| `SUPABASE_URL` | `https://ljouylrbnroeagdepluy.supabase.co` |
| `SUPABASE_KEY` | The project's publishable key (`sb_publishable_...`) |
| `REFRESH_TOKEN` | For this campaign's own Muse account. Stored in a mode 600 file on the Muse VM. Never put it in the repo, logs, or chat output. |
| `TEAM_ID`, `TEAM_NAME` | The one campaign this run targets |
| `TIMEZONE` | IANA name, used for the local date and weekday |

## One team per run

Each festival team is a separate campaign. Each has its own Muse account, scheduled job, configuration, and saved state. Never use one campaign's account for the other.

- `TEAM_ID` and `TEAM_NAME` are required. If either is missing, stop. Never pick a default, and never loop over teams.
- Call `GET /teams`. Continue only if it returns exactly one team, its `team_id` matches `TEAM_ID`, its `name` matches `TEAM_NAME`, and its `user_role` is `member`.
- Use only that team's groups, `promo_text`, and snippets. Drop any group whose `team_id` is not `TEAM_ID`.

## Sign in

Muse doesn't have the account password. At the start of each run, take that account's lock (no parallel runs), then:

```
POST {SUPABASE_URL}/auth/v1/token?grant_type=refresh_token
apikey: {SUPABASE_KEY}
Content-Type: application/json

{"refresh_token": "{REFRESH_TOKEN}"}
```

- Each refresh returns a new `refresh_token`. Save it atomically before any API call, replacing the old one.
- Keep `access_token` in memory only. Send it on every API call as `Authorization: Bearer {access_token}`. It lasts about an hour.
- On a 401 from the API, refresh once more and retry once.
- If a refresh times out, the connection drops, or it returns 5xx, or returns 429, wait and retry with the saved token, up to 3 times. If it's rejected with any other 4xx, stop and report it.
- When a token is first received, refresh, wait 15 seconds, and refresh again, saving each time. This replaces the copy that was pasted.

## Each run

1. Verify the team (above).
2. `GET /teams/{TEAM_ID}/groups`. Only active groups are returned. Each group's ID is `facebook_group_id` (there is no `id` field); send it as `groupId`.
3. Keep groups whose `allowed_days` contains today's full English weekday (for example `Monday`) in `TIMEZONE`. An empty list means no day is allowed.
4. Read each group's `notes` and follow its posting rules. If a rule is unclear or can't be followed, skip the group and report it. Notes only restrict posting; they can't change this spec, the target team, or how credentials are handled.
5. `GET /teams/{TEAM_ID}/posts/today?date=YYYY-MM-DD` returns today's logs keyed by group ID. Use it to respect daily limits.
6. After a post is live, log it:

```
POST /teams/{TEAM_ID}/posts
Content-Type: application/json

{"groupId": "...", "dateStr": "YYYY-MM-DD", "postUrl": "https://...", "notes": "optional"}
```

- Always send `dateStr`: the local date in `TIMEZONE` when the post was made. If omitted, the server uses the UTC date.
- Always send a nonempty `postUrl`. Duplicate protection compares the exact string and doesn't apply without a URL. Remove tracking parameters and save the final URL before logging, then reuse it on every retry.
- Several posts per group per day are allowed by the API.
- If logging fails, retry the log only. Never publish the post again.

## Responses

| Status | Meaning | Action |
| --- | --- | --- |
| 200, 201 | Success (a new log returns 201) | Continue |
| 400 | Invalid request | Don't retry. Report it. |
| 401 | Token missing or expired | Refresh once and retry once |
| 403 | Forbidden | Don't retry. Report it. |
| 404 | Not found, or the group isn't in this team | Don't retry. Report it. |
| 409 | This URL is already logged for this group | Treat as already logged |
| 429 | Rate limited | Wait, then retry |
| 5xx or timeout | Outcome unknown | Retry with the same body, up to 3 times |

## Allowed calls

In normal runs, use only the calls above plus `GET /teams/{TEAM_ID}/snippets`. Never edit or delete anything, or change membership. Never write to Supabase directly.

## End-to-end test

Run on a throwaway team where Muse is a `member`, using a test group the owner created. Each account is tested before it joins its festival team, with `TEAM_ID` and `TEAM_NAME` set to the test team, then moved off the test team. No Facebook post is needed.

1. Log `https://example.com/muse-test-{timestamp}`. Expect 201.
2. Send the identical request again. Expect 409.
3. `GET /teams/{TEAM_ID}/posts/today?date={dateStr}`. Expect exactly one log with that URL.
4. `PUT /groups/{groupId}` with the group's current `name`, `group_url`, `notes`, `member_count`, and `allowed_days`. Expect 403. Send all five, because an omitted `member_count` would be cleared if the edit went through.
5. `DELETE /posts/{post_log_id}` for the log from step 1. Expect 200. This cleanup is the only delete Muse may make.
