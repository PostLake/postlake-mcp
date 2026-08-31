import { readFile, stat as statFile } from "node:fs/promises";
import { extname, resolve as resolvePath } from "node:path";
import { randomUUID } from "node:crypto";
import { Type } from "@sinclair/typebox";
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";
import { jsonResult } from "openclaw/plugin-sdk/tool-results";

// PostLake plugin for OpenClaw.
//
// Five tools covering a working publish workflow. Kept small so an agent
// choosing from a long list of near-identical tools does not choose worse.
// Analytics, comments and OAuth-connect stay on the dashboard / MCP server.

const DEFAULT_BASE_URL = "https://api.postlake.dev";
const PLUGIN_ID = "postlake";

function readConfig(api) {
 return api?.config?.plugins?.entries?.[PLUGIN_ID]?.config ?? {};
}

async function callApi(cfg, method, path, body, signal, extraHeaders) {
 if (!cfg.apiKey) {
  throw new Error(
   "No PostLake API key configured. Set plugins.entries.postlake.config.apiKey: create a key at https://app.postlake.dev/app/keys"
  );
 }
 const headers = {
  Authorization: `Bearer ${cfg.apiKey}`,
  ...(extraHeaders || {}),
 };
 if (body !== undefined && !headers["Content-Type"]) {
  headers["Content-Type"] = "application/json";
 }
 const res = await fetch(`${cfg.baseUrl || DEFAULT_BASE_URL}${path}`, {
  method,
  headers,
  body:
   body === undefined
    ? undefined
    : headers["Content-Type"] === "application/json"
     ? JSON.stringify(body)
     : body,
  signal,
 });
 const text = await res.text();
 let parsed;
 try {
  parsed = text ? JSON.parse(text) : null;
 } catch {
  parsed = text;
 }
 if (!res.ok) {
  const msg =
   typeof parsed === "string"
    ? parsed
    : parsed?.error?.message ||
     parsed?.message ||
     JSON.stringify(parsed);
  throw new Error(`PostLake API ${res.status}: ${msg}`);
 }
 return parsed;
}

const MIME_BY_EXT = {
 ".jpg": "image/jpeg",
 ".jpeg": "image/jpeg",
 ".png": "image/png",
 ".gif": "image/gif",
 ".webp": "image/webp",
 ".mp4": "video/mp4",
 ".mov": "video/quicktime",
 ".webm": "video/webm",
};

async function uploadLocalFile(cfg, filePath, signal) {
 const file = resolvePath(filePath);
 const info = await statFile(file).catch(() => null);
 if (!info?.isFile()) throw new Error(`File not found: ${file}`);
 const mimeType =
  MIME_BY_EXT[extname(file).toLowerCase()] || "application/octet-stream";
 const bytes = await readFile(file);
 return callApi(cfg, "POST", "/v1/media", bytes, signal, {
  "Content-Type": mimeType,
 });
}

