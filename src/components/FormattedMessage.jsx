import React from "react";

// Render text tokens as React children; character content is never interpreted as HTML.
export default function FormattedMessage({ text = "", showMarkers = false }) {
  const parts = String(text).split(
    /(\*\*[^*]+\*\*|\*[^*]+\*|"(?:[^"\\]|\\.)*"|“[^”]*”)/g,
  );
  return (
    <span className="formatted-message">
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**") && part.length > 4)
          return (
            <strong key={i}>{showMarkers ? part : part.slice(2, -2)}</strong>
          );
        if (part.startsWith("*") && part.endsWith("*") && part.length > 2)
          return (
            <span className="msg-action" key={i}>
              {showMarkers ? part : part.slice(1, -1)}
            </span>
          );
        if (
          (part.startsWith('"') && part.endsWith('"')) ||
          (part.startsWith("“") && part.endsWith("”"))
        )
          return (
            <span className="msg-dialogue" key={i}>
              {part}
            </span>
          );
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </span>
  );
}
