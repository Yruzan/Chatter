import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, Plus, Trash2, Save, BookOpen } from "lucide-react";
import BufferedTextarea from "./BufferedTextarea";

export default function LorebookEditor({ value, onSave, onClose }) {
  const [book, setBook] = useState(() =>
    structuredClone(
      value || {
        name: "Character lorebook",
        description: "",
        scan_depth: 8,
        entries: [],
      },
    ),
  );
  const bookRef = useRef(book),
    panel = useRef(null);
  const [selected, setSelected] = useState(0),
    [query, setQuery] = useState(""),
    [page, setPage] = useState(0);
  const update = (fn) => {
    bookRef.current = fn(bookRef.current);
    setBook(bookRef.current);
  };
  const entry = book.entries?.[selected];
  const edit = (key, value) =>
    update((previous) => ({
      ...previous,
      entries: previous.entries.map((item, i) =>
        i === selected ? { ...item, [key]: value } : item,
      ),
    }));
  const filtered = useMemo(
    () =>
      (book.entries || [])
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) =>
          `${entry.name || entry.comment || ""} ${(entry.keys || []).join(" ")}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    [book.entries, query],
  );
  useEffect(() => {
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const key = (event) => {
      if (event.key === "Escape") {
        event.stopImmediatePropagation();
        event.preventDefault();
        onClose();
      }
      if (event.key === "Tab") {
        const nodes = [
          ...panel.current.querySelectorAll("button,input,textarea,select"),
        ].filter((el) => !el.disabled && el.getClientRects().length);
        if (
          event.shiftKey &&
          (document.activeElement === nodes[0] ||
            document.activeElement === panel.current)
        ) {
          event.preventDefault();
          nodes.at(-1)?.focus();
        } else if (!event.shiftKey && document.activeElement === nodes.at(-1)) {
          event.preventDefault();
          nodes[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key, true);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key, true);
      previous?.focus();
    };
  }, []);
  return (
    <div className="lorebook-backdrop">
      <section
        className="lorebook-editor"
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Lorebook editor"
      >
        <header>
          <div>
            <span className="eyebrow">WORLD & MEMORY</span>
            <h2>
              <BookOpen size={22} /> Lorebook editor
            </h2>
          </div>
          <button
            className="icon-button"
            aria-label="Close lorebook editor"
            onClick={onClose}
          >
            <X />
          </button>
        </header>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            window.dispatchEvent(new Event("chatter-flush-inputs"));
            onSave(bookRef.current);
          }}
        >
          <div className="lorebook-meta">
            <label>
              Book name
              <input
                value={book.name || ""}
                onChange={(e) =>
                  update((b) => ({ ...b, name: e.target.value }))
                }
              />
            </label>
            <label>
              Scan depth (messages)
              <input
                type="number"
                min={1}
                value={book.scan_depth ?? 8}
                onChange={(e) =>
                  update((b) => ({
                    ...b,
                    scan_depth: Math.max(1, Number(e.target.value)),
                  }))
                }
              />
            </label>
          </div>
          <label className="lorebook-description">
            Book description
            <BufferedTextarea
              rows={2}
              value={book.description || ""}
              onCommit={(value) =>
                update((b) => ({ ...b, description: value }))
              }
            />
          </label>
          <div className="lorebook-layout">
            <aside className="lorebook-entries" aria-label="Lorebook entries">
              <input
                aria-label="Search lorebook entries"
                placeholder="Search entries…"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(0);
                }}
              />
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  const length = book.entries?.length || 0;
                  update((b) => ({
                    ...b,
                    entries: [
                      ...(b.entries || []),
                      {
                        id: Date.now(),
                        name: "New entry",
                        keys: [],
                        secondary_keys: [],
                        content: "",
                        enabled: true,
                        constant: false,
                        selective: false,
                        insertion_order: length,
                      },
                    ],
                  }));
                  setSelected(length);
                  setQuery("");
                  setPage(Math.floor(length / 20));
                }}
              >
                <Plus size={15} /> Add entry
              </button>
              {filtered
                .slice(page * 20, page * 20 + 20)
                .map(({ entry, index }) => (
                  <button
                    type="button"
                    key={index}
                    className={`lorebook-entry ${index === selected ? "selected" : ""}`}
                    onClick={() => setSelected(index)}
                  >
                    <strong>
                      {entry.name || entry.comment || `Entry ${index + 1}`}
                    </strong>
                    <small>
                      {entry.enabled === false
                        ? "Disabled"
                        : entry.constant
                          ? "Always active"
                          : `${entry.keys?.length || 0} keywords`}
                    </small>
                  </button>
                ))}
              {filtered.length > 20 && (
                <div className="lorebook-pages">
                  <button
                    type="button"
                    disabled={!page}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    {page + 1} / {Math.ceil(filtered.length / 20)}
                  </span>
                  <button
                    type="button"
                    disabled={(page + 1) * 20 >= filtered.length}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </aside>
            {entry ? (
              <div className="lorebook-fields" key={selected}>
                <label>
                  Entry name
                  <input
                    value={entry.name || entry.comment || ""}
                    onChange={(e) => edit("name", e.target.value)}
                  />
                </label>
                <div className="lorebook-toggles">
                  {[
                    ["enabled", "Enabled", entry.enabled !== false],
                    ["constant", "Always active", !!entry.constant],
                    [
                      "case_sensitive",
                      "Case sensitive",
                      !!entry.case_sensitive,
                    ],
                    ["selective", "Require secondary key", !!entry.selective],
                  ].map(([key, label, checked]) => (
                    <label key={key}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => edit(key, e.target.checked)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <label>
                  Primary keywords
                  <BufferedTextarea
                    rows={2}
                    value={(entry.keys || []).join("\n")}
                    onCommit={(value) =>
                      edit(
                        "keys",
                        value
                          .split(/\n|,/)
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </label>
                <p className="field-hint">
                  One keyword per line, or separate with commas. Any primary
                  match activates this entry.
                </p>
                <label>
                  Secondary keywords
                  <BufferedTextarea
                    rows={2}
                    value={(entry.secondary_keys || []).join("\n")}
                    onCommit={(value) =>
                      edit(
                        "secondary_keys",
                        value
                          .split(/\n|,/)
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </label>
                <label>
                  Entry content
                  <BufferedTextarea
                    rows={9}
                    value={entry.content || ""}
                    onCommit={(value) => edit("content", value)}
                  />
                </label>
                <label>
                  Insertion order
                  <input
                    type="number"
                    value={entry.insertion_order || 0}
                    onChange={(e) =>
                      edit("insertion_order", Number(e.target.value))
                    }
                  />
                </label>
                <button
                  className="text-button danger"
                  type="button"
                  onClick={() => {
                    update((b) => ({
                      ...b,
                      entries: b.entries.filter((_, i) => i !== selected),
                    }));
                    setSelected(Math.max(0, selected - 1));
                    setPage(0);
                  }}
                >
                  <Trash2 size={15} /> Delete lore entry
                </button>
              </div>
            ) : (
              <div className="lorebook-empty">
                <BookOpen size={36} />
                <h3>Build a world, one entry at a time.</h3>
                <p>Add an entry to define places, people, or memories.</p>
              </div>
            )}
          </div>
          <footer>
            <span>
              Changes are applied to this character’s draft. Save the character
              to keep them.
            </span>
            <button
              type="button"
              className="button secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button className="button primary" type="submit">
              <Save size={16} /> Apply lorebook
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}
