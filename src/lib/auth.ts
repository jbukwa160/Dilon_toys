import "server-only";
import { cache } from "react";
import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { storeDb } from "./db";
import { verifyPassword } from "./password";

export const SESSION_COOKIE = "dt_admin";
const SHORT_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours
const LONG_SESSION_MS = 30 * 24 * 60 * 60 * 1000; // "remember me": 30 days
const MAX_FAILURES = 5; // per username + IP
const MAX_USER_FAILURES = 20; // per username from anywhere (IP headers can be forged)
const LOCK_MS = 15 * 60 * 1000;

export type Admin = { id: number; username: string };

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function requestInfo() {
  const h = await headers();
  const ip = (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim().slice(0, 64);
  const proto = h.get("x-forwarded-proto") ?? (h.get("origin")?.startsWith("https:") ? "https" : "http");
  return { ip, userAgent: (h.get("user-agent") ?? "").slice(0, 200), secure: proto === "https" };
}

/** The logged-in admin for this request, or null. Checked against the DB every time. */
export const getAdmin = cache(async (): Promise<Admin | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token || token.length < 20) return null;
  const db = storeDb();
  const row = db
    .prepare(
      `SELECT u.id, u.username, s.expires_at, s.last_seen_at FROM admin_sessions s JOIN admin_users u ON u.id = s.user_id
       WHERE s.token_hash = ?`,
    )
    .get(sha256(token)) as { id: number; username: string; expires_at: string; last_seen_at: string } | undefined;
  if (!row) return null;
  const now = Date.now();
  if (Date.parse(row.expires_at) <= now) {
    db.prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(sha256(token));
    return null;
  }
  if (now - Date.parse(row.last_seen_at) > 60_000) {
    db.prepare("UPDATE admin_sessions SET last_seen_at = ? WHERE token_hash = ?").run(new Date(now).toISOString(), sha256(token));
  }
  return { id: row.id, username: row.username };
});

/** Use at the top of every admin page and server action. Redirects to the login page if not signed in. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

export function hasAdminUsers(): boolean {
  return !!storeDb().prepare("SELECT 1 FROM admin_users LIMIT 1").get();
}

type LoginResult = { ok: true } | { ok: false; error: string };

type Attempt = { failures: number; first_at: string; locked_until: string | null };

function lockedFor(db: ReturnType<typeof storeDb>, key: string, now: number): number {
  const a = db.prepare("SELECT failures, first_at, locked_until FROM login_attempts WHERE key = ?").get(key) as Attempt | undefined;
  return a?.locked_until && Date.parse(a.locked_until) > now ? Date.parse(a.locked_until) - now : 0;
}

/** Count a failure; returns true if this key is now locked. */
function recordFailure(db: ReturnType<typeof storeDb>, key: string, max: number, now: number): boolean {
  const a = db.prepare("SELECT failures, first_at, locked_until FROM login_attempts WHERE key = ?").get(key) as Attempt | undefined;
  const fresh = !a || now - Date.parse(a.first_at) > LOCK_MS;
  const failures = fresh ? 1 : a!.failures + 1;
  const lockedUntil = failures >= max ? new Date(now + LOCK_MS).toISOString() : null;
  db.prepare(
    `INSERT INTO login_attempts (key, failures, first_at, locked_until) VALUES (?, ?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET failures = excluded.failures, first_at = excluded.first_at, locked_until = excluded.locked_until`,
  ).run(key, failures, fresh ? new Date(now).toISOString() : a!.first_at, lockedUntil);
  return !!lockedUntil;
}

export async function login(username: string, password: string, remember: boolean): Promise<LoginResult> {
  const db = storeDb();
  const { ip, userAgent, secure } = await requestInfo();
  const key = `${username.toLowerCase()}|${ip}`;
  const userKey = `user:${username.toLowerCase()}`;
  const now = Date.now();

  const wait = Math.max(lockedFor(db, key, now), lockedFor(db, userKey, now));
  if (wait > 0) {
    return { ok: false, error: `Твърде много неуспешни опити. Опитайте отново след ${Math.ceil(wait / 60000)} мин.` };
  }

  const user = db.prepare("SELECT id, username, password_hash FROM admin_users WHERE username = ?").get(username) as
    | { id: number; username: string; password_hash: string }
    | undefined;
  // Verify even for unknown users so response time doesn't reveal which usernames exist.
  const valid = verifyPassword(password, user?.password_hash ?? "scrypt$16384$AAAAAAAAAAAAAAAAAAAAAA==$" + "A".repeat(86) + "==") && !!user;

  if (!valid || !user) {
    const ipLocked = recordFailure(db, key, MAX_FAILURES, now);
    const userLocked = recordFailure(db, userKey, MAX_USER_FAILURES, now);
    const locked = ipLocked || userLocked;
    return {
      ok: false,
      error: locked ? "Твърде много неуспешни опити. Входът е заключен за 15 минути." : "Грешно потребителско име или парола.",
    };
  }

  db.prepare("DELETE FROM login_attempts WHERE key IN (?, ?)").run(key, userKey);
  db.prepare("DELETE FROM admin_sessions WHERE expires_at < ?").run(new Date(now).toISOString());

  const token = randomBytes(32).toString("base64url");
  const ttl = remember ? LONG_SESSION_MS : SHORT_SESSION_MS;
  const expires = new Date(now + ttl);
  db.prepare(
    "INSERT INTO admin_sessions (token_hash, user_id, created_at, expires_at, last_seen_at, ip, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(sha256(token), user.id, new Date(now).toISOString(), expires.toISOString(), new Date(now).toISOString(), ip, userAgent);
  db.prepare("UPDATE admin_users SET last_login_at = ? WHERE id = ?").run(new Date(now).toISOString(), user.id);

  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/admin",
    ...(remember ? { expires } : {}),
  });
  return { ok: true };
}

export async function logout() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) storeDb().prepare("DELETE FROM admin_sessions WHERE token_hash = ?").run(sha256(token));
  store.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", path: "/admin", maxAge: 0 });
}

/** Sign out every other device of this admin (after a password change). */
export async function endOtherSessions(userId: number) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  storeDb().prepare("DELETE FROM admin_sessions WHERE user_id = ? AND token_hash <> ?").run(userId, sha256(token));
}
