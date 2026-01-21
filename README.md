# PostPal Group Landing Page

**Official corporate portal for the PostPal Group** – Champions in Owned Media Print Marketing and home of the PostPal App.

This high-performance landing page serves as the digital headquarters for the PostPal Group, showcasing our role as a holding company, promoting our flagship software product, and offering expert consulting services for direct marketing strategies.

## Project Overview

*   **Holding Identity:** Clearly positions PostPal Group as the parent entity and strategic partner.
*   **Product Promotion:** Highlights the **PostPal App** as the leading solution for automated postcard marketing on Shopify & Klaviyo.
*   **Consulting Focus:** Details our expertise in "Owned Media" print marketing and direct mail strategy.
*   **High Performance:** Optimized for 100/100 PageSpeed scores with minimal asset loading and a text-first design.

## Tech Stack

Built with a focus on speed, scalability, and developer experience:

*   **Framework:** [Astro](https://astro.build/) (v5)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **Fonts:** [Roboto](https://fontsource.org/fonts/roboto) & [Covered By Your Grace](https://fontsource.org/fonts/covered-by-your-grace)
*   **Icons:** Heroicons (via SVG)

## Getting Started

### Prerequisites

*   Node.js (v20.3.0 or later)
*   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/PostPal-Marketing-Solutions/postpal-group-landing.git
    cd postpal-group-landing
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

### Development

Start the local development server at `http://localhost:4321`:

```bash
npm run dev
```

### Build

Build the production-ready site to the `./dist/` directory:

```bash
npm run build
```

## Project Structure

```plaintext
/
├── public/              # Static assets (favicons, etc.)
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── blocks/      # Page sections (Hero, Highlights, CTA)
│   │   └── ui/          # Atomic elements (Buttons, Layouts)
│   ├── config/          # Global configuration (Navigation, Footer, SEO)
│   ├── layouts/         # Page layouts (Layout.astro)
│   ├── pages/           # Astro page routes (index.astro)
│   └── styles/          # Global CSS and Tailwind directives
└── tailwind.config.mjs  # Tailwind configuration (Brand colors, Fonts)
```

## Customization

### Branding
*   **Colors:** Defined in `tailwind.config.mjs` under `colors.primary` (PostPal Green) and `colors.accent` (PostPal Orange).
*   **Fonts:** Global font imports are managed in `src/layouts/Layout.astro` and configured in `tailwind.config.mjs`.

### Content
*   **Navigation:** `src/config/navigationBar.ts`
*   **Footer:** `src/config/footerNavigation.ts`
*   **Contact Links:** All meeting links point to the official Calendly URL.

## License

© PostPal Marketing Solutions GmbH 2026. All rights reserved.
