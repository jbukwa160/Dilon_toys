"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { writeSetting } from "@/lib/settings";
import { normalizeChat } from "@/lib/settings-normalize";
import type { ChatSettings } from "@/lib/settings-types";
import { CHAT_LIMITS, addMessage, cleanText, deleteConversation, getConversation, setConversationStatus, type ChatMessage } from "@/lib/chat";

export async function sendChatReplyAction(conversationId: number, text: string): Promise<{ message?: ChatMessage; error?: string }> {
  await requireAdmin();
  const body = cleanText(text, CHAT_LIMITS.body);
  if (!body) return { error: "Напишете отговор." };
  if (!getConversation(conversationId)) return { error: "Разговорът вече не съществува." };
  return { message: addMessage(conversationId, "admin", body) };
}

export async function setChatStatusAction(conversationId: number, status: "open" | "closed"): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  if (!getConversation(conversationId)) return { error: "Разговорът вече не съществува." };
  setConversationStatus(conversationId, status === "closed" ? "closed" : "open");
  return { ok: true };
}

export async function deleteChatAction(conversationId: number): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  deleteConversation(conversationId);
  return { ok: true };
}

export async function saveChatSettingsAction(input: ChatSettings): Promise<{ ok?: boolean; error?: string }> {
  await requireAdmin();
  if (!String(input?.title ?? "").trim()) return { error: "Въведете заглавие на чата." };
  writeSetting("chat", normalizeChat(input));
  revalidatePath("/", "layout");
  return { ok: true };
}
