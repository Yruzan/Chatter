# Chatter

A responsive character-chat prototype with optional OpenAI-compatible live replies built with React and Vite. Dark botanical colors, original anime illustrations, mobile bottom navigation, and a shared sidebar that opens as a drawer on phones.

## Run

Requires Node.js 22 or later.

```sh
npm ci
npm run dev
```

```sh
npm run build
npm run preview
```

Run the desktop and mobile browser checks with `npm test`. The tests use system Chromium when available; otherwise install it with `npx playwright install chromium`.

## Prototype flows

- Discover and filter characters; open a card for details or start a chat directly.
- Start independent conversations, including multiple chats with the same character. Inside chat, the sidebar shows only that character’s history and **New chat** starts another conversation with them. Outside chat, browse all history or choose a character for a new conversation.
- Open the sidebar from the mobile menu button on Home, in the editor, and inside chat. The bottom navigation remains available outside chat and the editor.
- Save favorites in Library and manage chat history.
- Create, edit, or remix characters in a dedicated studio: name, bio, full description, personality, scenario, first message, example exchanges, tags, and creator notes. Drafts save automatically, with a live card and greeting preview.
- Upload JPG, PNG, or WebP character portraits (up to 10 MB), frame them with zoom and position controls, or choose a preset portrait. Images are cropped to 512 × 512 and compressed locally.
- Edit your profile and open chat settings for generation parameters, API configuration, and appearance.
- Change chat fonts, text and bubble colors, action/dialogue formatting, line spacing, and message spacing. Appearance updates the actual conversation immediately.
- Send messages and image attachments. Edit and copy either side of a conversation. Regeneration saves alternate character replies; use the arrows below a bubble to select a version. Edits, versions, and the selected reply survive refresh.

Characters, conversations, favorites, profile, and preferences persist in this browser’s local storage. There is no account authentication or backend. Older character-based histories continue to work. If storage fills up, the editor keeps your work open and reports that saving failed. Character definitions support `{{char}}` and `{{user}}` placeholders. Clear site data to reset the prototype.

## Live API setup

1. Open a chat → **Chat settings → API**. Choose OpenAI-compatible (or a provider preset).
2. Enter a trusted API base URL, such as `https://your-provider.example/v1`, and your key if required.
3. Click **Load models**. The app requests `GET /models` and displays the returned model IDs in a selector. Select a model, or enter its ID manually if listing is unsupported. The list stays available while this page is open and is cleared when the endpoint or key changes.
4. **Test connection** sends a short, real `POST /chat/completions` request; it can use paid tokens. **Validate configuration** only checks fields locally.
5. Enable **Use live AI**. New messages and regenerations now use that endpoint. Demo mode remains available without a key. Keys and live mode clear on page reload; provider/base URL/model preferences persist.

Requests go directly from your browser to the configured provider. Keys stay in memory, never in browser storage, source, or a Chatter server. Use a trusted endpoint that allows browser requests (CORS). HTTPS endpoints are required, except for local HTTP providers; an HTTPS site may still block a local HTTP request. Localhost means the device running the browser. Image attachments are sent to your provider in live mode and require a vision-capable model. Character portraits remain local. Messages and attachments are stored locally in both modes.

The payload includes the selected model, character definition and examples, user name, system instructions, generation parameters, and the selected reply versions. With history disabled, only the latest user turn is included. A conservative UTF-8 byte estimate trims older turns to leave room for the requested output; image cost is approximate and provider tokenization varies. Oversized instructions/latest turns produce a visible error rather than silently discarding them. Providers differ in supported parameters and model capabilities; their errors are surfaced without replacing saved messages with scripted replies. Replies are non-streaming, time out after 60 seconds, and support stop/retry. Navigating away cancels an in-progress request.

Browser integration tests intercept a compatible endpoint to verify model discovery, authentication headers, connection tests, payloads, retries, cancellation, and version selection. These checks do not establish compatibility with a particular live provider/account; use **Test connection** with your own endpoint to verify that.

Character artwork was generated specifically for this prototype and is served locally. Fonts are bundled locally with system fallbacks.
