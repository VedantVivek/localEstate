const money = (n) => `$${Number(n).toLocaleString()}`;
const INR = 83;
const moneyINR = (n, rate = fxRate) => `₹${Math.round(Number(n) * rate).toLocaleString("en-IN")}`;
const TOKEN_KEY = "le_token";
const COMPARE_KEY = "le_compare";
let user = null;
let compareIds = JSON.parse(localStorage.getItem(COMPARE_KEY) || "[]");
let fxRate = INR;

const api = async (path, opts = {}) => {
  const headers = { "Content-Type": "application/json", ...(opts.headers || {}) };
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
};

const openAuth = () => {
  const el = document.getElementById("auth-modal");
  if (el) {
    el.hidden = false;
    el.style.zIndex = "60";
  }
};

const showPopup = (title, body) => {
  let box = document.getElementById("le-popup");
  if (!box) {
    box = document.createElement("div");
    box.id = "le-popup";
    box.className = "le-popup";
    box.innerHTML = `<div class="le-popup-card" role="dialog" aria-modal="true">
      <button type="button" class="modal-x" data-popup-close>close</button>
      <h2 id="le-popup-title"></h2>
      <p id="le-popup-body"></p>
      <button type="button" class="le-popup-ok" data-popup-close>OK</button>
    </div>`;
    document.body.appendChild(box);
    box.addEventListener("click", (e) => {
      if (e.target === box || e.target.matches("[data-popup-close]")) {
        box.setAttribute("hidden", "");
      }
    });
  }
  document.getElementById("le-popup-title").textContent = title;
  document.getElementById("le-popup-body").textContent = body;
  box.removeAttribute("hidden");
};

const afterAuth = (data, kind = "login") => {
  localStorage.setItem(TOKEN_KEY, data.token);
  user = data.user;
  document.getElementById("auth-modal").hidden = true;
  const note = document.getElementById("auth-note");
  if (note) note.textContent = "";
  setAuthUI();
  loadFavorites();
  loadTours();
  loadProperties();
  if (kind === "register") {
    showPopup("Account created", "Your account has been created successfully. Check your email inbox (and spam) for a welcome message.");
  } else {
    showPopup("Signed in", "You have signed in successfully.");
  }
};

const setAuthUI = () => {
  const btn = document.getElementById("auth-open");
  const who = document.getElementById("nav-user");
  if (user) {
    if (btn) {
      btn.textContent = "Sign out";
      btn.onclick = async () => {
        try { await api("/api/auth/logout", { method: "POST" }); } catch {}
        localStorage.removeItem(TOKEN_KEY);
        user = null;
        setAuthUI();
        loadFavorites();
        loadTours();
        loadProperties();
        showPopup("Signed out", "You have been signed out successfully.");
      };
    }
    if (who) { who.hidden = false; who.textContent = user.name; }
  } else {
    if (btn) { btn.textContent = "Sign in"; btn.onclick = openAuth; }
    if (who) who.hidden = true;
  }
};

const refreshMe = async () => {
  try {
    if (!localStorage.getItem(TOKEN_KEY)) throw new Error("no");
    user = (await api("/api/auth/me")).user;
  } catch {
    user = null;
    localStorage.removeItem(TOKEN_KEY);
  }
  setAuthUI();
};

document.querySelectorAll(".auth-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("login-form").hidden = tab.dataset.tab !== "login";
    document.getElementById("register-form").hidden = tab.dataset.tab !== "register";
    const title = document.querySelector("#auth-modal h2");
    if (title) title.textContent = tab.dataset.tab === "register" ? "Create account" : "Sign in";
    const note = document.getElementById("auth-note");
    if (note) note.textContent = "";
  });
});
document.getElementById("auth-close")?.addEventListener("click", () => {
  document.getElementById("auth-modal").hidden = true;
});