export default definePluginEntry({
 id: PLUGIN_ID,
 name: "PostLake",
 description:
  "Publish, schedule and measure posts across X, LinkedIn, Instagram, TikTok, Facebook, Threads, Bluesky, YouTube and Pinterest.",
 register(api) {
  api.registerTool({
   name: "postlake_accounts",
   label: "PostLake: list accounts",
   description:
    "List PostLake profiles and the social accounts connected to them (X, LinkedIn, Instagram, TikTok, Facebook, Threads, Bluesky, YouTube, Pinterest), with ids, handles and health status. Call this first. Prefer posting to a profile by name; use acc_… ids only when you need a specific account. Skip accounts with status needs_reauth: the user must reconnect them at https://app.postlake.dev/app/channels.",
   promptSnippet:
    "postlake_accounts - list profiles and connected social accounts",
   parameters: Type.Object({}),
   async execute(_toolCallId, _params, signal) {
    const cfg = readConfig(api);
    const [accounts, profiles] = await Promise.all([
     callApi(cfg, "GET", "/v1/social-accounts", undefined, signal),
     callApi(cfg, "GET", "/v1/profiles", undefined, signal),
    ]);
    return jsonResult({ profiles, accounts });
   },
  });

  api.registerTool({
   name: "postlake_upload_media",
   label: "PostLake: upload media",
   description:
    "Upload a local image or video to PostLake and get back a med_… id to pass to postlake_post. Use this for any file on disk. Images ≤20MB (jpeg/png/webp/gif); videos ≤200MB (mp4/mov/webm).",
   promptSnippet:
    "postlake_upload_media - upload a local image or video, returns a media id",
   parameters: Type.Object({
    file_path: Type.String({
     description: "Absolute or relative path to the image or video on disk.",
    }),
   }),
   async execute(_toolCallId, params, signal) {
    const data = await uploadLocalFile(
     readConfig(api),
     params.file_path,
     signal
    );
    return jsonResult(data);
   },
  });

  api.registerTool({
   name: "postlake_post",
   label: "PostLake: publish or schedule",
   description:
    "Publish or schedule one post. Prefer profile (a named brand) over account ids. Add platforms to narrow a profile to certain networks. Media must already be uploaded (med_… ids from postlake_upload_media). Omit scheduledAt to publish immediately. Every network publishes independently: read targets[] for per-network state and url, not the top-level state alone.",
   promptSnippet:
    "postlake_post - publish or schedule a post to a profile or chosen accounts",
   promptGuidelines: [
    "Call postlake_accounts first unless the user already named a profile.",
    "Prefer profile over a list of acc_… ids.",
    "Always send a unique idempotencyKey so a retry never double-posts.",
    "Prefer scheduling over publishing a burst of posts onto one account.",
    "Read targets[]: a failure on one network does not mean the whole post failed.",
   ],
   parameters: Type.Object({
    text: Type.String({ description: "The post caption." }),
    profile: Type.Optional(
     Type.String({
      description:
       "Profile name from postlake_accounts. Posts to every account in it unless platforms is set.",
     })
    ),
    accounts: Type.Optional(
     Type.Array(Type.String(), {
      description: "Account ids (acc_…) from postlake_accounts.",
     })
    ),
    platforms: Type.Optional(
     Type.Array(Type.String(), {
      description:
       "Optional filter when using profile, e.g. [\"linkedin\",\"bluesky\"].",
     })
    ),
    media: Type.Optional(
     Type.Array(Type.String(), {
      description: "Media ids (med_…) already uploaded to PostLake.",
     })
    ),
    scheduledAt: Type.Optional(
     Type.String({
      description:
       "ISO 8601 timestamp. Omit to publish immediately. Naive local time needs timezone.",
     })
    ),
    timezone: Type.Optional(
     Type.String({
      description:
       "IANA timezone (e.g. Europe/London) for a naive scheduledAt.",
     })
    ),
    idempotencyKey: Type.Optional(
     Type.String({
      description:
       "Unique key for this post. Generated for you if omitted.",
     })
    ),
   }),
   async execute(_toolCallId, params, signal) {
    if (!params.profile && !params.accounts?.length) {
     throw new Error(
      "Provide profile (preferred) or accounts. Call postlake_accounts first."
     );
    }
    const body = { text: params.text };
    if (params.profile) body.profile = params.profile;
    if (params.accounts?.length) body.accounts = params.accounts;
    if (params.platforms?.length) body.platforms = params.platforms;
    if (params.media?.length) body.media = params.media;
    if (params.scheduledAt) body.scheduledAt = params.scheduledAt;
    if (params.timezone) body.timezone = params.timezone;
    const data = await callApi(
     readConfig(api),
     "POST",
     "/v1/posts",
     body,
     signal,
     { "Idempotency-Key": params.idempotencyKey || randomUUID() }
    );
    return jsonResult(data);
   },
  });

  api.registerTool({
   name: "postlake_list_posts",
   label: "PostLake: list posts",
   description:
    "List posts already created in PostLake, including scheduled and draft ones. Use this to see what is queued before adding more.",
   promptSnippet: "postlake_list_posts - list existing and scheduled posts",
   parameters: Type.Object({
    state: Type.Optional(
     Type.String({
      description:
       "Filter: published, scheduled, draft, failed, processing. Omit for recent posts.",
     })
    ),
   }),
   async execute(_toolCallId, params, signal) {
    const q = params?.state
     ? `?state=${encodeURIComponent(params.state)}`
     : "";
    const data = await callApi(
     readConfig(api),
     "GET",
     `/v1/posts${q}`,
     undefined,
     signal
    );
    return jsonResult(data);
   },
  });

  api.registerTool({
   name: "postlake_get_post",
   label: "PostLake: get post results",
   description:
    "Read one post and its per-network results. Each target reports state (published, processing, failed, scheduled) and url independently. Poll this for async networks like TikTok and YouTube until targets are final.",
   promptSnippet: "postlake_get_post - read one post and per-network results",
   parameters: Type.Object({
    post_id: Type.String({ description: "Post id (post_…)." }),
   }),
   async execute(_toolCallId, params, signal) {
    const data = await callApi(
     readConfig(api),
     "GET",
     `/v1/posts/${encodeURIComponent(params.post_id)}`,
     undefined,
     signal
    );
    return jsonResult(data);
   },
  });
 },
});
