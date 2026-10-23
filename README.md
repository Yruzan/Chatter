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
- Create, edit, or remix characters in a dedicated studio: name, bio, full description, personality, scenario, first message, example exchanges, tags, and creator notes. Drafts save automatically, with a live card and greeting preview.
- Edit your profile and open chat settings for generation parameters, API configuration, and appearance.
- Change chat fonts, text and bubble colors, action/dialogue formatting, line spacing, and message spacing. Appearance updates the actual conversation immediately.
- Send messages and image attachments; copy or regenerate demo replies.

Characters, conversations, favorites, profile, and preferences persist in this browser's local storage. This is a frontend prototype: replies are scripted, settings do not configure a live model, and there is no account authentication or backend. API controls validate configuration format without making provider requests. Provider/base URL/model settings persist locally; API keys stay in memory and clear on refresh. No API key is required. Uploaded images are stored locally with chat history; use small files for this preview. Character text supports `{{char}}` and `{{user}}` placeholders in the opening message. Clear site data to reset it.

Character artwork was generated specifically for this prototype and is served locally. Fonts are bundled locally with system fallbacks.
