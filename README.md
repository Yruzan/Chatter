# Chatter

A responsive character-chat website with OpenAI-compatible live replies built with React and Vite. Dark botanical colors, original anime illustrations, mobile bottom navigation, and a shared sidebar that opens as a drawer on phones.

## Run

Requires Node.js 22.9 or later.

```sh
npm ci
npm run dev
```

```sh
npm run build
npm start
```

`npm start` serves the built site and the API relay at `127.0.0.1:3000`. Put your existing reverse proxy in front of it. `npm run preview` also includes the relay for local review.

Run the desktop and mobile browser checks with `npm test`. The tests use system Chromium when available; otherwise install it with `npx playwright install chromium`.

## Features

- Discover and filter characters; open a card for details or start a chat directly.
- Start independent conversations, including multiple chats with the same character. Inside chat, the sidebar shows only that character’s history and **New chat** starts another conversation with them. Outside chat, browse all history or choose a character for a new conversation.
- Open the sidebar from the mobile menu button on Home, in the editor, and inside chat. The bottom navigation remains available outside chat and the editor.
- Save favorites in Library and manage chat history.
- Create, edit, or remix characters in a dedicated studio: name, bio, full description, personality, scenario, first message, example exchanges, tags, and creator notes. Drafts save automatically, with a live card and greeting preview.
- Upload JPG, PNG, or WebP character portraits (up to 10 MB), frame them with zoom and position controls, or choose a preset portrait. Images are cropped to 512 × 512 and compressed locally.
- Edit your account profile; set a separate conversation persona under **Chat settings → Persona**, with just a name and description. `{{user}}` uses the persona name.
- Configure the **System prompt** and **Post prompt** under **Parameters**. The system prompt is the first message of every request. The post prompt is the final system message after history and any character-specific post-history instructions.
- Apply a website-wide theme under **Appearance**: Forest, Black & blue, Purple glow, Monochrome, or Midnight ember. Themes cover the entire website and set matching chat colors; individual chat colors remain adjustable.
- Change chat fonts, text and bubble colors, action/dialogue formatting, line spacing, and message spacing. Appearance updates the actual conversation immediately.
- Send messages and image attachments. Edit and copy either side of a conversation. Regeneration saves alternate character replies; use the arrows below a bubble to select a version. Edits, versions, and the selected reply survive refresh.

Characters, conversations, favorites, profile, and preferences persist in this browser’s local storage. There is no account authentication. A small Node server serves the site and relays provider requests. Older character-based histories continue to work. If storage fills up, the editor keeps your work open and reports that saving failed. Character definitions support `{{char}}` and `{{user}}` placeholders. Clear site data to reset the site.

## Character card imports

Choose **Create character → Import character card** to load a V2/V3 JSON or PNG card. Imports replace the editor’s fields for review; they do not change the saved library until you press **Save character**. Invalid imports preserve the current draft. Cards may have empty descriptions or greetings; the character name is required.

Mapped fields include name/nickname, description, personality, scenario, first message, raw `mes_example` dialogue, creator notes, creator/version, tags, character system prompt, post-history instructions, alternate greetings, group greetings, and the character lorebook. The editor has a **Card instructions** section for these fields. Select an alternate opening from the chat introduction before sending a message. Group greetings are preserved, but group chat is not implemented.

PNG imports support `chara` and `ccv3` metadata in `tEXt`, `iTXt`, or `zTXt`, including compressed metadata and Unicode. V3 metadata takes precedence when both versions are present. Metadata checksums and chunk lengths are validated. The portrait is cropped/compressed locally to a 512px WebP. Files are limited to 20 MB, JSON metadata to 1 MB, and portraits to 40 megapixels. V3 assets, source metadata, multilingual creator notes, and extensions remain in the original `cardData`; external assets are not fetched. Import support does not imply full SillyTavern runtime compatibility.

Lorebooks support enabled constant entries, primary keyword matches, case sensitivity, selective secondary keys, scan depth, and insertion order. Content is included in character context and counts against the context budget. Advanced extension rules, regex, scripts, recursion, and specialized insertion positions are preserved in the imported source but are not executed. Imported creator notes remain editor metadata and are not sent as character instructions.

## Live API setup

