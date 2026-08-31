# PostLake plugin for OpenClaw

Publish, schedule and measure social posts across X, LinkedIn, Instagram, TikTok,
Facebook, Threads, Bluesky, YouTube and Pinterest — one API, one normalised
response per network.

## Install

```bash
openclaw plugins install clawhub:postlake
openclaw plugins enable postlake
openclaw gateway restart
```

Then add your API key. Create one at
[app.postlake.dev/app/keys](https://app.postlake.dev/app/keys). Connect networks
at [app.postlake.dev/app/channels](https://app.postlake.dev/app/channels).

```json5
{
  plugins: {
    entries: {
      postlake: {
        enabled: true,
        config: { apiKey: "sk_live_..." }
      }
    }
  }
}
```

## Tools

| tool | what it does |
|---|---|
| `postlake_accounts` | List profiles and connected accounts. Call this first. |
| `postlake_upload_media` | Upload a local image or video, returns a `med_…` id. |
| `postlake_post` | Publish or schedule one post to a profile or specific accounts. |
| `postlake_list_posts` | List existing, scheduled or draft posts. |
| `postlake_get_post` | Read one post and its per-network results. |

Five tools on purpose: the smallest set that covers a real workflow. Analytics,
comments and account connect stay in the dashboard or at
`https://api.postlake.dev/mcp`.

## Notes

- Prefer `profile` (a named brand) over hunting for `acc_…` ids.
- Always send an idempotency key — retries never double-post.
- Each network reports independently in `targets[]`. A failure on one does not
  stop the others.

MIT licensed. Source: [PostLake/postlake-mcp](https://github.com/PostLake/postlake-mcp)