document.getElementById("login-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const note = document.getElementById("auth-note");
  const btn = e.target.querySelector('button[type="submit"]');
  note.textContent = "";
  try {
    if (btn) { btn.disabled = true; btn.textContent = "Signing in…"; }
    afterAuth(await api("/api/auth/login", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.target))) }), "login");
  } catch (err) { note.textContent = err.message; }
  finally { if (btn) { btn.disabled = false; btn.textContent = "Sign in"; } }
});
document.getElementById("register-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const note = document.getElementById("auth-note");
  const btn = e.target.querySelector('button[type="submit"]');
  note.textContent = "";
  try {
    if (btn) { btn.disabled = true; btn.textContent = "Creating…"; }
    afterAuth(await api("/api/auth/register", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.target))) }), "register");
  } catch (err) { note.textContent = err.message; }
  finally { if (btn) { btn.disabled = false; btn.textContent = "Create account"; } }
});

const queryFromForm = (form) => {
  const params = new URLSearchParams();
  for (const [k, v] of new FormData(form).entries()) if (v && v !== "0") params.set(k, v);
  return params.toString();
};

const favSet = () => new Set(user?.favorites || []);

const cardHTML = (p) => {
  const loved = favSet().has(p.id);
  const inCompare = compareIds.includes(p.id);
  const radar = p.dealRadar || {};
  const sense = (p.streetSense || [])
    .map((s) => {
      const label = typeof s === "string" ? s : s.label;
      const tip = typeof s === "string" ? "" : (s.tip || "");
      return `<span class="sense-tag" tabindex="0" data-tip="${String(tip).replace(/"/g, "&quot;")}">${label}</span>`;
    })
    .join("");
  return `<article class="listing" data-id="${p.id}">
    <div class="listing-media"><img src="${p.image}" alt="${p.title}" loading="lazy"></div>
    <div>
      <p class="meta">${p.tag || "Listing"} · ${p.city || ""} <span class="deal-pill deal-${(radar.deal || "").replace(/\s+/g, "").toLowerCase()}">${radar.deal || "On lane"}${typeof radar.delta === "number" ? ` · ${radar.delta > 0 ? "+" : ""}${radar.delta}%` : ""}</span></p>
      <p class="price">${money(p.price)}</p>
      <h3>${p.title}</h3>
      <p class="meta">${p.location}<br>${p.beds} bed · ${p.baths} bath · ${p.area} m²</p>
      <p class="street-sense">${sense}</p>
      <div class="actions">
        <button type="button" data-view="${p.id}">Open</button>
        <button type="button" data-fav="${p.id}">${loved ? "Saved" : "Save"}</button>
        <button type="button" data-compare="${p.id}">${inCompare ? "Comparing" : "Compare"}</button>
      </div>
    </div>
  </article>`;
};

const updateCompareBar = () => {
  const bar = document.getElementById("compare-bar");
  const labels = document.getElementById("compare-labels");
  if (!bar) return;
  bar.hidden = compareIds.length === 0;
  if (labels) labels.textContent = compareIds.join(", ");
  localStorage.setItem(COMPARE_KEY, JSON.stringify(compareIds));
};

const renderProperties = (properties, meta = {}) => {
  const grid = document.getElementById("properties-grid");
  const status = document.getElementById("popular-status");
  if (!grid) return;
  if (!properties.length) {
    grid.innerHTML = "";
    const hint = (meta.cities || []).slice(0, 8).join(", ");
    if (status) status.textContent = hint ? `Nothing matched. Try ${hint}.` : "Nothing matched.";
    return;
  }
  if (status) status.textContent = `${properties.length} on the board`;
  grid.innerHTML = properties.map(cardHTML).join("");
  updateCompareBar();
};

const loadProperties = async (qs = "") => {
  const status = document.getElementById("popular-status");
  if (status) status.textContent = "Loading…";
  try {
    const data = await api(`/api/properties${qs ? `?${qs}` : ""}`);
    renderProperties(data.properties || [], data);
  } catch {
    if (status) status.textContent = "Server offline — run npm start";
  }
};