1. Open a chat → **Chat settings → API**. Choose OpenAI-compatible (or a provider preset). Leave **Connection → Chatter server** selected. GeraiKita has separate free-tier and paid presets; free keys use `https://ai.geraikita.com/v1/claude`, paid keys use `https://ai.geraikita.com/v1`.
2. Enter a trusted API base URL, such as `https://your-provider.example/v1`, and your key if required.
3. Click **Load models**. The app requests `GET /models` and displays the returned model IDs in a selector. Select a model, or enter its ID manually if listing is unsupported. The list stays available while this page is open and is cleared when the endpoint or key changes.
4. **Test connection** sends a short, real `POST /chat/completions` request; it can use paid tokens. **Validate configuration** only checks fields locally.
5. Send a message. Every new reply and regeneration uses the selected provider; there is no scripted fallback or mode switch. Keys clear on page reload and must be re-entered for providers that require them. Provider/base URL/model preferences persist.

By default, requests go to this website’s Node server, which forwards them to the selected API. Provider CORS restrictions do not apply to this server-to-server request. Keys stay in memory, are forwarded only for the current request, and are never saved or logged by Chatter. Only use a trusted Chatter host and API. Serve the public Chatter site over HTTPS before entering real keys, since server mode sends the key to your Chatter host. **Direct from browser** remains available for providers that permit browser access; it can fail because of CORS or mixed-content restrictions.

The relay enables the exact OpenAI, OpenRouter and both GeraiKita base URLs by default. To enable another provider, add its exact base URL to `CHATTER_API_BASE_URLS` in `.env` (comma-separated), then restart Chatter. Copy `.env.example` for the available settings; `.env` is ignored by Git. The relay accepts only model listing and non-streaming chat operations, rejects cross-origin browser requests and redirects, caps request/response sizes, and times out upstream requests after 55 seconds. A provider’s authentication/rate-limit status is preserved; its error body and response headers are not forwarded.

HTTPS API endpoints are required except for explicitly enabled local HTTP endpoints. With **Chatter server**, localhost refers to the VPS; with **Direct from browser**, it refers to the device running the browser. To use a VPS-local Ollama instance, enable `http://127.0.0.1:11434/v1` in `CHATTER_API_BASE_URLS`. Image attachments are sent to your provider and need a vision model. Character portraits remain local. Messages and attachments are stored locally.

## VPS upgrade from static hosting

The relay requires a running Node process. Pulling new frontend files into an Nginx document root alone will still leave API connections unavailable.

```sh
git pull --ff-only origin main
npm ci
npm run build
npm start
```

Run those commands in your existing Chatter checkout. For a persistent service, adapt the paths, Node executable and service user in `deploy/chatter.service`, install it as `/etc/systemd/system/chatter.service`, then run `systemctl daemon-reload` and `systemctl enable --now chatter`. The service user needs read access to this checkout and `.env`. If a Chatter process manager already exists, update/restart that service instead of creating a second listener on port 3000.

Adapt `deploy/nginx.conf` inside Chatter’s existing domain block so the site proxies to `127.0.0.1:3000`. Keep other domains’ server blocks intact. Run `nginx -t` before reloading Nginx. Keep port 3000 bound to loopback. If you retain static asset hosting in Nginx, at minimum proxy `/api/` to the Node server and rebuild the frontend.

`GET /api/health` must return `{ "service": "chatter", "relay": true }` through the public website. If **Load models** reports that the server connection is unavailable, the domain is still serving a static-only build or its `/api/` route does not reach Node. GeraiKita’s free route needs its matching key; a missing key should give a visible 401 instead of a generic browser network failure.

The payload includes the selected model, character definition and examples, persona name and description, the global system and post prompts, character-specific instructions, active lorebook entries, generation parameters, and the selected reply versions. With history disabled, only the latest user turn is included. A conservative UTF-8 byte estimate trims older turns to leave room for the requested output; image cost is approximate and provider tokenization varies. Oversized instructions/latest turns produce a visible error rather than silently discarding them. Providers differ in supported parameters and model capabilities; their errors are surfaced without replacing saved messages with scripted replies. Replies are non-streaming, time out after 60 seconds, and support stop/retry. Navigating away cancels an in-progress request.

Browser checks cover both direct requests and the production relay. Relay tests use a real local HTTP provider that deliberately sends no CORS permission headers: direct browser access fails while model loading, connection testing, and chat through Chatter succeed. They also check endpoint restrictions, cross-origin rejection, provider authentication failures, redirects, and static-only deployment errors. Account-specific model access still needs **Test connection** with your provider key.

Character artwork was generated specifically for this prototype and is served locally. Fonts are bundled locally with system fallbacks.
