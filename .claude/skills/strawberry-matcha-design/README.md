# Strawberry Matcha — Design System

A design system for **Strawberry Matcha**, a sweet, soft, playful dating app. The brand is built on the literal flavor pairing: **strawberry pinks meet matcha greens** on warm cream backgrounds. Glass cards, rounded forms, gentle gradients. The vibe is dating-app meets neighborhood café — friendly, casual, never edgy.

This system is the canonical source for fonts, colors, gradients, and the UI kit that mirrors the production Next.js app.

## Sources

- **Codebase:** local mount `matcha/` — Next.js 15 (App Router), React 19, Tailwind v4, shadcn/ui ("new-york" style), Radix primitives, lucide-react icons. Tokens live in `matcha/src/app/globals.css`.
- **Product spec:** `matcha/prds/` — eight PRDs covering registration, profile, browsing, search, profile view, chat, notifications, bonus features. The app is a 42-style Matcha dating app.

There is one product: a **single responsive web app** (mobile-first, also desktop). No marketing site, docs site, or native app exists in the codebase.

## Index

- `README.md` — this file (context, content fundamentals, visual foundations, iconography)
- `SKILL.md` — Agent Skills entrypoint
- `colors_and_type.css` — all CSS variables (brand colors, semantic tokens, type, radius, shadows) + brand utility classes (`.strawberry-matcha-bg`, `.glass-effect`, gradient text, etc.)
- `assets/` — logos, illustrative SVGs, sample avatars, hero imagery
- `preview/` — design-system preview cards rendered in the Design System tab
- `ui_kits/web/` — the web UI kit: components + interactive `index.html`

---

## CONTENT FUNDAMENTALS

**Voice & tone**
- **Sweet, warm, casual.** The brand leans hard into the strawberry-matcha metaphor — copy uses food/brewing language as flavor without overdoing it.
- **You-first.** All copy addresses the user as "you" / "your". Never "we" lecturing the user.
- **Encouraging, never urgent.** No FOMO, no scarcity tactics, no all-caps. Errors are soft and helpful.
- **Sentence case.** Headers and buttons use Sentence case, not Title Case. Exceptions: the brand wordmark "Strawberry Matcha" is always Title Case.

**Examples from the app**

| Surface | Copy |
|---|---|
| Hero headline | "Sweet Connections, Fresh Starts" |
| Hero subhead | "Like the perfect blend of strawberry and matcha, find your perfect match. Sweet, refreshing, and uniquely yours." |
| Sign-in subhead | "Welcome back! Let's brew some sweet connections." |
| Register subhead | "Join thousands finding love every day!" |
| Profile header | "Keep your profile up to date to find better matches" |
| CTA | "Start Your Journey" / "Sign In" / "Sign Up" / "Continue to Sign In" |
| Footer | "© 2025 Strawberry Matcha. Made with 🍓 and 🍵 for finding love." |
| Feature card titles | "Sweet Matching" • "Fresh Conversations" • "Authentic Love" |

**Style rules**
- **Apostrophes are real** (`don't`, `let's`) — escape them in JSX as `&apos;`.
- **Buttons are short** — 1–3 words, action-led ("Sign In", "Start Your Journey", "Continue to Sign In"). The home CTA "Start Your Journey" is the one place where a verb-first three-word button is allowed.
- **Errors are gentle.** "Please check your information and try again", "Unable to sign in. Please try again." Never "Invalid input" or "Error 401".
- **Success is celebratory.** "Account Created!" with an exclamation, paired with a green check.
- **Emoji** — used **only** in the footer and in marketing copy as flavor (🍓 strawberry, 🍵 matcha). They never appear in UI controls, error messages, or product chrome.

---

## VISUAL FOUNDATIONS

