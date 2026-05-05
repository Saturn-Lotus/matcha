---
name: strawberry-matcha-design
description: Use this skill to generate well-branded interfaces and assets for Strawberry Matcha (a sweet, soft, strawberry-pink-meets-matcha-green dating app), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files: `colors_and_type.css` for tokens, `assets/` for the wordmark and app icon, `ui_kits/web/` for the production-faithful component recreations, `preview/` for token specimens.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. The fastest path is:
1. Link `colors_and_type.css` (it provides all CSS variables + brand utilities like `.strawberry-matcha-bg`, `.strawberry-matcha-btn`, `.strawberry-matcha-gradient`, `.glass-effect`).
2. Load Lucide via CDN — `<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>` then `lucide.createIcons()`. Never hand-draw icon SVGs.
3. Reuse the JSX components from `ui_kits/web/` for forms, cards, browse, chat — they mirror the production Next.js app exactly.

If working on production code, read the rules here and in `matcha/CLAUDE.md` (when available) to become an expert in designing with this brand. Tailwind v4 + shadcn/ui ("new-york" style) + lucide-react is the canonical stack.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions about audience and surface, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

Brand essentials to remember:
- Two color families: strawberry pink and matcha green, always used together on primary CTAs and the wordmark.
- Page backgrounds are a 4-stop diagonal cream→matcha→strawberry→lavender gradient (`.strawberry-matcha-bg`).
- Geist sans + Geist mono. Sentence case everywhere except the wordmark "Strawberry Matcha".
- Voice: sweet, warm, casual; you-first; no urgency or all-caps. Tea/strawberry metaphors as flavor, not gimmick.
- Emoji 🍓 and 🍵 in marketing copy only — never as functional icons.
- Lucide for all icons. Hearts can be filled when used as a brand mark; everything else is outline.
