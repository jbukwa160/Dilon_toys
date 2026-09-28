import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getChatSettings } from "@/lib/settings";
import { getConversation, listConversations, markReadByAdmin, messagesAfter, touchAdminPresence, unreadConversationCount } from "@/lib/chat";
import { PageHeader } from "@/components/admin/PageHeader";
import { ChatInbox } from "@/components/admin/ChatInbox";

export const metadata: Metadata = { title: "Чат" };

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  await requireAdmin();
  touchAdminPresence();
  const id = parseInt((await searchParams).c ?? "", 10);
  const conversation = Number.isInteger(id) && id > 0 ? getConversation(id) : null;
  if (conversation?.unreadAdmin) markReadByAdmin(conversation.id);
  return (
    <>
      <PageHeader
        title="Чат"
        description="Съобщенията от балончето в сайта. Отговорът ви се появява веднага при посетителя. Новите съобщения се виждат и в менюто вляво."
      />
      <ChatInbox
        initial={{
          unread: unreadConversationCount(),
          conversations: listConversations("open"),
          conversation: conversation ? { ...conversation, unreadAdmin: 0 } : null,
          messages: conversation ? messagesAfter(conversation.id) : [],
        }}
        initialSettings={getChatSettings()}
        initialId={conversation?.id ?? null}
      />
    </>
  );
}
