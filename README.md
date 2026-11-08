# Aurora Diwali

Aurora Diwali is a festive, interactive website celebrating Diwali. Explore the festival through creative activities, lanterns, music, and a canvas-based fireworks display.

## Features

- **Home:** Diwali greeting and festival countdown.
- **Light a Diya:** Interactive diya experience.
- **Rangoli:** Create a rangoli design.
- **Greetings:** Generate and share a Diwali wish.
- **Fireworks:** Launch fireworks on the canvas or enjoy automatic fireworks. Launch and explosion sounds are enabled after your first interaction with the page.
- **Eco & Safety:** Tips for celebrating responsibly.
- **Sky Lanterns:** Write and release a virtual wish.
- **Festive music:** Choose from three Diwali-themed audio options and play or pause them.

## Getting started

### Requirements

- Node.js
- npm

### Install and run

```bash
npm install
npm run dev
```

Open the local URL printed by Vite in your browser.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server. |
| `npm run build` | Create a production build in `dist/`. |
| `npm run preview` | Preview the production build locally. |
| `npm run lint` | Run ESLint across the project. |

## Routes

| Path | Page |
| --- | --- |
| `/` | Home |
| `/diya` | Light Diya |
| `/rangoli` | Rangoli Creator |
| `/greetings` | Greeting Generator |
| `/celebration` | Fireworks |
| `/eco` | Eco & Safety |
| `/lantern` | Sky Lanterns |

## Audio assets

Audio files are stored in `src/assets/` and are bundled by Vite. Browser playback policies require a user interaction before sounds can play; interact with the page to enable the fireworks audio.

## Built with

- React
- React Router
- Vite
- HTML Canvas

