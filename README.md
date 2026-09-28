# Dilon Toys — online toy store

A Bulgarian-language e-commerce site for kids' toys, built from the Dilon product export
(`entire products_export (9).csv`), with an admin panel for non-technical staff.
Next.js 16 (App Router) + TypeScript + Tailwind CSS 4, data in SQLite (`better-sqlite3`, FTS5 search).

## Quick start

```bash
npm install
npm run import                          # CSV → data/catalog.db (≈15 s)
npm run admin:user -- --user admin      # create the admin login (prints a password)
npm run dev                             # http://localhost:3000  ·  admin: http://localhost:3000/admin
# production:
npm run build && npm start
```

`npm run import` reads `../entire products_export (9).csv` by default; pass another file with
`npm run import -- --csv "D:/path/to/export.csv"`. It can run while the site is up (it updates the
database in place).

## Admin panel (`/admin`)

Protected by a username and password. Everything is in Bulgarian with help text next to each field.

| Section | What the admin can do |
| --- | --- |
| Табло | Overview, demo-price warning, recent orders, shortcuts |
| Продукти | Search/filter; change price, promo (old) price, stock and visibility straight in the table; tick products (or "all found") and move them to another category or set their age / "for whom"; age, "for whom", safety warnings, batch and digital-passport link per product (with "back to automatic"); review filters for products without an age or with an estimated one; full editor for name, brand, category, description, photos (upload/reorder), EAN, colour, pieces; add new products; restore a product to the supplier data |
| Производители | GPSR data per brand — manufacturer name, postal address, e-mail, website and the EU responsible person — shown on every product of the brand; brands with the most products first, progress bar |
| Категории | The "Всички категории" list: re-order, rename, hide/show, short text, icon, colours, picture; subcategories (rename, re-order, hide, add, delete added ones); add new categories and delete them (their products move to a category you pick) |
| Цени и промоции | Download prices as Excel → edit → upload, with a preview before anything changes; start/stop a promotion or change prices by % for a category, brand or everything |
| Начална страница | Announcement bar, banner carousel (text + picture, or a ready-made picture), promo cards, bonus section, show/hide home sections — each button has a link picker (category, brand, hero, product, page, search or custom URL) |
| Идеи за подаръци | Hand-picked gifts "За момчета" / "За момичета", grouped in category sections: search & add products (they go to their category's section), drag & drop or arrows to reorder products and sections, rename sections, automatic suggestions, menu label / on-off |
| Меню | The bar under the search: "Всички категории" button (label, colour, on/off) and any number of items — links, dropdowns with up to 5 columns (lists of links or a picture), and the gift ideas item; each with its own style (plain / coloured text / coloured button / outline / gradient), colours from a colour wheel or typed as HEX/RGB, and an icon |
| Блог | Write, edit, schedule and delete articles: toolbar for headings, bold, lists, tips, links, pictures, product cards and buttons; live preview; cover picture or colour; topic; address, Google title/description with a Google preview and an SEO checklist |
| Поръчки | Orders list by status, order details, status + internal note |
| Чат | Conversations from the chat bubble: reply (with a product-link picker), close / re-open, delete; the visitor's phone/e-mail, page and device; settings (on/off, title, greeting, offline text, quick questions, ask for contact). Unread count in the menu, the tab title and on the dashboard |
| Настройки | Store name, contacts, shipping price mode (courier's live price or fixed prices), fixed shipping prices, free-shipping threshold, return days, points rate, company details, demo notice |
| Профил и парола | Change password (signs out other devices) |

Changes appear on the site immediately (cached pages are revalidated on save).

### Logins

```bash
npm run admin:user -- --user admin                    # create, or reset a forgotten password (random, printed once)
npm run admin:user -- --user admin --password "…"     # choose the password (10+ chars, letters and digits)
npm run admin:user -- --list                          # list admins
npm run admin:user -- --delete --user someone
```

Security: passwords are hashed with scrypt; sessions are random tokens (stored hashed) in an
httpOnly, SameSite=Lax cookie scoped to `/admin` (Secure over HTTPS), 12 h or 30 days with
"Запомни ме". After 5 wrong passwords from one address, or 20 for one username, sign-in is locked
for 15 minutes (the CLI reset clears it). Every admin page, server action and the price download
checks the session on the server. Uploaded files are checked by content (JPG/PNG/WEBP/GIF/AVIF only).
**Serve the site over HTTPS in production.**

## Delivery: Speedy and Econt

Courier accounts go in `.env.local` (never committed):

```bash
SPEEDY_USERNAME=…
SPEEDY_PASSWORD=…
ECONT_USERNAME=…
ECONT_PASSWORD=…
```

At checkout the customer chooses Econt office/Econtomat, Speedy office/locker, or address delivery
with either courier; offices and cities come live from the couriers (cached 12 h in `store.db`,
the last good copy is used if a courier is down). With the price mode "courier", the delivery price
is Speedy's/Econt's own quote for the order's weight (+ cash on delivery); if a quote fails, the fixed
price from Настройки is used. Orders are re-validated and re-priced on the server, and store the
courier office code for the waybill. The shipping endpoints are rate-limited per IP.

Econt office and city lists are public; Econt **prices** need a working Econt API login. The Econt
login is checked at most every 6 hours so wrong credentials can't lock the account. Waybills are not
created automatically yet.

## Gift ideas (`/podaratsi`)

"Идеи за подаръци" in the main menu opens a boys/girls split (blue / pink); `/podaratsi/momcheta`
and `/podaratsi/momicheta` list the gifts by category in the admin's order. Until the admin saves
their own list, popular in-stock toys from suitable categories are suggested automatically
(`src/lib/gifts.ts`). Picks are stored by SKU, so they survive re-imports.

## Chat bubble

Every shop page has a chat button (bottom right; full screen on phones). A visitor's conversation is
kept by an httpOnly cookie (only its hash is stored), so they see the history and replies when they come
back from the same browser. After they write, they are asked for a phone or e-mail (optional), so the
shop can answer after they leave; "Не сега" hides the question only until the chat is opened again (or a
new / re-opened conversation starts) — it keeps coming back until they leave a contact. The shop shows as "на линия" while an admin page is open
somewhere (the panel checks for new messages every 15 s). Messages are plain text (links are made
clickable); posting is limited per IP and only accepted from the shop's own pages.
Code: `src/lib/chat.ts`, `src/app/api/chat/route.ts`, `src/components/chat`, `src/components/admin/ChatInbox.tsx`.

## Blog (`/blog`)

Articles live in `store.db` and are written in Admin → Блог. Ten starter articles in Bulgarian
(`src/lib/blog-seed`) are added once, the first time the blog is used; deleting them later is final.
The text format is a small, safe subset of Markdown (`src/lib/blog-markup.ts`) — the editor's toolbar
writes it, so nobody has to learn it. For search engines each article has its own title/description,
canonical URL, Open Graph tags, `BlogPosting` + `BreadcrumbList` structured data (plus `FAQPage` when it
has a "Често задавани въпроси" section), a table of contents and links to categories and products;
articles are in `sitemap.xml`, the footer and (optionally) on the home page. Changing an article's
address keeps the old one working (permanent redirect). A future publish date schedules the article.

## Categories

The shop has 11 general groups (Бебешки играчки, Конструктори, Кукли и плюшени играчки, …); the more detailed
earlier categories are their subcategories and keep their addresses (`/kategoria/nastolni-igri` etc.). The two
that were merged away redirect (`plyusheni` → `plyusheni-igrachki`, `modeli-i-hobi` → `sglobyaemi-modeli`).
The importer still sorts with the detailed rules and `generalizeCategory()` (`src/lib/taxonomy.ts`) places the
result in a group; the same function moves older admin edits and catalogues over (once, on first open).

The built-in categories and the importer's sorting rules are in `src/lib/taxonomy.ts`. What the admin changes
in Admin → Категории is saved in `store.db` (settings `categories`) and merged on top (`src/lib/category-config.ts`):
order, names, texts, icons, colours, pictures, hidden flags and added categories/subcategories. The menu, the
phone menu, home tiles, footer, category pages, breadcrumbs, filters and the admin all read the merged list
(`src/lib/categories.ts`, `getCategories()` in `catalog.ts`). Addresses never change when a category is renamed.
Built-in categories can be hidden but not deleted (new products from the CSV are sorted into them); a hidden
category's page still works. Moving a product to another category is saved as a product edit, so it — and
everything above — survives `npm run import`.

## Age, "for whom" and safety information

The supplier file has no age or gender, and a barcode only identifies the manufacturer, so every product gets an
estimate (`src/lib/toy-infer.ts`): an age written in the name ("3+", "0м+", "6-36м", "4-7 години"), else brand /
series / type rules (LEGO themes, DUPLO, Playmobil, Nerf, Revell kits, puzzles by piece count…), else a typical age
for the subcategory. "For whom" is boys / girls only for clearly themed toys (Barbie, L.O.L., Nerf, Transformers…)
or doll / vehicle subcategories; everything else is for everyone. Safety warnings (texts in `src/lib/toy-info.ts`,
per Directive 2009/48/EC / EN 71) come from the age and keywords: under 36 months (small parts), latex balloons,
magnets, batteries, button batteries, water toys, protective equipment, cot/pram toys, cosmetics, chemistry,
supervision, toys in food.

These are estimates — check them against the packaging. The admin sees where each value came from and can change
it per product or in bulk; admin values are never overwritten (also not by `npm run import`). The shop shows the
age and warnings on the product page before the order, a separate-collection note for battery toys, and the GPSR
block (manufacturer, EU responsible person, model / EAN / batch, digital product passport link). Listings have
"Възраст" and "За кого" filters (`?vazrast=3-5`, `?za=momicheta`); an open-ended "3+" counts for 5 years there.

## Search by SKU and barcode

Every product search — the shop's search box, the search page, the admin product list and the
admin product pickers (gift ideas, link picker) — also finds products by SKU (`Dilon-108965`) and
barcode (EAN/UPC). Barcodes match with or without leading zeros (Excel drops them, scanners may add
one) and with spaces as printed under the bars. Exact code matches are listed first.

- Shop: a whole SKU or barcode that belongs to one product opens that product (so a barcode
  scanner + Enter goes straight to it). A bare number like `60322` stays a normal search, since it
  is more often a LEGO set number than a SKU.
- Admin: the SKU number alone (`108965`) and any part of a SKU or barcode work too.
- Price import matches SKUs in any letter case and barcodes with lost leading zeros.

Logic: `searchMatchSql` in `src/lib/search.ts`.

## Data files (`data/`)

| File | Contents | Back up? |
| --- | --- | --- |
| `catalog.db` | Products, rebuilt by `npm run import` | No — can be rebuilt |
| `store.db` | Orders, admin logins, settings, banners, menu, categories, manufacturers (GPSR), blog articles, chat conversations, **all admin product changes** | **Yes** |
| `uploads/` | Photos uploaded in the admin panel | **Yes** |

Admin product changes are stored in `store.db` and re-applied after every import, so a new
supplier CSV never overwrites prices or edits made in the panel. Products added in the panel
are kept too. Product ids and URLs stay the same across imports.

`DATA_DIR=/some/folder` points the app, importer and admin CLI at another data folder (e.g. a
test copy), leaving `data/` untouched.

## Prices

The export has **no price column**, so the importer generates deterministic **placeholder prices**
and the site shows a purple "Демо версия" bar. Real prices can come from:

- the admin panel (Цени и промоции → Excel file, or per product), or
- a `Price` / `Old Price` column in the CSV, or `data/prices.csv` (`sku,price,old_price`, see
  `data/prices.example.csv`), then `npm run import`.

The bar disappears when no visible product has a placeholder price (or turn it off in Настройки).

## What gets imported

- Only toy categories (`Toys & Games`, `Играчки`, `Puzzles & Board Games`, `LEGO & Construction Sets`,
  `Настолни игри, хоби и пъзели`, `Model Kits & Hobby`, and smaller toy categories).
- **Safety filter**: the export files adult products under toy categories. The importer blocks
  (1) any brand that also sells in the `Sexual Wellness` category, (2) images from sex-shop hosts,
  and (3) an adult/alcohol keyword list. It also excludes non-toys (supplements, cosmetics, phones,
  baby bottles, etc.).
- Products without an image are skipped (use `--include-no-image` to keep them).
- Duplicates (same EAN or name) are merged, keeping the in-stock/most complete row.
- Every product is classified into the store's category tree and tagged with "heroes"
  (Paw Patrol, Frozen, Marvel…). Rules live in `src/lib/taxonomy.ts`.

`data/import-report.txt` lists counts per category and random samples after each import.

## Where things are

| What | Where |
| --- | --- |
| Default store settings, home content, menu (until changed in the admin) | `src/lib/settings-types.ts` |
| Site URL (`NEXT_PUBLIC_SITE_URL`), currency, locale | `src/config/site.ts` |
| Built-in categories, keyword rules, heroes, brand clean-up | `src/lib/taxonomy.ts` |
| Categories as edited in the admin (merge, look-ups) | `src/lib/category-config.ts`, `src/lib/categories.ts` |
| Age / for whom / warnings (lists, texts, estimates) | `src/lib/toy-info.ts`, `src/lib/toy-infer.ts` |
| Manufacturers (GPSR) | `src/lib/manufacturers.ts` |
| CSV importer / admin CLI | `scripts/import-catalog.ts`, `scripts/admin-user.ts` |
| Catalogue queries (listing, filters, search, facets) | `src/lib/catalog.ts` |
| Search words / SKU / barcode matching | `src/lib/search.ts` |
| Blog (queries, text format, starter articles) | `src/lib/blog.ts`, `src/lib/blog-markup.ts`, `src/lib/blog-seed` |
| Chat | `src/lib/chat.ts`, `src/app/api/chat/route.ts` |
| Catalogue writes shared by admin + importer | `src/lib/catalog-write.ts` |
| Auth, sessions, lockout | `src/lib/auth.ts` |
| Admin pages / server actions / components | `src/app/admin`, `src/app/admin/_actions`, `src/components/admin` |
| Storefront pages | `src/app/(shop)` |

## Before going live

- Real prices, contacts and company details (all editable in the admin panel)
- HTTPS, `NEXT_PUBLIC_SITE_URL`, and regular backups of `data/store.db` + `data/uploads/`
- Have the terms/privacy texts reviewed (they are templates)
- Order notification emails (orders are visible in the admin panel, but no email is sent yet)
- Fix the Econt API login (currently rejected by Econt), then Econt prices become live automatically
- Creating Speedy/Econt waybills from the order page (the office codes are already stored)
- Points redemption at checkout needs customer accounts; points are shown and stored per order
- Product images from the CSV are hotlinked from supplier sites; consider mirroring them
