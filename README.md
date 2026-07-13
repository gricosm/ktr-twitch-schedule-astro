# KTR Twitch Schedule

Stream schedule overlay for the [Kill That Robot](https://twitch.tv/killthatrobot) Twitch
channel, built to run inside an **OBS browser source**.

It pulls the next five scheduled segments from the Twitch Helix API, renders them as a row
of cards with the game's box art as background, and rotates the highlighted card every 7.5
seconds. The page refreshes itself every 15 minutes so it can stay open for days.

Everything is rendered **on the server**. The browser only handles the rotation, which keeps
the Twitch credentials out of the client bundle and avoids relying on the OBS browser
engine for anything beyond basic CSS.

## Stack

- [Astro 7](https://astro.build) with `output: "server"`
- [`@astrojs/vercel`](https://docs.astro.build/en/guides/integrations-guide/vercel/) adapter
- [`astro:env`](https://docs.astro.build/en/guides/environment-variables/) for typed, server-only secrets
- Plain CSS (no Tailwind)
- [Bun](https://bun.sh) as package manager

## Requirements

- **Node 22.12.0 or higher** (Astro 7 drops Node 18 and 20)
- Bun
- A **confidential** Twitch application

## Twitch application

The app **must be registered as a confidential client**. Public clients cannot use the
`client_credentials` OAuth flow at all, and the token request will fail with a `403`.

1. Go to the [Twitch developer console](https://dev.twitch.tv/console/apps).
2. Register an application:
   - **OAuth Redirect URL**: `http://localhost` (required by the form, unused by this flow)
   - **Category**: Application Integration
   - **Client Type**: **Confidential**
3. Copy the **Client ID**, then click **New Secret** and copy the **Client Secret**.

> The Client Secret is shown **once**. If you lose it you must generate a new one, which
> immediately invalidates the old one. It is exactly 30 characters long — if yours is
> shorter, it got truncated on copy and Twitch will answer `invalid client secret`.

## Environment variables

| Variable | Description |
| --- | --- |
| `TWITCH_CLIENT_ID` | Client ID of the Twitch application |
| `TWITCH_CLIENT_SECRET` | Client Secret of the Twitch application |

Both are declared in `astro.config.mjs` as server-only secrets, so they are never exposed
to the browser. The grant type and token URL are constants in `src/api/Twitch.ts` and do
not need to be configured.

Create a `.env` file at the project root for local development:

```sh
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
```

On Vercel, add both under **Settings → Environment Variables** for **Production, Preview
and Development**, then **redeploy** — Vercel does not apply new variables to an existing
build.

## Development

```sh
bun install
bun run dev        # http://localhost:4321
```

| Command | Action |
| --- | --- |
| `bun install` | Install dependencies |
| `bun run dev` | Start the dev server at `localhost:4321` |
| `bun run build` | Type-check and build for production |
| `bun run preview` | Preview the production build locally |

## Deployment

The project targets Vercel. Set the **Node.js Version** to **22.x** in the project settings,
push to `main`, and Vercel builds and deploys it.

The rendered page sends a `Cache-Control` header of `s-maxage=300, stale-while-revalidate=600`
on success, so the Twitch API is hit at most once every five minutes. Failed responses are
sent with `no-store` so an outage never gets frozen in the CDN.

## OBS setup

Add a **Browser** source and configure it as follows:

| Setting | Value |
| --- | --- |
| URL | The deployed URL (**not** *Local file*) |
| Width | `1024` |
| Height | `450` |
| Shutdown source when not visible | **off** — otherwise the rotation restarts on every scene change |
| Refresh browser when scene becomes active | **off** — the page already refreshes itself |
| Custom CSS | Leave the default (`body { background-color: rgba(0, 0, 0, 0); margin: 0; overflow: hidden; }`) |

The width and height must match `#schedule` in `src/pages/index.astro`. If you change the
canvas size in one place, change it in the other.

To debug inside OBS, launch it with `--remote-debugging-port=9222` and open
`http://localhost:9222` in Chrome for the real CEF console.

## Project structure

```text
src/
├── api/Twitch.ts          # Helix client: token caching, 401 retry, schedule and categories
├── pages/index.astro      # Server-rendered overlay + client-side rotation
├── styles/global.css      # @font-face declarations and OBS-friendly base styles
├── types/twitchTypes.ts   # Twitch API response types
└── utils/Image.ts         # Box art URL size placeholder replacement
public/fonts/              # Blender Pro and DIN Pro (brand typefaces)
```

### Notes on `src/api/Twitch.ts`

The OAuth token is cached in memory with its expiry, so a warm serverless instance reuses
it instead of requesting a new one for every Helix call. Concurrent callers share a single
in-flight request, and a `401` triggers one automatic token refresh and retry.

## Brand

| Token | Value |
| --- | --- |
| Primary | `#FF9331` |
| Dark | `#3C3C3B` |
| Light | `#FFFFFF` |
| Display typeface | Blender Pro Bold |
| Text typeface | DIN Pro Medium / Bold |