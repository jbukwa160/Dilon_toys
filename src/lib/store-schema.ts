// Schema of data/store.db. Shared by the app and the CLI scripts.
export const STORE_SCHEMA = `
  CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    number INTEGER NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    customer TEXT NOT NULL,
    delivery TEXT NOT NULL,
    payment TEXT NOT NULL,
    items TEXT NOT NULL,
    subtotal REAL NOT NULL,
    shipping REAL NOT NULL,
    total REAL NOT NULL,
    points INTEGER NOT NULL,
    note TEXT
  );
  CREATE TABLE IF NOT EXISTS newsletter (
    email TEXT PRIMARY KEY,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  -- Admin changes to products. Re-applied after every CSV import so they are never lost.
  CREATE TABLE IF NOT EXISTS product_edits (
    sku TEXT PRIMARY KEY,
    custom INTEGER NOT NULL DEFAULT 0,
    deleted INTEGER NOT NULL DEFAULT 0,
    data TEXT NOT NULL,
    -- catalogue values before the first admin change, for "restore original"
    original TEXT,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_users (
    id INTEGER PRIMARY KEY,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );
  CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    ip TEXT,
    user_agent TEXT
  );
  CREATE TABLE IF NOT EXISTS login_attempts (
    key TEXT PRIMARY KEY,
    failures INTEGER NOT NULL,
    first_at TEXT NOT NULL,
    locked_until TEXT
  );
  -- Office / city lists downloaded from the couriers (refreshed automatically).
  CREATE TABLE IF NOT EXISTS courier_cache (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    fetched_at TEXT NOT NULL
  );
  -- Price files uploaded in the admin panel, kept until the admin confirms them.
  CREATE TABLE IF NOT EXISTS price_imports (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL,
    data TEXT NOT NULL
  );
  -- Chat bubble: one conversation per visitor (identified by a cookie), answered in the admin panel.
  CREATE TABLE IF NOT EXISTS chat_conversations (
    id INTEGER PRIMARY KEY,
    token_hash TEXT NOT NULL UNIQUE,
    name TEXT,
    contact TEXT,
    page TEXT,
    ip TEXT,
    user_agent TEXT,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT NOT NULL,
    last_message_at TEXT NOT NULL,
    -- messages not seen yet by the admin / by the visitor
    unread_admin INTEGER NOT NULL DEFAULT 0,
    unread_visitor INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS chat_conversations_last ON chat_conversations(last_message_at);
  CREATE TABLE IF NOT EXISTS chat_messages (
    id INTEGER PRIMARY KEY,
    conversation_id INTEGER NOT NULL,
    sender TEXT NOT NULL, -- 'visitor' | 'admin'
    body TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS chat_messages_conversation ON chat_messages(conversation_id, id);
  -- Blog (/blog), written in the admin panel.
  CREATE TABLE IF NOT EXISTS blog_posts (
    id INTEGER PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    body TEXT NOT NULL DEFAULT '',
    cover TEXT NOT NULL DEFAULT '',
    theme TEXT NOT NULL DEFAULT 'sunrise',
    topic TEXT NOT NULL DEFAULT '',
    meta_title TEXT NOT NULL DEFAULT '',
    meta_description TEXT NOT NULL DEFAULT '',
    published INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  -- Manufacturer / EU responsible person per brand (GPSR), shown on every product of the brand.
  CREATE TABLE IF NOT EXISTS manufacturers (
    brand_slug TEXT PRIMARY KEY,
    data TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  -- Old addresses of posts whose address was changed, so links and Google results keep working.
  CREATE TABLE IF NOT EXISTS blog_redirects (
    old_slug TEXT PRIMARY KEY,
    post_id INTEGER NOT NULL
  );
`;
