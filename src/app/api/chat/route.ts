import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getChatSettings } from "@/lib/settings";
import { rateLimited } from "@/lib/rate-limit";
import {
  CHAT_COOKIE,
  CHAT_COOKIE_MAX_AGE,
  CHAT_LIMITS,
  addMessage,
  adminOnline,
  cleanText,
  conversationByToken,
  markReadByVisitor,
  messageCount,
  setConversationPage,
  messagesAfter,
  setVisitorContact,
  startConversation,
} from "@/lib/chat";

// The chat bubble's endpoint. GET polls for new messages, POST sends a message or the visitor's contact details.

const noStore = { "Cache-Control": "no-store" };
const fail = (error: string, status = 400) => NextResponse.json({ error }, { status, headers: noStore });

/** Only the shop's own pages may post (browsers always send Origin on POST requests). */
function sameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === (req.headers.get("x-forwarded-host") ?? req.headers.get("host"));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  if (await rateLimited("chat-poll", 120)) return fail("Твърде много заявки. Опитайте след минута.", 429);
  const conv = conversationByToken((await cookies()).get(CHAT_COOKIE)?.value);
  const online = adminOnline();
  if (!conv) return NextResponse.json({ online, conversation: false, messages: [], unread: 0 }, { headers: noStore });
  const after = Math.max(0, parseInt(req.nextUrl.searchParams.get("after") ?? "0", 10) || 0);
  // The panel is open, so whatever arrives now is read.
  if (req.nextUrl.searchParams.get("read") === "1") markReadByVisitor(conv.id);
  return NextResponse.json(
    {
      online,
      conversation: true,
      messages: messagesAfter(conv.id, after),
      unread: req.nextUrl.searchParams.get("read") === "1" ? 0 : conv.unreadVisitor,
      hasContact: !!(conv.name || conv.contact),
    },
    { headers: noStore },
  );
}

export async function POST(req: NextRequest) {
  if (!sameOrigin(req)) return fail("Забранено.", 403);
  if (!getChatSettings().enabled) return fail("Чатът в момента не работи.", 403);
  if (await rateLimited("chat-send", 15)) return fail("Изпращате съобщения твърде бързо. Изчакайте малко.", 429);

  let input: Record<string, unknown>;
  try {
    input = (await req.json()) as Record<string, unknown>;
  } catch {
    return fail("Невалидна заявка.");
  }
  const jar = await cookies();
  let conv = conversationByToken(jar.get(CHAT_COOKIE)?.value);

  if (input.action === "contact") {
    if (!conv) return fail("Няма започнат разговор.");
    const name = cleanText(input.name, CHAT_LIMITS.name).replace(/\n/g, " ");
    const contact = cleanText(input.contact, CHAT_LIMITS.contact).replace(/\n/g, " ");
    if (!contact) return fail("Въведете телефон или имейл.");
    setVisitorContact(conv.id, name, contact);
    return NextResponse.json({ ok: true }, { headers: noStore });
  }

  const body = cleanText(input.body, CHAT_LIMITS.body);
  if (!body) return fail("Напишете съобщение.");
  const page = typeof input.page === "string" && /^\/(?!\/)[^\s<>"]{0,300}$/.test(input.page) ? input.page : null;
  // A new conversation, or one the shop had closed, counts as a new chat (the bubble asks for contact details again).
  const fresh = !conv || conv.status === "closed";
  if (!conv) {
    if (await rateLimited("chat-new", 5, 60 * 60_000)) return fail("Твърде много нови разговори. Опитайте по-късно.", 429);
    const ip = (req.headers.get("x-forwarded-for")?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "local").trim().slice(0, 64);
    const started = startConversation({ page, ip, userAgent: (req.headers.get("user-agent") ?? "").slice(0, 200) });
    jar.set(CHAT_COOKIE, started.token, {
      httpOnly: true,
      sameSite: "lax",
      secure: (req.headers.get("x-forwarded-proto") ?? req.nextUrl.protocol.replace(":", "")) === "https",
      path: "/api/chat",
      maxAge: CHAT_COOKIE_MAX_AGE,
    });
    conv = conversationByToken(started.token);
  }
  if (!conv) return fail("Грешка при започване на разговора.", 500);
  if (messageCount(conv.id) >= CHAT_LIMITS.messagesPerConversation) {
    return fail("Разговорът стана твърде дълъг. Моля, обадете ни се или ни пишете на имейл.");
  }
  if (page && page !== conv.page) setConversationPage(conv.id, page);
  const message = addMessage(conv.id, "visitor", body);
  return NextResponse.json({ ok: true, message, fresh, hasContact: !!(conv.name || conv.contact) }, { headers: noStore });
}
