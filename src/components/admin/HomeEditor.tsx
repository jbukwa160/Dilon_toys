"use client";

import { useState } from "react";
import clsx from "clsx";
import { ArrowDown, ArrowUp, Copy, ExternalLink, Eye, EyeOff, Image as ImageIcon, LayoutTemplate, Megaphone, Plus, Trash2 } from "lucide-react";
import { saveHomeAction } from "@/app/admin/_actions/content";
import { COUNT_TOKEN, SECTION_LABELS, THEMES, type HeroSlide, type HomeContent, type PromoCard } from "@/lib/settings-types";
import { HeroSlideView, type CollageProduct } from "@/components/home/HeroSlideView";
import { PromoCards } from "@/components/home/PromoCards";
import { Card, Field, ImageField, SaveBar, TextArea, TextInput, ThemePicker, Toggle, useEditor } from "./ui";
import { LinkPicker, type LinkOptions } from "./LinkPicker";

const newId = () => Math.random().toString(36).slice(2, 10);

function ListControls({
  index,
  count,
  onMove,
  onDuplicate,
  onRemove,
  enabled,
  onToggle,
}: {
  index: number;
  count: number;
  onMove: (d: number) => void;
  onDuplicate?: () => void;
  onRemove: () => void;
  enabled: boolean;
  onToggle: () => void;
}) {
  const btn = "grid h-8 w-8 place-items-center rounded-lg border border-line bg-white hover:border-ink disabled:opacity-30";
  return (
    <>
      {/* Show / hide: small, next to the title. */}
      <button
        type="button"
        onClick={onToggle}
        className={clsx("grid h-8 w-8 shrink-0 place-items-center rounded-lg border", enabled ? "border-mint/40 bg-mint-soft text-mint" : "border-ink bg-ink text-white")}
        title={enabled ? "Показва се — натиснете, за да го скриете" : "Скрит — натиснете, за да се показва"}
        aria-label={enabled ? "Скрий" : "Покажи"}
        aria-pressed={!enabled}
      >
        {enabled ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
      </button>
      {/* Order, copy, delete: under the title on phones, at the side on wider screens. */}
      <div className="flex w-full justify-end gap-1 sm:w-auto">
        <button type="button" className={btn} disabled={index === 0} onClick={() => onMove(-1)} title="Премести нагоре" aria-label="Премести нагоре">
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" className={btn} disabled={index === count - 1} onClick={() => onMove(1)} title="Премести надолу" aria-label="Премести надолу">
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
        {onDuplicate ? (
          <button type="button" className={btn} onClick={onDuplicate} title="Направи копие" aria-label="Направи копие">
            <Copy className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          className={clsx(btn, "text-brand hover:border-brand")}
          onClick={() => confirm("Да изтрия ли този елемент?") && onRemove()}
          title="Изтрий"
          aria-label="Изтрий"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </>
  );
}

/** Picture for a banner / promo card row: its own image, else what the site shows, else its colour. */
function RowThumb({ src, background, wide, cover, dim }: { src: string | null; background: string; wide?: boolean; cover?: boolean; dim?: boolean }) {
  return (
    <span
      className={clsx("block shrink-0 overflow-hidden rounded-lg border border-line", wide ? "h-12 w-20" : "h-12 w-12", dim && "opacity-50")}
      style={{ background }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" referrerPolicy="no-referrer" className={clsx("h-full w-full", cover ? "object-cover" : "object-contain p-1")} />
      ) : null}
    </span>
  );
}

function move<T>(list: T[], i: number, d: number): T[] {
  const next = [...list];
  const [x] = next.splice(i, 1);
  next.splice(i + d, 0, x);
  return next;
}

function SlideEditor({
  slide,
  onChange,
  linkOptions,
  collage,
}: {
  slide: HeroSlide;
  onChange: (s: HeroSlide) => void;
  linkOptions: LinkOptions;
  collage: CollageProduct[];
}) {
  const set = <K extends keyof HeroSlide>(k: K, v: HeroSlide[K]) => onChange({ ...slide, [k]: v });
  const preview = {
    ...slide,
    eyebrow: slide.eyebrow.split(COUNT_TOKEN).join("38 000"),
    title: slide.title || "Заглавие на банера",
  };
  return (
    <div className="space-y-5">
      <Field group label="Вид банер">
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            { key: "text-image" as const, title: "Текст + снимка", text: "Заглавие, текст и бутони вляво, снимка вдясно. Без снимка — автоматичен колаж от играчки.", icon: LayoutTemplate },
            { key: "image-only" as const, title: "Готова картинка", text: "Качвате готов банер (напр. направен в Canva) — цялата картинка е връзка.", icon: ImageIcon },
          ].map(({ key, title, text, icon: Icon }) => (
            <label key={key} className={clsx("flex cursor-pointer gap-3 rounded-2xl border-2 p-4 transition", slide.layout === key ? "border-brand bg-brand-soft/40" : "border-line hover:border-ink-soft")}>
              <input type="radio" className="sr-only" checked={slide.layout === key} onChange={() => set("layout", key)} />
              <Icon className="h-6 w-6 shrink-0 text-brand" />
              <span>
                <span className="block font-black">{title}</span>
                <span className="text-sm text-ink-soft">{text}</span>
              </span>
            </label>
          ))}
        </div>
      </Field>

      {slide.layout === "text-image" ? (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Малък надпис над заглавието" hint={`По желание. ${COUNT_TOKEN} се заменя с броя на продуктите.`}>
              <TextInput value={slide.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} maxLength={120} />
            </Field>
            <Field group label="Цвят на фона">
              <ThemePicker value={slide.theme} onChange={(v) => set("theme", v)} />
            </Field>
            <Field label="Заглавие">
              <TextInput value={slide.title} onChange={(e) => set("title", e.target.value)} maxLength={120} placeholder="напр. Коледни подаръци" />
            </Field>
            <Field label="Оцветена част от заглавието" hint="Показва се след заглавието в различен цвят. По желание.">
              <TextInput value={slide.highlight} onChange={(e) => set("highlight", e.target.value)} maxLength={80} placeholder="напр. до -30%" />
            </Field>
          </div>
          <Field label="Текст под заглавието">
            <TextArea rows={2} value={slide.text} onChange={(e) => set("text", e.target.value)} maxLength={400} />
          </Field>
          <div className="grid gap-4 rounded-2xl bg-canvas p-4 md:grid-cols-2">
            <div className="space-y-2">
              <Field label="Главен бутон — надпис" hint="Оставете празно, ако не искате бутон.">
                <TextInput value={slide.primary.label} onChange={(e) => set("primary", { ...slide.primary, label: e.target.value })} maxLength={60} />
              </Field>
              <Field group label="Главен бутон — води към">
                <LinkPicker value={slide.primary.href} onChange={(href) => set("primary", { ...slide.primary, href })} options={linkOptions} />
              </Field>
            </div>
            <div className="space-y-2">
              <Field label="Втори бутон — надпис" hint="По желание.">
                <TextInput value={slide.secondary.label} onChange={(e) => set("secondary", { ...slide.secondary, label: e.target.value })} maxLength={60} />
              </Field>
              <Field group label="Втори бутон — води към">
                <LinkPicker value={slide.secondary.href} onChange={(href) => set("secondary", { ...slide.secondary, href })} options={linkOptions} />
              </Field>
            </div>
          </div>
          <Field group label="Снимка вдясно" hint="По желание. Ако няма снимка, се показват 4 популярни играчки.">
            <ImageField value={slide.image} onChange={(v) => set("image", v)} recommended="Препоръчително: PNG с прозрачен фон или квадратна снимка, около 1000×1000 px." />
          </Field>
        </>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            <Field group label="Банер за компютър">
              <ImageField value={slide.image} onChange={(v) => set("image", v)} recommended="Препоръчителен размер: 1920 × 640 px (широк)." />
            </Field>
            <Field group label="Банер за телефон (по желание)">
              <ImageField value={slide.mobileImage} onChange={(v) => set("mobileImage", v)} recommended="Препоръчителен размер: 1080 × 1080 px. Ако липсва, се ползва този за компютър." />
            </Field>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Описание на картинката" hint="За незрящи посетители и Google, напр. „Коледна промоция LEGO“.">
              <TextInput value={slide.title} onChange={(e) => set("title", e.target.value)} maxLength={120} />
            </Field>
            <Field group label="При натискане води към">
              <LinkPicker value={slide.href} onChange={(href) => set("href", href)} options={linkOptions} />
            </Field>
          </div>
        </>
      )}

      <div>
        <div className="mb-2 text-sm font-extrabold text-muted">Преглед</div>
        <div className="pointer-events-none overflow-hidden rounded-[2rem] border border-line">
          {/* zoom (unlike transform) also shrinks the space the preview takes */}
          <div style={{ zoom: 0.6 }}>
            <HeroSlideView slide={preview} collage={collage} />
          </div>
        </div>
      </div>
    </div>
  );
}

