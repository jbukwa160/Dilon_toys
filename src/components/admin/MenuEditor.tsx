"use client";

import { useState } from "react";
import clsx from "clsx";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Ban,
  ChevronDown,
  Columns3,
  ExternalLink,
  Gift,
  Image as ImageIcon,
  LayoutGrid,
  Link as LinkIcon,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { saveMenuAction } from "@/app/admin/_actions/content";
import {
  DEFAULT_APPEARANCE,
  DEFAULT_MENU,
  MENU_ICONS,
  MENU_STYLES,
  contrastText,
  type MenuAppearance,
  type MenuColumn,
  type MenuConfig,
  type MenuItem,
  type MenuItemKind,
  type MenuStyle,
} from "@/lib/settings-types";
import { MenuLabel, menuItemProps } from "@/components/layout/MenuLabel";
import { MENU_ICON_COMPONENTS } from "@/components/layout/MenuIcon";
import { MenuColumnView } from "@/components/layout/NavDropdown";
import { Card, ColorField, Field, ImageField, SaveBar, TextInput, Toggle, useEditor } from "./ui";
import { LinkPicker, type LinkOptions } from "./LinkPicker";

const newId = () => Math.random().toString(36).slice(2, 10);

const KIND_INFO: Record<MenuItemKind, { label: string; icon: typeof LinkIcon; help: string }> = {
  link: { label: "Връзка", icon: LinkIcon, help: "Бутон, който води към страница, категория, марка, продукт…" },
  dropdown: { label: "Падащо меню с колони", icon: Columns3, help: "При посочване се отваря панел с колони от връзки или снимки." },
  gifts: { label: "Идеи за подаръци", icon: Gift, help: "Панелът „За момчета / За момичета“. Подаръците се избират от страница „Идеи за подаръци“." },
};

function move<T>(list: T[], i: number, d: number): T[] {
  const next = [...list];
  const [x] = next.splice(i, 1);
  next.splice(i + d, 0, x);
  return next;
}

const emptyColumn = (): MenuColumn => ({ id: newId(), kind: "links", title: "", href: "", image: "", links: [] });

function StylePicker({ label, appearance, onChange }: { label: string; appearance: MenuAppearance; onChange: (s: MenuStyle) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Вид на бутона">
      {(Object.keys(MENU_STYLES) as MenuStyle[]).map((s) => {
        const a = { ...appearance, style: s };
        const p = menuItemProps(a);
        return (
          <button
            key={s}
            type="button"
            role="radio"
            aria-checked={appearance.style === s}
            onClick={() => onChange(s)}
            className={clsx("flex flex-col items-center gap-1.5 rounded-2xl border-2 bg-white p-2.5 transition", appearance.style === s ? "border-ink" : "border-line hover:border-ink-soft")}
          >
            <span className={clsx(p.className, "pointer-events-none !text-sm")} style={p.style}>
              <MenuLabel label={label || "Пример"} appearance={a} />
            </span>
            <span className="text-xs font-bold text-muted">{MENU_STYLES[s]}</span>
          </button>
        );
      })}
    </div>
  );
}