### Color
- **Two brand families:** Strawberry (pink) and Matcha (green). They appear together as a 3-stop gradient (`strawberry → matcha → strawberry`) on every primary CTA and the wordmark.
- **Backgrounds are warm cream**, never pure white. The full-page background is a 4-stop diagonal gradient (`#f8f5f2 → #e8f5e8 → #fce7e7 → #f5f0f8`) — the `.strawberry-matcha-bg` utility.
- **Cards are white with `bg-card-border` (`#ffe4e6`, strawberry-100) borders.** Often glassy: `rgba(255,255,255,0.85)` over the page gradient with `backdrop-filter: blur(10px)`.
- **Semantic colors** map to brand: success = matcha-600, link = strawberry-600, link-alt = matcha-700, destructive = standard red.

### Type
- **Sans-serif: Geist** (loaded via Next.js `next/font/google`). Mono: **Geist Mono**. No display face, no serif.
- Weight scale: 400 / 500 / 600 / 700. Hero text uses 700.
- Casing: Sentence case everywhere except the brand wordmark.
- Line height is generous (1.5–1.625 on body) — the design breathes.

### Spacing
- Tailwind defaults (4px grid). Cards typically use `p-6` (24px). Forms stack with `gap-3` (12px) between rows. Hero sections use `mb-12 / mt-16` for breathing room.

### Backgrounds
- **Full-bleed page gradient** (cream → matcha → strawberry → lavender-cream) on every authenticated and marketing page.
- No textures, no patterns, no hand-drawn illustrations, no photography in chrome. Imagery only appears as user-uploaded profile photos.
- Glass cards float over the gradient on the home page; solid white cards on form pages (login/register/profile).

### Animation
- `transition-all duration-200` or `duration-300` is the default. Easing: default CSS ease.
- `hover:opacity-90` on buttons. `hover:shadow-xl` on hero CTAs.
- Form errors animate in: `animate-in fade-in slide-in-from-top-1 duration-150` (from `tw-animate-css`).
- Success card: `animate-in fade-in zoom-in-95 duration-300`.
- Heart icon on the "like" button uses `group-hover:scale-125 transition-all duration-200`.
- Reject "X" icon uses `group-hover:rotate-90 transition-transform duration-200`.
- No bouncy springs. No long sequences. Animation is decoration, never the message.

### Hover & press states
- **Primary buttons:** `hover:opacity-90`. No color change.
- **Ghost buttons:** color shift on hover (`text-gray-600 hover:text-green-600`).
- **Icon buttons (like/dislike):** background color shift (`bg-gray-100 hover:bg-red-400` for X, `bg-[#94b894] hover:bg-[#7ba07b]` for ❤).
- **Avatar:** `ring-2 ring-transparent hover:ring-pink-200`.
- **Press state:** none custom — relies on browser default.

### Borders
- Default border: `#e5e7eb` (gray-200).
- Card borders: `#ffe4e6` (strawberry-100) or `#bbf7d0` (matcha-200, on the "Fresh Conversations" card).
- Form inputs: `border-gray-300 rounded-sm` (4px). Inputs are short — 40px tall — and sit inside a wrapping div that hosts the icon.
- Focus ring: `ring/50` at 3px (shadcn default).

### Shadow
- `shadow-xs` — buttons, inputs (default shadcn).
- `shadow-sm` — cards.
- `shadow-lg` and `shadow-xl` — hero CTAs and elevated cards. Shadow tints carry a subtle pink (`rgba(244,114,182,0.15)` and up) so they feel warm, not gray.
- No inner shadows.

### Corner radii
- `--radius: 1rem` is the seed (16px).
- **Cards:** `rounded-xl` (12px) or `rounded-2xl` (16px).
- **Buttons:** `rounded-md` (default shadcn) or **`rounded-full`** for hero CTAs and the like/dislike circles.
- **Inputs:** `rounded-sm` (4px) — intentionally tighter than cards.
- **Avatars / icon buttons:** `rounded-full`.

### Transparency & blur
- Glass cards (`.glass-effect`) use `rgba(255,255,255,0.85) + backdrop-filter: blur(10px)` over the page gradient. Used on the home feature cards.
- No transparency on text or icons.

