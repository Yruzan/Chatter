const MAX_METADATA = 1024 * 1024;
const signature = [137, 80, 78, 71, 13, 10, 26, 10];
const text = (value, field) => {
  if (value == null) return "";
  if (typeof value !== "string")
    throw new Error(`Card field ${field} must be text.`);
  return value;
};
const strings = (value, field) => {
  if (value == null) return [];
  if (!Array.isArray(value) || value.some((v) => typeof v !== "string"))
    throw new Error(`Card field ${field} must be a list of text values.`);
  return value;
};
export function normalizeCard(card) {
  if (
    !card ||
    !["chara_card_v2", "chara_card_v3"].includes(card.spec) ||
    !card.data ||
    typeof card.data !== "object" ||
    Array.isArray(card.data)
  )
    throw new Error(
      "Choose a Character Card V2 or V3 JSON file, or a PNG with embedded card data.",
    );
  const d = card.data;
  const name = text(d.name, "name").trim();
  if (!name) throw new Error("The character card needs a name.");
  const book = d.character_book;
  if (book != null && (typeof book !== "object" || Array.isArray(book)))
    throw new Error("The character book must be an object.");
  return {
    name,
    bio: "",
    tagline: "Imported character card",
    art: 0,
    portrait: null,
    description: text(d.description, "description"),
    personality: text(d.personality, "personality"),
    scenario: text(d.scenario, "scenario"),
    greeting: text(d.first_mes, "first_mes"),
    exampleDialogue: text(d.mes_example, "mes_example"),
    examples: [],
    nickname: text(d.nickname, "nickname"),
    creatorNotes: text(d.creator_notes, "creator_notes"),
    creator: text(d.creator, "creator"),
    characterVersion: text(d.character_version, "character_version"),
    systemPrompt: text(d.system_prompt, "system_prompt"),
    postHistoryInstructions: text(
      d.post_history_instructions,
      "post_history_instructions",
    ),
    alternateGreetings: strings(d.alternate_greetings, "alternate_greetings"),
    groupGreetings: strings(d.group_only_greetings, "group_only_greetings"),
    tags: strings(d.tags, "tags"),
    characterBook: book || null,
    // Keep V3 assets, extensions, multilingual notes and unknown fields intact.
    cardData: card,
  };
}
function parseJSON(raw) {
  if (new TextEncoder().encode(raw).length > MAX_METADATA)
    throw new Error("Card metadata must be smaller than 1 MB.");
  try {
    return JSON.parse(raw.replace(/^\uFEFF/, ""));
  } catch {
    throw new Error("The character card contains invalid JSON.");
  }
}
async function inflate(bytes) {
  if (!globalThis.DecompressionStream)
    throw new Error(
      "This browser cannot read compressed PNG card metadata. Import the card’s JSON version instead.",
    );
  const reader = new Blob([bytes])
    .stream()
    .pipeThrough(new DecompressionStream("deflate"))
    .getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_METADATA * 2)
        throw new Error("PNG card metadata is too large.");
      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
export async function cardFromPNG(bytes) {
  if (!signature.every((value, index) => bytes[index] === value))
    throw new Error("This file is not a valid PNG.");
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const found = new Map();
  let ended = false;
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = view.getUint32(offset);
    if (length > bytes.length - offset - 12)
      throw new Error("The PNG card is truncated or damaged.");
    const type = String.fromCharCode(...bytes.slice(offset + 4, offset + 8));
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (["tEXt", "iTXt", "zTXt"].includes(type)) {
      const zero = data.indexOf(0);
      const keyword = new TextDecoder().decode(data.subarray(0, zero));
      if (["chara", "ccv3"].includes(keyword)) {
        if (length > MAX_METADATA * 2)
          throw new Error("PNG card metadata is too large.");
        if (
          crc32(bytes.subarray(offset + 4, offset + 8 + length)) !==
          view.getUint32(offset + 8 + length)
        )
          throw new Error(
            "The PNG card metadata is damaged (checksum mismatch).",
          );
        let payload = data.subarray(zero + 1);
        if (type === "zTXt") {
          if (payload[0] !== 0)
            throw new Error("Unsupported PNG text compression.");
          payload = await inflate(payload.subarray(1));
        } else if (type === "iTXt") {
          const compressed = payload[0];
          if (![0, 1].includes(compressed) || payload[1] !== 0)
            throw new Error("Unsupported PNG text compression.");
          let start = 2;
          for (let i = 0; i < 2; i++) {
            const end = payload.indexOf(0, start);
            if (end < 0) throw new Error("Invalid PNG text metadata.");
            start = end + 1;
          }
          payload = compressed
            ? await inflate(payload.subarray(start))
            : payload.subarray(start);
        }
        const encoded = decoder.decode(payload).trim();
        let raw;
        try {
          raw = encoded.startsWith("{")
            ? encoded
            : decoder.decode(
                Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0)),
              );
        } catch {
          throw new Error("The PNG card contains invalid encoded metadata.");
        }
        found.set(keyword, parseJSON(raw));
      }
    }
    offset += length + 12;
    if (type === "IEND") {
      ended = true;
      break;
    }
  }
  if (!ended) throw new Error("The PNG card is incomplete.");
  const card = found.get("ccv3") || found.get("chara");
  if (!card)
    throw new Error(
      "This PNG has no V2/V3 card metadata. Use Upload image for a portrait, or import a character-card PNG.",
    );
  return card;
}
async function portraitFromPNG(file, bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (bytes.length < 24 || view.getUint32(16) * view.getUint32(20) > 40000000)
    throw new Error("Choose a card image under 40 megapixels.");
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    canvas
      .getContext("2d")
      .drawImage(
        image,
        (image.naturalWidth - side) / 2,
        (image.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        512,
        512,
      );
    return canvas.toDataURL("image/webp", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
export async function importCharacterCard(file) {
  if (file.size > 20 * 1024 * 1024)
    throw new Error("Choose a card smaller than 20 MB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const png = signature.every((value, index) => bytes[index] === value);
  const raw = png
    ? await cardFromPNG(bytes)
    : parseJSON(new TextDecoder().decode(bytes));
  const character = normalizeCard(raw);
  if (png) character.portrait = await portraitFromPNG(file, bytes);
  return character;
}
// A deliberately small, predictable lorebook matcher. Advanced metadata stays
// in cardData; no imported regex or script is executed.
export function activeLore(character, history) {
  const book = character.characterBook;
  if (!Array.isArray(book?.entries)) return [];
  const depth = Number.isFinite(book.scan_depth)
    ? Math.max(1, book.scan_depth)
    : 8;
  const input = history
    .slice(-depth)
    .map((m) => m.text || "")
    .join("\n");
  return book.entries
    .filter((entry) => {
      if (!entry || typeof entry !== "object") return false;
      if (entry.enabled === false) return false;
      if (entry.constant) return true;
      const match = (key) =>
        typeof key === "string" &&
        key.length &&
        (entry.case_sensitive
          ? input.includes(key)
          : input.toLowerCase().includes(key.toLowerCase()));
      return (
        Array.isArray(entry.keys) &&
        entry.keys.some(match) &&
        (!entry.selective ||
          (Array.isArray(entry.secondary_keys) &&
            entry.secondary_keys.some(match)))
      );
    })
    .sort((a, b) => (a.insertion_order || 0) - (b.insertion_order || 0))
    .map((e) => e.content)
    .filter((v) => typeof v === "string");
}
