import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Home,
  Library,
  Plus,
  MessagesSquare,
  UserRound,
  Search,
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  X,
  Heart,
  MessageCircle,
  Sparkles,
  SlidersHorizontal,
  MoreHorizontal,
  Bookmark,
  Bell,
  Check,
  Copy,
  RefreshCw,
  Feather,
  Trash2,
  Pencil,
  Leaf,
  WandSparkles,
  ImagePlus,
} from "lucide-react";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-600.css";
import "@fontsource/dm-sans/latin-700.css";
import "@fontsource/manrope/latin-500.css";
import "@fontsource/manrope/latin-600.css";
import "@fontsource/manrope/latin-700.css";
import "@fontsource/manrope/latin-800.css";
import "./styles.css";

const initialCharacters = [
  {
    id: "seraphine",
    name: "Seraphine",
    tagline: "Some paths are meant to cross.",
    description:
      "Beyond the familiar trails, an elven guardian waits among ancient trees. Seraphine has spent centuries protecting the forest, but she has never met anyone quite like you.",
    tags: ["Fantasy", "Adventure", "Slow burn"],
    art: 0,
    chats: "24.8k",
    creator: "moonlit",
    greeting:
      "*The forest grows quiet as a silver-haired elf steps into the clearing. A tiny light dances above her open palm.*\n\n“You’re a long way from the path, traveler.” Her eyes soften. “Lost… or looking for something?”",
    color: "#70d7b5",
  },
  {
    id: "kael",
    name: "Kael",
    tagline: "The city has secrets. So does he.",
    description:
      "A chance encounter on a rain-soaked rooftop brings you face to face with the city’s most elusive night wanderer. Under his quiet exterior is a story waiting to be told.",
    tags: ["Mystery", "Slow burn", "Adventure"],
    art: 1,
    chats: "18.2k",
    creator: "nightowl",
    greeting:
      "*Neon reflections ripple across the rooftop. He turns at the sound of your footsteps, one eyebrow lifting.*\n\n“Not many people come up here.” He moves aside, leaving room beside him. “Long night?”",
    color: "#91a9e9",
  },
  {
    id: "mila",
    name: "Mila",
    tagline: "Your usual? Or a little adventure?",
    description:
      "A cozy corner café, a rainy afternoon, and a barista who remembers your name. Mila makes ordinary moments feel a little more magical.",
    tags: ["Comfort", "Slice of life", "Friendship"],
    art: 2,
    chats: "15.6k",
    creator: "peachy",
    greeting:
      "*The little bell above the café door chimes. Mila looks up, her smile brighter than the fairy lights behind her.*\n\n“There you are! I was just trying out a new recipe. Want to be my very honest taste tester?”",
    color: "#e6a3b2",
  },
  {
    id: "rowan",
    name: "Captain Rowan",
    tagline: "A little trouble on the open sea.",
    description:
      "The map is stolen, the compass is broken, and your captain has a grin that means trouble. Climb aboard for a voyage into the unknown.",
    tags: ["Adventure", "Fantasy", "Friendship"],
    art: 3,
    chats: "12.4k",
    creator: "wildheart",
    greeting:
      "*A weathered map lands on the table in front of you. The captain leans over it with a conspiratorial grin.*\n\n“I have a ship, half a plan, and absolutely no intention of turning back. Are you in?”",
    color: "#daa36d",
  },
  {
    id: "ren",
    name: "Ren",
    tagline: "Even the moon needs company.",
    description:
      "High above the clouds, a quiet swordsman keeps watch over an abandoned shrine. Perhaps tonight, the silence is ready to be broken.",
    tags: ["Fantasy", "Comfort", "Slow burn"],
    art: 4,
    chats: "10.9k",
    creator: "moonlit",
    greeting:
      "*Moonlight catches the edge of his robe as he places a second cup of tea beside him.*\n\n“The mountain is cold tonight. Sit for a while. There is no hurry here.”",
    color: "#a7b2df",
  },
  {
    id: "ivy",
    name: "Ivy",
    tagline: "Let’s grow something good.",
    description:
      "A greenhouse full of curious plants and an even more curious botanist. With Ivy, every conversation is a new thing waiting to bloom.",
    tags: ["Comfort", "Slice of life", "Friendship"],
    art: 5,
    chats: "8.7k",
    creator: "fern",
    greeting:
      "*Ivy peeks around a trailing vine, a smudge of soil on her cheek.*\n\n“Oh, hi! Perfect timing. I need someone to help me name this very dramatic fern. Any ideas?”",
    color: "#b0cda2",
  },
];
const categories = [
  "For you",
  "Fantasy",
  "Adventure",
  "Comfort",
  "Slow burn",
  "Slice of life",
  "Friendship",
];
function useSaved(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(
    () => localStorage.setItem(key, JSON.stringify(value)),
    [key, value],
  );
  return [value, setValue];
}
function Art({ character, className = "", ...props }) {
  return (
    <div
      role="img"
      aria-label={`${character.name} character illustration`}
      className={`art art-${character.art ?? 0} ${className}`}
      {...props}
    />
  );
}
function Brand() {
  return (
    <span className="brand">
      <span className="brand-mark">
        <Sparkles size={21} strokeWidth={1.8} />
      </span>
      chatter<span className="brand-dot">.</span>
    </span>
  );
}
function Modal({ children, onClose, className = "", label }) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    const listener = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = ref.current?.querySelectorAll(
          'button,input,textarea,select,[tabindex="0"]',
        );
        if (!items?.length) return;
        const first = items[0],
          last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", listener);
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", listener);
      document.body.style.overflow = old;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={`modal ${className}`}
      >
        <button
          className="icon-button modal-close"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>
        {children}
      </section>
    </div>
  );
}
function App() {
  const [page, setPage] = useState("Home"),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("For you"),
    [detail, setDetail] = useState(null),
    [create, setCreate] = useState(false),
    [activeChat, setActiveChat] = useState(null),
    [settings, setSettings] = useState(false),
    [toast, setToast] = useState(""),
    [notifications, setNotifications] = useState(false),
    [profileEdit, setProfileEdit] = useState(false),
    [libraryTab, setLibraryTab] = useState("All characters");
  const [custom, setCustom] = useSaved("chatter-characters", []),
    [favorites, setFavorites] = useSaved("chatter-favorites", [
      "seraphine",
      "mila",
    ]),
    [profile, setProfile] = useSaved("chatter-profile", {
      name: "Alex",
      bio: "Collecting little moments & new worlds.",
    }),
    [sessions, setSessions] = useSaved("chatter-sessions", {}),
    [preferences, setPreferences] = useSaved("chatter-preferences", {
      temperature: 0.8,
      style: "Balanced",
      prompt: "Stay in character. Write expressive, thoughtful responses.",
      memory: true,
    });
  const characters = [...initialCharacters, ...custom];
  const recentIds = Object.keys(sessions).sort(
    (a, b) => (sessions[b].updated ?? 0) - (sessions[a].updated ?? 0),
  );
  const recent = (recentIds.length ? recentIds : ["seraphine", "kael", "mila"])
    .map((id) => characters.find((c) => c.id === id))
    .filter(Boolean);
  const current = characters.find((c) => c.id === activeChat);
  const alert = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3200);
  };
  const navigate = (p) => {
    setPage(p);
    setActiveChat(null);
    setQuery("");
    setCategory("For you");
  };
  const toggleFavorite = (id) =>
    setFavorites((f) =>
      f.includes(id) ? f.filter((x) => x !== id) : [...f, id],
    );
  const startChat = (c) => {
    if (!sessions[c.id])
      setSessions((s) => ({
        ...s,
        [c.id]: {
          messages: [{ role: "assistant", text: c.greeting }],
          updated: Date.now(),
        },
      }));
    setActiveChat(c.id);
    setPage("Chats");
    setDetail(null);
    setSettings(false);
  };
  const saveCharacter = (data) => {
    const c = {
      ...data,
      id: `custom-${Date.now()}`,
      creator: profile.name.toLowerCase(),
      chats: "0",
      tags: [data.genre, "Original"],
      description: data.description,
      tagline: data.tagline || "A new story is waiting.",
      color: "#8cdfbf",
    };
    setCustom((prev) => [...prev, c]);
    setCreate(false);
    setDetail(c);
    alert("Your character is ready to meet the world.");
  };
  const filtered = characters.filter(
    (c) =>
      (category === "For you" || c.tags.includes(category)) &&
      `${c.name} ${c.tagline} ${c.tags.join(" ")}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (page !== "Library" ||
        libraryTab !== "Saved" ||
        favorites.includes(c.id)),
  );
  return (
    <div className={`app ${current ? "in-chat" : ""}`}>
      <aside className="sidebar">
        <button
          className="brand-button"
          onClick={() => navigate("Home")}
          aria-label="Chatter home"
        >
          <Brand />
        </button>
        <div className="workspace-label">YOUR LITTLE UNIVERSE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {[
            [Home, "Home"],
            [Library, "Library"],
            [Plus, "Create"],
            [MessagesSquare, "Chats"],
            [UserRound, "Profile"],
          ].map(([Icon, label]) => (
            <button
              key={label}
              className={`nav-item ${page === label ? "active" : ""} ${label === "Create" ? "create-nav" : ""}`}
              onClick={() =>
                label === "Create" ? setCreate(true) : navigate(label)
              }
            >
              <span className="nav-icon">
                <Icon size={21} />
              </span>
              <span>
                {label === "Chats"
                  ? "Chats"
                  : label === "Create"
                    ? "Create character"
                    : label}
              </span>
              {page === label && <span className="nav-indicator" />}
              {label === "Chats" && (
                <span className="nav-count">{recentIds.length || 3}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-recent">
          <div className="section-eyebrow">
            PICK UP THE STORY <span>↗</span>
          </div>
          {recent.slice(0, 3).map((c) => (
            <button
              key={c.id}
              className={`mini-chat ${activeChat === c.id ? "selected" : ""}`}
              onClick={() => startChat(c)}
            >
              <Art character={c} className="avatar" />
              <span>
                <strong>{c.name}</strong>
                <small>
                  {c.id === "seraphine"
                    ? "The enchanted forest"
                    : c.tags[0] + " & a little magic"}
                </small>
              </span>
              <span className="tiny-online" />
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="inspiration">
            <span className="small-spark">
              <Sparkles size={18} />
            </span>
            <p>
              A character in your mind?
              <br />
              <strong>Bring them to life.</strong>
            </p>
            <button
              onClick={() => setCreate(true)}
              aria-label="Create your character"
            >
              <ArrowUpRight size={19} />
            </button>
          </div>
          <button className="account" onClick={() => navigate("Profile")}>
            <div className="user-avatar">
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
            <span>
              <strong>{profile.name}</strong>
              <small>Your own kind of universe</small>
            </span>
            <MoreHorizontal size={19} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-location">
            <span className="desktop-location">
              {current
                ? "Your conversations"
                : page === "Home"
                  ? "Discover"
                  : page}
            </span>
            <span className="mobile-brand">
              <Brand />
            </span>
            <span className="topbar-slash">/</span>
            <span className="topbar-subtitle">
              {current
                ? current.name
                : page === "Home"
                  ? "A world of possibilities"
                  : "Make yourself at home"}
            </span>
          </div>
          <div className="topbar-actions">
            <span className="prototype-badge">
              <span /> DESIGN PREVIEW
            </span>
            <div className="notifications-wrap">
              <button
                className={`icon-button notification-button ${notifications ? "pressed" : ""}`}
                aria-label="Notifications"
                onClick={() => setNotifications(!notifications)}
              >
                <Bell size={19} />
                <i />
              </button>
              {notifications && (
                <div className="notification-popover">
                  <strong>
                    You’re all caught up <Sparkles size={16} />
                  </strong>
                  <p>
                    Your next story is waiting. Explore a character or create
                    one of your own.
                  </p>
                </div>
              )}
            </div>
            <button
              className="user-avatar small"
              aria-label="Open profile"
              onClick={() => navigate("Profile")}
            >
              {profile.name.slice(0, 1).toUpperCase()}
            </button>
          </div>
        </header>
        {current ? (
          <div className="chat-layout">
            <section className="conversation">
              <header className="conversation-header">
                <button
                  className="icon-button mobile-back"
                  aria-label="Back to chats"
                  onClick={() => setActiveChat(null)}
                >
                  <ChevronLeft />
                </button>
                <button
                  className="conversation-person"
                  onClick={() => setDetail(current)}
                >
                  <Art character={current} className="avatar" />
                  <span>
                    <strong>{current.name}</strong>
                    <small>
                      <i /> Here for your next chapter
                    </small>
                  </span>
                </button>
                <div className="conversation-actions">
                  <button
                    className="icon-button"
                    title="Character details"
                    onClick={() => setDetail(current)}
                  >
                    <UserRound size={20} />
                  </button>
                  <button
                    className={`icon-button ${settings ? "pressed" : ""}`}
                    title="Chat settings"
                    onClick={() => setSettings(!settings)}
                  >
                    <SlidersHorizontal size={20} />
                  </button>
                </div>
              </header>
              <Chat
                character={current}
                session={sessions[current.id]}
                setSessions={setSessions}
                profile={profile}
                alert={alert}
              />
            </section>
            {settings && (
              <aside className="chat-settings">
                <div className="settings-heading">
                  <h3>Make it your story</h3>
                  <button
                    className="icon-button"
                    onClick={() => setSettings(false)}
                    aria-label="Close settings"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="muted">
                  A few little details. A different kind of conversation.
                </p>
                <label className="settings-label">Response style</label>
                <div className="style-options">
                  {["Creative", "Balanced", "Precise"].map((style) => (
                    <button
                      className={preferences.style === style ? "selected" : ""}
                      key={style}
                      onClick={() => setPreferences((p) => ({ ...p, style }))}
                    >
                      {style}
                    </button>
                  ))}
                </div>
                <label className="settings-label" htmlFor="temperature">
                  Creativity <span>{preferences.temperature}</span>
                </label>
                <input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={preferences.temperature}
                  onChange={(e) =>
                    setPreferences((p) => ({
                      ...p,
                      temperature: Number(e.target.value),
                    }))
                  }
                />
                <small className="muted">
                  From familiar paths to unexpected turns.
                </small>
                <label className="settings-label" htmlFor="prompt">
                  Character instructions
                </label>
                <textarea
                  id="prompt"
                  value={preferences.prompt}
                  onChange={(e) =>
                    setPreferences((p) => ({ ...p, prompt: e.target.value }))
                  }
                />
                <label className="toggle-row">
                  <span>
                    Remember the story<small>Keep context between visits</small>
                  </span>
                  <input
                    type="checkbox"
                    checked={preferences.memory}
                    onChange={(e) =>
                      setPreferences((p) => ({
                        ...p,
                        memory: e.target.checked,
                      }))
                    }
                  />
                </label>
                <div className="settings-note">
                  <Sparkles size={18} />
                  <p>
                    These settings are saved for your design preview. Live AI
                    comes in the next chapter.
                  </p>
                </div>
                <button
                  className="text-button danger"
                  onClick={() => {
                    setSessions((s) => ({
                      ...s,
                      [current.id]: {
                        messages: [
                          { role: "assistant", text: current.greeting },
                        ],
                        updated: Date.now(),
                      },
                    }));
                    alert("A fresh chapter. Conversation reset.");
                  }}
                >
                  <RefreshCw size={15} /> Start a fresh conversation
                </button>
              </aside>
            )}
          </div>
        ) : (
          <main className="content">
            {page === "Home" && (
              <>
                <div className="welcome-row">
                  <div>
                    <div className="eyebrow">
                      <span className="greeting-line" /> A SPACE FOR YOUR
                      IMAGINATION
                    </div>
                    <h1>
                      A little escape.
                      <br className="mobile-only" /> A whole new connection
                      <span>.</span>
                    </h1>
                    <p className="page-description">
                      Meet someone unexpected. Go somewhere unforgettable.
                    </p>
                  </div>
                  <div className="date-decoration">
                    <Sparkles size={18} />
                    <span>
                      Endless stories.
                      <br />
                      <strong>Yours to begin.</strong>
                    </span>
                  </div>
                </div>
                <section className="hero">
                  <Art character={initialCharacters[0]} className="hero-art" />
                  <div className="hero-grain" />
                  <div className="hero-content">
                    <span className="hero-badge">
                      <span /> CHARACTER SPOTLIGHT
                    </span>
                    <div className="hero-title">
                      Every great story
                      <br />
                      starts with a <em>hello.</em>
                    </div>
                    <p>
                      Deep in an enchanted forest, a chance encounter
                      <br className="desktop-only" /> could become your favorite
                      story.
                    </p>
                    <div className="hero-person">
                      <span className="hero-dash" />
                      <strong>Seraphine</strong>
                      <span>The forest guardian</span>
                    </div>
                    <div className="hero-buttons">
                      <button
                        className="button primary"
                        onClick={() => startChat(initialCharacters[0])}
                      >
                        Step into the story <ArrowUpRight size={19} />
                      </button>
                      <button
                        className="hero-details"
                        onClick={() => setDetail(initialCharacters[0])}
                      >
                        Meet Seraphine <ArrowRight size={17} />
                      </button>
                    </div>
                  </div>
                  <div className="hero-caption">
                    <span>
                      01 <i>/ 06</i>
                    </span>
                    <div className="hero-progress">
                      <b />
                      <i />
                      <i />
                    </div>
                    <span>
                      <Leaf size={13} /> A little magic awaits
                    </span>
                  </div>
                  <span className="hero-orbit orbit-one" />
                  <span className="hero-orbit orbit-two" />
                </section>
                <section className="continue-section">
                  <div className="section-heading">
                    <h2>
                      Right where you left off <span className="heading-dot" />
                    </h2>
                    <button
                      className="text-button"
                      onClick={() => navigate("Chats")}
                    >
                      All chats <ArrowUpRight size={16} />
                    </button>
                  </div>
                  <div className="continue-grid">
                    {recent.slice(0, 3).map((c, i) => (
                      <button
                        className="continue-card"
                        key={c.id}
                        onClick={() => startChat(c)}
                      >
                        <Art character={c} className="continue-avatar" />
                        <div>
                          <div>
                            <strong>{c.name}</strong>
                            <span>
                              {i === 0
                                ? "Just now"
                                : i === 1
                                  ? "2h ago"
                                  : "Yesterday"}
                            </span>
                          </div>
                          <p>
                            {sessions[c.id]?.messages
                              .at(-1)
                              ?.text.replace(/\*/g, "")
                              .slice(0, 52) ||
                              [
                                "“Lost… or looking for something?”",
                                "“Long night?”",
                                "“Your usual? I saved you a seat.”",
                              ][i]}
                          </p>
                        </div>
                        <ArrowUpRight size={18} className="continue-arrow" />
                      </button>
                    ))}
                  </div>
                </section>
              </>
            )}
            {(page === "Home" || page === "Library") && (
              <section className="discovery">
                <div className="section-heading discovery-heading">
                  <div>
                    <span className="eyebrow">
                      {page === "Library" ? "YOUR COLLECTION" : "A HELLO AWAY"}
                    </span>
                    <h2>
                      {page === "Library"
                        ? "A world of characters"
                        : "Find your next connection"}
                    </h2>
                    {page === "Library" && (
                      <p className="page-description">
                        Familiar faces, new favorites, and stories yet to be
                        told.
                      </p>
                    )}
                  </div>
                  <label className="search">
                    <Search size={17} />
                    <input
                      placeholder="Find a character, a world, a vibe…"
                      aria-label="Search characters"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                      >
                        <X size={15} />
                      </button>
                    )}
                    <kbd>/</kbd>
                  </label>
                </div>
                {page === "Library" && (
                  <div className="library-tabs">
                    {["All characters", "Saved"].map((tab) => (
                      <button
                        className={libraryTab === tab ? "active" : ""}
                        key={tab}
                        onClick={() => setLibraryTab(tab)}
                      >
                        {tab === "Saved" && <Bookmark size={15} />} {tab}{" "}
                        {tab === "Saved" && <span>{favorites.length}</span>}
                      </button>
                    ))}
                  </div>
                )}
                <div className="filter-bar">
                  <div className="category-list">
                    {categories.map((cat, i) => (
                      <button
                        key={cat}
                        className={`category-chip ${category === cat ? "selected" : ""}`}
                        onClick={() => setCategory(cat)}
                      >
                        {i === 0 && <Sparkles size={14} />} {cat}
                      </button>
                    ))}
                  </div>
                  <span className="results-label">
                    {filtered.length} characters
                  </span>
                </div>
                <div className="character-grid">
                  {filtered.map((c) => (
                    <article className="character-card" key={c.id}>
                      <button
                        className="card-main"
                        onClick={() => setDetail(c)}
                        aria-label={`View ${c.name}`}
                      >
                        <div className="card-image">
                          <Art character={c} />
                          <div className="card-image-shade" />
                          <span className="card-genre">{c.tags[0]}</span>
                          <span className="card-chat-count">
                            <MessageCircle size={12} />
                            {c.chats}
                          </span>
                          <div className="card-character-title">
                            <h3>{c.name}</h3>
                            <span>by @{c.creator}</span>
                          </div>
                        </div>
                        <div className="card-content">
                          <p>{c.tagline}</p>
                          <div className="card-tags">
                            {c.tags.slice(1, 3).map((tag) => (
                              <span key={tag}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </button>
                      <button
                        className={`favorite-button ${favorites.includes(c.id) ? "saved" : ""}`}
                        aria-label={`${favorites.includes(c.id) ? "Unsave" : "Save"} ${c.name}`}
                        onClick={() => toggleFavorite(c.id)}
                      >
                        <Heart
                          size={16}
                          fill={
                            favorites.includes(c.id) ? "currentColor" : "none"
                          }
                        />
                      </button>
                      <button
                        className="card-chat"
                        onClick={() => startChat(c)}
                        aria-label={`Chat with ${c.name}`}
                      >
                        <ArrowUpRight size={18} />
                      </button>
                    </article>
                  ))}
                </div>
                {filtered.length === 0 && (
                  <div className="empty-state">
                    <Search size={30} />
                    <h3>No characters found</h3>
                    <p>Try another name or a different mood.</p>
                    <button
                      className="button secondary"
                      onClick={() => {
                        setQuery("");
                        setCategory("For you");
                        setLibraryTab("All characters");
                      }}
                    >
                      Explore all characters
                    </button>
                  </div>
                )}
                <div className="discovery-footer">
                  <span>
                    A thousand possible stories. One that feels like yours.
                  </span>
                  <Sparkles size={16} />
                </div>
              </section>
            )}
            {page === "Chats" && (
              <>
                <div className="page-heading">
                  <span className="eyebrow">A FEW UNFINISHED CHAPTERS</span>
                  <h1>
                    Your conversations<span>.</span>
                  </h1>
                  <p className="page-description">
                    Pick up a familiar story, or start a whole new one.
                  </p>
                </div>
                <label className="search wide">
                  <Search size={18} />
                  <input
                    aria-label="Search conversations"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Find a conversation…"
                  />
                </label>
                <div className="history-list">
                  {recent
                    .filter((c) =>
                      c.name.toLowerCase().includes(query.toLowerCase()),
                    )
                    .map((c, i) => (
                      <div className="history-card" key={c.id}>
                        <button onClick={() => startChat(c)}>
                          <Art character={c} className="history-avatar" />
                          <div>
                            <div className="history-title">
                              <h3>{c.name}</h3>
                              <small>
                                {sessions[c.id]
                                  ? "Saved conversation"
                                  : "Start a conversation"}
                              </small>
                            </div>
                            <p>
                              {sessions[c.id]?.messages
                                .at(-1)
                                ?.text.replace(/\*/g, "")
                                .slice(0, 110) || c.tagline}
                            </p>
                            <span className="history-tag">{c.tags[0]}</span>
                          </div>
                          <ArrowUpRight size={22} />
                        </button>
                        {sessions[c.id] && (
                          <button
                            className="delete-chat icon-button"
                            aria-label={`Delete conversation with ${c.name}`}
                            onClick={() => {
                              setSessions((s) => {
                                const next = { ...s };
                                delete next[c.id];
                                return next;
                              });
                              alert("Conversation removed");
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                </div>
                {recent.filter((c) =>
                  c.name.toLowerCase().includes(query.toLowerCase()),
                ).length === 0 && (
                  <div className="empty-state">
                    <MessagesSquare size={32} />
                    <h3>No conversations found</h3>
                    <p>Try searching for another character.</p>
                  </div>
                )}
                <div className="chat-disclaimer">
                  <Feather size={18} />
                  <span>
                    Your stories stay in this browser. This prototype uses demo
                    replies.
                  </span>
                </div>
              </>
            )}
            {page === "Profile" && (
              <>
                <section className="profile-cover">
                  <div className="profile-orbits" />
                  <span className="eyebrow">YOUR CORNER OF THE UNIVERSE</span>
                  <Sparkles size={45} />
                </section>
                <div className="profile-info">
                  <div className="profile-avatar">
                    {profile.name.slice(0, 1).toUpperCase()}
                  </div>
                  <button
                    className="button secondary"
                    onClick={() => setProfileEdit(true)}
                  >
                    <Pencil size={15} /> Edit profile
                  </button>
                  <h1>
                    {profile.name}
                    <span>.</span>
                  </h1>
                  <p>{profile.bio}</p>
                  <div className="profile-stats">
                    <span>
                      <strong>{custom.length}</strong> Characters
                    </span>
                    <span>
                      <strong>{recentIds.length}</strong> Conversations
                    </span>
                    <span>
                      <strong>{favorites.length}</strong> Saved
                    </span>
                  </div>
                </div>
                <div className="section-heading">
                  <h2>
                    Made by you <span className="heading-dot" />
                  </h2>
                  <button
                    className="text-button"
                    onClick={() => setCreate(true)}
                  >
                    <Plus size={16} /> Create character
                  </button>
                </div>
                {custom.length ? (
                  <div className="character-grid">
                    {custom.map((c) => (
                      <article className="character-card" key={c.id}>
                        <button
                          className="card-main"
                          onClick={() => setDetail(c)}
                        >
                          <div className="card-image">
                            <Art character={c} />
                            <div className="card-image-shade" />
                            <div className="card-character-title">
                              <h3>{c.name}</h3>
                              <span>by you</span>
                            </div>
                          </div>
                          <div className="card-content">
                            <p>{c.tagline}</p>
                          </div>
                        </button>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="create-empty">
                    <div className="create-empty-art">
                      <WandSparkles size={32} />
                      <span />
                      <i />
                    </div>
                    <h2>Someone only you could imagine.</h2>
                    <p>
                      A name, a little personality, a spark of an idea.
                      <br />
                      That’s all it takes to start a new story.
                    </p>
                    <button
                      className="button primary"
                      onClick={() => setCreate(true)}
                    >
                      <Plus size={17} /> Create your first character
                    </button>
                  </div>
                )}
              </>
            )}
            <footer className="page-footer">
              <Brand />
              <span>Little conversations. Limitless possibilities.</span>
              <span>
                Made for your imagination <Sparkles size={12} />
              </span>
            </footer>
          </main>
        )}
      </div>
      <nav className="bottom-nav" aria-label="Mobile navigation">
        {[
          [Home, "Home"],
          [Library, "Library"],
          [Plus, "Create"],
          [MessagesSquare, "Chats"],
          [UserRound, "Profile"],
        ].map(([Icon, label]) => (
          <button
            className={`${page === label ? "active" : ""} ${label === "Create" ? "mobile-create" : ""}`}
            key={label}
            onClick={() =>
              label === "Create" ? setCreate(true) : navigate(label)
            }
          >
            <span>
              <Icon size={21} />
            </span>
            <small>{label}</small>
          </button>
        ))}
      </nav>
      {detail && (
        <Modal
          label={`${detail.name} character details`}
          onClose={() => setDetail(null)}
          className="character-modal"
        >
          <div className="detail-visual">
            <Art character={detail} />
            <div className="detail-gradient" />
            <span className="detail-label">
              <Sparkles size={13} /> YOUR NEXT STORY
            </span>
            <div>
              <h2>{detail.name}</h2>
              <p>{detail.tagline}</p>
            </div>
          </div>
          <div className="detail-body">
            <div className="detail-meta">
              <span>
                Created by <strong>@{detail.creator}</strong>
              </span>
              <span>
                <MessageCircle size={14} />
                {detail.chats} conversations
              </span>
            </div>
            <div className="detail-tags">
              {detail.tags.map((t) => (
                <span key={t}>{t}</span>
              ))}
            </div>
            <p className="detail-description">{detail.description}</p>
            <div className="greeting-preview">
              <span className="eyebrow">THE FIRST HELLO</span>
              <p>{detail.greeting.replace(/\*/g, "")}</p>
            </div>
            <div className="detail-actions">
              <button
                className="button primary"
                onClick={() => startChat(detail)}
              >
                Start chatting <ArrowUpRight size={19} />
              </button>
              <button
                className={`button secondary ${favorites.includes(detail.id) ? "is-saved" : ""}`}
                onClick={() => toggleFavorite(detail.id)}
              >
                <Heart
                  size={17}
                  fill={favorites.includes(detail.id) ? "currentColor" : "none"}
                />
                {favorites.includes(detail.id) ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </Modal>
      )}
      {create && (
        <CreateModal onClose={() => setCreate(false)} onSave={saveCharacter} />
      )}
      {profileEdit && (
        <Modal
          label="Edit profile"
          onClose={() => setProfileEdit(false)}
          className="form-modal"
        >
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h2>A little about you.</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const data = new FormData(e.currentTarget);
              setProfile({
                name: data.get("name").trim(),
                bio: data.get("bio").trim(),
              });
              setProfileEdit(false);
              alert("Profile updated");
            }}
          >
            <label>
              Display name
              <input
                name="name"
                required
                maxLength={30}
                defaultValue={profile.name}
              />
            </label>
            <label>
              Your bio
              <textarea name="bio" maxLength={180} defaultValue={profile.bio} />
            </label>
            <button className="button primary" type="submit">
              Save changes <Check size={17} />
            </button>
          </form>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
    </div>
  );
}
function CreateModal({ onClose, onSave }) {
  const [art, setArt] = useState(0),
    [step, setStep] = useState(1),
    [data, setData] = useState({
      name: "",
      tagline: "",
      description: "",
      genre: "Fantasy",
      greeting: "",
    });
  const update = (e) =>
    setData((d) => ({ ...d, [e.target.name]: e.target.value }));
  return (
    <Modal
      label="Create a character"
      onClose={onClose}
      className="form-modal create-modal"
    >
      <span className="eyebrow">
        <WandSparkles size={14} /> FROM YOUR IMAGINATION
      </span>
      <h2>
        Give a story a soul<span>.</span>
      </h2>
      <p className="muted">
        Every unforgettable character starts with a little spark.
      </p>
      <div className="form-steps">
        <span className={step === 1 ? "active" : ""}>
          01 <b>The character</b>
        </span>
        <i />
        <span className={step === 2 ? "active" : ""}>
          02 <b>The first hello</b>
        </span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 1) {
            if (!data.name.trim()) return;
            setStep(2);
          } else
            onSave({
              ...data,
              art,
              greeting:
                data.greeting ||
                `“Hello! I'm ${data.name}. I have a feeling this is the start of something interesting.”`,
            });
        }}
      >
        {step === 1 ? (
          <>
            <label>
              Choose their look <small>Prototype portraits</small>
            </label>
            <div className="avatar-picker">
              {initialCharacters.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  className={art === c.art ? "selected" : ""}
                  onClick={() => setArt(c.art)}
                  aria-label={`Select ${c.name} portrait`}
                >
                  <Art character={c} />
                  {art === c.art && (
                    <span>
                      <Check size={13} />
                    </span>
                  )}
                </button>
              ))}
            </div>
            <label>
              Character name <span>*</span>
              <input
                autoComplete="off"
                name="name"
                required
                maxLength={40}
                placeholder="What should we call them?"
                value={data.name}
                onChange={update}
              />
            </label>
            <label>
              A little introduction
              <input
                name="tagline"
                maxLength={90}
                placeholder="A line that makes someone curious…"
                value={data.tagline}
                onChange={update}
              />
            </label>
            <label>
              Their world
              <select name="genre" value={data.genre} onChange={update}>
                {categories.slice(1).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <button className="button primary" type="submit">
              A little more personality <ArrowRight size={17} />
            </button>
          </>
        ) : (
          <>
            <label>
              Personality & backstory <span>*</span>
              <textarea
                required
                name="description"
                maxLength={1800}
                rows={4}
                value={data.description}
                onChange={update}
                placeholder="Who are they? What makes them tick? What world do they live in?"
              />
            </label>
            <label>
              Their first message <span>*</span>
              <textarea
                required
                name="greeting"
                maxLength={2000}
                rows={4}
                value={data.greeting}
                onChange={update}
                placeholder="Set the scene. What do they say when someone says hello?"
              />
            </label>
            <div className="form-note">
              <Feather size={15} /> Saved privately in this browser for the
              prototype.
            </div>
            <div className="form-actions">
              <button
                className="button secondary"
                type="button"
                onClick={() => setStep(1)}
              >
                <ChevronLeft size={17} /> Back
              </button>
              <button className="button primary" type="submit">
                Bring them to life <Sparkles size={17} />
              </button>
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}
function Chat({ character, session, setSessions, profile, alert }) {
  const [text, setText] = useState(""),
    [typing, setTyping] = useState(false),
    [attachment, setAttachment] = useState(null);
  const end = useRef(null),
    timer = useRef(null),
    fileRef = useRef(null);
  const messages = session?.messages || [
    { role: "assistant", text: character.greeting },
  ];
  useEffect(() => {
    setText("");
    setAttachment(null);
    setTyping(false);
    return () => clearTimeout(timer.current);
  }, [character.id]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing]);
  const update = (fn) =>
    setSessions((s) => ({
      ...s,
      [character.id]: {
        ...s[character.id],
        messages: fn(s[character.id]?.messages || messages),
        updated: Date.now(),
      },
    }));
  const reply = (message) => {
    if (/hello|hi\b|hey/i.test(message))
      return `*${character.name} turns toward you, a small smile forming.*\n\n“Hello, ${profile.name}. I’m glad you’re here. Tell me… what kind of story shall we make today?”`;
    if (/name/i.test(message))
      return `“${character.name},” *they say, with a curious smile.* “And you? I’d like to remember the name of someone who finds their way here.”`;
    if (/where|forest|world/i.test(message))
      return "*A gentle breeze moves through the space between you.*\n\n“This place has a way of bringing people exactly where they need to be.” A thoughtful pause. “What do you think brought you here?”";
    return `*${character.name} listens, giving your words a moment to settle.*\n\n“${message.length < 70 ? message.replace(/[.!?]$/, "") + "…" : "There’s a story behind that, isn’t there?"}” A warm smile. “Tell me a little more. We have all the time in the world.”`;
  };
  const send = (e) => {
    e.preventDefault();
    if ((!text.trim() && !attachment) || typing) return;
    const message = text.trim() || "Look at this image.";
    update((m) => [...m, { role: "user", text: message, image: attachment }]);
    setText("");
    setAttachment(null);
    setTyping(true);
    timer.current = setTimeout(() => {
      update((m) => [...m, { role: "assistant", text: reply(message) }]);
      setTyping(false);
    }, 1000);
  };
  const regenerate = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    update((m) => [
      ...m.slice(0, -1),
      {
        role: "assistant",
        text: `*${character.name} tilts their head, thinking for a moment.*\n\n“There’s more than one way this story could go. What if we take the unexpected path?”`,
      },
    ]);
    alert("A different turn in the story.");
  };
  return (
    <>
      <div className="message-scroll">
        <div className="chat-intro">
          <Art character={character} className="intro-avatar" />
          <span className="eyebrow">A NEW CHAPTER WITH</span>
          <h2>{character.name}</h2>
          <p>{character.tagline}</p>
          <div className="intro-tags">
            {character.tags.slice(0, 2).map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>
        <div className="conversation-date">
          <span />
          Today
          <span />
        </div>
        <div className="messages">
          {messages.map((m, i) => (
            <div className={`message ${m.role}`} key={i}>
              {m.role === "assistant" ? (
                <Art character={character} className="message-avatar" />
              ) : (
                <div className="user-avatar message-avatar">
                  {profile.name.slice(0, 1)}
                </div>
              )}
              <div className="message-content">
                <div className="message-name">
                  {m.role === "assistant" ? character.name : profile.name}
                  <small>{m.role === "assistant" ? "Character" : "You"}</small>
                </div>
                <div className="message-bubble">
                  {m.image && (
                    <img
                      className="message-image"
                      src={m.image}
                      alt="Your attachment"
                    />
                  )}
                  {m.text
                    .split(/(\*[^*]+\*)/g)
                    .map((part, j) =>
                      part.startsWith("*") ? (
                        <em key={j}>{part.slice(1, -1)}</em>
                      ) : (
                        <span key={j}>{part}</span>
                      ),
                    )}
                </div>
                {m.role === "assistant" && (
                  <div className="message-tools">
                    <button
                      onClick={() => {
                        navigator.clipboard
                          ?.writeText(m.text)
                          .then(() => alert("Message copied"))
                          .catch(() => alert("Clipboard unavailable"));
                      }}
                      aria-label="Copy message"
                    >
                      <Copy size={13} />
                    </button>
                    {i === messages.length - 1 && messages.length > 1 && (
                      <button
                        aria-label="Regenerate reply"
                        onClick={regenerate}
                      >
                        <RefreshCw size={13} />
                      </button>
                    )}
                    <span>
                      {i === 0
                        ? "The story begins"
                        : `${i + 1} / ${messages.length}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className="typing-indicator">
              <Art character={character} className="message-avatar" />
              <span>
                <i />
                <i />
                <i />
              </span>
              <small>{character.name} is thinking…</small>
            </div>
          )}
          <div ref={end} />
        </div>
      </div>
      <div className="composer-container">
        {attachment && (
          <div className="attachment-preview">
            <img src={attachment} alt="Selected attachment" />
            <button
              className="icon-button"
              aria-label="Remove attachment"
              onClick={() => setAttachment(null)}
            >
              <X size={14} />
            </button>
          </div>
        )}
        <form className="composer" onSubmit={send}>
          <button
            className="icon-button"
            type="button"
            aria-label="Attach an image"
            onClick={() => fileRef.current.click()}
          >
            <ImagePlus size={20} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                if (file.size > 1500000) {
                  alert("Choose an image smaller than 1.5 MB.");
                  return;
                }
                const reader = new FileReader();
                reader.onload = () => setAttachment(reader.result);
                reader.readAsDataURL(file);
              }
              e.target.value = "";
            }}
          />
          <textarea
            rows={1}
            aria-label="Message"
            placeholder={`Say something to ${character.name}…`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(e);
              }
            }}
          />
          <button
            className="send-button"
            type="submit"
            aria-label="Send message"
            disabled={typing || (!text.trim() && !attachment)}
          >
            <ArrowUpRight size={22} />
          </button>
        </form>
        <p className="composer-note">
          <Sparkles size={11} /> A little imagination, a demo reply. Characters
          aren’t real people.
        </p>
      </div>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
