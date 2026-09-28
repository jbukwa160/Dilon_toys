import Link from "next/link";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { getMeta } from "@/lib/catalog";
import { getChatSettings, getHomeContent, getSettings } from "@/lib/settings";
import { THEMES, isExternalHref, publicSettings } from "@/lib/settings-types";
import { SettingsProvider } from "@/components/SettingsProvider";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { ChatWidget } from "@/components/chat/ChatWidget";

/** Header, footer, cart drawer and site-wide bars around every storefront page. */
export function ShopChrome({ children }: { children: React.ReactNode }) {
  const settings = getSettings();
  const { demoPrices } = getMeta();
  const { announcement } = getHomeContent();
  const annTheme = THEMES[announcement.theme];
  const { enabled: chatEnabled, ...chat } = getChatSettings();

  return (
    <SettingsProvider value={publicSettings(settings)}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-bold"
      >
        Към съдържанието
      </a>
      {demoPrices && settings.showDemoNotice ? (
        <div className="bg-grape px-4 py-1.5 text-center text-xs font-bold text-white">
          Демо версия: цените са ориентировъчни и ще бъдат заменени с реалните.
        </div>
      ) : null}
      {announcement.enabled && announcement.text ? (
        <div className={clsx("px-4 py-2 text-center text-sm font-extrabold", annTheme.dark ? "text-white" : "text-ink")} style={{ background: annTheme.background }}>
          {announcement.href ? (
            <Link href={announcement.href} target={isExternalHref(announcement.href) ? "_blank" : undefined} className="inline-flex items-center gap-1.5 hover:underline">
              {announcement.text} <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            announcement.text
          )}
        </div>
      ) : null}
      <Header />
      <main id="main" className="flex-1">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      {chatEnabled ? <ChatWidget config={chat} /> : null}
    </SettingsProvider>
  );
}
