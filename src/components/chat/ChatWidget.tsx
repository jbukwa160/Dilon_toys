"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Check, LoaderCircle, MessageCircle, SendHorizontal, X } from "lucide-react";
import type { PublicChat } from "@/lib/settings-types";
import { LogoMark } from "@/components/layout/Logo";
import { MessageText, formatChatTime } from "./MessageText";

type Message = { id: number; sender: "visitor" | "admin"; body: string; createdAt: string; failed?: boolean };
type PollResponse = { online: boolean; conversation: boolean; messages: Message[]; unread: number; hasContact?: boolean };

const STARTED_KEY = "dt_chat_started"; // this browser has a conversation, so check for replies
const OLD_SKIP_KEY = "dt_chat_contact_skipped"; // earlier versions remembered "Не сега" for good
const MAX = 1000;

const store = {
  get(k: string) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  remove(k: string) {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};

export function ChatWidget({ config }: { config: PublicChat }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [online, setOnline] = useState(false);
  const [unread, setUnread] = useState(0);
  const [hasContact, setHasContact] = useState(true);
  // "Не сега" only lasts while the chat stays open: after it is opened again (or a new chat starts)
  // and the visitor writes, the phone / e-mail question comes back until they leave one.
  const [wroteNow, setWroteNow] = useState(false);
  const [skippedNow, setSkippedNow] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastId = useRef(0);
  const tempId = useRef(0); // negative ids for messages still being sent
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Read after mount: localStorage isn't available while the page is rendered on the server.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStarted(store.get(STARTED_KEY) === "1");
    store.remove(OLD_SKIP_KEY);
  }, []);

  const openChat = () => {
    setWroteNow(false);
    setSkippedNow(false);
    setOpen(true);
  };

  const merge = useCallback((incoming: Message[]) => {
    if (!incoming.length) return;
    setMessages((cur) => {
      const known = new Set(cur.map((m) => m.id));
      const add = incoming.filter((m) => !known.has(m.id));
      return add.length ? [...cur, ...add] : cur;
    });
    lastId.current = Math.max(lastId.current, ...incoming.map((m) => m.id));
  }, []);

  const poll = useCallback(
    async (read: boolean) => {
      try {
        const r = await fetch(`/api/chat?after=${lastId.current}${read ? "&read=1" : ""}`, { cache: "no-store" });
        if (!r.ok) return;
        const d = (await r.json()) as PollResponse;
        setOnline(d.online);
        setUnread(read ? 0 : d.unread);
        if (typeof d.hasContact === "boolean") setHasContact(d.hasContact);
        if (!d.conversation) return;
        merge(d.messages);
      } catch {}
    },
    [merge],
  );

  // Open: check every 3 s. Closed with a conversation: every 20 s (for the unread badge). Paused in background tabs.
  useEffect(() => {
    if (!open && !started) return;
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      if (!document.hidden) await poll(open);
      if (!stopped) timer = setTimeout(tick, open ? 3000 : 20000);
    };
    tick();
    const onVisible = () => !document.hidden && poll(open);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      stopped = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [open, started, poll]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [open, messages.length, hasContact]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    // On phones the chat covers the page; keep the page from scrolling behind it.
    const small = window.matchMedia("(max-width: 639px)").matches;
    if (small) document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      if (small) document.documentElement.style.overflow = "";
    };
  }, [open]);

  const send = async (raw: string) => {
    const body = raw.trim().slice(0, MAX);
    if (!body || sending) return;
    setSending(true);
    setError(null);
    const temp: Message = { id: --tempId.current, sender: "visitor", body, createdAt: new Date().toISOString() };
    setMessages((m) => [...m, temp]);
    setText("");
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body, page: pathname }) });
      const d = (await r.json().catch(() => ({}))) as { message?: Message; error?: string; fresh?: boolean; hasContact?: boolean };
      if (!r.ok || !d.message) throw new Error(d.error ?? "Съобщението не беше изпратено. Опитайте отново.");
      setMessages((m) => m.map((x) => (x.id === temp.id ? d.message! : x)));
      lastId.current = Math.max(lastId.current, d.message.id);
      if (typeof d.hasContact === "boolean") setHasContact(d.hasContact);
      if (d.fresh) setSkippedNow(false); // a new (or re-opened) conversation asks again
      setWroteNow(true);
      if (!started) {
        store.set(STARTED_KEY, "1");
        setStarted(true);
      }
    } catch (e) {
      setMessages((m) => m.map((x) => (x.id === temp.id ? { ...x, failed: true } : x)));
      setError(e instanceof Error ? e.message : "Съобщението не беше изпратено.");
      setText(body);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const showContact = config.askContact && wroteNow && !hasContact && !skippedNow;
  const preview = !open && unread > 0 ? [...messages].reverse().find((m) => m.sender === "admin") : undefined;

  return (
    <>
      {preview ? (
        <button
          type="button"
          onClick={openChat}
          className="fixed right-4 z-50 max-w-[260px] rounded-2xl rounded-br-md border border-line bg-white px-4 py-3 text-left text-sm shadow-[var(--shadow-lift)] [animation:fade-in_.2s_ease-out] sm:right-6"
          style={{ bottom: "calc(max(1rem, env(safe-area-inset-bottom)) + 4.5rem)" }}
        >
          <span className="block text-xs font-extrabold text-brand">Нов отговор</span>
          <span className="line-clamp-2 font-semibold">{preview.body}</span>
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => (open ? setOpen(false) : openChat())}
        aria-expanded={open}
        aria-label={open ? "Затвори чата" : unread ? `Отвори чата (${unread} нови съобщения)` : "Отвори чата"}
        className={clsx(
          "fixed right-4 z-50 grid h-14 w-14 place-items-center rounded-full bg-brand text-white shadow-[0_8px_24px_rgb(240_80_58/0.45)] transition hover:scale-105 hover:bg-brand-dark sm:right-6",
          open && "max-sm:hidden",
        )}
        style={{ bottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-7 w-7" />}
        {!open && unread ? (
          <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full border-2 border-white bg-sun px-1 text-xs font-black text-ink">{unread}</span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label={config.title}
          className="fixed inset-0 z-50 flex flex-col bg-white [animation:fade-in_.15s_ease-out] sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(620px,calc(100vh-8rem))] sm:w-[380px] sm:overflow-hidden sm:rounded-3xl sm:border sm:border-line sm:shadow-[var(--shadow-lift)]"
        >
          <header className="flex items-center gap-3 bg-ink px-4 py-3.5 text-white">
            <span className="relative">
              <LogoMark className="h-10 w-10" />
              <span className={clsx("absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink", online ? "bg-mint" : "bg-muted")} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-black leading-tight">{config.title}</span>
              <span className="block text-xs font-semibold text-white/70">{online ? "На линия — отговаряме веднага" : "Сега не сме на линия"}</span>
            </span>
            <button type="button" onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-white/10" aria-label="Затвори чата">
              <X className="h-5 w-5" />
            </button>
          </header>

          <div ref={listRef} className="flex-1 space-y-2.5 overflow-y-auto bg-canvas px-4 py-4" aria-live="polite">
            {config.greeting ? <Bubble sender="admin">{config.greeting}</Bubble> : null}
            {!online && config.offlineText ? <p className="px-2 text-center text-xs font-semibold text-muted">{config.offlineText}</p> : null}
            {messages.map((m) => (
              <Bubble key={m.id} sender={m.sender} time={m.id > 0 ? formatChatTime(m.createdAt) : undefined} failed={m.failed}>
                <MessageText text={m.body} />
              </Bubble>
            ))}
            {!messages.length && config.quickQuestions.length ? (
              <div className="flex flex-col items-end gap-2 pt-2">
                {config.quickQuestions.map((q) => (
                  <button key={q} type="button" onClick={() => send(q)} disabled={sending} className="rounded-2xl border-2 border-brand/30 bg-white px-3.5 py-2 text-left text-sm font-bold text-brand hover:bg-brand-soft">
                    {q}
                  </button>
                ))}
              </div>
            ) : null}
            {showContact ? <ContactCard onSaved={() => setHasContact(true)} onSkip={() => setSkippedNow(true)} /> : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(text);
            }}
            className="border-t border-line bg-white p-3"
            style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          >
            {error ? <p className="mb-2 text-sm font-bold text-brand">{error}</p> : null}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    send(text);
                  }
                }}
                rows={1}
                placeholder="Напишете съобщение…"
                aria-label="Съобщение"
                className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border-2 border-line bg-white px-3.5 py-2.5 text-[1rem] outline-none [field-sizing:content] focus:border-sky"
                autoFocus
              />
              <button type="submit" disabled={sending || !text.trim()} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand text-white transition hover:bg-brand-dark disabled:opacity-40" aria-label="Изпрати">
                {sending ? <LoaderCircle className="h-5 w-5 animate-spin" /> : <SendHorizontal className="h-5 w-5" />}
              </button>
            </div>
            {text.length > MAX - 100 ? <p className="mt-1 text-right text-xs text-muted">{MAX - text.length} знака остават</p> : null}
          </form>
        </div>
      ) : null}
    </>
  );
}

