import React, { memo, useState } from "react";

// Linear token pairing: unmatched quote/asterisk runs never backtrack through
// the entire string. A long bubble reveals text in chunks to bound DOM work.
export function formatTokens(text) {
  const tokens = [];
  const marker = /\*\*|\*|"|“|”/g;
  let match;
  while ((match = marker.exec(text))) {
    if (match[0] === '"' && text[match.index - 1] === "\\") continue;
    tokens.push({ at: match.index, mark: match[0] });
  }
  const next = new Map();
  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    token.close = next.get(token.mark === "“" ? "”" : token.mark);
    next.set(token.mark, i);
  }
  const result = [];
  let offset = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i],
      closing = tokens[token.close];
    if (
      token.mark === "”" ||
      !closing ||
      closing.at <= token.at + token.mark.length
    )
      continue;
    if (offset < token.at) result.push({ text: text.slice(offset, token.at) });
    const end = closing.at + closing.mark.length;
    result.push({ text: text.slice(token.at, end), mark: token.mark });
    offset = end;
    i = token.close;
  }
  if (offset < text.length) result.push({ text: text.slice(offset) });
  return result;
}
const FormattedMessage = memo(function FormattedMessage({
  text = "",
  showMarkers = false,
}) {
  const [limit, setLimit] = useState(12000);
  const full = String(text);
  const parts = formatTokens(full.slice(0, limit));
  return (
    <span className="formatted-message">
      {parts.map((part, i) => {
        if (part.mark === "**")
          return (
            <strong key={i}>
              {showMarkers ? part.text : part.text.slice(2, -2)}
            </strong>
          );
        if (part.mark === "*")
          return (
            <span className="msg-action" key={i}>
              {showMarkers ? part.text : part.text.slice(1, -1)}
            </span>
          );
        if (part.mark === '"' || part.mark === "“")
          return (
            <span className="msg-dialogue" key={i}>
              {part.text}
            </span>
          );
        return <React.Fragment key={i}>{part.text}</React.Fragment>;
      })}
      {full.length > limit && (
        <button
          type="button"
          className="expand-message text-button"
          onClick={() => setLimit((n) => n + 12000)}
        >
          Show more of this message ({(full.length - limit).toLocaleString()}{" "}
          characters left)
        </button>
      )}
    </span>
  );
});
export default FormattedMessage;
