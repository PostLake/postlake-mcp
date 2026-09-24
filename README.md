# PostLake: the social operating system for AI agents

**Give an agent one reliable way to run social.** PostLake lets agents publish,
schedule, monitor, discover, reply, moderate, and learn across X, LinkedIn,
Instagram, TikTok, Facebook, Threads, Bluesky, YouTube, and Pinterest.

One connection gives an agent one normalised contract instead of nine platform
SDKs, nine auth models, and nine incompatible result shapes. It can act with a
hosted MCP server, a drop-in agent skill, or the REST API.

> An agent can plan a campaign, validate each destination before it spends a
> credit, publish or save a draft for approval, confirm asynchronous posts,
> read conversations and comments, handle what needs a response, and use the
> results to decide what to do next.

- **Hosted MCP:** `https://api.postlake.dev/mcp`
- **Documentation:** https://docs.postlake.dev
- **Website:** https://postlake.dev
- **Machine-readable docs:** https://postlake.dev/llms.txt
- **MCP Registry:** `dev.postlake/social`
- **Grok Build:** install `postlake` from the plugin marketplace, or add this repo as a marketplace source

## Why agents use PostLake

### One contract, every network

Post once or fan out to every connected network. Each target has the same
state, URL, time, and error shape, so an agent handles the result once rather
than writing platform-specific recovery logic.

### Safe to let an agent act

`validate_post` provides a free dry run before publishing. Idempotency keys
make retries safe. Owners can require approval on an OAuth connection, which
forces every publish request from that agent into a draft and prevents it from
approving its own work. `confirm_post` checks an asynchronous provider after
it accepts a post, and every action reports the individual target result rather
than hiding partial failure.

### Not just a publishing endpoint

An agent can read a unified feed of notifications, direct messages, comments,
and post performance. It can then reply, moderate, engage, research a topic,
or inspect an account before it acts. Social management stays in the same
workflow as publishing.

### Human control where it belongs

OAuth makes the account owner approve a connection in the browser. `get_connect_link`
lets an agent send them directly to that approval step. Owners can revoke an
agent, manage channels, set agent limits, and require approval from PostLake.
An OAuth agent cannot create an unrestricted account key to bypass those
controls, and never needs a social-network password.

## Start in minutes

### Hosted MCP: Cursor, Claude, ChatGPT, Gemini, Copilot, and more

PostLake is a remote Streamable HTTP MCP server. Nothing is installed, run, or
self-hosted. Add this server in your MCP client, then complete the PostLake
OAuth approval once.

```json
{
  "mcpServers": {
    "postlake": {
      "url": "https://api.postlake.dev/mcp"
    }
  }
}
```

#### Cursor

Open **Settings -> Tools & MCP -> New MCP server**, add the configuration above,
then select **Connect** for PostLake and approve the browser sign-in.

#### Claude Code

```bash
claude mcp add --transport http postlake https://api.postlake.dev/mcp
```

#### Grok Build

This repository is a Grok Build plugin. It ships the hosted MCP server and the
agent skills. No local process, no shell hooks, no API key in chat.

Add this repo as a marketplace, then install `postlake`:

```bash
grok plugin marketplace add PostLake/postlake-mcp
grok plugin install postlake --trust
```

Inside Grok Build you can also browse `/marketplace` after the official xAI
catalog lists it.

The MCP server is `https://api.postlake.dev/mcp` (Streamable HTTP). On first
use, Grok opens PostLake OAuth in the browser. The account owner approves the
agent once and can revoke it from https://app.postlake.dev/app/agents.

This plugin calls only:

- `https://api.postlake.dev` (MCP and REST)
- `https://postlake.dev` and `https://docs.postlake.dev` (docs the skills cite)
- `https://app.postlake.dev` (OAuth approval and dashboard)

`openclaw/` in this repo is a separate OpenClaw package. Grok Build does not
load it.

#### Other MCP clients

Add `https://api.postlake.dev/mcp` as a remote MCP server. The initial OAuth
challenge opens the host's sign-in and approval flow. Full setup instructions:
https://docs.postlake.dev/mcp