document.getElementById("search-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = String(new FormData(e.target).get("q") || "");
  const ff = document.getElementById("filter-form");
  if (ff) { ff.q.value = q; ff.city.value = ""; }
  document.getElementById("board")?.scrollIntoView({ behavior: "smooth" });
  loadProperties(new URLSearchParams({ q }).toString());
});

document.getElementById("filter-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  loadProperties(queryFromForm(e.target));
});

api("/api/tags").then((d) => {
  const sel = document.getElementById("tag-filter");
  (d.tags || []).forEach((t) => {
    const o = document.createElement("option");
    o.value = t; o.textContent = t; sel?.appendChild(o);
  });
}).catch(() => {});

api("/api/cities").then((d) => {
  const citySel = document.getElementById("city-filter");
  const stateSel = document.getElementById("state-filter");
  const list = document.getElementById("city-suggestions");
  (d.cities || []).forEach((c) => {
    const o = document.createElement("option");
    o.value = c; o.textContent = c; citySel?.appendChild(o);
    const opt = document.createElement("option");
    opt.value = c; list?.appendChild(opt);
  });
  (d.states || []).forEach((s) => {
    const o = document.createElement("option");
    o.value = s; o.textContent = s; stateSel?.appendChild(o);
  });
}).catch(() => {});

const detail = document.createElement("div");
detail.className = "modal detail-modal";
detail.hidden = true;
detail.innerHTML = `<div class="modal-card"><button type="button" class="modal-x" data-close>close</button><div class="body"></div></div>`;
document.body.appendChild(detail);
const closeDetail = () => { detail.hidden = true; document.body.style.overflow = ""; };
detail.addEventListener("click", (e) => {
  if (e.target === detail || e.target.matches("[data-close]")) closeDetail();
});