function IconPicker({ value, onChange }: { value: MenuAppearance["icon"]; onChange: (v: MenuAppearance["icon"]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Иконка">
      {MENU_ICONS.map((name) => {
        const Icon = name === "none" ? Ban : MENU_ICON_COMPONENTS[name];
        return (
          <button
            key={name}
            type="button"
            role="radio"
            aria-checked={value === name}
            aria-label={name === "none" ? "Без иконка" : name}
            title={name === "none" ? "Без иконка" : name}
            onClick={() => onChange(name)}
            className={clsx("grid h-10 w-10 place-items-center rounded-xl border-2 transition", value === name ? "border-ink bg-ink text-white" : "border-line bg-white hover:border-ink-soft")}
          >
            <Icon className="h-4.5 w-4.5" />
          </button>
        );
      })}
    </div>
  );
}

function ColumnEditor({
  column: c,
  index,
  count,
  onChange,
  onMove,
  onRemove,
  linkOptions,
}: {
  column: MenuColumn;
  index: number;
  count: number;
  onChange: (c: MenuColumn) => void;
  onMove: (d: number) => void;
  onRemove: () => void;
  linkOptions: LinkOptions;
}) {
  const set = <K extends keyof MenuColumn>(k: K, v: MenuColumn[K]) => onChange({ ...c, [k]: v });
  return (
    <div className="rounded-2xl border-2 border-line bg-canvas/60 p-4" role="group" aria-label={`Колона ${index + 1}`}>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="font-black">Колона {index + 1}</span>
        <div className="flex overflow-hidden rounded-full border-2 border-line bg-white text-sm font-bold" role="radiogroup" aria-label="Вид колона">
          {(["links", "image"] as const).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={c.kind === k}
              onClick={() => set("kind", k)}
              className={clsx("flex items-center gap-1 px-3 py-1", c.kind === k ? "bg-ink text-white" : "hover:bg-canvas")}
            >
              {k === "links" ? <LinkIcon className="h-3.5 w-3.5" /> : <ImageIcon className="h-3.5 w-3.5" />} {k === "links" ? "Връзки" : "Снимка"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex gap-1">
          <button type="button" disabled={index === 0} onClick={() => onMove(-1)} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white hover:border-ink disabled:opacity-30" aria-label="Колоната наляво">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white hover:border-ink disabled:opacity-30" aria-label="Колоната надясно">
            <ArrowRight className="h-4 w-4" />
          </button>
          <button type="button" onClick={() => confirm("Да изтрия ли колоната?") && onRemove()} className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white text-brand hover:border-brand" aria-label="Изтрий колоната">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {c.kind === "links" ? (
        <div className="space-y-3">
          <Field label="Заглавие на колоната" hint="По желание, напр. „По възраст“.">
            <TextInput value={c.title} onChange={(e) => set("title", e.target.value)} maxLength={60} />
          </Field>
          <Field group label="Заглавието води към (по желание)">
            <LinkPicker value={c.href} onChange={(h) => set("href", h)} options={linkOptions} />
          </Field>
          <div>
            <div className="mb-1.5 text-sm font-extrabold">Връзки</div>
            <ol className="space-y-2">
              {c.links.map((l, li) => (
                <li key={l.id} className="rounded-xl border border-line bg-white p-3">
                  <div className="flex items-center gap-2">
                    <TextInput
                      value={l.label}
                      onChange={(e) => set("links", c.links.map((x) => (x.id === l.id ? { ...x, label: e.target.value } : x)))}
                      placeholder="Надпис, напр. LEGO Friends"
                      maxLength={60}
                      aria-label={`Надпис на връзка ${li + 1}`}
                    />
                    <button type="button" disabled={li === 0} onClick={() => set("links", move(c.links, li, -1))} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-canvas disabled:opacity-30" aria-label="Нагоре">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={li === c.links.length - 1}
                      onClick={() => set("links", move(c.links, li, 1))}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg hover:bg-canvas disabled:opacity-30"
                      aria-label="Надолу"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => set("links", c.links.filter((x) => x.id !== l.id))} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-brand hover:bg-brand-soft" aria-label="Премахни връзката">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2">
                    <LinkPicker value={l.href} onChange={(h) => set("links", c.links.map((x) => (x.id === l.id ? { ...x, href: h } : x)))} options={linkOptions} allowEmpty={false} />
                  </div>
                </li>
              ))}
            </ol>
            {c.links.length < 15 ? (
              <button type="button" onClick={() => set("links", [...c.links, { id: newId(), label: "", href: "/igrachki" }])} className="btn btn-ghost mt-2 h-10 px-4 text-sm">
                <Plus className="h-4 w-4" /> Добави връзка
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Field group label="Снимка">
            <ImageField compact value={c.image} onChange={(v) => set("image", v)} recommended="Препоръчително: хоризонтална снимка, около 800 × 600 px." />
          </Field>
          <Field label="Надпис под снимката">
            <TextInput value={c.title} onChange={(e) => set("title", e.target.value)} maxLength={60} />
          </Field>
          <Field group label="Снимката води към">
            <LinkPicker value={c.href} onChange={(h) => set("href", h)} options={linkOptions} />
          </Field>
        </div>
      )}
    </div>
  );
}

function ItemEditor({ item, onChange, linkOptions, giftsTaken }: { item: MenuItem; onChange: (i: MenuItem) => void; linkOptions: LinkOptions; giftsTaken: boolean }) {
  const set = <K extends keyof MenuItem>(k: K, v: MenuItem[K]) => onChange({ ...item, [k]: v });
  const setLook = (patch: Partial<MenuAppearance>) => onChange({ ...item, appearance: { ...item.appearance, ...patch } });
  const a = item.appearance;
  const accent = a.style === "plain" ? "#1d2340" : a.color;
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Надпис">
          <TextInput value={item.label} onChange={(e) => set("label", e.target.value)} maxLength={40} invalid={!item.label.trim()} />
        </Field>
        <Field label="Вид">
          <select
            className="field cursor-pointer"
            value={item.kind}
            onChange={(e) => {
              const kind = e.target.value as MenuItemKind;
              onChange({ ...item, kind, columns: kind === "dropdown" && !item.columns.length ? [emptyColumn()] : item.columns });
            }}
          >
            {(Object.keys(KIND_INFO) as MenuItemKind[]).map((k) => (
              <option key={k} value={k} disabled={k === "gifts" && giftsTaken && item.kind !== "gifts"}>
                {KIND_INFO[k].label}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <p className="-mt-2 text-sm text-muted">{KIND_INFO[item.kind].help}</p>

      {item.kind === "link" ? (
        <Field group label="Води към">
          <LinkPicker value={item.href} onChange={(h) => set("href", h)} options={linkOptions} allowEmpty={false} />
        </Field>
      ) : item.kind === "dropdown" ? (
        <Field group label="Връзка „Виж всички“ долу в панела (по желание)">
          <LinkPicker value={item.href} onChange={(h) => set("href", h)} options={linkOptions} />
        </Field>
      ) : null}

      <div className="rounded-2xl bg-canvas p-4">
        <div className="mb-3 text-sm font-black uppercase tracking-wide text-muted">Външен вид</div>
        <div className="space-y-4">
          <Field group label="Вид на бутона">
            <StylePicker label={item.label} appearance={a} onChange={(style) => setLook({ style })} />
          </Field>
          {a.style !== "plain" ? (
            <div className={clsx("grid gap-4", a.style === "gradient" && "lg:grid-cols-2")}>
              <Field group label={a.style === "pill" ? "Цвят на бутона" : a.style === "gradient" ? "Начален цвят" : "Цвят"}>
                <ColorField value={a.color} onChange={(color) => setLook({ color })} />
              </Field>
              {a.style === "gradient" ? (
                <Field group label="Краен цвят">
                  <ColorField value={a.color2} onChange={(color2) => setLook({ color2 })} />
                </Field>
              ) : null}
            </div>
          ) : null}
          {a.style === "pill" ? (
            <p className="text-sm text-muted">Цветът на текста се избира автоматично ({contrastText(a.color) === "#ffffff" ? "бял" : "тъмен"}), за да се чете добре.</p>
          ) : null}
          <Field group label="Иконка (по желание)">
            <IconPicker value={a.icon} onChange={(icon) => setLook({ icon })} />
          </Field>
        </div>
      </div>

      {item.kind === "dropdown" ? (
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-lg font-black">Колони в падащото меню</div>
              <p className="text-sm text-muted">До 5 колони: списък с връзки или снимка с връзка.</p>
            </div>
            {item.columns.length < 5 ? (
              <button type="button" onClick={() => set("columns", [...item.columns, emptyColumn()])} className="btn btn-primary h-10 px-4 text-sm !shadow-none">
                <Plus className="h-4 w-4" /> Добави колона
              </button>
            ) : null}
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {item.columns.map((c, ci) => (
              <ColumnEditor
                key={c.id}
                column={c}
                index={ci}
                count={item.columns.length}
                onChange={(nc) => set("columns", item.columns.map((x) => (x.id === c.id ? nc : x)))}
                onMove={(d) => set("columns", move(item.columns, ci, d))}
                onRemove={() => set("columns", item.columns.filter((x) => x.id !== c.id))}
                linkOptions={linkOptions}
              />
            ))}
          </div>
          {item.columns.some((c) => (c.kind === "image" ? c.image : c.links.length || c.title)) ? (
            <div className="mt-4">
              <div className="mb-2 text-sm font-extrabold text-muted">Преглед на панела</div>
              <div className="pointer-events-none rounded-3xl border border-line bg-white p-6 shadow-[var(--shadow-card)]">
                <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.max(1, item.columns.length)}, minmax(0, 1fr))` }}>
                  {item.columns.map((c) => (
                    <MenuColumnView key={c.id} column={c} accent={accent} />
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function newItem(kind: MenuItemKind): MenuItem {
  if (kind === "gifts") return { ...DEFAULT_MENU.items.find((i) => i.kind === "gifts")!, id: newId() };
  return {
    id: newId(),
    kind,
    label: kind === "dropdown" ? "Ново меню" : "Нова връзка",
    href: kind === "link" ? "/igrachki" : "",
    appearance: { ...DEFAULT_APPEARANCE },
    columns: kind === "dropdown" ? [emptyColumn()] : [],
  };
}

export function MenuEditor({ initial, linkOptions, giftsEnabled }: { initial: MenuConfig; linkOptions: LinkOptions; giftsEnabled: boolean }) {
  const ed = useEditor(initial, saveMenuAction);
  const menu = ed.value;
  const [open, setOpen] = useState<string | null>(null);
  const setItems = (fn: (items: MenuItem[]) => MenuItem[]) => ed.setValue((m) => ({ ...m, items: fn(m.items) }));
  const giftsTaken = menu.items.some((i) => i.kind === "gifts");

  const add = (kind: MenuItemKind) => {
    const it = newItem(kind);
    setItems((items) => [...items, it]);
    setOpen(it.id);
  };

  return (
    <div className="space-y-6">
      <Card title="Преглед" description="Така изглежда менюто в сайта. Натиснете елемент, за да го редактирате.">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-white p-3">
          {menu.categories.show ? (
            <span className="flex h-11 items-center gap-2 whitespace-nowrap rounded-full px-5 font-extrabold" style={{ background: menu.categories.color, color: contrastText(menu.categories.color) }}>
              <LayoutGrid className="h-5 w-5" /> {menu.categories.label}
            </span>
          ) : null}
          {menu.items.map((i) => {
            const p = menuItemProps(i.appearance, open === i.id);
            return (
              <button key={i.id} type="button" onClick={() => setOpen(open === i.id ? null : i.id)} className={clsx(p.className, open === i.id && "ring-2 ring-sky")} style={p.style}>
                <MenuLabel label={i.label || "…"} appearance={i.appearance} />
                {i.kind !== "link" ? <ChevronDown className="h-4 w-4 opacity-60" /> : null}
              </button>
            );
          })}
        </div>
        {giftsTaken && !giftsEnabled ? <p className="mt-2 text-sm font-bold text-brand">„Идеи за подаръци“ е изключено от страница „Идеи за подаръци“ и няма да се показва.</p> : null}
      </Card>

      <Card title="Бутон „Всички категории“">
        <div className="space-y-4">
          <Toggle checked={menu.categories.show} onChange={(show) => ed.setValue((m) => ({ ...m, categories: { ...m.categories, show } }))} label="Показвай бутона" />
          {menu.categories.show ? (
            <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
              <Field label="Надпис на бутона">
                <TextInput value={menu.categories.label} onChange={(e) => ed.setValue((m) => ({ ...m, categories: { ...m.categories, label: e.target.value } }))} maxLength={40} />
              </Field>
              <Field group label="Цвят на бутона">
                <ColorField value={menu.categories.color} onChange={(color) => ed.setValue((m) => ({ ...m, categories: { ...m.categories, color } }))} />
              </Field>
            </div>
          ) : null}
        </div>
      </Card>

      <Card
        title="Елементи на менюто"
        description="Добавяйте връзки и падащи менюта с колони. Подредете ги със стрелките."
        actions={
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => add("link")} className="btn btn-primary h-11 px-4 !shadow-none">
              <Plus className="h-4 w-4" /> Връзка
            </button>
            <button type="button" onClick={() => add("dropdown")} className="btn btn-primary h-11 px-4 !shadow-none">
              <Columns3 className="h-4 w-4" /> Падащо меню
            </button>
            {!giftsTaken ? (
              <button type="button" onClick={() => add("gifts")} className="btn btn-ghost h-11 px-4">
                <Gift className="h-4 w-4" /> Идеи за подаръци
              </button>
            ) : null}
          </div>
        }
      >
        <ol className="space-y-3">
          {menu.items.map((item, i) => {
            const KindIcon = KIND_INFO[item.kind].icon;
            const p = menuItemProps(item.appearance);
            const isOpen = open === item.id;
            return (
              <li key={item.id} className={clsx("rounded-2xl border-2", isOpen ? "border-ink" : "border-line")}>
                <div className="flex flex-wrap items-center gap-3 p-3">
                  <button type="button" onClick={() => setOpen(isOpen ? null : item.id)} className="flex min-w-0 flex-1 items-center gap-3 text-left" aria-expanded={isOpen}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-canvas">
                      <KindIcon className="h-5 w-5" />
                    </span>
                    <span className={clsx(p.className, "pointer-events-none")} style={p.style}>
                      <MenuLabel label={item.label || "Без надпис"} appearance={item.appearance} />
                    </span>
                    <span className="hidden text-sm text-muted sm:inline">
                      {KIND_INFO[item.kind].label}
                      {item.kind === "dropdown" ? ` · ${item.columns.length} ${item.columns.length === 1 ? "колона" : "колони"}` : ""}
                    </span>
                    <ChevronDown className={clsx("ml-auto h-5 w-5 text-muted transition", isOpen && "rotate-180")} />
                  </button>
                  <div className="flex gap-1.5">
                    <button type="button" disabled={i === 0} onClick={() => setItems((items) => move(items, i, -1))} className="grid h-9 w-9 place-items-center rounded-lg border border-line hover:border-ink disabled:opacity-30" aria-label="По-напред в менюто">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={i === menu.items.length - 1}
                      onClick={() => setItems((items) => move(items, i, 1))}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-line hover:border-ink disabled:opacity-30"
                      aria-label="По-назад в менюто"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => confirm(`Да премахна ли „${item.label}“ от менюто?`) && setItems((items) => items.filter((x) => x.id !== item.id))}
                      className="grid h-9 w-9 place-items-center rounded-lg border border-line text-brand hover:border-brand"
                      aria-label={`Премахни ${item.label}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {isOpen ? (
                  <div className="border-t border-line p-4 md:p-5">
                    <ItemEditor item={item} onChange={(it) => setItems((items) => items.map((x) => (x.id === item.id ? it : x)))} linkOptions={linkOptions} giftsTaken={giftsTaken} />
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
        {!menu.items.length ? <p className="rounded-2xl border-2 border-dashed border-line p-6 text-center font-bold text-ink-soft">Менюто е празно. Добавете връзка.</p> : null}
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
