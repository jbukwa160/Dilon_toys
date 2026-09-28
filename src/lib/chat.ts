import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { storeDb } from "./db";

// Chat bubble: a visitor's conversation is found by a random token kept in an httpOnly cookie
// (only its hash is stored). The admin answers from Admin → Чат.

export const CHAT_COOKIE = "dt_chat";
export const CHAT_COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // seconds
export const CHAT_LIMITS = { body: 1000, name: 60, contact: 100, messagesPerConversation: 400 };

export type ChatSender = "visitor" | "admin";
export type ChatMessage = { id: number; sender: ChatSender; body: string; createdAt: string };
export type ChatStatus = "open" | "closed";

export type ChatConversation = {
  id: number;
  name: string | null;
  contact: string | null;
  page: string | null;
  userAgent: string | null;
  status: ChatStatus;
  createdAt: string;
  lastMessageAt: string;
  unreadAdmin: number;
  unreadVisitor: number;
};

export type ChatSummary = ChatConversation & { lastMessage: { sender: ChatSender; body: string } | null; messageCount: number };

type ConvRow = {
  id: number;
  name: string | null;
  contact: string | null;
  page: string | null;
  user_agent: string | null;
  status: string;
  created_at: string;
  last_message_at: string;
  unread_admin: number;
  unread_visitor: number;
};

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");
const nowIso = () => new Date().toISOString();

function toConversation(r: ConvRow): ChatConversation {
  return {
    id: r.id,
    name: r.name,
    contact: r.contact,
    page: r.page,
    userAgent: r.user_agent,
    status: r.status === "closed" ? "closed" : "open",
    createdAt: r.created_at,
    lastMessageAt: r.last_message_at,
    unreadAdmin: r.unread_admin,
    unreadVisitor: r.unread_visitor,
  };
}

