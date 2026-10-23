import React, { useState } from "react";
import { Search, ArrowUpRight, Plus, MessagesSquare } from "lucide-react";
export default function NewChatPicker({ characters, Art, onChoose }) {
  const [query, setQuery] = useState("");
  const filtered = characters.filter((c) =>
    `${c.name} ${c.tagline} ${c.tags.join(" ")}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <div className="new-chat-picker">
      <span className="eyebrow">
        <Plus size={14} /> A NEW CHAPTER
      </span>
      <h2>
        Who’s in your next story<span>?</span>
      </h2>
      <p>Choose a character. Every new chat gets its own conversation.</p>
      <label className="new-chat-search">
        <Search size={18} />
        <input
          autoComplete="off"
          aria-label="Search characters for a new chat"
          placeholder="Find a character or a world…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="new-chat-choices">
        {filtered.map((c) => (
          <button
            key={c.id}
            onClick={() => onChoose(c)}
            aria-label={`Start a new chat with ${c.name}`}
          >
            <Art character={c} className="new-chat-avatar" />
            <span>
              <strong>{c.name}</strong>
              <small>{c.tagline}</small>
            </span>
            <ArrowUpRight size={18} />
          </button>
        ))}
      </div>
      {!filtered.length && (
        <div className="new-chat-empty">
          <MessagesSquare size={25} />
          <p>No characters found. Try another search.</p>
        </div>
      )}
      <div className="new-chat-footer">
        <MessagesSquare size={14} />
        <span>Your earlier conversations stay in chat history.</span>
      </div>
    </div>
  );
}