function Bubble({ sender, time, failed, children }: { sender: "visitor" | "admin"; time?: string; failed?: boolean; children: React.ReactNode }) {
  const mine = sender === "visitor";
  return (
    <div className={clsx("flex flex-col", mine ? "items-end" : "items-start")}>
      <div
        className={clsx(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-[0.95rem] leading-snug",
          mine ? "rounded-br-md bg-brand text-white" : "rounded-bl-md border border-line bg-white text-ink",
          failed && "opacity-60",
        )}
      >
        {children}
      </div>
      {failed ? <span className="mt-0.5 text-[0.7rem] font-bold text-brand">Не е изпратено</span> : time ? <span className="mt-0.5 px-1 text-[0.7rem] text-muted">{time}</span> : null}
    </div>
  );
}

function ContactCard({ onSaved, onSkip }: { onSaved: () => void; onSkip: () => void }) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const save = async () => {
    if (!contact.trim()) return setError("Въведете телефон или имейл.");
    setPending(true);
    setError(null);
    try {
      const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "contact", name, contact }) });
      const d = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) throw new Error(d.error ?? "Грешка");
      setDone(true);
      setTimeout(onSaved, 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Грешка");
    } finally {
      setPending(false);
    }
  };
  if (done) {
    return (
      <p className="flex items-center justify-center gap-1.5 py-1 text-sm font-bold text-mint">
        <Check className="h-4 w-4" strokeWidth={3} /> Благодарим! Ще ви отговорим и там.
      </p>
    );
  }
  return (
    <div className="rounded-2xl border border-line bg-white p-3.5">
      <p className="text-sm font-extrabold">Как да ви отговорим, ако затворите страницата?</p>
      <div className="mt-2.5 space-y-2">
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Име (по желание)" aria-label="Име" className="field !py-2 text-sm" />
        <input value={contact} onChange={(e) => setContact(e.target.value)} maxLength={100} placeholder="Телефон или имейл" aria-label="Телефон или имейл" className="field !py-2 text-sm" />
      </div>
      {error ? <p className="mt-1.5 text-xs font-bold text-brand">{error}</p> : null}
      <div className="mt-2.5 flex gap-2">
        <button type="button" onClick={save} disabled={pending} className="btn btn-primary h-9 flex-1 px-3 text-sm !shadow-none">
          {pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null} Запази
        </button>
        <button type="button" onClick={onSkip} className="btn btn-ghost h-9 px-3 text-sm">
          Не сега
        </button>
      </div>
    </div>
  );
}