const openModal = (p) => {
  const loved = favSet().has(p.id);
  const radar = p.dealRadar || {};
  const brief = p.pinBrief || {};
  const rate = Number(radar.inrRate || fxRate || INR);
  detail.querySelector(".body").innerHTML = `
    <img src="${p.image}" alt="${p.title}">
    <p class="meta">${p.tag || "Listing"} · ${p.city || ""}</p>
    <h2 class="detail-title">${p.title}</h2>
    <p class="detail-price">${money(p.price)} <span class="detail-inr">≈ ${moneyINR(p.price)}</span></p>
    <div class="fx-row">
      <label class="fx-box">Convert $ to ₹
        <input type="number" id="fx-usd" value="${p.price}" min="1">
      </label>
      <p class="fx-out">Rupees: <output id="fx-inr">${moneyINR(p.price)}</output> <span class="muted">($1 ≈ ₹${rate})</span></p>
    </div>
    <p class="detail-facts">${p.location}<br>${p.beds} bed · ${p.baths} bath · ${p.area} m²${p.year ? ` · built ${p.year}` : ""}</p>
    <p class="detail-blurb">${p.description}</p>
    ${(p.amenities || []).length ? `<p class="amenities">${p.amenities.map((a) => `<span>${a}</span>`).join("")}</p>` : ""}

    <section class="house-notes">
      <h3>What we know about this one</h3>
      <dl class="notes-list">
        <div><dt>Price</dt><dd><span class="note-tag">${brief.priceTag || radar.deal || "In range"}</span> ${brief.priceNote || radar.dealLabel || "Compared with other homes in this city."}</dd></div>
        <div><dt>Metro</dt><dd><span class="note-tag">${brief.metroTitle || "Travel"}</span> ${brief.metro || "Ask on the visit."}</dd></div>
        <div><dt>Area</dt><dd><span class="note-tag">${brief.areaTitle || p.city || "Locality"}</span> ${brief.area || p.location}</dd></div>
        <div><dt>Parking</dt><dd><span class="note-tag">${brief.parkingTitle || "Parking"}</span> ${brief.parking || "Confirm on tour."}</dd></div>
      </dl>
      <p class="notes-extra"><strong>Also:</strong> ${(brief.around || []).join(" · ") || "See it once in person before you decide."}</p>
    </section>

    <div class="reviews">${(p.reviews || []).map((r) => `<p><strong>${r.rating}/5</strong> — ${r.name}: ${r.text}</p>`).join("") || "<p class='muted'>No reviews yet.</p>"}</div>
    <p class="actions detail-actions">
      <button type="button" class="linkish" data-fav="${p.id}">${loved ? "Unsave" : "Save"}</button>
      <button type="button" class="linkish" data-compare="${p.id}">Compare</button>
    </p>
    <form class="stack-form" id="tour-form">
      <h3>Book a tour</h3>
      <input type="hidden" name="propertyId" value="${p.id}">
      <label><span class="field-label">Date</span><input type="date" name="date" required min="${new Date().toISOString().slice(0, 10)}"></label>
      <label><span class="field-label">Time</span><input type="time" name="time" value="11:00" required></label>
      <label><span class="field-label">Note</span><input name="note" maxlength="300" placeholder="Anything the desk should know"></label>
      <button type="submit">Schedule tour</button>
      <p class="form-note" id="tour-note"></p>
    </form>
    <form class="stack-form" id="review-form">
      <h3>Leave a review</h3>
      <input type="hidden" name="propertyId" value="${p.id}">
      <label><span class="field-label">Rating</span><select name="rating"><option>5</option><option>4</option><option>3</option><option>2</option><option>1</option></select></label>
      <label><span class="field-label">Your thoughts</span><textarea name="text" required rows="3"></textarea></label>
      <button type="submit">Post</button>
      <p class="form-note" id="review-note"></p>
    </form>`;
  detail.hidden = false;
  document.body.style.overflow = "hidden";

  const usd = document.getElementById("fx-usd");
  const inr = document.getElementById("fx-inr");
  usd?.addEventListener("input", () => {
    inr.textContent = moneyINR(Number(usd.value) || 0);
  });

  document.getElementById("tour-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const note = document.getElementById("tour-note");
    const btn = e.target.querySelector('button[type="submit"]');
    try {
      if (!user) { note.textContent = "Sign in first."; openAuth(); return; }
      const raw = Object.fromEntries(new FormData(e.target));
      const payload = {
        propertyId: Number(raw.propertyId),
        date: String(raw.date || "").trim(),
        time: String(raw.time || "").trim(),
        note: String(raw.note || "").trim(),
      };
      if (!payload.propertyId || !payload.date || !payload.time) {
        note.textContent = "Pick a date and time.";
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = "Booking…"; }
      await api("/api/tours", { method: "POST", body: JSON.stringify(payload) });
      note.textContent = "Tour booked — check your email.";
      showPopup("Tour scheduled", `Visit set for ${payload.date} at ${payload.time}. Confirmation sent to your email.`);
      loadTours();
    } catch (err) {
      note.textContent = err.message || "Could not book tour.";
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Schedule tour"; }
    }
  });
  document.getElementById("review-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const note = document.getElementById("review-note");
    try {
      if (!user) { note.textContent = "Sign in first."; openAuth(); return; }
      await api("/api/reviews", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
      note.textContent = "Posted.";
      openModal(await api(`/api/properties/${p.id}`));
    } catch (err) { note.textContent = err.message; }
  });
};

document.body.addEventListener("click", async (e) => {
  const view = e.target.closest("[data-view]");
  if (view) {
    try { openModal(await api(`/api/properties/${view.dataset.view}`)); } catch { alert("Could not open listing"); }
    return;
  }
  const fav = e.target.closest("[data-fav]");
  if (fav) {
    if (!user) { openAuth(); return; }
    try {
      const data = await api(`/api/favorites/${fav.dataset.fav}`, { method: "POST" });
      user.favorites = data.favorites;
      const ff = document.getElementById("filter-form");
      loadProperties(ff ? queryFromForm(ff) : "");
      loadFavorites();
    } catch (err) { alert(err.message); }
    return;
  }
  const cmp = e.target.closest("[data-compare]");
  if (cmp) {
    const id = Number(cmp.dataset.compare);
    if (compareIds.includes(id)) compareIds = compareIds.filter((x) => x !== id);
    else if (compareIds.length < 3) compareIds.push(id);
    else { alert("Compare up to 3"); return; }
    updateCompareBar();
    const ff = document.getElementById("filter-form");
    loadProperties(ff ? queryFromForm(ff) : "");
  }
});

