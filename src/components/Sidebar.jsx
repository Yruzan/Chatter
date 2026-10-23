import React, { useEffect, useRef, useState } from "react";
import {
  Home,
  Library,
  Plus,
  MessagesSquare,
  UserRound,
  X,
  Search,
  MessageCircle,
  ChevronRight,
  ArrowUpRight,
} from "lucide-react";
import { historyDay } from "../conversations";

export default function Sidebar({
  Brand,
  open,
  onClose,
  page,
  history,
  activeChat,
  currentCharacter,
  profile,
  onNavigate,
  onCreate,
  onNewChat,
  onSelect,
}) {
  const [query, setQuery] = useState(""),
    [mobile, setMobile] = useState(
      () => window.matchMedia("(max-width: 760px)").matches,
    );
  useEffect(() => setQuery(""), [currentCharacter?.id]);
  const ref = useRef(null),
    close = useRef(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 760px)");
    const update = () => {
      setMobile(media.matches);
      if (!media.matches) onClose();
    };
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [onClose]);
  useEffect(() => {
    if (!open || !mobile) return;
    const previous = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    close.current?.focus();
    const key = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        const items = [...ref.current.querySelectorAll("button,input")].filter(
          (el) => !el.disabled && el.getClientRects().length,
        );
        if (e.shiftKey && document.activeElement === items[0]) {
          e.preventDefault();
          items.at(-1)?.focus();
        } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
          e.preventDefault();
          items[0]?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      if (previous?.isConnected) previous.focus();
    };
  }, [open, mobile, onClose]);
  const filtered = history.filter((item) =>
    `${item.title} ${item.character.name}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  const groups = ["Today", "Earlier"]
    .map((label) => ({
      label,
      items: filtered.filter(
        (item) => historyDay(item.session.updated) === label,
      ),
    }))
    .filter((group) => group.items.length);
  return (
    <>
      {open && mobile && (
        <button
          className="sidebar-scrim"
          aria-label="Close navigation backdrop"
          onClick={onClose}
        />
      )}
      <aside
        ref={ref}
        id="app-sidebar"
        className={`sidebar conversation-sidebar ${open ? "is-open" : ""}`}
        role={mobile && open ? "dialog" : undefined}
        aria-modal={mobile && open ? true : undefined}
        aria-label={mobile ? "Navigation menu" : "Sidebar"}
        aria-hidden={mobile && !open}
        inert={mobile && !open}
      >
        <div className="sidebar-brand-row">
          <button
            className="brand-button"
            onClick={() => onNavigate("Home")}
            aria-label="Chatter home"
          >
            <Brand />
          </button>
          <button
            ref={close}
            className="icon-button sidebar-close"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>
        <button className="sidebar-new-chat" onClick={onNewChat}>
          <Plus size={19} />
          <span>New chat</span>
          <span className="new-chat-spark" aria-hidden="true">
            <ArrowUpRight size={15} />
          </span>
        </button>
        <div className="sidebar-scroll-area">
          <div className="workspace-label">MAIN MENU</div>
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
                  label === "Create" ? onCreate() : onNavigate(label)
                }
              >
                <span className="nav-icon">
                  <Icon size={20} />
                </span>
                <span>{label === "Create" ? "Create character" : label}</span>
                {page === label && <span className="nav-indicator" />}
                {label === "Chats" && page !== label && (
                  <span className="nav-count">{history.length}</span>
                )}
              </button>
            ))}
          </nav>
          <section className="sidebar-history" aria-label="Chat history">
            <div className="sidebar-history-heading">
              <span>
                {currentCharacter
                  ? `${currentCharacter.name.toUpperCase()} CHATS`
                  : "CHAT HISTORY"}
              </span>
              <span>{history.length}</span>
            </div>
            {history.length > 0 && (
              <label className="sidebar-history-search">
                <Search size={14} />
                <input
                  aria-label="Search chat history"
                  value={query}
                  placeholder="Search conversations…"
                  onChange={(e) => setQuery(e.target.value)}
                />
                {query && (
                  <button
                    aria-label="Clear history search"
                    onClick={() => setQuery("")}
                  >
                    <X size={12} />
                  </button>
                )}
              </label>
            )}
            {groups.map((group) => (
              <div className="sidebar-history-group" key={group.label}>
                <h3>{group.label}</h3>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    className={`sidebar-history-item ${activeChat === item.id ? "selected" : ""}`}
                    aria-label={`Open conversation ${item.title} with ${item.character.name}`}
                    aria-current={activeChat === item.id ? "page" : undefined}
                    onClick={() => onSelect(item.id)}
                  >
                    <MessageCircle size={16} />
                    <span>
                      <strong>{item.title}</strong>
                      <small>{item.character.name}</small>
                    </span>
                    {activeChat === item.id && (
                      <span className="history-active-dot" />
                    )}
                  </button>
                ))}
              </div>
            ))}
            {!history.length && (
              <div className="sidebar-history-empty">
                <MessagesSquare size={23} />
                <p>
                  A new story starts
                  <br />
                  with a little hello.
                </p>
                <button onClick={onNewChat}>
                  Start your first chat <Plus size={12} />
                </button>
              </div>
            )}
            {!!history.length && !filtered.length && (
              <p className="sidebar-history-no-results">
                No conversations match “{query}”.
              </p>
            )}
          </section>
        </div>
        <div className="sidebar-bottom">
          <button className="account" onClick={() => onNavigate("Profile")}>
            <div className="user-avatar">
              {profile.name.slice(0, 1).toUpperCase()}
            </div>
            <span>
              <strong>{profile.name}</strong>
              <small>Your corner of the universe</small>
            </span>
            <ChevronRight size={16} />
          </button>
        </div>
      </aside>
    </>
  );
}