/** Keeps the text as typed (line breaks included) but drops control characters and trims it to `max`. */
export function cleanText(v: unknown, max: number): string {
  if (typeof v !== "string") return "";
  return v
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

// ---------------------------------------------------------------------------
// Visitor side

export function conversationByToken(token: string | undefined): ChatConversation | null {
  if (!token || token.length < 20 || token.length > 100) return null;
  const r = storeDb().prepare("SELECT * FROM chat_conversations WHERE token_hash = ?").get(sha256(token)) as ConvRow | undefined;
  return r ? toConversation(r) : null;
}

export function startConversation(meta: { page: string | null; ip: string; userAgent: string }): { id: number; token: string } {
  const token = randomBytes(24).toString("base64url");
  const t = nowIso();
  const r = storeDb()
    .prepare(
      `INSERT INTO chat_conversations (token_hash, page, ip, user_agent, created_at, last_message_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(sha256(token), meta.page, meta.ip, meta.userAgent, t, t);
  return { id: Number(r.lastInsertRowid), token };
}

export function messageCount(conversationId: number): number {
  return (storeDb().prepare("SELECT COUNT(*) AS n FROM chat_messages WHERE conversation_id = ?").get(conversationId) as { n: number }).n;
}

/** Adds a message and updates the unread counters. A visitor's message re-opens a closed conversation. */
export function addMessage(conversationId: number, sender: ChatSender, body: string): ChatMessage {
  const db = storeDb();
  const t = nowIso();
  return db.transaction(() => {
    const r = db.prepare("INSERT INTO chat_messages (conversation_id, sender, body, created_at) VALUES (?, ?, ?, ?)").run(conversationId, sender, body, t);
    if (sender === "visitor") {
      db.prepare("UPDATE chat_conversations SET last_message_at = ?, unread_admin = unread_admin + 1, status = 'open' WHERE id = ?").run(t, conversationId);
    } else {
      db.prepare("UPDATE chat_conversations SET last_message_at = ?, unread_visitor = unread_visitor + 1, unread_admin = 0 WHERE id = ?").run(t, conversationId);
    }
    return { id: Number(r.lastInsertRowid), sender, body, createdAt: t };
  })();
}

export function messagesAfter(conversationId: number, afterId = 0, limit = 300): ChatMessage[] {
  const rows = storeDb()
    .prepare("SELECT id, sender, body, created_at FROM chat_messages WHERE conversation_id = ? AND id > ? ORDER BY id LIMIT ?")
    .all(conversationId, afterId, limit) as { id: number; sender: string; body: string; created_at: string }[];
  return rows.map((r) => ({ id: r.id, sender: r.sender === "admin" ? "admin" : "visitor", body: r.body, createdAt: r.created_at }));
}

export function markReadByVisitor(conversationId: number) {
  storeDb().prepare("UPDATE chat_conversations SET unread_visitor = 0 WHERE id = ? AND unread_visitor > 0").run(conversationId);
}

/** The page the visitor was on when they last wrote (shown to the admin). */
export function setConversationPage(conversationId: number, page: string) {
  storeDb().prepare("UPDATE chat_conversations SET page = ? WHERE id = ?").run(page, conversationId);
}

export function setVisitorContact(conversationId: number, name: string, contact: string) {
  storeDb().prepare("UPDATE chat_conversations SET name = ?, contact = ? WHERE id = ?").run(name || null, contact || null, conversationId);
}

// ---------------------------------------------------------------------------
// "On line" = the admin panel was open in the last 90 seconds (it checks for new messages every 15 s).

const g = globalThis as unknown as { __chatAdminSeen?: number };

export function touchAdminPresence() {
  g.__chatAdminSeen = Date.now();
}

export function adminOnline(): boolean {
  return Date.now() - (g.__chatAdminSeen ?? 0) < 90_000;
}

// ---------------------------------------------------------------------------
// Admin side

export type ChatFilter = "open" | "closed" | "all";

export function listConversations(filter: ChatFilter, limit = 200): ChatSummary[] {
  const where = filter === "all" ? "" : "WHERE c.status = ?";
  const rows = storeDb()
    .prepare(
      `SELECT c.*,
         (SELECT COUNT(*) FROM chat_messages m WHERE m.conversation_id = c.id) AS message_count,
         (SELECT sender || char(31) || body FROM chat_messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message
       FROM chat_conversations c ${where}
       ORDER BY c.unread_admin > 0 DESC, c.last_message_at DESC LIMIT ?`,
    )
    .all(...(filter === "all" ? [] : [filter]), limit) as (ConvRow & { message_count: number; last_message: string | null })[];
  return rows
    .filter((r) => r.message_count > 0)
    .map((r) => {
      const [sender, ...rest] = (r.last_message ?? "").split("\u001f");
      return {
        ...toConversation(r),
        messageCount: r.message_count,
        lastMessage: r.last_message ? { sender: sender === "admin" ? "admin" : "visitor", body: rest.join("\u001f").slice(0, 160) } : null,
      };
    });
}

export function getConversation(id: number): ChatConversation | null {
  const r = storeDb().prepare("SELECT * FROM chat_conversations WHERE id = ?").get(id) as ConvRow | undefined;
  return r ? toConversation(r) : null;
}

export function markReadByAdmin(id: number) {
  storeDb().prepare("UPDATE chat_conversations SET unread_admin = 0 WHERE id = ? AND unread_admin > 0").run(id);
}

export function setConversationStatus(id: number, status: ChatStatus) {
  storeDb().prepare("UPDATE chat_conversations SET status = ? WHERE id = ?").run(status, id);
}

export function deleteConversation(id: number) {
  const db = storeDb();
  db.transaction(() => {
    db.prepare("DELETE FROM chat_messages WHERE conversation_id = ?").run(id);
    db.prepare("DELETE FROM chat_conversations WHERE id = ?").run(id);
  })();
}

/** Conversations with messages the admin hasn't read yet (for the menu badge). */
export function unreadConversationCount(): number {
  return (storeDb().prepare("SELECT COUNT(*) AS n FROM chat_conversations WHERE unread_admin > 0").get() as { n: number }).n;
}
