# Chatter

A responsive character-chat design prototype built with React and Vite. Dark botanical colors, original anime illustrations, a mobile bottom navigation, and a desktop sidebar.

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
- Continue conversations, save favorites in Library, and manage chat history.
- Create a character with a portrait, backstory, and opening message.
- Edit your profile and adjust conversation preferences.
- Send messages and image attachments; copy or regenerate demo replies.

Characters, conversations, favorites, profile, and preferences persist in this browser's local storage. This is a frontend prototype: replies are scripted, settings do not configure a live model, and there is no account authentication or backend. No API key is required. Uploaded images are stored locally with chat history; use small files for this preview. Clear site data to reset it.

Character artwork was generated specifically for this prototype and is served locally. Fonts are bundled locally with system fallbacks.
