# LocaleEstate

Full-stack neighborhood real estate app (Express + MongoDB). Ready for Vercel.

## Setup
1. Copy env file and fill in your Mongo URI (and optional SMTP):
```bash
copy .env.example .env
```
2. In MongoDB Atlas: create a free cluster → Database Access (user) → Network Access (`0.0.0.0/0` for Vercel) → Connect → copy the connection string into `MONGODB_URI`.
3. Install and run:
```bash
npm install
npm start
```
Open http://localhost:3000

## Demo login
`demo@localeestate.com` / `demo1234`

## Deploy on Vercel
1. Push this repo to GitHub.
2. Import the project on [vercel.com](https://vercel.com/new).
3. Framework Preset: **Other** (or leave auto). Root directory: project root.
4. Add Environment Variables (Production + Preview):
   - `MONGODB_URI` — same Atlas string as `.env`
   - `CONTACT_TO`, `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT` (optional, for contact mail)
5. Deploy. Atlas Network Access must allow `0.0.0.0/0` (or Vercel IPs).

Static files live in `public/` (required by Vercel). The Express app is exported from `server.js`.

## Features
- Auth (register / login / sessions)
- Property search, filters, sort, tags
- Favorites, compare, tours, reviews
- Mortgage calculator API
- Contact + newsletter (Mongo + optional email)
- MongoDB persistence (works on Vercel serverless)

## API
`/api/health` `/api/properties` `/api/auth/*` `/api/favorites` `/api/tours` `/api/reviews` `/api/mortgage` `/api/contact` `/api/subscribe` `/api/stats`
