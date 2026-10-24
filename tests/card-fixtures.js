import { deflateSync } from "node:zlib";
export const makeCard = (version = 3) => ({
  spec: `chara_card_v${version}`,
  spec_version: `${version}.0`,
  data: {
    name: "星のミラ 🌙",
    nickname: "Mira",
    description: "An astronomer who remembers every constellation.",
    personality: "Gentle and curious",
    scenario: "{{user}} meets {{char}} in an observatory.",
    first_mes: '*{{char}} smiles.* "Welcome, {{user}}."',
    mes_example: "<START>\n{{user}}: Where are we?\n{{char}}: Among the stars.",
    creator_notes: "Keep the mystery.",
    creator: "CardAuthor",
    character_version: "1.2",
    tags: ["Fantasy", "Astronomy"],
    system_prompt: "Card instruction for {{char}}",
    post_history_instructions: "Card final instruction for {{user}}",
    alternate_greetings: [
      '"A second hello, {{user}}."',
      '"The stars have changed."',
    ],
    group_only_greetings: ['"Welcome, everyone."'],
    character_book: {
      name: "The sky",
      scan_depth: 8,
      entries: [
        {
          keys: ["observatory"],
          content: "The observatory has a silver telescope.",
          enabled: true,
          insertion_order: 1,
        },
        {
          keys: [],
          content: "The sky is full of secrets.",
          constant: true,
          enabled: true,
          insertion_order: 0,
        },
        {
          keys: ["stars"],
          secondary_keys: ["silver"],
          selective: true,
          content: "Silver stars reveal the gate.",
          enabled: true,
        },
        {
          keys: [],
          content: "Do not send disabled lore.",
          constant: true,
          enabled: false,
        },
      ],
    },
    assets: [{ type: "icon", uri: "ccdefault:", name: "main", ext: "png" }],
    extensions: { custom: { retained: true } },
    creator_notes_multilingual: { ja: "星の物語" },
    source: ["https://example.com/character"],
  },
});
function crc32(bytes) {
  let crc = -1;
  for (const value of bytes) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit++)
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }
  return (crc ^ -1) >>> 0;
}
export function chunk(type, data) {
  const typeAndData = Buffer.concat([Buffer.from(type), data]);
  const size = Buffer.alloc(4);
  size.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([size, typeAndData, checksum]);
}
export function cardPNG(
  card,
  {
    keyword = card.spec === "chara_card_v3" ? "ccv3" : "chara",
    format = "tEXt",
    image,
  } = {},
) {
  // A valid small PNG or a browser-generated portrait; metadata goes before IEND.
  image ||= Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const encoded = Buffer.from(
    Buffer.from(JSON.stringify(card)).toString("base64"),
  );
  let data = Buffer.concat([Buffer.from(`${keyword}\0`), encoded]);
  if (format === "zTXt")
    data = Buffer.concat([Buffer.from(`${keyword}\0\0`), deflateSync(encoded)]);
  if (format === "iTXt")
    data = Buffer.concat([
      Buffer.concat([Buffer.from(keyword), Buffer.from([0, 1, 0, 0, 0])]),
      deflateSync(encoded),
    ]);
  return Buffer.concat([
    image.subarray(0, -12),
    chunk(format, data),
    image.subarray(-12),
  ]);
}
