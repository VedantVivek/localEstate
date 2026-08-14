const express = require("express");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const { connectDB, seedIfEmpty, load, verify, findUserByEmail, createUser, createSession, findSessionUser, deleteSession, updateUserFavorites, createTour, listToursForUser, createReview, createContact, createSubscriber, findPropertyById } = require("./db");
const { sendContactMail, sendSubscribeMail, sendRegisterMail, sendWelcomeToUser, sendLoginMail, sendLoginToUser, sendTourMail, sendTourToUser, mailReady } = require("./mail");

const app = express();
const argPort = process.argv.find((a, i, arr) => arr[i - 1] === "--port");
const PORT = Number(argPort || process.env.PORT || 3000);
const publicDir = path.join(__dirname, "public");

// Required on Vercel so express-rate-limit accepts X-Forwarded-For
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "48kb" }));

// Local static serving; on Vercel, files in /public are served by the CDN
app.use(express.static(publicDir));

app.use(
  "/api/",
  rateLimit({
    windowMs: 60_000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Ensure Mongo is ready before API handlers run
app.use("/api", async (_req, _res, next) => {
  try {
    await connectDB();
    await seedIfEmpty();
    next();
  } catch (err) {
    console.error("[mongo]", err.message);
    next(err);
  }
});

const tokenOf = (req) => String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
const userFrom = async (req) => findSessionUser(tokenOf(req));
const authed = async (req, res, next) => {
  try {
    const u = await userFrom(req);
    if (!u) return res.status(401).json({ error: "Please sign in" });
    req.user = u;
    next();
  } catch (err) {
    next(err);
  }
};
const publicUser = (u) => ({ id: u.id, name: u.name, email: u.email, favorites: u.favorites || [] });

app.get("/api/health", async (_req, res) => {
  try {
    await connectDB();
    res.json({
      ok: true,
      brand: "LocaleEstate",
      mongo: true,
      features: ["auth", "favorites", "tours", "reviews", "filters"],
    });
  } catch (err) {
    res.status(503).json({ ok: false, mongo: false, error: err.message });
  }
});

app.post("/api/auth/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password || String(password).length < 6) {
      return res.status(400).json({ error: "Name, email, and password (6+ chars) required" });
    }
    let user;
    try {
      user = await createUser({ name, email, password });
    } catch (err) {
      if (err.status === 409 || /duplicate|E11000|already/i.test(err.message)) {
        return res.status(409).json({ error: "Email already registered" });
      }
      throw err;
    }
    const token = await createSession(user.id);
    res.status(201).json({ token, user: publicUser(user), message: "Account created successfully" });
    Promise.all([sendRegisterMail(user), sendWelcomeToUser(user)]).catch((err) => console.error("[mail]", err.message));
  } catch (err) {
    next(err);
  }
});

app.post("/api/auth/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const user = await findUserByEmail(email);
    if (!user || !verify(password, user.password)) return res.status(401).json({ error: "Invalid email or password" });
    const token = await createSession(user.id);
    res.json({ token, user: publicUser(user), message: "Signed in successfully" });
    Promise.all([sendLoginMail(user), sendLoginToUser(user)]).catch((err) => console.error("[mail]", err.message));
  } catch (err) {
    next(err);
  }
});

app.get("/api/auth/me", authed, (req, res) => res.json({ user: publicUser(req.user) }));