function PromoEditor({ card, onChange, linkOptions }: { card: PromoCard; onChange: (c: PromoCard) => void; linkOptions: LinkOptions }) {
  const set = <K extends keyof PromoCard>(k: K, v: PromoCard[K]) => onChange({ ...card, [k]: v });
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Field label="Заглавие">
        <TextInput value={card.title} onChange={(e) => set("title", e.target.value)} maxLength={80} />
      </Field>
      <Field label="Надпис на бутона" hint="По желание.">
        <TextInput value={card.buttonLabel} onChange={(e) => set("buttonLabel", e.target.value)} maxLength={40} />
      </Field>
      <Field label="Текст" className="md:col-span-2">
        <TextInput value={card.text} onChange={(e) => set("text", e.target.value)} maxLength={200} />
      </Field>
      <Field group label="Води към" className="md:col-span-2">
        <LinkPicker value={card.href} onChange={(href) => set("href", href)} options={linkOptions} />
      </Field>
      <Field group label="Цвят">
        <ThemePicker value={card.theme} onChange={(v) => set("theme", v)} />
      </Field>
      <Field group label="Снимка" hint="По желание. Ако води към категория или герой, снимката се взима автоматично.">
        <ImageField compact value={card.image} onChange={(v) => set("image", v)} />
      </Field>
    </div>
  );
}

