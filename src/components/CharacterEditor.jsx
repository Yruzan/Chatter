import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Plus,
  X,
  Save,
  UserRound,
  Feather,
  MessagesSquare,
  Sparkles,
  RotateCcw,
  Eye,
  ChevronRight,
  Upload,
} from "lucide-react";
import { importCharacterCard } from "../characterCards";
import FormattedMessage from "./FormattedMessage";
import LorebookEditor from "./LorebookEditor";
import PortraitUpload from "./PortraitUpload";
import { appearanceStyle } from "../settings";

const blank = {
  name: "",
  bio: "",
  description: "",
  personality: "",
  scenario: "",
  greeting: "",
  examples: [{ user: "", character: "" }],
  tags: [],
  art: 0,
  portrait: null,
  creatorNotes: "",
  nickname: "",
  creator: "",
  characterVersion: "",
  systemPrompt: "",
  postHistoryInstructions: "",
  exampleDialogue: "",
  alternateGreetings: [],
  groupGreetings: [],
  characterBook: null,
};
function valuesFrom(character) {
  return {
    ...blank,
    ...character,
    bio: character?.bio ?? character?.tagline ?? "",
    examples: character?.examples?.length
      ? character.examples.map((e) => ({ ...e }))
      : [{ user: "", character: "" }],
    tags: [...(character?.tags ?? [])],
    alternateGreetingsText: (character?.alternateGreetings || []).join(
      "\n\n---\n\n",
    ),
    groupGreetingsText: (character?.groupGreetings || []).join("\n\n---\n\n"),
    characterBookText: character?.characterBook
      ? JSON.stringify(character.characterBook, null, 2)
      : "",
  };
}
function Field({
  name,
  label,
  value,
  onChange,
  maxLength,
  rows,
  hint,
  required = false,
  placeholder,
  error,
}) {
  const id = `character-${name}`,
    Input = rows ? "textarea" : "input";
  return (
    <div className={`editor-field ${error ? "field-error" : ""}`}>
      <div className="editor-field-top">
        <label htmlFor={id}>
          {label}
          {required && <span aria-hidden="true"> *</span>}
        </label>
        <span>
          {value.length.toLocaleString()}
          {maxLength ? ` / ${maxLength.toLocaleString()}` : " characters"}
        </span>
      </div>
      {hint && (
        <p className="editor-field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      <Input
        id={id}
        name={name}
        aria-label={label}
        value={value}
        onChange={onChange}
        maxLength={maxLength}
        rows={rows}
        required={required}
        placeholder={placeholder}
        aria-invalid={!!error}
        aria-describedby={
          [hint && `${id}-hint`, error && `${id}-error`]
            .filter(Boolean)
            .join(" ") || undefined
        }
      />
      {error && (
        <p className="editor-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}
export default function CharacterEditor({
  character,
  remix = false,
  portraits,
  Art,
  appearance,
  persona,
  onSave,
  onClose,
}) {
  const draftKey = `chatter-editor-draft-${remix ? "remix-" : ""}${character?.id || "new"}`;
  const [data, setData] = useState(() => {
    try {
      const draft = JSON.parse(localStorage.getItem(draftKey));
      if (draft?.version === 1) return valuesFrom(draft.data);
    } catch {}
    return valuesFrom(character);
  });
  const [tag, setTag] = useState(""),
    [active, setActive] = useState("identity"),
    [showPreview, setShowPreview] = useState(false),
    [errors, setErrors] = useState({}),
    [draftStatus, setDraftStatus] = useState(""),
    [portraitBusy, setPortraitBusy] = useState(false),
    [importBusy, setImportBusy] = useState(false),
    [lorebookOpen, setLorebookOpen] = useState(false),
    [importStatus, setImportStatus] = useState(null);
  const importRef = useRef(null);
  const heading = useRef(null),
    saved = useRef(false),
    previewRef = useRef(null),
    previewClose = useRef(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  useEffect(() => {
    if (!showPreview) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    previewClose.current?.focus();
    const listener = (event) => {
      if (event.key === "Escape") setShowPreview(false);
      if (event.key === "Tab") {
        event.preventDefault();
        previewClose.current?.focus();
      }
    };
    document.addEventListener("keydown", listener);
    return () => {
      document.removeEventListener("keydown", listener);
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [showPreview]);
  const latestDraft = useRef(data);
  latestDraft.current = data;
  const writeDraft = () => {
    if (saved.current) return;
    try {
      localStorage.setItem(
        draftKey,
        JSON.stringify({ version: 1, data: latestDraft.current }),
      );
      setDraftStatus("Draft saved on this device");
    } catch {
      setDraftStatus("Storage full. Keep this editor open until you save.");
    }
  };
  useEffect(() => {
    const timer = setTimeout(writeDraft, 500);
    return () => clearTimeout(timer);
  }, [data, draftKey]);
  useEffect(() => {
    const leave = () => writeDraft();
    window.addEventListener("pagehide", leave);
    return () => {
      window.removeEventListener("pagehide", leave);
      if (!saved.current) {
        try {
          localStorage.setItem(
            draftKey,
            JSON.stringify({ version: 1, data: latestDraft.current }),
          );
        } catch {}
      }
    };
  }, [draftKey]);
  const change = (e) => {
    const { name, value } = e.target;
    setData((d) => ({ ...d, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };
  const addTag = () => {
    const names = tag
      .split(",")
      .map((s) => s.trim().replace(/^#/, ""))
      .filter(Boolean);
    setData((d) => {
      const seen = new Set(d.tags.map((t) => t.toLowerCase()));
      const next = [...d.tags];
      for (const name of names) {
        if (!seen.has(name.toLowerCase()) && next.length < 12) {
          next.push(name.slice(0, 24));
          seen.add(name.toLowerCase());
        }
      }
      return { ...d, tags: next };
    });
    setTag("");
  };
  const example = (i, key, value) =>
    setData((d) => ({
      ...d,
      examples: d.examples.map((e, index) =>
        index === i ? { ...e, [key]: value } : e,
      ),
    }));
  const filled = [
    "name",
    "bio",
    "description",
    "personality",
    "greeting",
  ].filter((key) => data[key]?.trim()).length;
  const tokens = Math.ceil(
    [
      data.description,
      data.personality,
      data.scenario,
      data.greeting,
      ...data.examples.flatMap((e) => [e.user, e.character]),
    ].join("\n").length / 4,
  );
  function save(e) {
    e.preventDefault();
    if (portraitBusy || importBusy) return;
    const nextErrors = {};
    for (const key of ["name"])
      if (!data[key].trim())
        nextErrors[key] = "Please add a little detail here.";
    let characterBook = null;
    if (data.characterBookText.trim()) {
      try {
        characterBook = JSON.parse(data.characterBookText);
        if (
          !characterBook ||
          typeof characterBook !== "object" ||
          Array.isArray(characterBook) ||
          (characterBook.entries && !Array.isArray(characterBook.entries))
        )
          throw new Error();
      } catch {
        nextErrors.characterBookText =
          "Enter a valid lorebook JSON object with an entries array.";
      }
    }
    data.examples.forEach((example, index) => {
      if (!!example.user.trim() !== !!example.character.trim())
        nextErrors[`example-${index}`] =
          "Fill both sides of the exchange, or leave both empty.";
    });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      const key = Object.keys(nextErrors)[0];
      const target = key.startsWith("example-")
        ? document.getElementById(
            `example-${data.examples[Number(key.split("-")[1])].user.trim() ? "character" : "user"}-${key.split("-")[1]}`,
          )
        : document.getElementById(`character-${key}`);
      target?.focus();
      return;
    }
    const cleaned = {
      ...data,
      name: data.name.trim(),
      bio: data.bio.trim(),
      description: data.description.trim(),
      personality: data.personality.trim(),
      scenario: data.scenario.trim(),
      greeting: data.greeting.trim(),
      creatorNotes: data.creatorNotes.trim(),
      tags: [...data.tags],
      characterBook,
      alternateGreetings: data.alternateGreetingsText
        .split(/^\s*---\s*$/m)
        .map((s) => s.trim())
        .filter(Boolean),
      groupGreetings: data.groupGreetingsText
        .split(/^\s*---\s*$/m)
        .map((s) => s.trim())
        .filter(Boolean),
      examples: data.examples
        .filter((e) => e.user.trim() && e.character.trim())
        .map((e) => ({ user: e.user.trim(), character: e.character.trim() })),
    };
    if (onSave(cleaned) === false) return;
    saved.current = true;
    localStorage.removeItem(draftKey);
  }
  function discard() {
    setData(valuesFrom(character));
    setErrors({});
    setTag("");
    localStorage.removeItem(draftKey);
  }
  const sections = [
    ["identity", "01", "Profile", UserRound],
    ["definition", "02", "Personality & world", Feather],
    ["dialogue", "03", "Dialogue", MessagesSquare],
    ["card", "04", "Card instructions", Feather],
  ];
  return (
    <div className="character-studio">
      {lorebookOpen && (
        <LorebookEditor
          value={
            data.characterBookText.trim()
              ? JSON.parse(data.characterBookText)
              : null
          }
          onClose={() => setLorebookOpen(false)}
          onSave={(book) => {
            setData((d) => ({
              ...d,
              characterBookText: JSON.stringify(book, null, 2),
            }));
            setErrors((previous) => ({
              ...previous,
              characterBookText: undefined,
            }));
            setLorebookOpen(false);
          }}
        />
      )}
      <header className="studio-header">
        <div>
          <button className="text-button studio-back" onClick={onClose}>
            <ArrowLeft size={15} /> Back to{" "}
            {character && !remix ? "character" : "exploring"}
          </button>
          <span className="eyebrow">CHARACTER STUDIO</span>
          <h1 ref={heading} tabIndex={-1}>
            {character && !remix
              ? "A little more depth"
              : remix
                ? "A familiar face. Your story"
                : "Make someone unforgettable"}
            <span>.</span>
          </h1>
          <p>
            Build a personality, give them a world, and write the first hello.
          </p>
        </div>
        <div className="studio-actions">
          <button
            className="button secondary preview-toggle"
            onClick={() => setShowPreview(!showPreview)}
            aria-pressed={showPreview}
          >
            <Eye size={16} /> Preview
          </button>
          <button
            className="button primary"
            form="character-editor-form"
            type="submit"
            disabled={portraitBusy || importBusy}
          >
            <Save size={16} />
            {character && !remix ? "Save changes" : "Save character"}
          </button>
        </div>
      </header>
      <div className="card-import">
        <button
          className="button secondary"
          type="button"
          disabled={portraitBusy || importBusy}
          onClick={() => importRef.current?.click()}
        >
          <Upload size={16} />
          {importBusy ? "Reading card…" : "Import character card"}
        </button>
        <input
          ref={importRef}
          hidden
          type="file"
          accept=".json,.png,application/json,image/png"
          aria-label="Import character card file"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setImportBusy(true);
            setImportStatus(null);
            try {
              const imported = await importCharacterCard(file);
              setData(valuesFrom(imported));
              setErrors({});
              setTag("");
              setImportStatus({
                ok: true,
                text: `Imported ${imported.name} (${imported.cardData.spec === "chara_card_v3" ? "V3" : "V2"}). Review the fields, then save. Your library has not changed yet.`,
              });
            } catch (error) {
              setImportStatus({ ok: false, text: error.message });
            } finally {
              setImportBusy(false);
            }
          }}
        />
        <p>
          Import SillyTavern V2/V3 JSON or PNG cards. This replaces the editor’s
          current fields; your library changes only when you save.
        </p>
      </div>
      {importStatus && (
        <p
          className="card-import-result"
          role={importStatus.ok ? "status" : "alert"}
        >
          {importStatus.text}
        </p>
      )}
      <div className="studio-draft-bar">
        <span
          className={draftStatus.startsWith("Storage") ? "storage-warning" : ""}
        >
          <Check size={13} />
          {draftStatus}
        </span>
        <span>Approx. {tokens.toLocaleString()} definition tokens</span>
      </div>
      <div
        className={`studio-layout ${showPreview ? "show-mobile-preview" : ""}`}
      >
        <nav className="studio-nav" aria-label="Character editor sections">
          {sections.map(([id, number, label, Icon]) => (
            <button
              key={id}
              className={active === id ? "active" : ""}
              onClick={() => {
                setActive(id);
                document
                  .getElementById(`studio-${id}`)
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              <span>{number}</span>
              <Icon size={15} />
              <strong>{label}</strong>
              <ChevronRight size={13} />
            </button>
          ))}
          <div className="studio-completion">
            <span>{filled} of 5 essentials</span>
            <div>
              <i style={{ width: `${filled * 20}%` }} />
            </div>
            <p>A good character has a name, a spark, and something to say.</p>
          </div>
          <button className="text-button reset-draft" onClick={discard}>
            <RotateCcw size={13} /> Reset to saved version
          </button>
        </nav>
        <form
          className="studio-form"
          id="character-editor-form"
          onSubmit={save}
        >
          <section className="studio-section" id="studio-identity">
            <div className="studio-section-heading">
              <span>01</span>
              <div>
                <h2>The face of the story</h2>
                <p>The details people meet first.</p>
              </div>
              <UserRound size={20} />
            </div>
            <div className="studio-portrait-row">
              <Art
                character={{ ...data, name: data.name || "Your character" }}
                className="studio-current-portrait"
              />
              <div>
                <label>Character portrait</label>
                <p>Choose a starting look for your character.</p>
                <div className="studio-portrait-picker">
                  {portraits.map((c) => (
                    <button
                      type="button"
                      className={
                        !data.portrait && data.art === c.art ? "selected" : ""
                      }
                      aria-label={`Select ${c.name} portrait`}
                      disabled={portraitBusy || importBusy}
                      key={c.id}
                      onClick={() =>
                        setData((d) => ({ ...d, art: c.art, portrait: null }))
                      }
                    >
                      <Art character={c} />
                      {!data.portrait && data.art === c.art && (
                        <span>
                          <Check size={11} />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <PortraitUpload
              value={data.portrait}
              onBusyChange={setPortraitBusy}
              onChange={(portrait) =>
                setData((previous) => ({ ...previous, portrait }))
              }
            />
            <Field
              name="name"
              label="Character name"
              maxLength={120}
              required
              value={data.name}
              onChange={change}
              placeholder="A name worth remembering"
              error={errors.name}
            />
            <Field
              name="bio"
              label="Bio"
              maxLength={160}
              rows={2}
              value={data.bio}
              onChange={change}
              hint="A short introduction shown on their card. Keep the mystery alive."
              placeholder="A quiet astronomer with a head full of impossible dreams."
            />
            <div className="editor-field">
              <div className="editor-field-top">
                <label htmlFor="character-tags">Tags</label>
                <span>{data.tags.length} / 12</span>
              </div>
              <p className="editor-field-hint">
                Describe their world, mood, and the kind of connection to
                expect.
              </p>
              <div className="editor-tags">
                {data.tags.map((t) => (
                  <span key={t}>
                    #{t}
                    <button
                      type="button"
                      aria-label={`Remove tag ${t}`}
                      onClick={() =>
                        setData((d) => ({
                          ...d,
                          tags: d.tags.filter((v) => v !== t),
                        }))
                      }
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
                <input
                  id="character-tags"
                  aria-label="Add a tag"
                  value={tag}
                  maxLength={180}
                  disabled={data.tags.length >= 12}
                  placeholder={
                    data.tags.length >= 12
                      ? "12 tags added"
                      : "Type a tag, then press Enter"
                  }
                  onChange={(e) => setTag(e.target.value)}
                  onBlur={() => {
                    if (tag.trim()) addTag();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                />
              </div>
              <div className="suggested-tags">
                <span>Try</span>
                {["Fantasy", "Comfort", "Adventure", "Slow burn", "Original"]
                  .filter(
                    (t) =>
                      !data.tags.some(
                        (s) => s.toLowerCase() === t.toLowerCase(),
                      ),
                  )
                  .map((t) => (
                    <button
                      type="button"
                      key={t}
                      disabled={data.tags.length >= 12}
                      onClick={() =>
                        setData((d) => ({ ...d, tags: [...d.tags, t] }))
                      }
                    >
                      <Plus size={11} />
                      {t}
                    </button>
                  ))}
              </div>
            </div>
          </section>
          <section className="studio-section" id="studio-definition">
            <div className="studio-section-heading">
              <span>02</span>
              <div>
                <h2>More than a description</h2>
                <p>The details that make them feel like themselves.</p>
              </div>
              <Feather size={20} />
            </div>
            <Field
              name="description"
              label="Description"
              maxLength={100000}
              rows={6}
              value={data.description}
              onChange={change}
              hint="Appearance, background, relationships, and the details the model should know."
              placeholder="Who are they? Where did they come from? What have they never told anyone?"
              error={errors.description}
            />
            <Field
              name="personality"
              label="Personality"
              maxLength={40000}
              rows={5}
              value={data.personality}
              onChange={change}
              hint="Traits, mannerisms, motivations, fears, and how they speak. Specific details work best."
              placeholder="Thoughtful and quietly playful. Pauses before answering difficult questions. Hides nerves behind dry humor…"
            />
            <Field
              name="scenario"
              label="Scenario"
              maxLength={40000}
              rows={4}
              value={data.scenario}
              onChange={change}
              hint="Where does the story begin, and how does the user fit into their world?"
              placeholder="You arrive at an abandoned observatory just as an unexpected light crosses the sky…"
            />
            <div className="writing-tip">
              <Sparkles size={17} />
              <p>
                Use <code>{"{{char}}"}</code> for the character and{" "}
                <code>{"{{user}}"}</code> for the person chatting. These
                placeholders are filled in when the conversation starts.
              </p>
            </div>
          </section>
          <section className="studio-section" id="studio-dialogue">
            <div className="studio-section-heading">
              <span>03</span>
              <div>
                <h2>Let their voice come through</h2>
                <p>Set the scene. Show us how they talk.</p>
              </div>
              <MessagesSquare size={20} />
            </div>
            <Field
              name="greeting"
              label="First message"
              maxLength={100000}
              rows={6}
              value={data.greeting}
              onChange={change}
              hint={
                'The opening scene and greeting. Use *asterisks* for actions and "quotes" for dialogue.'
              }
              placeholder={
                '*{{char}} looks up from a well-worn notebook.*\n\n"You found me. I was beginning to think no one would."'
              }
              error={errors.greeting}
            />
            <div className="editor-field">
              <div className="editor-field-top">
                <label>Example messages</label>
                <span>Optional · {data.examples.length} / 6 exchanges</span>
              </div>
              <p className="editor-field-hint">
                A few example exchanges teach the character’s tone and response
                style.
              </p>
              <div className="example-exchanges">
                {data.examples.map((pair, i) => (
                  <div className="example-exchange" key={i}>
                    <div className="exchange-heading">
                      <span>EXCHANGE {String(i + 1).padStart(2, "0")}</span>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label={`Remove example ${i + 1}`}
                        onClick={() =>
                          setData((d) => ({
                            ...d,
                            examples: d.examples.filter(
                              (_, index) => index !== i,
                            ),
                          }))
                        }
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <label htmlFor={`example-user-${i}`}>{"{{user}}"}</label>
                    <textarea
                      id={`example-user-${i}`}
                      aria-label={`Example ${i + 1} user message`}
                      maxLength={40000}
                      rows={2}
                      value={pair.user}
                      placeholder="Do you ever get lonely up here?"
                      onChange={(e) => example(i, "user", e.target.value)}
                    />
                    <label htmlFor={`example-character-${i}`}>
                      {"{{char}}"}
                    </label>
                    <textarea
                      id={`example-character-${i}`}
                      aria-label={`Example ${i + 1} character message`}
                      maxLength={40000}
                      rows={3}
                      value={pair.character}
                      placeholder={
                        '*A small smile.* "Only when the stars stop telling stories."'
                      }
                      onChange={(e) => example(i, "character", e.target.value)}
                    />
                    {errors[`example-${i}`] && (
                      <p className="editor-error" role="alert">
                        {errors[`example-${i}`]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                className="button secondary add-example"
                disabled={data.examples.length >= 6}
                onClick={() =>
                  setData((d) => ({
                    ...d,
                    examples: [...d.examples, { user: "", character: "" }],
                  }))
                }
              >
                <Plus size={15} /> Add example exchange
              </button>
            </div>
            <Field
              name="exampleDialogue"
              label="Card example dialogue"
              rows={6}
              maxLength={100000}
              value={data.exampleDialogue}
              onChange={change}
              hint="Original mes_example text from imported cards. Preserves {{user}}, {{char}}, and <START> dialogue blocks."
            />
            <Field
              name="alternateGreetingsText"
              label="Alternate greetings"
              rows={6}
              maxLength={100000}
              value={data.alternateGreetingsText}
              onChange={change}
              hint="Separate full greetings with a line containing ---. Choose one when starting a new conversation."
            />
            <Field
              name="creatorNotes"
              label="Creator notes"
              maxLength={2000}
              rows={3}
              value={data.creatorNotes}
              onChange={change}
              hint="Personal notes for the editor. These aren’t part of the character’s conversation context."
              placeholder="Inspiration, ideas to explore, or things to come back to."
            />
          </section>
          <section className="studio-section" id="studio-card">
            <div className="studio-section-heading">
              <span>04</span>
              <div>
                <h2>Character card instructions</h2>
                <p>V2/V3 definitions and additional character context.</p>
              </div>
              <Feather size={20} />
            </div>
            <Field
              name="systemPrompt"
              label="Character system prompt"
              rows={5}
              value={data.systemPrompt}
              onChange={change}
              hint="Added to character context after your global system prompt. {{original}} expands to the global system prompt."
            />
            <Field
              name="postHistoryInstructions"
              label="Character post-history instructions"
              rows={5}
              value={data.postHistoryInstructions}
              onChange={change}
              hint="Placed after conversation history, before your global post prompt."
            />
            <Field
              name="nickname"
              label="Nickname"
              maxLength={300}
              value={data.nickname}
              onChange={change}
              hint="Optional V3 character nickname, included in character context."
            />
            <Field
              name="creator"
              label="Card creator"
              maxLength={300}
              value={data.creator}
              onChange={change}
            />
            <Field
              name="characterVersion"
              label="Character version"
              maxLength={300}
              value={data.characterVersion}
              onChange={change}
            />
            <Field
              name="groupGreetingsText"
              label="Group-only greetings"
              rows={4}
              maxLength={100000}
              value={data.groupGreetingsText}
              onChange={change}
              hint="V3 group greetings are preserved. Group chat is not available yet. Separate greetings with a line containing ---."
            />
            <div className="lorebook-launcher">
              <h3>Character lorebook</h3>
              <p>
                Edit entries, keywords, and activation rules in a dedicated
                editor.
              </p>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  try {
                    const book = data.characterBookText.trim()
                      ? JSON.parse(data.characterBookText)
                      : null;
                    if (
                      book &&
                      (!Array.isArray(book.entries ?? []) ||
                        (book.entries || []).some(
                          (e) => !e || typeof e !== "object",
                        ))
                    )
                      throw new Error();
                    setLorebookOpen(true);
                  } catch {
                    setErrors((previous) => ({
                      ...previous,
                      characterBookText:
                        "Fix the source JSON below before opening the editor.",
                    }));
                  }
                }}
              >
                Open lorebook editor
              </button>
            </div>
            <details
              className="lorebook-json"
              open={!!errors.characterBookText}
            >
              <summary>Advanced lorebook JSON</summary>
              <Field
                name="characterBookText"
                label="Character lorebook JSON"
                rows={10}
                maxLength={500000}
                value={data.characterBookText}
                onChange={change}
                error={errors.characterBookText}
                hint="Keyword, selective secondary-key, and constant entries are included in requests. Other matching extensions are retained in the imported source but are not executed."
              />
            </details>
            {data.cardData && (
              <p className="editor-field-hint">
                Imported V2/V3 assets, extensions, and additional source
                metadata are preserved. External assets are not downloaded.
              </p>
            )}
            <div className="studio-form-footer">
              <span>
                <ShieldNote /> Saved privately in your browser
              </span>
              <button
                type="submit"
                className="button primary"
                disabled={portraitBusy || importBusy}
              >
                <Save size={16} />
                {character && !remix ? "Save changes" : "Save character"}
              </button>
            </div>
          </section>
        </form>
        {showPreview && (
          <button
            className="studio-preview-scrim"
            aria-label="Close preview backdrop"
            onClick={() => setShowPreview(false)}
          />
        )}
        <aside
          ref={previewRef}
          className="studio-preview"
          role={showPreview ? "dialog" : undefined}
          aria-modal={showPreview || undefined}
          aria-label="Live character preview"
        >
          <div className="studio-preview-heading">
            <span className="eyebrow">
              <Eye size={13} /> LIVE PREVIEW
            </span>
            <button
              ref={previewClose}
              className="icon-button preview-mobile-close"
              aria-label="Close character preview"
              onClick={() => setShowPreview(false)}
            >
              <X size={17} />
            </button>
          </div>
          <div className="studio-preview-card">
            <Art character={{ ...data, name: data.name || "Your character" }} />
            <div className="studio-preview-overlay" />
            <div>
              <span>{data.tags[0] || "YOUR ORIGINAL CHARACTER"}</span>
              <h2>{data.name || "A new character"}</h2>
              <p>{data.bio || "A little introduction goes a long way."}</p>
            </div>
          </div>
          <div className="preview-tag-list">
            {data.tags.slice(0, 5).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          <div
            className="studio-greeting-preview"
            style={appearanceStyle(appearance)}
          >
            <span className="eyebrow">THE FIRST HELLO</span>
            <p>
              <FormattedMessage
                text={
                  data.greeting
                    .replaceAll("{{char}}", data.name || "Your character")
                    .replaceAll("{{user}}", persona?.name || "you") ||
                  '*A new story waits to be written.*\n\n"What shall we make of it?"'
                }
                showMarkers={appearance.showMarkers}
              />
            </p>
          </div>
          <p className="preview-help">
            Your card introduces them. Their definition gives them depth.
          </p>
        </aside>
      </div>
    </div>
  );
}
function ShieldNote() {
  return <Check size={13} />;
}