app.post("/api/auth/logout", authed, async (req, res, next) => {
  try {
    await deleteSession(tokenOf(req));
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

app.get("/api/properties", async (req, res, next) => {
  try {
    const q = String(req.query.q || "").trim().toLowerCase();
    const tokens = q.split(/[\s,]+/).filter(Boolean);
    const min = Number(req.query.min) || 0;
    const max = Number(req.query.max) || Number.MAX_SAFE_INTEGER;
    const beds = Number(req.query.beds) || 0;
    const baths = Number(req.query.baths) || 0;
    const sort = String(req.query.sort || "price_desc");
    const tag = String(req.query.tag || "").toLowerCase();
    const city = String(req.query.city || "").trim().toLowerCase();
    const state = String(req.query.state || "").trim().toLowerCase();
    const db = await load();
    let properties = db.properties.filter((p) => p.price >= min && p.price <= max && p.beds >= beds && p.baths >= baths);
    if (city) properties = properties.filter((p) => String(p.city || "").toLowerCase() === city);
    if (state) properties = properties.filter((p) => String(p.state || "").toLowerCase() === state);
    if (tokens.length) {
      properties = properties.filter((p) => {
        const hay = `${p.title} ${p.location} ${p.city || ""} ${p.state || ""} ${p.country || ""} ${p.tag} ${p.description} ${(p.amenities || []).join(" ")}`.toLowerCase();
        return tokens.every((t) => hay.includes(t));
      });
    }
    if (tag) properties = properties.filter((p) => String(p.tag).toLowerCase() === tag);
    const sorters = {
      price_asc: (a, b) => a.price - b.price,
      price_desc: (a, b) => b.price - a.price,
      score: (a, b) => (b.score || 0) - (a.score || 0),
      newest: (a, b) => (b.year || 0) - (a.year || 0),
      area: (a, b) => b.area - a.area,
    };
    properties.sort(sorters[sort] || sorters.price_desc);
    const reviews = db.reviews;
    const all = db.properties;
    properties = properties.map((p) => {
      const rs = reviews.filter((r) => r.propertyId === p.id);
      const avg = rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : 0;
      const cityPeers = all.filter((x) => x.city === p.city && x.id !== p.id);
      const median = cityPeers.length
        ? [...cityPeers.map((x) => x.price)].sort((a, b) => a - b)[Math.floor(cityPeers.length / 2)]
        : p.price;
      const delta = median ? Math.round(((p.price - median) / median) * 100) : 0;
      let deal = "Fair for city";
      if (delta <= -8) deal = "Below city average";
      else if (delta >= 12) deal = "Above city average";
      const cues = [];
      if (p.tag === "Coastal") cues.push({ label: "Sea-breeze evenings", tip: "Cool wind near the water after sunset — good for walks." });
      if (p.beds >= 3) cues.push({ label: "Family-scale rooms", tip: "Space feels big enough for a family, not a tight bachelor pad." });
      else cues.push({ label: "Compact footprint", tip: "Smaller layout — easier on EMI and cleaning." });
      if ((p.amenities || []).some((a) => /metro/i.test(a))) cues.push({ label: "Metro-close", tip: "A metro stop is nearby, so office days are simpler." });
      else cues.push({ label: "Car-first access", tip: "You’ll mostly use car or cab — check parking on the visit." });
      if (p.score >= 93) cues.push({ label: "Desk favourite", tip: "Our desk likes this one for price, location, and livability." });
      else cues.push({ label: "Solid local pick", tip: "A sensible home for this area — worth seeing in person." });
      return {
        ...p,
        ratingAvg: Math.round(avg * 10) / 10,
        reviewCount: rs.length,
        dealRadar: { deal, delta, cityMedian: median },
        streetSense: cues.slice(0, 3),
      };
    });
    const cities = [...new Set(all.map((p) => p.city).filter(Boolean))].sort();
    const states = [...new Set(all.map((p) => p.state).filter(Boolean))].sort();
    res.json({ count: properties.length, properties, cities, states, country: "India" });
  } catch (err) {
    next(err);
  }
});

app.get("/api/cities", async (_req, res, next) => {
  try {
    const all = (await load()).properties;
    res.json({
      country: "India",
      cities: [...new Set(all.map((p) => p.city).filter(Boolean))].sort(),
      states: [...new Set(all.map((p) => p.state).filter(Boolean))].sort(),
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/properties/:id", async (req, res, next) => {
  try {
    const db = await load();
    const property = db.properties.find((p) => p.id === Number(req.params.id));
    if (!property) return res.status(404).json({ error: "Property not found" });
    const reviews = db.reviews.filter((r) => r.propertyId === property.id);
    const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    const peers = db.properties.filter((x) => x.city === property.city && x.id !== property.id);
    const median = peers.length
      ? [...peers.map((x) => x.price)].sort((a, b) => a - b)[Math.floor(peers.length / 2)]
      : property.price;
    const delta = median ? Math.round(((property.price - median) / median) * 100) : 0;
    let dealLabel = `Sits around the usual ${property.city} asking range.`;
    let dealShort = "In range";
    if (delta <= -8) {
      dealLabel = `Asking less than most ${property.city} homes we have on the board. Worth a conversation on price.`;
      dealShort = "Softer ask";
    } else if (delta >= 12) {
      dealLabel = `Asking more than most ${property.city} listings here. You’re paying for the pin / finish.`;
      dealShort = "Stiffer ask";
    }

    const areaNotes = {
      Mumbai: "Busy roads, evening cafés, and longish cab waits at peak hours.",
      "New Delhi": "Wide sectors, metro pockets, and weekend mall runs are the norm.",
      Bengaluru: "Tree-lined stretches, tech-park traffic, and café culture nearby.",
      Hyderabad: "IT corridors, lake-side walks in places, and mixed society living.",
      Chennai: "Coastal humidity, OMR / beach-road hops depending on the pin.",
      Pune: "Quieter lanes than Mumbai, campus traffic in IT pockets.",
      Kolkata: "Older neighbourhood texture, markets close by, humid summers.",
      Gurgaon: "Office-side living, highway access, society amenities matter a lot.",
      Noida: "Expressway access and planned sectors; check society maintenance.",
      Ahmedabad: "SG Highway side is practical; weekends lean toward malls.",
      Jaipur: "Central pins feel walkable; evenings get warm in summer.",
      Chandigarh: "Planned sectors, green belts, calm compared to bigger metros.",
      Kochi: "Harbour air in older pockets; rain can slow evening travel.",
      Goa: "Tourist traffic near beaches; quieter inland lanes after season.",
      Lucknow: "Calmer residential pace; markets within a short drive.",
    };

    const hasMetro = (property.amenities || []).some((a) => /metro/i.test(a));
    const hasParking = /car|parking|driveway|garage|clubhouse/i.test([...(property.amenities || []), property.description].join(" "));
    const metroLine = {
      Mumbai: "Western / Harbour / Metro Line 1–3 depending on the suburb.",
      "New Delhi": "Delhi Metro — check which colour line hits this sector.",
      Bengaluru: "Namma Metro — Purple or Green, depending on the side.",
      Hyderabad: "Hyderabad Metro — Red or Blue for this stretch.",
      Chennai: "Chennai Metro / MRTS for this side of town.",
      Pune: "Pune Metro is expanding; confirm the nearest open stop.",
      Kolkata: "Kolkata Metro for north–south / east hops.",
    };

    const pinBrief = {
      priceNote: dealLabel,
      priceTag: dealShort,
      priceDelta: delta,
      metroTitle: hasMetro ? "Metro helps" : "Mostly road travel",
      metro: hasMetro
        ? `Listed near metro. ${metroLine[property.city] || "Confirm the station name and walk time when you visit."}`
        : `No metro at the gate. ${metroLine[property.city] ? `City option: ${metroLine[property.city]}` : "Budget for cab / own vehicle."}`,
      areaTitle: property.location.split(",")[0] || property.city,
      area: `${property.location}. ${areaNotes[property.city] || "Normal residential rhythm — see it once in daylight."}`,
      parkingTitle: hasParking ? "Parking looks okay" : "Ask about parking",
      parking: hasParking
        ? "Expect society parking. Still ask: one covered slot? visitor bay? monthly charge?"
        : "Parking isn’t clear on paper. On the tour, ask for a covered slot and visitor rules.",
      around: [
        ...(property.amenities || []).slice(0, 2),
        property.beds >= 3 ? `${property.beds} beds — family-sized` : `${property.beds} bed — compact`,
        `Built ${property.year || "—"} · ${property.area} m²`,
      ].filter(Boolean),
    };
    res.json({
      ...property,
      ratingAvg: Math.round(avg * 10) / 10,
      reviews,
      dealRadar: { deal: dealShort, dealLabel, delta, cityMedian: median, inrRate: 83 },
      pinBrief,
    });
  } catch (err) {
    next(err);
  }
});

app.get("/api/tags", async (_req, res, next) => {
  try {
    const tags = [...new Set((await load()).properties.map((p) => p.tag).filter(Boolean))];
    res.json({ tags });
  } catch (err) {
    next(err);
  }
});

app.get("/api/favorites", authed, async (req, res, next) => {
  try {
    const ids = req.user.favorites || [];
    const properties = (await load()).properties.filter((p) => ids.includes(p.id));
    res.json({ properties });
  } catch (err) {
    next(err);
  }
});

app.post("/api/favorites/:id", authed, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const favorites = [...(req.user.favorites || [])];
    const on = favorites.includes(id);
    const nextFavs = on ? favorites.filter((x) => x !== id) : [...favorites, id];
    await updateUserFavorites(req.user.id, nextFavs);
    res.json({ favorites: nextFavs, favorited: !on });
  } catch (err) {
    next(err);
  }
});

app.post("/api/tours", authed, async (req, res, next) => {
  try {
    const { propertyId, date, time, note = "" } = req.body || {};
    if (!propertyId || !date || !time) return res.status(400).json({ error: "Property, date, and time required" });
    const property = await findPropertyById(propertyId);
    if (!property) return res.status(404).json({ error: "Property not found" });
    const tour = {
      id: Date.now(),
      userId: Number(req.user.id),
      propertyId: Number(propertyId),
      date: String(date),
      time: String(time),
      note: String(note).slice(0, 300),
      status: "scheduled",
      created_at: new Date().toISOString(),
    };
    await createTour(tour);
    res.status(201).json({ ok: true, tour, message: "Tour scheduled" });
    Promise.all([
      sendTourMail({ user: req.user, tour, property }),
      sendTourToUser({ user: req.user, tour, property }),
    ]).catch((err) => console.error("[mail]", err.message));
  } catch (err) {
    next(err);
  }
});

app.get("/api/tours", authed, async (req, res, next) => {
  try {
    const tours = await listToursForUser(req.user.id);
    res.json({ tours });
  } catch (err) {
    next(err);
  }
});

app.post("/api/reviews", authed, async (req, res, next) => {
  try {
    const { propertyId, rating, text } = req.body || {};
    const r = Number(rating);
    if (!propertyId || !r || r < 1 || r > 5 || !text) return res.status(400).json({ error: "Property, rating 1–5, and text required" });
    const property = await findPropertyById(propertyId);
    if (!property) return res.status(404).json({ error: "Property not found" });
    const review = { id: Date.now(), propertyId: Number(propertyId), userId: req.user.id, name: req.user.name, rating: r, text: String(text).slice(0, 500), created_at: new Date().toISOString() };
    await createReview(review);
    res.status(201).json({ ok: true, review });
  } catch (err) {
    next(err);
  }
});

app.post("/api/contact", async (req, res, next) => {
  try {
    const { name, email, phone = "", message, channel = "message" } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: "Name, email, and message are required" });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Invalid email" });
    const entry = { id: Date.now(), name: String(name).slice(0, 80), email: String(email).slice(0, 120), phone: String(phone).slice(0, 40), message: String(message).slice(0, 1000), channel: String(channel).slice(0, 40), created_at: new Date().toISOString() };
    await createContact(entry);
    res.status(201).json({ ok: true, id: entry.id, emailed: mailReady(), mailConfigured: mailReady() });
    sendContactMail(entry)
      .then(() => {})
      .catch((err) => console.error("[mail]", err.message));
  } catch (err) {
    next(err);
  }
});

app.post("/api/subscribe", async (req, res, next) => {
  try {
    const email = String((req.body || {}).email || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Valid email required" });
    const result = await createSubscriber(email);
    if (result.already) return res.json({ ok: true, message: "Already subscribed" });
    res.status(201).json({ ok: true, message: "Subscribed" });
    sendSubscribeMail(email).catch((err) => console.error("[mail]", err.message));
  } catch (err) {
    next(err);
  }
});

app.get("/api/stats", async (_req, res, next) => {
  try {
    const db = await load();
    res.json({ homes: db.properties.length * 285, buyers: 1800 + db.contacts.length, awards: 42, subscribers: db.subscribers.length, tours: db.tours.length, reviews: db.reviews.length });
  } catch (err) {
    next(err);
  }
});

app.post("/api/mortgage", (req, res) => {
  const price = Number(req.body?.price) || 0;
  const down = Number(req.body?.down) || 20;
  const years = Number(req.body?.years) || 30;
  const rate = Number(req.body?.rate) || 6.5;
  if (price <= 0) return res.status(400).json({ error: "Price required" });
  const principal = price * (1 - down / 100);
  const mRate = rate / 100 / 12;
  const n = years * 12;
  const monthly = mRate === 0 ? principal / n : (principal * mRate * (1 + mRate) ** n) / ((1 + mRate) ** n - 1);
  res.json({ principal: Math.round(principal), monthly: Math.round(monthly), total: Math.round(monthly * n), downPercent: down, years, rate });
});

// SPA fallback for local / non-CDN requests
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api")) return next();
  res.sendFile(path.join(publicDir, "index.html"));
});

app.use((err, _req, res, _next) => {
  console.error(err);
  const msg = err.message || "Server error";
  const status = /MONGODB_URI|Mongo|ECONNREFUSED|authentication failed/i.test(msg) ? 503 : 500;
  res.status(status).json({ error: msg });
});

async function start() {
  try {
    await connectDB();
    await seedIfEmpty();
    console.log("MongoDB connected");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
    console.error("Set MONGODB_URI in .env (see .env.example)");
    if (process.env.VERCEL) throw err;
  }
  app.listen(PORT, () => {
    console.log(`LocaleEstate running at http://localhost:${PORT}`);
    console.log(mailReady() ? "Mail: configured" : "Mail: not configured — copy .env.example to .env");
  });
}

// Export for Vercel (serverless). Listen only when run directly (npm start).
module.exports = app;

if (require.main === module) {
  start();
}
