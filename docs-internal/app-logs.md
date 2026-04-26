# App Logs

Major user actions and runtime errors from the calculator are written to the
Supabase table `public.app_logs`.

## Schema

| column        | type         | notes                                            |
| ------------- | ------------ | ------------------------------------------------ |
| `id`          | uuid PK      | auto                                             |
| `user_id`     | uuid (null)  | `auth.users.id` of the signed-in user, or null   |
| `level`       | text         | `info` / `warn` / `error`                        |
| `event`       | text         | dotted name, e.g. `preset.save-cloud`            |
| `message`     | text (null)  | human-readable summary (errors only)             |
| `data`        | jsonb (null) | extra payload (sanitized, capped at ~8 KB)       |
| `url`         | text         | `window.location.href` at log time               |
| `user_agent`  | text         | `navigator.userAgent` at log time                |
| `app_version` | text         | client build version                             |
| `created_at`  | timestamptz  | server insert time                               |

## RLS

- **Insert**: anyone (anon + signed-in). The `user_id` must equal `auth.uid()`
  or be `null`.
- **Select**:
  - Signed-in users see *their own* rows.
  - Admins (`user_profiles.role = 'admin'`) see every row.
- **Delete**: admins only.

## Where to read the logs

You have three options:

### 1. Supabase Dashboard → Table Editor

Open your project → **Table Editor** → `app_logs`. Sort by `created_at` desc.
Filter chips work for `level`, `event`, `user_id`, etc.

### 2. Supabase Dashboard → SQL Editor

Useful queries:

```sql
-- Latest 100 events
select created_at, level, event, message, user_id, url, data
from public.app_logs
order by created_at desc
limit 100;

-- Errors in the last 24 hours
select created_at, event, message, data, url, user_agent
from public.app_logs
where level = 'error'
  and created_at > now() - interval '24 hours'
order by created_at desc;

-- Errors grouped by event + message
select event, message, count(*) as n, max(created_at) as last_seen
from public.app_logs
where level = 'error'
  and created_at > now() - interval '7 days'
group by event, message
order by n desc;

-- One specific user's recent activity
select created_at, level, event, data
from public.app_logs
where user_id = '<uuid>'
order by created_at desc
limit 200;
```

To run these as a normal signed-in user, you'll only see your own rows. Run
them as an admin (or via the dashboard, which uses the service role) to see
everything.

### 3. As an admin in the app

Promote a user to admin once via:

```sql
update public.user_profiles set role = 'admin' where id = '<uuid>';
```

Then any signed-in admin can read every row directly through the same
`from('app_logs').select(...)` API.

## Currently emitted events

| event                       | level | trigger                                                |
| --------------------------- | ----- | ------------------------------------------------------ |
| `auth.login-success`        | info  | OAuth or email login completes                         |
| `auth.login-failure`        | error | email signin returns an error                          |
| `auth.signup-success`       | info  | email signup completes (with or without session)       |
| `auth.signup-failure`       | error | email signup errors                                    |
| `auth.oauth-failure`        | error | OAuth init returns an error                            |
| `auth.logout`               | info  | user confirms logout from the topbar                   |
| `preset.save-local`         | info  | local preset created                                   |
| `preset.save-cloud`         | info  | cloud preset created                                   |
| `preset.save-cloud-failure` | error | `presetService.createPreset` fails                     |
| `preset.update-cloud`       | info  | cloud preset updated                                   |
| `preset.delete-cloud`       | info  | cloud preset deleted                                   |
| `api.error`                 | error | any RxJS API pipeline goes through `handleAPIError`    |
| `app.unhandled-error`       | error | global Angular `ErrorHandler` catches an unhandled err |

Adding more events is just `appLog.info('<dotted.name>', data?)` /
`appLog.error('<dotted.name>', err, data?)` — see
[src/app/api-services/app-log.service.ts](../src/app/api-services/app-log.service.ts).

## Buffering & flushing

- `info` / `warn` events are buffered and flushed every 2 seconds, or when the
  in-memory buffer reaches 20 rows.
- `error` events flush immediately.
- The buffer is also flushed on `pagehide` / `visibilitychange` so logs aren't
  lost when the user navigates away.

## Opting out

Run in DevTools console:

```js
localStorage.setItem('app-logs.disabled', '1'); // off
localStorage.removeItem('app-logs.disabled');   // on (default)
```

## Migration

Schema lives in
[supabase/migrations/20260426000100_app_logs.sql](../supabase/migrations/20260426000100_app_logs.sql).
Apply with `supabase db push` or paste it into the SQL Editor.
