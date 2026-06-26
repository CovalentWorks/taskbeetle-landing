# TaskBeetle — landing site (Next.js)

The TaskBeetle marketing/landing page, ported from the original static `taskbeetle.html` to **Next.js
(App Router + TypeScript)** with the **UI unchanged** — same markup, same CSS, same fonts, same
animations (scroll reveal, count-up stats, the rotating live-bid card).

## What changed in the port (behaviour, not look)

- The page is one client component (`app/page.tsx`); the original vanilla-JS interactions were moved
  verbatim into a `useEffect` (with proper observer/timer cleanup).
- The original `taskbeetle.html` is preserved at the repo root for reference; it is not served.
- **The waitlist form now calls the backend.** On submit it `POST`s to the TaskBeetle API
  `…/v1/waitlist` with `{ email, metadata: { role, location, work, source } }` and, on success, shows
  the existing "You are on the list" confirmation state. (The hero email field is a no-op, exactly as
  in the original.)

## Configuration

The API base URL is read from `NEXT_PUBLIC_API_BASE_URL` (see `.env.example`):

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8081/taskbeetle-api
```

Copy it to `.env.local` and point it at your backend. The backend's CORS allow-list must include this
site's origin (the softbread API defaults to `http://localhost:3000`, which matches `next dev`).

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (also type-checks)
npm start        # serve the production build
```
# taskbeetle-landing
