# Chatter

A responsive character-chat design prototype built with React and Vite. Dark botanical colors, original anime illustrations, mobile bottom navigation, and a shared sidebar that opens as a drawer on phones.

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
- Start independent conversations, including multiple chats with the same character; search and reopen real chat history in the sidebar.
- Open the sidebar from the mobile menu button on Home, in the editor, and inside chat. The bottom navigation remains available outside chat and the editor.
- Save favorites in Library and manage chat history.
- Create, edit, or remix characters in a dedicated studio: name, bio, full description, personality, scenario, first message, example exchanges, tags, and creator notes. Drafts save automatically, with a live card and greeting preview.
- Upload JPG, PNG, or WebP character portraits (up to 10 MB), frame them with zoom and position controls, or choose a preset portrait. Images are cropped to 512 × 512 and compressed locally.
- Edit your profile and open chat settings for generation parameters, API configuration, and appearance.
- Change chat fonts, text and bubble colors, action/dialogue formatting, line spacing, and message spacing. Appearance updates the actual conversation immediately.
- Send messages and image attachments; copy or regenerate demo replies.

Characters, conversations, favorites, profile, and preferences persist in this browser's local storage. This is a frontend prototype: replies are scripted, settings do not configure a live model, and there is no account authentication or backend. API controls validate configuration format without making provider requests. Provider/base URL/model settings persist locally; API keys stay in memory and clear on refresh. No API key is required. Character portraits, editor drafts, and chat attachments stay in browser storage; they are not uploaded to a server. Older character-based chat histories continue to work. If storage fills up, the character editor keeps your work open and reports that saving failed. Character text supports `{{char}}` and `{{user}}` placeholders in the opening message. Clear site data to reset it.

Character artwork was generated specifically for this prototype and is served locally. Fonts are bundled locally with system fallbacks.