### Drop-in skills: coding agents

Install PostLake's agent skills for Claude Code, Cursor, Codex, Windsurf, and
other skills-compatible coding agents:

```bash
npx skills add postlake/postlake-mcp --all
```

Set `POSTLAKE_API_KEY` in the agent's runtime, then ask it to handle social
work in plain language. The skills cover accounts, publishing, scheduling,
media, inbox conversations, and analytics.

### REST API: custom agent runtimes

Use `https://api.postlake.dev/v1` from LangGraph, CrewAI, AutoGen, OpenAI tool
calls, or any HTTPS client. The REST API and MCP server work against the same
profiles, channels, posts, and safety rules.

## What an agent can do

The MCP server currently provides 64 focused tools. They are designed around
social outcomes rather than individual platform APIs.

| Outcome | Tools |
| --- | --- |
| **Understand the account** | `whoami`, `set_my_name`, `get_changelog`, `get_credits`, `list_profiles`, `list_social_accounts`, `get_social_account`, `list_account_targets`, `search_facebook_pages`, `check_allowance` |
| **Connect and organise channels** | `create_profile`, `rename_profile`, `delete_profile`, `connect_account`, `get_connect_link`, `disconnect_account` |
| **Plan and validate** | `get_platform_capabilities`, `get_publish_info`, `validate_post` |
| **Publish and schedule** | `create_post`, `get_post`, `confirm_post`, `list_posts`, `edit_post`, `cancel_post`, `publish_draft`, `delete_post` |
| **Media** | `upload_media`, `upload_media_batch` |
| **Unified Inbox** | `list_notifications`, `mark_notifications_seen`, `list_conversations`, `read_conversation`, `mark_conversation_read`, `send_message`, `read_comments`, `reply_to_comment`, `hide_comment`, `delete_comment` |
| **Discover and understand the network** | `search_posts`, `look_up_profile`, `read_profile_posts`, `search_places`, `list_own_posts`, `list_tagged_posts` |
| **Engage and manage presence** | `engage`, `update_profile` |
| **Commerce, events, and collaborations** | `list_products`, `list_branded_partners`, `list_facebook_partnership_permissions`, `list_facebook_branded_content_posts`, `act_on_facebook_partnership_permission`, `list_ad_accounts`, `list_events`, `create_event`, `find_creators` |
| **Facebook Page live broadcasts** | `create_live_broadcast`, `start_live_broadcast`, `list_live_broadcasts`, `get_live_broadcast`, `end_live_broadcast` |
| **Measure and improve** | `get_post_analytics`, `get_analytics` |

`set_my_name` changes only the authenticated agent's display name. The account
owner can set and lock that name in Agent Control. Renaming does not change the
underlying API key or OAuth client identity.

For Facebook Partnership Ads, tagged posts and permission grants are separate.
Use `list_facebook_branded_content_posts` to see posts tagging the connected
brand Page, then `list_facebook_partnership_permissions` to check whether a
creator Page has approved account-level ad access. The action tool can send,
cancel, accept, reject, or remove a request only after the owner approves that
specific Page and action. It does not create an ad or spend money. Meta may
restrict these calls until it grants the app and Page the required access.

`list_posts` supports bounded cursor pagination and filters for status, agent,
profile, network, dates, approval state, and a case-insensitive literal caption
search with `q`. This lets an agent inspect publishing history without loading
an entire account's posts into one tool response. The REST endpoint
`GET /v1/posts` uses the same search and paging behavior.

Account-key-authenticated MCP callers can also use `create_api_key` to hand off
to another trusted service. OAuth agents do not see or receive this tool because
an account key would bypass their owner-set limits.

## An agent workflow that does not break trust

1. Call `whoami` and `list_social_accounts` to understand the account, limits,
   connected channels, and current readiness.
2. If a human still needs to connect a channel, call `get_connect_link` and send
   them the short-lived approval URL. Do not ask them to hunt through a dashboard.
3. Call `get_platform_capabilities` and `validate_post` before creating a
   multi-network post. PostLake returns each target's exact constraint and fix.
