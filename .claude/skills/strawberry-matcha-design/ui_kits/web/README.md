# Strawberry Matcha — Web UI Kit

A pixel-faithful recreation of the production Next.js app, built as standalone JSX modules loaded via `<script type="text/babel">`. Each component renders the same DOM shape and Tailwind-equivalent styles as the real codebase (`matcha/src/app/**`), but with simple cosmetic state instead of real APIs / DB calls.

## Open
- `index.html` — interactive click-thru: landing → register → onboarding → browse (swipe deck) → matches → chat thread.

## Components
- `Layout.jsx` — `NavigationBar`, `Footer`, page wrapper with the brand `.strawberry-matcha-bg`.
- `Buttons.jsx` — `Button` (gradient, outline, ghost, destructive, sizes).
- `Cards.jsx` — `Card`, `GlassFeatureCard`, `ProfileCard` (the swipe-deck card from `home/page.tsx`).
- `Forms.jsx` — `FormInputRow` (icon + input + inline error), `LoginForm`, `RegisterForm`.
- `Hero.jsx` — landing-page hero (`Sweet Connections, Fresh Starts`).
- `Browse.jsx` — full browse screen with sidebar + carousel (mirrors `home/page.tsx`).
- `Chat.jsx` — `ConversationList` + `ChatThread` (PRD 06).
- `Profile.jsx` — `EditProfile` view (PRD 02).
- `App.jsx` — top-level router that wires all screens together.

All components reference Lucide icons via the CDN UMD build, so `<i data-lucide="heart"></i>` markup just works after `lucide.createIcons()`. Brand utilities (`.strawberry-matcha-btn`, `.glass-effect`, gradient text) come from the design system's `colors_and_type.css`.
