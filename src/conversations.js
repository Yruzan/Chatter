export function conversationTitle(session) {
  return (
    session.title ||
    session.messages?.find((message) => message.role === "user")?.text ||
    "New conversation"
  )
    .replace(/\*/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 70);
}
export function getHistory(sessions, characters) {
  return Object.entries(sessions)
    .map(([id, session]) => {
      const character = characters.find(
        (character) => character.id === (session.characterId || id),
      );
      return character
        ? { id, session, character, title: conversationTitle(session) }
        : null;
    })
    .filter(Boolean)
    .sort((a, b) => (b.session.updated || 0) - (a.session.updated || 0));
}
export function historyDay(timestamp) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(new Date(timestamp || 0)) ===
    formatter.format(new Date())
    ? "Today"
    : "Earlier";
}
