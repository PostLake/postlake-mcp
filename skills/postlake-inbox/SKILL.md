---
name: postlake-inbox
description: Read and handle PostLake direct-message conversations across Facebook, Instagram, X, and Bluesky. Use when checking DMs, reading a thread, marking it read, drafting a reply, or sending an approved reply.
---

# PostLake: unified inbox

Use PostLake's normalized inbox instead of calling four network APIs.

## Start safely

1. Call `list_social_accounts` to identify the connection.
2. Call `get_platform_capabilities` if you do not know whether that connection supports messaging.
3. Call `list_conversations`, optionally filtered by `account`.
4. Call `read_conversation` with both the conversation id and account id.
5. Draft a concise reply. Do not send until the user has asked you to send it.
6. Call `send_message`, then `mark_conversation_read` after the thread is handled.

Conversation ids are scoped to one connected account. Never guess the account
or reuse a conversation id with another connection.

## What the response means

- `fromMe` identifies which side sent a message. Do not infer this from handles.
- `content` can describe an attachment, shared media, or an unsupported provider
  payload. Do not claim that an empty `text` means the message itself was empty.
- A `problems` entry means PostLake could not read a network. Report it. An empty
  `items` array without a problem means the network answered with no threads.

## Network rules

- Facebook and Instagram can produce `message.received` webhooks.
- X and Bluesky require polling with `list_conversations`.
- Sending a direct message on X costs 6 credits. Messaging on the other
  currently supported inbox networks does not spend credits.
- Instagram normal replies must be within 24 hours of the person's last
  message. MCP deliberately does not expose the Human Agent override because
  it may only be used for replies actually written by a person.
- Bluesky app passwords need direct-message access enabled when created.
- Facebook and Instagram messaging may be unavailable until Meta grants the
  required permission to the connected business.

## Do not overpromise

PostLake currently exposes inbox messaging for Facebook, Instagram, X, and
Bluesky. LinkedIn, TikTok, Threads, YouTube, and Pinterest do not provide a
usable creator DM API for this product.

Docs: https://docs.postlake.dev/messages
MCP: https://api.postlake.dev/mcp