export function HomeEditor({
  initial,
  linkOptions,
  collage,
  autoImages,
}: {
  initial: HomeContent;
  linkOptions: LinkOptions;
  collage: CollageProduct[];
  autoImages: Record<string, string | null>;
}) {
  const ed = useEditor(initial, saveHomeAction);
  const home = ed.value;
  const set = <K extends keyof HomeContent>(k: K, v: HomeContent[K]) => ed.setValue((h) => ({ ...h, [k]: v }));
  const [openSlide, setOpenSlide] = useState<string | null>(home.slides[0]?.id ?? null);
  const [openPromo, setOpenPromo] = useState<string | null>(null);

  const updateSlide = (i: number, s: HeroSlide) => set("slides", home.slides.map((x, j) => (j === i ? s : x)));
  const updatePromo = (i: number, c: PromoCard) => set("promos", home.promos.map((x, j) => (j === i ? c : x)));

  const addSlide = () => {
    const s: HeroSlide = {
      id: newId(),
      enabled: true,
      layout: "text-image",
      eyebrow: "",
      title: "Нов банер",
      highlight: "",
      text: "",
      image: "",
      mobileImage: "",
      href: "",
      theme: "sky",
      primary: { label: "Разгледай", href: "/igrachki" },
      secondary: { label: "", href: "" },
    };
    set("slides", [...home.slides, s]);
    setOpenSlide(s.id);
  };
  const addPromo = () => {
    const c: PromoCard = { id: newId(), enabled: true, title: "Нова карта", text: "", image: "", href: "/promotsii", buttonLabel: "Виж", theme: "mint" };
    set("promos", [...home.promos, c]);
    setOpenPromo(c.id);
  };

  const promoAuto = Object.fromEntries(home.promos.map((p) => [p.id, autoImages[p.href] ?? null]));
  const annTheme = THEMES[home.announcement.theme];

  return (
    <div className="space-y-6">
      <Card
        title={
          <span className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-brand" /> Обява над менюто
          </span>
        }
        description="Цветна лента най-отгоре на всяка страница — за кратки съобщения като „Безплатна доставка този уикенд“."
      >
        <div className="space-y-4">
          <Toggle checked={home.announcement.enabled} onChange={(v) => set("announcement", { ...home.announcement, enabled: v })} label="Показвай обявата" />
          {home.announcement.enabled ? (
            <>
              <Field label="Текст">
                <TextInput value={home.announcement.text} onChange={(e) => set("announcement", { ...home.announcement, text: e.target.value })} maxLength={200} />
              </Field>
              <Field group label="При натискане води към">
                <LinkPicker value={home.announcement.href} onChange={(href) => set("announcement", { ...home.announcement, href })} options={linkOptions} />
              </Field>
              <Field group label="Цвят">
                <ThemePicker value={home.announcement.theme} onChange={(v) => set("announcement", { ...home.announcement, theme: v })} />
              </Field>
              <div className={clsx("rounded-xl px-4 py-2 text-center text-sm font-extrabold", annTheme.dark ? "text-white" : "text-ink")} style={{ background: annTheme.background }}>
                {home.announcement.text || "Текст на обявата"}
              </div>
            </>
          ) : null}
        </div>
      </Card>

      <Card
        title="Банери (голямата снимка най-горе)"
        description="Ако има повече от един показан банер, те се сменят автоматично. Подредете ги със стрелките."
        actions={
          <button type="button" onClick={addSlide} className="btn btn-primary h-11 px-5 !shadow-none">
            <Plus className="h-4 w-4" /> Добави банер
          </button>
        }
      >
        <div className="space-y-3">
          {home.slides.map((s, i) => (
            <div key={s.id} className={clsx("rounded-2xl border-2", openSlide === s.id ? "border-ink" : "border-line")}>
              <div className="flex flex-wrap items-start gap-x-3 gap-y-2 p-3 sm:items-center">
                <button type="button" onClick={() => setOpenSlide(openSlide === s.id ? null : s.id)} className="flex min-w-0 flex-1 items-start gap-3 text-left sm:items-center">
                  <RowThumb
                    src={s.image || s.mobileImage || collage[0]?.image || null}
                    background={THEMES[s.theme].background}
                    wide
                    cover={!!(s.image || s.mobileImage)}
                    dim={!s.enabled}
                  />
                  <span className="min-w-0">
                    <span className="block break-words font-black leading-snug">
                      {[s.title, s.highlight].filter(Boolean).join(" ") || (s.layout === "image-only" ? "Готова картинка" : "Без заглавие")}
                    </span>
                    <span className="text-sm text-muted">
                      Банер {i + 1} · {s.enabled ? "показва се" : "скрит"} · {openSlide === s.id ? "натиснете, за да затворите" : "натиснете, за да редактирате"}
                    </span>
                  </span>
                </button>
                <ListControls
                  index={i}
                  count={home.slides.length}
                  enabled={s.enabled}
                  onToggle={() => updateSlide(i, { ...s, enabled: !s.enabled })}
                  onMove={(d) => set("slides", move(home.slides, i, d))}
                  onDuplicate={() => set("slides", [...home.slides.slice(0, i + 1), { ...s, id: newId(), title: `${s.title} (копие)` }, ...home.slides.slice(i + 1)])}
                  onRemove={() => set("slides", home.slides.filter((_, j) => j !== i))}
                />
              </div>
              {openSlide === s.id ? (
                <div className="border-t border-line p-4 md:p-5">
                  <SlideEditor slide={s} onChange={(v) => updateSlide(i, v)} linkOptions={linkOptions} collage={collage} />
                </div>
              ) : null}
            </div>
          ))}
          {!home.slides.length ? <p className="rounded-2xl border-2 border-dashed border-line p-6 text-center text-ink-soft">Няма банери — началната страница започва с промо картите.</p> : null}
          <Field label="Смяна на банерите на всеки">
            <select className="field w-60 cursor-pointer" value={home.autoplaySeconds} onChange={(e) => set("autoplaySeconds", Number(e.target.value))}>
              <option value={0}>Без автоматична смяна</option>
              {[4, 5, 6, 8, 10, 15].map((n) => (
                <option key={n} value={n}>
                  {n} секунди
                </option>
              ))}
            </select>
          </Field>
        </div>
      </Card>

      <Card
        title="Промо карти (под банерите)"
        description="До 6 цветни карти с връзки — към категория, марка, герой или промоция."
        actions={
          home.promos.length < 6 ? (
            <button type="button" onClick={addPromo} className="btn btn-primary h-11 px-5 !shadow-none">
              <Plus className="h-4 w-4" /> Добави карта
            </button>
          ) : null
        }
      >
        <div className="space-y-3">
          {home.promos.map((c, i) => (
            <div key={c.id} className={clsx("rounded-2xl border-2", openPromo === c.id ? "border-ink" : "border-line")}>
              <div className="flex flex-wrap items-start gap-x-3 gap-y-2 p-3 sm:items-center">
                <button type="button" onClick={() => setOpenPromo(openPromo === c.id ? null : c.id)} className="flex min-w-0 flex-1 items-start gap-3 text-left sm:items-center">
                  <RowThumb src={c.image || promoAuto[c.id] || null} background={THEMES[c.theme].background} cover={!!c.image} dim={!c.enabled} />
                  <span className="min-w-0">
                    <span className="block break-words font-black leading-snug">{c.title || "Без заглавие"}</span>
                    <span className="block break-all text-sm text-muted">
                      {c.enabled ? "показва се" : "скрита"} · {c.href || "без връзка"}
                    </span>
                  </span>
                </button>
                <ListControls
                  index={i}
                  count={home.promos.length}
                  enabled={c.enabled}
                  onToggle={() => updatePromo(i, { ...c, enabled: !c.enabled })}
                  onMove={(d) => set("promos", move(home.promos, i, d))}
                  onRemove={() => set("promos", home.promos.filter((_, j) => j !== i))}
                />
              </div>
              {openPromo === c.id ? (
                <div className="border-t border-line p-4 md:p-5">
                  <PromoEditor card={c} onChange={(v) => updatePromo(i, v)} linkOptions={linkOptions} />
                </div>
              ) : null}
            </div>
          ))}
          {home.promos.some((p) => p.enabled && p.title) ? (
            <div>
              <div className="mb-2 mt-4 text-sm font-extrabold text-muted">Преглед</div>
              <div className="pointer-events-none">
                <PromoCards cards={home.promos.filter((p) => p.enabled && p.title)} autoImage={promoAuto} />
              </div>
            </div>
          ) : null}
        </div>
      </Card>

      <Card title="Секция „Бонус програма“" description="Лилавият блок в средата на страницата.">
        <div className="space-y-4">
          <Toggle checked={home.bonus.enabled} onChange={(v) => set("bonus", { ...home.bonus, enabled: v })} label="Показвай секцията" />
          {home.bonus.enabled ? (
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Заглавие">
                <TextInput value={home.bonus.title} onChange={(e) => set("bonus", { ...home.bonus, title: e.target.value })} maxLength={120} />
              </Field>
              <Field label="Надпис на бутона">
                <TextInput value={home.bonus.buttonLabel} onChange={(e) => set("bonus", { ...home.bonus, buttonLabel: e.target.value })} maxLength={40} />
              </Field>
              <Field label="Текст" className="md:col-span-2">
                <TextArea rows={2} value={home.bonus.text} onChange={(e) => set("bonus", { ...home.bonus, text: e.target.value })} maxLength={400} />
              </Field>
              <Field group label="Бутонът води към" className="md:col-span-2">
                <LinkPicker value={home.bonus.href} onChange={(href) => set("bonus", { ...home.bonus, href })} options={linkOptions} />
              </Field>
            </div>
          ) : null}
        </div>
      </Card>

      <Card title="Какво да се показва на началната страница">
        <div className="grid gap-3 sm:grid-cols-2">
          {(Object.keys(SECTION_LABELS) as (keyof HomeContent["sections"])[]).map((k) => (
            <Toggle key={k} checked={home.sections[k]} onChange={(v) => set("sections", { ...home.sections, [k]: v })} label={SECTION_LABELS[k]} />
          ))}
        </div>
      </Card>

      <SaveBar
        dirty={ed.dirty}
        pending={ed.pending}
        status={ed.status}
        onSave={ed.submit}
        onReset={ed.reset}
        extra={
          <a href="/" target="_blank" rel="noopener" className="btn btn-ghost h-12 px-5">
            <ExternalLink className="h-4 w-4" /> Виж сайта
          </a>
        }
      />
    </div>
  );
}
