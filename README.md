# HygroSense

HygroSense is a vibrant humidity dashboard built with Next.js App Router. It pulls live data from Arduino Cloud, asks OpenAI for friendly atmosphere summaries, and displays everything in a futuristic UI with a built-in chat companion.

## Features

- **Arduino Cloud OAuth2** - Automatic client-credentials flow with token caching.
- **Live humidity & temperature** - Reads your Thing/Property values every 10 seconds.
- **AI-generated narratives** - OpenAI condenses the reading into motivating advice.
- **Chat panel** - Preset or custom questions answered in plain Spanish.
- **Interactive UI** - Pastel gradients, hover animations, and a responsive layout.

## Tech Stack

- Next.js 16 (App Router) · TypeScript · Tailwind CSS
- Arduino Cloud REST API
- OpenAI official SDK

## Getting Started

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Environment Variables

Create a `.env.local` with:

```
ARDUINO_API_BASE_URL=https://api2.arduino.cc/iot/v2
ARDUINO_THING_ID=...
ARDUINO_PROPERTY_ID=...
ARDUINO_TEMPERATURE_PROPERTY_ID=...
ARDUINO_TOKEN_URL=https://api2.arduino.cc/iot/v1/clients/token
ARDUINO_CLIENT_ID=...
ARDUINO_CLIENT_SECRET=...
ARDUINO_AUDIENCE=https://api2.arduino.cc/iot
OPENAI_API_KEY=...
```

## Scripts

- `npm run dev` – start the dev server
- `npm run build` – production build
- `npm run start` – serve the built app
- `npm run lint` – run ESLint

## Architecture

- `app/page.tsx` – Main dashboard (client component).
- `components/chat-panel.tsx` – Chat experience.
- `app/api/hygrosense/overview` - Fetch Arduino humidity/temperature + OpenAI narrative.
- `app/api/hygrosense/chat` – Chat responses via OpenAI.
- `lib/arduino.ts` – OAuth helper for Arduino Cloud tokens.
- `lib/openai.ts` – OpenAI client setup.

## License

MIT © HygroSense
