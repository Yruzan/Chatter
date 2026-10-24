import React, { useState, useEffect, useRef, useCallback } from "react";
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
  ChevronRight,
  Square,
  X,
  Heart,
  MessageCircle,
  Sparkles,
  SlidersHorizontal,
  Menu,
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
import "./studio.css";
import "./navigation.css";
import "./messages.css";
import "./themes.css";
import { applyTheme } from "./themes";
import { requestReply, messageText, copyText } from "./api";
import Sidebar from "./components/Sidebar";
import NewChatPicker from "./components/NewChatPicker";
import { getHistory, historyDay } from "./conversations";
import ChatSettings from "./components/ChatSettings";
import CharacterEditor from "./components/CharacterEditor";
import FormattedMessage from "./components/FormattedMessage";
import {
  defaultParameters,
  defaultAppearance,
  defaultApi,
  appearanceStyle,
} from "./settings";

function fillPlaceholders(text, character, user) {
  return (text || "")
    .replaceAll("{{char}}", character.name)
    .replaceAll("{{user}}", user.name);
}

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
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      window.dispatchEvent(new Event("chatter-storage-error"));
    }
  }, [key, value]);
  return [value, setValue];
}
function Art({ character, className = "", ...props }) {
  const uploaded = /^data:image\/(png|jpeg|webp);base64,/.test(
    character.portrait || "",
  );
  return (
    <div
      role="img"
      aria-label={`${character.name} character illustration`}
      className={`art art-${character.art ?? 0} ${uploaded ? "custom-art" : ""} ${className}`}
      {...props}
    >
      {uploaded && <img src={character.portrait} alt="" />}
    </div>
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
    [editor, setEditor] = useState(null),
    [apiKey, setApiKey] = useState(""),
    [activeChat, setActiveChat] = useState(null),
    [settings, setSettings] = useState(false),
    [toast, setToast] = useState(""),
    [notifications, setNotifications] = useState(false),
    [profileEdit, setProfileEdit] = useState(false),
    [libraryTab, setLibraryTab] = useState("All characters"),
    [sidebarOpen, setSidebarOpen] = useState(false),
    [newChatOpen, setNewChatOpen] = useState(false);
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
    [preferences, setPreferences] = useSaved(
      "chatter-preferences",
      defaultParameters,
    ),
    [savedAppearance, setAppearance] = useSaved(
      "chatter-appearance",
      defaultAppearance,
    ),
    [savedApi, setApi] = useSaved("chatter-api", defaultApi),
    [persona, setPersona] = useSaved("chatter-persona", {
      name: profile.name,
      description: "",
    }),
    [theme, setTheme] = useSaved("chatter-theme", "forest");
  const chatPersona = {
    name: persona.name?.trim() || profile.name,
    description: persona.description || "",
  };
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  const parameters = { ...defaultParameters, ...preferences };
  const appearance = { ...defaultAppearance, ...savedAppearance };
  const api = { ...defaultApi, ...savedApi };
  const setParameters = (update) =>
    setPreferences((prev) =>
      typeof update === "function"
        ? update({ ...defaultParameters, ...prev })
        : update,
    );
  const [models, setModels] = useState([]);
  useEffect(() => {
    setModels([]);
  }, [api.baseUrl, api.provider, api.transport, apiKey]);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);
  const characters = [...initialCharacters, ...custom];
  const history = getHistory(sessions, characters);
  const recentIds = history.map((item) => item.id);
  const recent = [
    ...new Map(
      history.map((item) => [item.character.id, item.character]),
    ).values(),
  ].slice(0, 3);
  const currentSession = sessions[activeChat];
  const current = characters.find(
    (c) => c.id === (currentSession?.characterId || activeChat),
  );
  useEffect(() => {
    if (!current) return;
    const viewport = window.visualViewport;
    const resize = () =>
      document.documentElement.style.setProperty(
        "--chat-viewport-height",
        `${viewport?.height || window.innerHeight}px`,
      );
    resize();
    viewport?.addEventListener("resize", resize);
    window.addEventListener("resize", resize);
    return () => {
      viewport?.removeEventListener("resize", resize);
      window.removeEventListener("resize", resize);
      document.documentElement.style.removeProperty("--chat-viewport-height");
    };
  }, [current?.id]);
  const alert = (message) => {
    setToast(message);
    setTimeout(() => setToast(""), 3200);
  };
  useEffect(() => {
    const listener = () =>
      alert(
        "Browser storage is full. Recent changes may not survive a refresh.",
      );
    window.addEventListener("chatter-storage-error", listener);
    return () => window.removeEventListener("chatter-storage-error", listener);
  }, []);
  const navigate = (p) => {
    setPage(p);
    setSidebarOpen(false);
    setSettings(false);
    setEditor(null);
    setActiveChat(null);
    setQuery("");
    setCategory("For you");
  };
  const toggleFavorite = (id) =>
    setFavorites((f) =>
      f.includes(id) ? f.filter((x) => x !== id) : [...f, id],
    );
  const openConversation = (id) => {
    setActiveChat(id);
    setPage("Chats");
    setEditor(null);
    setDetail(null);
    setSettings(false);
    setSidebarOpen(false);
    setNewChatOpen(false);
  };
  const startChat = (c, options = {}) => {
    const existing = options.fresh
      ? null
      : history.find((item) => item.character.id === c.id);
    const id =
      existing?.id ||
      (!sessions[c.id]
        ? c.id
        : `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`);
    if (!existing)
      setSessions((prev) => ({
        ...prev,
        [id]: {
          characterId: c.id,
          messages: (options.greeting ?? c.greeting)?.trim()
            ? [
                {
                  role: "assistant",
                  text: fillPlaceholders(
                    options.greeting ?? c.greeting,
                    c,
                    chatPersona,
                  ),
                },
              ]
            : [],
          updated: Date.now(),
        },
      }));
    openConversation(id);
  };
  const openNewChat = () => {
    if (current) {
      startChat(current, { fresh: true });
      return;
    }
    setSidebarOpen(false);
    setSettings(false);
    setDetail(null);
    setNewChatOpen(true);
  };
  const openEditor = (character = null, remix = false) => {
    setSidebarOpen(false);
    setEditor({ character, remix, returnPage: page, returnChat: activeChat });
    setDetail(null);
    setSettings(false);
    setActiveChat(null);
    setPage("Create");
    window.scrollTo({ top: 0 });
  };
  const closeEditor = () => {
    setPage(
      editor?.returnPage === "Create" ? "Home" : editor?.returnPage || "Home",
    );
    setActiveChat(editor?.returnChat || null);
    setEditor(null);
  };
  const saveCharacter = (data) => {
    const existing =
      editor?.character && !editor.remix ? editor.character : null;
    const c = {
      ...data,
      id:
        existing?.id ||
        `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      creator:
        data.creator?.trim() || existing?.creator || profile.name.toLowerCase(),
      chats: existing?.chats || "0",
      tags: data.tags.length ? data.tags : ["Original"],
      tagline: data.bio || "A new story is waiting.",
      color: existing?.color || "#8cdfbf",
    };
    const next = existing
      ? custom.map((char) => (char.id === existing.id ? c : char))
      : [...custom, c];
    try {
      localStorage.setItem("chatter-characters", JSON.stringify(next));
    } catch {
      alert(
        "Not saved: browser storage is full. Remove a few old images or conversations, then try again.",
      );
      return false;
    }
    setCustom(next);
    setEditor(null);
    setPage("Profile");
    setDetail(c);
    alert(
      existing
        ? "Character updated. Existing conversations are preserved."
        : "Your character is ready to meet the world.",
    );
    window.scrollTo({ top: 0 });
    return true;
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
    <div
      className={`app ${current ? "in-chat" : ""} ${editor ? "in-editor" : ""}`}
    >
      <Sidebar
        Brand={Brand}
        open={sidebarOpen}
        onClose={closeSidebar}
        page={page}
        history={
          current
            ? history.filter((item) => item.character.id === current.id)
            : history
        }
        currentCharacter={current}
        activeChat={activeChat}
        profile={profile}
        onNavigate={navigate}
        onCreate={() => openEditor()}
        onNewChat={openNewChat}
        onSelect={openConversation}
      />
      <div className="main-shell">
        <header className="topbar">
          <div className="topbar-location">
            <button
              className="icon-button mobile-menu-toggle"
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
              aria-controls="app-sidebar"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={21} />
            </button>
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
            <section
              className={`conversation ${appearance.bubbles ? "" : "unboxed-messages"}`}
              style={appearanceStyle(appearance)}
            >
              <header className="conversation-header">
                <button
                  className="icon-button mobile-menu-toggle"
                  aria-label="Open navigation menu"
                  aria-expanded={sidebarOpen}
                  aria-controls="app-sidebar"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu size={21} />
                </button>
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
                key={`${activeChat}-${currentSession?.revision || 0}`}
                character={current}
                session={currentSession}
                sessionId={activeChat}
                setSessions={setSessions}
                profile={chatPersona}
                alert={alert}
                appearance={appearance}
                api={api}
                apiKey={apiKey}
                parameters={parameters}
              />
            </section>
            {settings && (
              <ChatSettings
                parameters={parameters}
                setParameters={setParameters}
                appearance={appearance}
                setAppearance={setAppearance}
                api={api}
                setApi={setApi}
                apiKey={apiKey}
                setApiKey={setApiKey}
                persona={persona}
                setPersona={setPersona}
                theme={theme}
                setTheme={setTheme}
                models={models}
                setModels={setModels}
                character={current}
                onClose={() => setSettings(false)}
                onReset={() => {
                  setSessions((s) => ({
                    ...s,
                    [activeChat]: {
                      characterId: current.id,
                      revision: (s[activeChat]?.revision || 0) + 1,
                      messages: current.greeting?.trim()
                        ? [
                            {
                              role: "assistant",
                              text: fillPlaceholders(
                                current.greeting,
                                current,
                                chatPersona,
                              ),
                            },
                          ]
                        : [],
                      updated: Date.now(),
                    },
                  }));
                  alert("A fresh chapter. Conversation reset.");
                }}
              />
            )}
          </div>
        ) : (
          <main className={`content ${editor ? "editor-content" : ""}`}>
            {editor && (
              <CharacterEditor
                key={`${editor.character?.id || "new"}-${editor.remix ? "remix" : "edit"}`}
                character={editor.character}
                remix={editor.remix}
                portraits={initialCharacters}
                Art={Art}
                appearance={appearance}
                persona={chatPersona}
                onSave={saveCharacter}
                onClose={closeEditor}
              />
            )}
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
                {recent.length > 0 && (
                  <section className="continue-section">
                    <div className="section-heading">
                      <h2>
                        Right where you left off{" "}
                        <span className="heading-dot" />
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
                                {historyDay(
                                  history.find(
                                    (item) => item.character.id === c.id,
                                  )?.session.updated,
                                )}
                              </span>
                            </div>
                            <p>
                              {history
                                .find((item) => item.character.id === c.id)
                                ?.session.messages.at(-1)
                                ?.text.replace(/\*/g, "")
                                .slice(0, 52) || "Start a conversation."}
                            </p>
                          </div>
                          <ArrowUpRight size={18} className="continue-arrow" />
                        </button>
                      ))}
                    </div>
                  </section>
                )}
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
                <button
                  className="button primary chats-new-chat"
                  onClick={openNewChat}
                >
                  <Plus size={17} /> New chat
                </button>
                <div className="history-list">
                  {history
                    .filter((item) =>
                      `${item.title} ${item.character.name}`
                        .toLowerCase()
                        .includes(query.toLowerCase()),
                    )
                    .map((item) => (
                      <div className="history-card" key={item.id}>
                        <button onClick={() => openConversation(item.id)}>
                          <Art
                            character={item.character}
                            className="history-avatar"
                          />
                          <div>
                            <div className="history-title">
                              <h3>{item.character.name}</h3>
                              <small>{historyDay(item.session.updated)}</small>
                            </div>
                            <p>{item.title}</p>
                            <span className="history-tag">
                              {item.character.tags[0]}
                            </span>
                          </div>
                          <ArrowUpRight size={22} />
                        </button>
                        <button
                          className="delete-chat icon-button"
                          aria-label={`Delete conversation ${item.title} with ${item.character.name}`}
                          onClick={() => {
                            setSessions((prev) => {
                              const next = { ...prev };
                              delete next[item.id];
                              return next;
                            });
                            alert("Conversation removed");
                          }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                </div>
                {!history.length && (
                  <div className="empty-state">
                    <MessagesSquare size={32} />
                    <h3>Your first story starts here</h3>
                    <p>Choose a character and begin a conversation.</p>
                    <button className="button secondary" onClick={openNewChat}>
                      <Plus size={16} /> New chat
                    </button>
                  </div>
                )}
                {!!history.length &&
                  !history.some((item) =>
                    `${item.title} ${item.character.name}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                  ) && (
                    <div className="empty-state">
                      <Search size={28} />
                      <h3>No conversations found</h3>
                      <p>Try another name or a word from your conversation.</p>
                    </div>
                  )}
                <div className="chat-disclaimer">
                  <Feather size={18} />
                  <span>Your conversations are saved on this device.</span>
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
                  <button className="text-button" onClick={() => openEditor()}>
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
                        <button
                          className="profile-character-edit"
                          aria-label={`Edit ${c.name}`}
                          onClick={() => openEditor(c)}
                        >
                          <Pencil size={14} /> Edit character
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
                      onClick={() => openEditor()}
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
              label === "Create" ? openEditor() : navigate(label)
            }
          >
            <span>
              <Icon size={21} />
            </span>
            <small>{label}</small>
          </button>
        ))}
      </nav>
      {newChatOpen && (
        <Modal
          label="Start a new chat"
          className="new-chat-modal"
          onClose={() => setNewChatOpen(false)}
        >
          <NewChatPicker
            characters={characters}
            Art={Art}
            onChoose={(character) => startChat(character, { fresh: true })}
          />
        </Modal>
      )}
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
            <p className="detail-description">
              {detail.bio || detail.description}
            </p>
            <div className="greeting-preview">
              <span className="eyebrow">THE FIRST HELLO</span>
              <p>{detail.greeting.replace(/\*/g, "")}</p>
            </div>
            <button
              className="text-button detail-edit"
              onClick={() =>
                openEditor(detail, !custom.some((c) => c.id === detail.id))
              }
            >
              <Pencil size={14} />
              {custom.some((c) => c.id === detail.id)
                ? "Edit character"
                : "Remix character"}
            </button>
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
function Chat({
  character,
  session,
  sessionId,
  setSessions,
  profile,
  alert,
  appearance,
  api,
  apiKey,
  parameters,
}) {
  const [text, setText] = useState(""),
    [typing, setTyping] = useState(false),
    [attachment, setAttachment] = useState(null),
    [editing, setEditing] = useState(null),
    [editText, setEditText] = useState(""),
    [error, setError] = useState("");
  const end = useRef(null),
    request = useRef(null),
    mounted = useRef(true),
    fileRef = useRef(null);
  const messages = session?.messages || [
    {
      role: "assistant",
      text: fillPlaceholders(character.greeting, character, profile),
    },
  ];
  useEffect(() => {
    setText("");
    setAttachment(null);
    setTyping(false);
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
    };
  }, [character.id, sessionId]);
  useEffect(() => {
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing]);
  const update = (fn) =>
    setSessions((s) => ({
      ...s,
      [sessionId]: {
        ...s[sessionId],
        characterId: character.id,
        messages: fn(s[sessionId]?.messages || messages),
        updated: Date.now(),
      },
    }));
  const generate = async (history, target = null) => {
    if (request.current || editing !== null) return;
    const controller = new AbortController();
    request.current = controller;
    setTyping(true);
    setError("");
    try {
      const generated = await requestReply(
        api,
        apiKey,
        parameters,
        character,
        profile,
        history,
        controller.signal,
      );
      if (!mounted.current || controller.signal.aborted) return;
      update((m) =>
        target === null
          ? [...m, { role: "assistant", text: generated }]
          : m.map((item, index) => {
              if (index !== target) return item;
              const variants = [...(item.variants || [item.text]), generated];
              return {
                ...item,
                variants,
                selectedVariant: variants.length - 1,
                text: generated,
              };
            }),
      );
    } catch (err) {
      if (mounted.current)
        setError(
          err.name === "AbortError"
            ? "Generation stopped. Your messages are saved."
            : err.message,
        );
    } finally {
      if (mounted.current) setTyping(false);
      if (request.current === controller) request.current = null;
    }
  };
  const send = (e) => {
    e.preventDefault();
    if ((!text.trim() && !attachment) || request.current || editing !== null)
      return;
    const message = {
      role: "user",
      text: text.trim() || "Look at this image.",
      image: attachment,
    };
    const history = [...messages, message];
    update(() => history);
    setText("");
    setAttachment(null);
    generate(history);
  };
  const regenerate = () => {
    if (
      messages.at(-1)?.role !== "assistant" ||
      !messages.some((m) => m.role === "user")
    )
      return;
    generate(messages.slice(0, -1), messages.length - 1);
  };
  const pickVariant = (index, selectedVariant) =>
    update((m) =>
      m.map((item, i) =>
        i === index
          ? { ...item, selectedVariant, text: item.variants[selectedVariant] }
          : item,
      ),
    );
  const saveEdit = () => {
    if (!editText.trim()) return;
    update((m) =>
      m.map((item, i) =>
        i === editing
          ? {
              ...item,
              text: editText,
              ...(item.variants
                ? {
                    variants: item.variants.map((v, n) =>
                      n === (item.selectedVariant || 0) ? editText : v,
                    ),
                  }
                : {}),
            }
          : item,
      ),
    );
    setEditing(null);
  };
  return (
    <>
      <div className="message-scroll">
        <div className="chat-intro">
          <Art character={character} className="intro-avatar" />
          <span className="eyebrow">A NEW CHAPTER WITH</span>
          <h2>{character.name}</h2>
          <p>{character.tagline}</p>
          {character.alternateGreetings?.length > 0 &&
            messages.length <= 1 &&
            !messages.some((m) => m.role === "user") && (
              <label className="greeting-choice">
                Opening message
                <select
                  aria-label="Opening message"
                  value={(() => {
                    const index = character.alternateGreetings.findIndex(
                      (g) =>
                        fillPlaceholders(g, character, profile) ===
                        (messages[0]?.text || ""),
                    );
                    return index < 0 ? "default" : String(index);
                  })()}
                  onChange={(e) => {
                    const greeting =
                      e.target.value === "default"
                        ? character.greeting
                        : character.alternateGreetings[Number(e.target.value)];
                    update(() =>
                      greeting?.trim()
                        ? [
                            {
                              role: "assistant",
                              text: fillPlaceholders(
                                greeting,
                                character,
                                profile,
                              ),
                            },
                          ]
                        : [],
                    );
                  }}
                >
                  <option value="default">Default greeting</option>
                  {character.alternateGreetings.map((g, i) => (
                    <option key={i} value={i}>
                      Greeting {i + 2} ·{" "}
                      {fillPlaceholders(g, character, profile).slice(0, 45)}
                    </option>
                  ))}
                </select>
              </label>
            )}
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
                  {editing === i ? (
                    <div className="message-editor">
                      <textarea
                        aria-label="Edit message text"
                        autoFocus
                        rows={5}
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            e.preventDefault();
                            setEditing(null);
                          }
                        }}
                      />
                      <div>
                        <button
                          className="button secondary"
                          onClick={() => setEditing(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="button primary"
                          disabled={!editText.trim()}
                          onClick={saveEdit}
                        >
                          Save message
                        </button>
                      </div>
                    </div>
                  ) : (
                    <FormattedMessage
                      text={messageText(m)}
                      showMarkers={appearance.showMarkers}
                    />
                  )}
                </div>
                <div className="message-tools">
                  <button
                    onClick={async () => {
                      try {
                        await copyText(messageText(m));
                        alert("Message copied");
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                    aria-label="Copy message"
                    title="Copy message"
                  >
                    <Copy size={14} />
                  </button>
                  <button
                    aria-label={
                      m.role === "user"
                        ? "Edit your message"
                        : "Edit character message"
                    }
                    title="Edit message"
                    disabled={typing || editing !== null}
                    onClick={() => {
                      setEditing(i);
                      setEditText(messageText(m));
                    }}
                  >
                    <Pencil size={14} />
                  </button>
                  {m.role === "assistant" &&
                    i === messages.length - 1 &&
                    messages.some((item) => item.role === "user") && (
                      <button
                        aria-label="Regenerate reply"
                        title="Generate another reply"
                        disabled={typing || editing !== null}
                        onClick={regenerate}
                      >
                        <RefreshCw size={14} />
                      </button>
                    )}
                  {m.role === "assistant" && m.variants?.length > 1 && (
                    <div
                      className="reply-variants"
                      role="group"
                      aria-label="Reply versions"
                    >
                      <button
                        aria-label="Previous reply"
                        disabled={
                          typing || editing !== null || !m.selectedVariant
                        }
                        onClick={() => pickVariant(i, m.selectedVariant - 1)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span aria-live="polite">
                        {(m.selectedVariant || 0) + 1} / {m.variants.length}
                      </span>
                      <button
                        aria-label="Next reply"
                        disabled={
                          typing ||
                          editing !== null ||
                          (m.selectedVariant || 0) >= m.variants.length - 1
                        }
                        onClick={() =>
                          pickVariant(i, (m.selectedVariant || 0) + 1)
                        }
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  )}
                  {i === 0 && !m.variants && <span>The story begins</span>}
                </div>
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
          <div ref={end} className="chat-scroll-anchor" />
        </div>
      </div>
      <div className="composer-container">
        {error && (
          <div className="generation-error" role="alert">
            <span>{error}</span>
            <button
              className="text-button"
              disabled={typing || editing !== null}
              onClick={() =>
                messages.at(-1)?.role === "user"
                  ? generate(messages)
                  : regenerate()
              }
            >
              Retry reply
            </button>
            <button
              className="icon-button"
              aria-label="Dismiss generation error"
              onClick={() => setError("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
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
          {typing ? (
            <button
              type="button"
              className="send-button"
              aria-label="Stop generating"
              onClick={() => request.current?.abort()}
            >
              <Square size={17} />
            </button>
          ) : (
            <button
              className="send-button"
              type="submit"
              aria-label="Send message"
              disabled={editing !== null || (!text.trim() && !attachment)}
            >
              <ArrowUpRight size={22} />
            </button>
          )}
        </form>
      </div>
    </>
  );
}

createRoot(document.getElementById("root")).render(<App />);
