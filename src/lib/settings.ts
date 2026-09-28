import "server-only";
import { cache } from "react";
import { storeDb } from "./db";
import { normalizeChat, normalizeGifts, normalizeHome, normalizeMenu, normalizeSettings } from "./settings-normalize";
import type { ChatSettings, GiftIdeas, HomeContent, MenuConfig, StoreSettings } from "./settings-types";
import { mergeCategories, type CategoryEntry } from "./category-config";

type Key = "store" | "home" | "menu" | "gifts" | "chat" | "categories";

function read(key: Key): unknown {
  const row = storeDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  if (!row) return undefined;
  try {
    return JSON.parse(row.value);
  } catch {
    return undefined;
  }
}

export function writeSetting(key: Key, value: unknown) {
  storeDb()
    .prepare("INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at")
    .run(key, JSON.stringify(value), new Date().toISOString());
}

export const getSettings = cache((): StoreSettings => normalizeSettings(read("store")));
export const getHomeContent = cache((): HomeContent => normalizeHome(read("home")));
export const getMenu = cache((): MenuConfig => normalizeMenu(read("menu")));
export const getChatSettings = cache((): ChatSettings => normalizeChat(read("chat")));

/** All categories in menu order, as edited in Admin → Категории (see lib/categories.ts for helpers). */
export const getCategoryEntries = cache((): CategoryEntry[] => mergeCategories(read("categories")));

/** Saved gift ideas, or null if the admin hasn't set them up yet (see lib/gifts.ts for the fallback). */
export const getSavedGifts = cache((): GiftIdeas | null => normalizeGifts(read("gifts")));