document.getElementById("compare-clear")?.addEventListener("click", () => {
  compareIds = [];
  updateCompareBar();
  loadProperties();
});
document.getElementById("compare-run")?.addEventListener("click", async () => {
  if (compareIds.length < 2) return alert("Pick at least 2");
  const rows = await Promise.all(compareIds.map((id) => api(`/api/properties/${id}`)));
  detail.querySelector(".body").innerHTML = `<h2 style="color:var(--ink)">Compare</h2>
    <div class="compare-grid">${rows.map((p) => `<div><img src="${p.image}" alt=""><strong>${p.title}</strong><p>${money(p.price)}</p><p>${p.beds}/${p.baths} · ${p.area}m²</p></div>`).join("")}</div>`;
  detail.hidden = false;
});

const loadFavorites = async () => {
  const grid = document.getElementById("fav-grid");
  if (!grid) return;
  if (!user) { grid.innerHTML = `<p class="muted">Sign in, then hit Save on a listing.</p>`; return; }
  try {
    const data = await api("/api/favorites");
    grid.innerHTML = data.properties.length
      ? data.properties.map((p) => `<article class="saved-card"><img src="${p.image}" alt=""><div><strong>${p.title}</strong><br>${money(p.price)} · <button class="linkish" data-view="${p.id}">Open</button></div></article>`).join("")
      : `<p class="muted">Nothing saved yet.</p>`;
  } catch { grid.innerHTML = `<p class="muted">Could not load saved homes.</p>`; }
};

const loadTours = async () => {
  const list = document.getElementById("tours-list");
  if (!list) return;
  if (!user) { list.innerHTML = `<p class="muted">Sign in to see scheduled visits.</p>`; return; }
  try {
    const data = await api("/api/tours");
    list.innerHTML = data.tours.length
      ? data.tours.map((t) => `<article class="tour-card"><span>${t.property?.title || "Home"}<br>${t.date} ${t.time}</span><span>${t.status}</span></article>`).join("")
      : `<p class="muted">No tours yet.</p>`;
  } catch { list.innerHTML = `<p class="muted">Could not load tours.</p>`; }
};

document.getElementById("mortgage-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const out = document.getElementById("mortgage-result");
  try {
    const m = await api("/api/mortgage", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    out.textContent =
      `Estimated EMI: ${money(m.monthly)} per month. Loan amount after down payment: ${money(m.principal)}. Total paid over ${m.years} years: about ${money(m.total)}.`;
  } catch (err) {
    out.textContent = err.message;
  }
});

document.getElementById("contact-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const note = document.getElementById("contact-note");
  try {
    const data = await api("/api/contact", { method: "POST", body: JSON.stringify(Object.fromEntries(new FormData(e.target))) });
    note.textContent = data.emailed ? "Got it — emailed to us." : "Saved, but email failed. Check SMTP / restart server.";
    e.target.reset();
  } catch (err) { note.textContent = err.message; }
});

document.getElementById("subscribe-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const note = document.getElementById("subscribe-note");
  try {
    const data = await api("/api/subscribe", { method: "POST", body: JSON.stringify({ email: new FormData(e.target).get("email") }) });
    note.textContent = data.message === "Already subscribed" ? "Already on the list." : "Added.";
    e.target.reset();
  } catch (err) { note.textContent = err.message; }
});

(async () => {
  await refreshMe();
  updateCompareBar();
  loadProperties();
  loadFavorites();
  loadTours();
})();