4. Use `create_post` to publish, schedule, or save a `draft` for human review.
   If the owner enabled Require my approval, PostLake saves a draft even when
   the agent does not request one. Include an idempotency key so a retry cannot
   double-post.
5. If a platform is processing asynchronously, call `confirm_post` to obtain
   the provider-confirmed state without waiting for a public URL.
6. Use `list_notifications`, `list_conversations`, and `read_comments` to see
   what needs attention. Reply, moderate, or engage only where the platform
   supports it.
7. Use `get_analytics` and `get_post_analytics` to turn results into the next
   informed action, not a spreadsheet someone has to interpret later.

### Direct messages

Facebook, Instagram, X, and Bluesky use one normalized conversation shape.
Agents list threads with `list_conversations`, open one with
`read_conversation`, finish it with `mark_conversation_read`, and reply with
`send_message`. A message can include `content` for an attachment, shared
media, or a provider payload that PostLake cannot safely flatten to text.

Facebook and Instagram can deliver `message.received` webhooks. X and Bluesky
do not push inbound messages to PostLake, so poll `list_conversations` on a
schedule. Sending a DM on X costs 6 credits; sending on the other supported
inbox networks does not spend credits. Full REST and MCP guidance:
https://docs.postlake.dev/messages.

## Example prompts

- "Check every connected channel, then tell me what needs a human approval."
- "Draft a launch post for LinkedIn, Instagram, Threads, and TikTok. Validate
  it, save it as a draft, and show me the platform-specific changes."
- "Read new DMs and comments. Give me concise reply drafts, but do not send
  anything until I approve them."
- "Find what people are saying about this topic, inspect the strongest three
  accounts, then propose a post that adds something useful."
- "Confirm yesterday's TikTok post, then compare its performance with the rest
  of the week and recommend the next post."

## Platform-aware, not platform-blind

PostLake knows the constraints that cause social automations to fail in real
life: media types, image counts, caption limits, creator-level TikTok settings,
network-specific privacy options, post destinations, async publishing, and
whether a given connection can read, search, message, or engage.

When a platform cannot perform an action, PostLake says so in the response.
An empty list never silently means a network was not read. A partial publish
does not pretend every destination succeeded. Agents get the information they
need to recover safely.

## What this repository contains

| Path | Used by |
| --- | --- |
| `skills/` | Claude Code, Cursor, Codex, Windsurf (`npx skills add postlake/postlake-mcp --all`) |
| `.mcp.json` | Grok Build, Claude Code plugins, Cursor plugins. Hosted MCP only. |
| `.grok-plugin/` | Grok Build plugin manifest |
| `.claude-plugin/` | Claude Code / Cursor plugin manifest |
| `openclaw/` | OpenClaw only. Not part of the Grok or Claude plugin. |

## Security and ownership

For interactive MCP clients, PostLake uses OAuth and PKCE. The account owner
approves each connected agent once and can revoke it from the dashboard at any
time. OAuth tokens are scoped to that client and refresh automatically. Owners
can enforce profile, platform, daily-credit, pack-credit, and approval limits.
An approval-gated agent cannot publish its own drafts or mint an unrestricted
account API key.

For unattended services, use a PostLake API key in the service's secret store,
not in a prompt or source file. Keys have account-level access, so use a named
key per trusted service and revoke it when it is no longer needed.

## Pricing

Every plan includes the MCP server and agent access. Start with 20 free credits
per month and no card. Credits are charged when publishing or where a platform
charges for a particular operation. On X, `send_message` costs 6 credits; sends
on Facebook, Instagram, and Bluesky do not spend credits. See current pricing
and credit rates at https://postlake.dev/pricing.

## Documentation

- MCP setup and tool reference: https://docs.postlake.dev/mcp
- Quickstart: https://docs.postlake.dev/quickstart
- Publishing and schedules: https://docs.postlake.dev/publishing
- Reading, Inbox, and engagement: https://docs.postlake.dev/reading
- API reference: https://docs.postlake.dev

Built by [PostLake](https://postlake.dev). Issues and pull requests are welcome.