### Layout rules
- The page wraps in a `container mx-auto` and is `flex flex-col` with `NavigationBar` (8vh) → `main` (flex-1) → `Footer` (6vh).
- Forms center vertically and horizontally; the form card is `md:w-[400px]`.
- Mobile-first; breakpoints follow Tailwind (`md:` ≥ 768px). The nav and hero downscale aggressively on mobile (`text-md` vs `md:text-2xl`).

### Imagery vibe
- Profile photos are the only photography. They're displayed in 60/40 carousel cards (image top, bio + tags below) — see `home/page.tsx`.
- No filters, no grain, no color grading. Photos are user-supplied and shown straight.

### Cards
- **Profile cards:** white, `rounded-xl`, `shadow-sm`. Image fills 60% of the card; bio + tags fill 40%.
- **Feature cards (home):** glass, `rounded-2xl`, `border` in strawberry-100 or matcha-200, with a centered icon → gradient title → muted paragraph stack.
- **Form cards:** white, `rounded-xl`, `md:w-[400px]`, vertically centered on the page.

---

## ICONOGRAPHY

- **Library:** [Lucide](https://lucide.dev/) via `lucide-react@0.540`. shadcn/ui's default icon library; configured in `components.json`.
- **Style:** monoline, 2px stroke, 24×24 viewport, currentColor stroke.
- **Sizes:** `h-4 w-4` (16px) inline in buttons, `h-5 w-5` (20px) for input-row icons, `h-6 w-6` to `h-8 w-8` (24–32px) for nav/avatar, `h-12 w-12` (48px) for feature cards.
- **Filled state:** the heart icon is filled (`fill-current`) when used as a brand mark in nav and hero. The "like" heart inside profile cards is also filled. All other icons are outline.
- **Color rules:**
  - Primary (strawberry) icons: `text-pink-400` / `text-icon-primary` (#f472b6) — used for the heart wordmark, "like" hearts, primary affordances.
  - Secondary (matcha) icons: `text-green-* / text-icon-secondary` (#22c55e) — used for "Sweet Matching" and "Authentic Love" feature cards, success states.
  - Muted: `text-icon-muted` (#9ca3af) — input field icons (User, Lock, Mail).
- **No icon font, no SVG sprite, no PNG icons.** Lucide is loaded as React components in code, and as the CDN UMD build (`https://unpkg.com/lucide@latest/dist/umd/lucide.js`) in HTML previews.
- **Emoji:** only 🍓 (strawberry) and 🍵 (matcha), only in the footer and marketing copy. Never as functional icons.
- **Unicode chars as icons:** never used. All glyphs come from Lucide.
- **Common icons used in the app:** `Heart`, `User`, `Lock`, `Mail`, `MessageSquare`, `Users`, `Settings`, `LogOut`, `X`, `Loader2` (animate-spin), `AlertCircle`, `CheckCircle2`.

**Icon substitution policy:** When recreating UI in this design system, use Lucide via CDN. Do not draw SVG icons by hand and do not substitute Heroicons, Material Icons, or emoji.

---

## Font substitution flag

The codebase loads **Geist** and **Geist Mono** via `next/font/google`. We pull them from Google Fonts (the same CDN) in `colors_and_type.css`. **No font files are bundled in `fonts/`** — Geist is served from Google Fonts and that's the canonical path the app uses too. If you need self-hosted `.ttf`/`.woff2` files for offline use, please drop them in `fonts/` and the system will pick them up.

---

## UI Kit

- `ui_kits/web/` — the single product UI kit. Components mirror the production app:
  - `NavigationBar.jsx`, `Footer.jsx` — layout chrome
  - `Button.jsx` — Lucide + shadcn variants, including the brand gradient
  - `Card.jsx`, `GlassFeatureCard.jsx`, `ProfileCard.jsx`
  - `FormInputRow.jsx`, `Input.jsx`
  - `Hero.jsx` — landing-page hero
  - `LoginForm.jsx`, `RegisterForm.jsx`
  - `ChatThread.jsx`, `ConversationList.jsx`
  - `index.html` — interactive click-thru: home → register → onboarding → browse → chat
