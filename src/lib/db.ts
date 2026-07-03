// SQLite 데이터 계층 — 사용자/관심기업/알림/결제 + OpenDART 응답 캐시.
// 파일 DB(data/dartwatch.db) 라 VPS·Docker 단일 인스턴스 배포에 적합. (스케일아웃 시 Postgres 전환)

import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

let _db: Database.Database | null = null;

export function db(): Database.Database {
  if (_db) return _db;
  const dir = path.join(process.cwd(), "data");
  mkdirSync(dir, { recursive: true });
  _db = new Database(path.join(dir, "dartwatch.db"));
  _db.pragma("journal_mode = WAL");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'FREE',
      plan_expires_at TEXT,
      api_key TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS watchlist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, code)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      code TEXT NOT NULL,
      company_name TEXT NOT NULL,
      filing_date TEXT NOT NULL,
      title TEXT NOT NULL,
      severity TEXT NOT NULL,
      tag TEXT NOT NULL,
      note TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, code, filing_date, title, tag)
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id),
      order_id TEXT NOT NULL UNIQUE,
      payment_key TEXT,
      plan TEXT NOT NULL,
      amount INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS dart_cache (
      key TEXT PRIMARY KEY,
      payload TEXT NOT NULL,
      fetched_at INTEGER NOT NULL
    );
  `);
  return _db;
}

// ── users ──

export interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  plan: string;
  plan_expires_at: string | null;
  api_key: string | null;
  created_at: string;
}

export function findUserByEmail(email: string): UserRow | undefined {
  return db().prepare("SELECT * FROM users WHERE email = ?").get(email) as UserRow | undefined;
}

export function findUserById(id: number): UserRow | undefined {
  return db().prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
}

export function createUser(email: string, passwordHash: string, name: string): number {
  const info = db()
    .prepare("INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)")
    .run(email, passwordHash, name);
  return Number(info.lastInsertRowid);
}

export function setUserPlan(userId: number, plan: string, expiresAt: string | null, apiKey?: string | null): void {
  db()
    .prepare("UPDATE users SET plan = ?, plan_expires_at = ?, api_key = COALESCE(?, api_key) WHERE id = ?")
    .run(plan, expiresAt, apiKey ?? null, userId);
}

export function findUserByApiKey(apiKey: string): UserRow | undefined {
  return db().prepare("SELECT * FROM users WHERE api_key = ?").get(apiKey) as UserRow | undefined;
}

// ── watchlist ──

export interface WatchRow {
  id: number;
  user_id: number;
  code: string;
  name: string;
  created_at: string;
}

export function getWatchlist(userId: number): WatchRow[] {
  return db()
    .prepare("SELECT * FROM watchlist WHERE user_id = ? ORDER BY created_at DESC")
    .all(userId) as WatchRow[];
}

export function watchCount(userId: number): number {
  const row = db().prepare("SELECT COUNT(*) AS n FROM watchlist WHERE user_id = ?").get(userId) as { n: number };
  return row.n;
}

export function addWatch(userId: number, code: string, name: string): void {
  db()
    .prepare("INSERT OR IGNORE INTO watchlist (user_id, code, name) VALUES (?, ?, ?)")
    .run(userId, code, name);
}

export function removeWatch(userId: number, code: string): void {
  db().prepare("DELETE FROM watchlist WHERE user_id = ? AND code = ?").run(userId, code);
  db().prepare("DELETE FROM alerts WHERE user_id = ? AND code = ?").run(userId, code);
}

// ── alerts ──

export interface AlertRow {
  id: number;
  user_id: number;
  code: string;
  company_name: string;
  filing_date: string;
  title: string;
  severity: string;
  tag: string;
  note: string;
  url: string;
  read: number;
  created_at: string;
}

export function upsertAlert(a: Omit<AlertRow, "id" | "read" | "created_at">): void {
  db()
    .prepare(
      `INSERT OR IGNORE INTO alerts (user_id, code, company_name, filing_date, title, severity, tag, note, url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(a.user_id, a.code, a.company_name, a.filing_date, a.title, a.severity, a.tag, a.note, a.url);
}

export function getAlerts(userId: number, limit = 100): AlertRow[] {
  return db()
    .prepare("SELECT * FROM alerts WHERE user_id = ? ORDER BY filing_date DESC, id DESC LIMIT ?")
    .all(userId, limit) as AlertRow[];
}

export function unreadAlertCount(userId: number): number {
  const row = db()
    .prepare("SELECT COUNT(*) AS n FROM alerts WHERE user_id = ? AND read = 0")
    .get(userId) as { n: number };
  return row.n;
}

export function markAlertsRead(userId: number): void {
  db().prepare("UPDATE alerts SET read = 1 WHERE user_id = ?").run(userId);
}

// ── payments ──

export function createPayment(userId: number, orderId: string, plan: string, amount: number): void {
  db()
    .prepare("INSERT INTO payments (user_id, order_id, plan, amount) VALUES (?, ?, ?, ?)")
    .run(userId, orderId, plan, amount);
}

export interface PaymentRow {
  id: number;
  user_id: number;
  order_id: string;
  payment_key: string | null;
  plan: string;
  amount: number;
  status: string;
  created_at: string;
}

export function findPayment(orderId: string): PaymentRow | undefined {
  return db().prepare("SELECT * FROM payments WHERE order_id = ?").get(orderId) as PaymentRow | undefined;
}

export function completePayment(orderId: string, paymentKey: string, status: string): void {
  db()
    .prepare("UPDATE payments SET payment_key = ?, status = ? WHERE order_id = ?")
    .run(paymentKey, status, orderId);
}

export function getPayments(userId: number): PaymentRow[] {
  return db()
    .prepare("SELECT * FROM payments WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(userId) as PaymentRow[];
}

// ── dart_cache: OpenDART 응답 캐시 (레이트리밋 보호) ──

export function cacheGet(key: string, ttlMs: number): string | null {
  const row = db().prepare("SELECT payload, fetched_at FROM dart_cache WHERE key = ?").get(key) as
    | { payload: string; fetched_at: number }
    | undefined;
  if (!row) return null;
  if (Date.now() - row.fetched_at > ttlMs) return null;
  return row.payload;
}

export function cacheSet(key: string, payload: string): void {
  db()
    .prepare(
      "INSERT INTO dart_cache (key, payload, fetched_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at",
    )
    .run(key, payload, Date.now());
}
