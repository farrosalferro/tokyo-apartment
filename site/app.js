/* Meguro Apartment Map: loads site/data/*.json, renders map + filterable room list. */
(() => {
  "use strict";

  const GROUPS = ["standard", "foreigner", "furnished", "serviced"];
  const LAYOUTS = ["1R", "1K", "1DK", "1LDK"];
  const SIZES = [0, 20, 25];
  const MAX_DEFAULT = 400000;
  const POI_CATS = [
    // [cat, color, on by default, radius]
    ["halal_food", "#137a57", true, 6],
    ["halal_grocery", "#0b5d40", true, 6],
    ["mosque", "#0b5d40", true, 7],
    ["community", "#c8102e", true, 7],
    ["supermarket", "#d9730d", true, 5],
    ["service", "#475569", true, 6],
    ["convenience", "#8a94a6", false, 4],
    ["clinic", "#d6336c", false, 4],
    ["daily", "#6b7280", false, 4],
    ["park", "#5f9e1a", false, 5],
  ];
  const ICONS = {
    office: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 21V4a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v4h3a1 1 0 0 1 1 1v12h2v1H3v-1h2Zm2-15v2h2V6H7Zm4 0v2h2V6h-2Zm-4 4v2h2v-2H7Zm4 0v2h2v-2h-2Zm-4 4v2h2v-2H7Zm4 0v2h2v-2h-2Zm5-4v2h1v-2h-1Zm0 4v2h1v-2h-1Z"/></svg>',
    mosque: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5c.3 1.2 1 1.8 1.8 2.3C16.6 6.4 18 8.5 18 11H6c0-2.5 1.4-4.6 4.2-6.2.8-.5 1.5-1.1 1.8-2.3ZM5 12h14v9h-4v-4a3 3 0 0 0-6 0v4H5v-9Zm-3 2h2v7H2v-7Zm18 0h2v7h-2v-7Z"/></svg>',
  };

  const $ = (s, el = document) => el.querySelector(s);
  const store = {
    get(k, d) { try { const v = localStorage.getItem("mam:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem("mam:" + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
  };

  let lang = store.get("lang", (navigator.language || "").toLowerCase().startsWith("id") ? "id" : "en");
  const t = (k, vars) => {
    let s = (I18N[lang] && I18N[lang][k]) ?? I18N.en[k] ?? k;
    if (vars) for (const [a, b] of Object.entries(vars)) s = s.replaceAll(`{${a}}`, b);
    return s;
  };
  const yen = (n) => "¥" + Math.round(n).toLocaleString("en-US");
  const kyen = (n) => "¥" + Math.round(n / 1000) + "k";
  const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (iso) => new Date(iso + "T00:00:00").toLocaleDateString(lang === "id" ? "id-ID" : "en-GB", { day: "numeric", month: "long", year: "numeric" });

  const state = {
    groups: new Set(GROUPS), layouts: new Set(LAYOUTS), max: MAX_DEFAULT, minSize: 0,
    walk: false, bath: false, foreigner: false, noguar: false, sort: "commute",
    activeId: null, tab: "list",
  };
  Object.assign(state, (() => {
    const s = store.get("filters", null);
    if (!s) return {};
    return { ...s, groups: new Set(s.groups), layouts: new Set(s.layouts) };
  })());
  const saveFilters = () => store.set("filters", { ...state, groups: [...state.groups], layouts: [...state.layouts], activeId: null });

  let D = {}; // data
  let map, cluster, markers = new Map(), poiLayers = {}, zoneLayers = {}, baseLayers = {}, anchorLayer;

  async function load() {
    const get = async (p, fallback) => {
      try { const r = await fetch(p, { cache: "no-cache" }); if (!r.ok) throw 0; return await r.json(); } catch { return fallback; }
    };
    const [anchors, zones, pois, listings, areas, meta] = await Promise.all([
      get("data/anchors.json", []), get("data/zones.geojson", { features: [] }), get("data/pois.json", []),
      get("data/listings.json", []), get("data/areas.json", []), get("data/meta.json", {}),
    ]);
    D = { anchors, zones, pois, listings, areas, meta, anchorById: Object.fromEntries(anchors.map((a) => [a.id, a])) };
  }

  /* ---------- map ---------- */
  function initMap() {
    map = L.map("map", { zoomControl: true, preferCanvas: true }).setView([35.6332, 139.7101], 15);
    const attr = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
    baseLayers.street = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: attr, className: "tiles-themed" });
    // GSI "pale" map: free Japanese government tiles with clean styling and Japanese labels.
    baseLayers.light = L.tileLayer("https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png", {
      maxZoom: 19, maxNativeZoom: 18, className: "tiles-themed",
      attribution: '<a href="https://maps.gsi.go.jp/development/ichiran.html">国土地理院 GSI</a> · places ' + attr,
    });
    const base = store.get("base", "light");
    (baseLayers[base] || baseLayers.light).addTo(map);

    for (const f of D.zones.features || []) {
      const walk = f.properties.tier === "walk";
      zoneLayers[f.properties.tier] = L.geoJSON(f, {
        interactive: false,
        style: walk
          ? { color: cssVar("--zone-walk"), weight: 2.5, fillOpacity: 0.10, fillColor: cssVar("--zone-walk"), dashArray: null }
          : { color: cssVar("--zone-bike"), weight: 1, opacity: 0.5, fillOpacity: 0.06, fillColor: cssVar("--zone-bike"), dashArray: "4 4" },
      }).addTo(map);
    }

    const poiRenderer = L.canvas({ padding: 0.3 });
    for (const [cat, color, on, radius] of POI_CATS) {
      const layer = L.layerGroup();
      for (const p of D.pois.filter((p) => p.cat === cat)) {
        L.circleMarker([p.lat, p.lng], {
          renderer: poiRenderer, radius, color: "#fff", weight: 1.5, fillColor: color, fillOpacity: 0.95,
        }).bindPopup(() => poiPopup(p), { maxWidth: 260 }).addTo(layer);
      }
      poiLayers[cat] = layer;
      if (store.get("poi:" + cat, on)) layer.addTo(map);
    }

    cluster = L.markerClusterGroup({
      showCoverageOnHover: false, maxClusterRadius: 38, spiderfyOnMaxZoom: true, disableClusteringAtZoom: 18,
      iconCreateFunction: (c) => {
        const ms = c.getAllChildMarkers();
        const min = Math.min(...ms.map((m) => m.options.listing.monthly));
        const n = ms.length;
        const size = n < 10 ? 40 : n < 30 ? 46 : 52;
        return L.divIcon({ html: `<div class="cluster" style="width:${size}px;height:${size}px">${n}<small>${kyen(min)}+</small></div>`, className: "pinwrap", iconSize: [size, size] });
      },
    });
    map.addLayer(cluster);

    anchorLayer = L.layerGroup().addTo(map);
    for (const a of D.anchors) {
      const k = a.id === "office" ? "var(--office)" : "var(--mosque)";
      L.marker([a.lat, a.lng], {
        zIndexOffset: 1000, keyboard: true, title: a.name,
        icon: L.divIcon({ className: "anchor", iconSize: null, html: `<div class="ico" style="--k:${k}">${ICONS[a.id] || ""}</div><div class="lab" style="--k:${k}">${esc(a.name)}</div>` }),
      }).bindPopup(() => `<h4>${esc(a.name)}</h4><div class="ja">${esc(a.name_ja)} · ${esc(a.address_ja)}</div><p>${esc(lang === "id" ? a.note_id : a.note_en)}</p><a href="https://www.google.com/maps/search/?api=1&query=${a.lat},${a.lng}" target="_blank" rel="noopener">${t("gmaps")} ↗</a>`).addTo(anchorLayer);
    }
  }

  function poiPopup(p) {
    const note = lang === "id" ? p.note_id : p.note_en;
    const ja = p.name_ja && p.name_ja !== p.name ? `<div class="ja">${esc(p.name_ja)}</div>` : "";
    const hours = p.hours ? `<p>${t("hours")}: ${esc(p.hours)}</p>` : "";
    const link = p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.src || t("open"))} ↗</a> · ` : "";
    return `<h4>${esc(p.name || t("c_" + p.cat))}</h4>${ja}<div class="ja">${t("c_" + p.cat)}</div>${note ? `<p>${esc(note)}</p>` : ""}${hours}${link}<a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((p.name_ja || p.name) + " ")}${p.lat},${p.lng}" target="_blank" rel="noopener">${t("gmaps")} ↗</a>`;
  }

  function pinIcon(x, active) {
    return L.divIcon({
      className: "pinwrap", iconSize: null,
      html: `<div class="pin${x.approx ? " approx" : ""}${active ? " active" : ""}" style="--c:var(--g-${x.group})">${kyen(x.monthly)}</div>`,
    });
  }

  function renderMarkers(list) {
    cluster.clearLayers();
    markers.clear();
    const ms = list.map((x) => {
      const m = L.marker([x.lat, x.lng], { icon: pinIcon(x, x.id === state.activeId), listing: x, title: x.name, riseOnHover: true });
      m.on("click", () => selectListing(x.id, { fromMap: true }));
      markers.set(x.id, m);
      return m;
    });
    cluster.addLayers(ms);
  }

  /* ---------- filtering ---------- */
  function filtered() {
    const xs = D.listings.filter((x) =>
      state.groups.has(x.group) &&
      (state.layouts.has(x.layout) || !LAYOUTS.includes(x.layout)) &&
      (state.max >= MAX_DEFAULT || x.monthly <= state.max) &&
      (!state.minSize || (x.size || 0) >= state.minSize) &&
      (!state.walk || x.tier === "walk") &&
      (!state.bath || x.bath_sep === true) &&
      (!state.foreigner || x.foreigner === "agency" || x.foreigner === "yes") &&
      (!state.noguar || x.no_guarantor));
    const commute = (x) => Math.max(x.walk_office, x.walk_mosque) * 1000 + x.monthly / 1000;
    const by = {
      commute: (a, b) => commute(a) - commute(b),
      monthly: (a, b) => a.monthly - b.monthly,
      upfront: (a, b) => a.upfront - b.upfront,
      size: (a, b) => (b.size || 0) - (a.size || 0),
      newest: (a, b) => (b.built || 0) - (a.built || 0),
    }[state.sort];
    return xs.sort(by);
  }

  /* ---------- list ---------- */
  function badge(cls, text) { return `<span class="badge ${cls}">${esc(text)}</span>`; }

  function cardHTML(x) {
    const fee = x.mgmt ? t("incl_fee", { fee: x.mgmt.toLocaleString("en-US") }) : t("no_fee");
    const idr = lang === "id" && D.meta.idr_per_jpy ? `<div class="idr">≈ Rp ${(x.monthly * D.meta.idr_per_jpy / 1e6).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt</div>` : "";
    const floor = x.floor ? (x.floors ? t("floor_of", { f: x.floor, n: x.floors }) : t("floor", { f: x.floor })) : "";
    const specLine = [x.built ? t("built", { y: x.built }) : "", floor].filter(Boolean).join(" · ");
    const b = [];
    b.push(`<span class="badge grp">${esc(t("g_" + x.group))}</span>`);
    if (x.tier === "walk") b.push(badge("good", t("tier_walk")));
    if (x.bath_sep === true) b.push(badge("good", t("bath_sep")));
    if (x.bath_sep === false) b.push(badge("warn", t("unit_bath")));
    if (x.foreigner === "agency") b.push(badge("good", t("fr_agency")));
    else if (x.foreigner === "yes") b.push(badge("good", t("fr_yes")));
    if (x.no_guarantor) b.push(badge("good", t("no_guar")));
    if (x.furnished) b.push(badge("", t("furnished")));
    if (x.autolock) b.push(badge("", t("autolock")));
    if (x.approx) b.push(badge("", t("approx_short")));

    const rows = x.upfront_items.filter((i) => i.v > 0).map((i) =>
      `<tr><td>${t("i_" + i.k)}${x.upfront_assumed.includes(i.k) ? `<span class="est">${t("estimated")}</span>` : ""}</td><td>${yen(i.v)}</td></tr>`).join("");
    const near = [
      x.near_super && `${t("supermarket")} <b>${x.near_super.walk} ${t("min")}</b>`,
      x.near_konbini && `${t("konbini")} <b>${x.near_konbini.walk} ${t("min")}</b>`,
      x.near_halal && `${t("halal")} <b>${x.near_halal.walk} ${t("min")}</b> <span>(${esc(x.near_halal.name)})</span>`,
    ].filter(Boolean).map((s) => `<span>${s}</span>`).join("");
    const notes = lang === "id" ? (x.notes_id || x.notes_en) : x.notes_en;
    const o = D.anchorById.office, mq = D.anchorById.mosque;
    const route = (a) => `https://www.google.com/maps/dir/?api=1&origin=${x.lat},${x.lng}&destination=${a.lat},${a.lng}&travelmode=walking`;
    const jp = [x.town, x.ward].filter(Boolean).join(", ");
    const where = x.address ? `${x.address}${jp ? ` (${jp})` : ""}` : jp || x.address_ja;

    return `<li class="card${x.id === state.activeId ? " active" : ""}" id="card-${esc(x.id)}" style="--c:var(--g-${x.group})">
      <div class="card-head" data-act="locate" data-id="${esc(x.id)}" role="button" tabindex="0" aria-label="${esc(t("show_on_map"))}: ${esc(x.name)}">
        <div><div class="price">${yen(x.monthly)} <small>${t("per_month")}</small></div><div class="price-sub">${esc(fee)}</div>${idr}</div>
        <div class="spec"><div>${esc(x.layout)}${x.size ? ` · ${x.size} m²` : ""}</div><div>${esc(specLine)}</div></div>
      </div>
      <div class="bname">${esc(x.name || x.address_ja)}<span class="where">${esc(where)}${x.station ? ` · ${esc(x.station)}` : ""}</span></div>
      <div class="commute">
        <div class="cm" style="--k:var(--office)"><span class="lbl"><i></i>${t("office")}</span><b>${x.walk_office}</b> ${t("min")} ${t("walk")} · ${x.bike_office} ${t("bike")}</div>
        <div class="cm" style="--k:var(--mosque)"><span class="lbl"><i></i>${t("mosque")}</span><b>${x.walk_mosque}</b> ${t("min")} ${t("walk")} · ${x.bike_mosque} ${t("bike")}</div>
      </div>
      <div class="badges">${b.join("")}</div>
      <details class="movein"><summary>${t("movein")} <b>${yen(x.upfront)}</b><span class="more">${t("movein_items")}</span></summary><table>${rows}</table></details>
      ${near ? `<div class="near">${near}</div>` : ""}
      ${notes ? `<p class="notes">${esc(notes)}</p>` : ""}
      <div class="links">
        <a href="${esc(x.url)}" target="_blank" rel="noopener">${t("view_listing")} ↗</a>
        <a href="${route(o)}" target="_blank" rel="noopener">${t("route_office")} ↗</a>
        <a href="${route(mq)}" target="_blank" rel="noopener">${t("route_mosque")} ↗</a>
      </div>
      <div class="meta">${t("source")}: ${esc(x.source)}${x.agency ? ` · ${esc(x.agency)}` : ""} · ${t("fetched", { d: esc(x.fetched_at) })}</div>
    </li>`;
  }

  function render() {
    const list = filtered();
    $("#count").textContent = list.length === D.listings.length ? t("results", { n: list.length }) : t("results_of", { n: list.length, total: D.listings.length });
    $("#cards").innerHTML = list.length ? list.map(cardHTML).join("") : `<li class="empty">${t("none")}</li>`;
    renderMarkers(list);
    syncFilterUI();
    saveFilters();
  }

  function selectListing(id, { fromMap = false } = {}) {
    const prev = state.activeId;
    state.activeId = id;
    for (const pid of [prev, id]) {
      const m = markers.get(pid);
      if (m) m.setIcon(pinIcon(m.options.listing, pid === id));
      const c = document.getElementById("card-" + pid);
      if (c) c.classList.toggle("active", pid === id);
    }
    const m = markers.get(id);
    if (fromMap) {
      setTab("list");
      if (isPhone()) setView("list");
      const c = document.getElementById("card-" + id);
      if (c) c.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
    } else if (m) {
      if (isPhone()) setView("map");
      cluster.zoomToShowLayer(m, () => map.panTo(m.getLatLng()));
    }
  }

  /* ---------- filter UI ---------- */
  function buildFilterUI() {
    $("#f-group").innerHTML = GROUPS.map((g) => `<button type="button" class="chip" data-g="${g}" style="--c:var(--g-${g})"><span class="dot"></span><span>${t("g_" + g)}</span></button>`).join("");
    $("#f-layout").innerHTML = LAYOUTS.map((l) => `<button type="button" class="chip" data-l="${l}">${l}</button>`).join("");
    $("#f-size").innerHTML = SIZES.map((s) => `<button type="button" class="chip" data-s="${s}">${s ? `≥ ${s} m²` : t("any")}</button>`).join("");
  }
  function syncFilterUI() {
    document.querySelectorAll("#f-group .chip").forEach((b) => b.setAttribute("aria-pressed", state.groups.has(b.dataset.g)));
    document.querySelectorAll("#f-layout .chip").forEach((b) => b.setAttribute("aria-pressed", state.layouts.has(b.dataset.l)));
    document.querySelectorAll("#f-size .chip").forEach((b) => b.setAttribute("aria-pressed", +b.dataset.s === state.minSize));
    $("#f-max").value = state.max;
    $("#f-max-out").textContent = state.max >= MAX_DEFAULT ? t("any") : "≤ " + yen(state.max);
    for (const k of ["walk", "bath", "foreigner", "noguar"]) $("#f-" + k).checked = state[k];
    $("#f-sort").value = state.sort;
  }
  function toggleSet(set, v) {
    if (set.has(v) && set.size > 1) set.delete(v); else set.add(v);
  }

  function bindFilters() {
    $("#f-group").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { toggleSet(state.groups, b.dataset.g); render(); } });
    $("#f-layout").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { toggleSet(state.layouts, b.dataset.l); render(); } });
    $("#f-size").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { state.minSize = +b.dataset.s; render(); } });
    $("#f-max").addEventListener("input", (e) => { state.max = +e.target.value; $("#f-max-out").textContent = state.max >= MAX_DEFAULT ? t("any") : "≤ " + yen(state.max); });
    $("#f-max").addEventListener("change", render);
    for (const k of ["walk", "bath", "foreigner", "noguar"]) $("#f-" + k).addEventListener("change", (e) => { state[k] = e.target.checked; render(); });
    $("#f-sort").addEventListener("change", (e) => { state.sort = e.target.value; render(); });
    $("#f-reset").addEventListener("click", () => {
      Object.assign(state, { groups: new Set(GROUPS), layouts: new Set(LAYOUTS), max: MAX_DEFAULT, minSize: 0, walk: false, bath: false, foreigner: false, noguar: false, sort: "commute" });
      render();
    });
    $("#cards").addEventListener("click", (e) => {
      const h = e.target.closest('[data-act="locate"]');
      if (h) selectListing(h.dataset.id);
    });
    $("#cards").addEventListener("keydown", (e) => {
      const h = e.target.closest('[data-act="locate"]');
      if (h && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); selectListing(h.dataset.id); }
    });
  }

  /* ---------- layers panel ---------- */
  function buildLayersUI() {
    const count = (cat) => D.pois.filter((p) => p.cat === cat).length;
    const base = store.get("base", "light");
    const body = $("#layers-body");
    body.innerHTML = `
      <div class="base">
        <button type="button" class="chip" data-base="light" aria-pressed="${base === "light"}">${t("base_light")}</button>
        <button type="button" class="chip" data-base="street" aria-pressed="${base === "street"}">${t("base_street")}</button>
      </div>
      <hr>
      <label><input type="checkbox" data-zone="walk" ${map.hasLayer(zoneLayers.walk) ? "checked" : ""}><span class="sw zone" style="--c:var(--zone-walk)"></span>${t("l_zone_walk")}</label>
      <label><input type="checkbox" data-zone="bike" ${map.hasLayer(zoneLayers.bike) ? "checked" : ""}><span class="sw zone" style="--c:var(--zone-bike)"></span>${t("l_zone_bike")}</label>
      <label><input type="checkbox" data-rooms ${map.hasLayer(cluster) ? "checked" : ""}><span class="sw" style="--c:var(--g-standard)"></span>${t("l_listings")}<span class="n">${D.listings.length}</span></label>
      <hr>
      ${POI_CATS.filter(([c]) => count(c)).map(([c, color]) => `<label><input type="checkbox" data-poi="${c}" ${map.hasLayer(poiLayers[c]) ? "checked" : ""}><span class="sw" style="--c:${color}"></span>${t("c_" + c)}<span class="n">${count(c)}</span></label>`).join("")}`;
  }
  function bindLayers() {
    const tog = $("#layers-toggle"), body = $("#layers-body");
    const setOpen = (open) => { tog.setAttribute("aria-expanded", open); body.hidden = !open; store.set("layersOpen", open); };
    setOpen(isPhone() ? false : store.get("layersOpen", true));
    tog.addEventListener("click", () => setOpen(body.hidden));
    body.addEventListener("change", (e) => {
      const i = e.target;
      const layer = i.dataset.poi ? poiLayers[i.dataset.poi] : i.dataset.zone ? zoneLayers[i.dataset.zone] : i.hasAttribute("data-rooms") ? cluster : null;
      if (!layer) return;
      i.checked ? map.addLayer(layer) : map.removeLayer(layer);
      if (i.dataset.poi) store.set("poi:" + i.dataset.poi, i.checked);
    });
    body.addEventListener("click", (e) => {
      const b = e.target.closest("[data-base]");
      if (!b) return;
      for (const [k, l] of Object.entries(baseLayers)) k === b.dataset.base ? l.addTo(map) : map.removeLayer(l);
      store.set("base", b.dataset.base);
      body.querySelectorAll("[data-base]").forEach((x) => x.setAttribute("aria-pressed", x === b));
    });
    L.DomEvent.disableClickPropagation($("#layers"));
    L.DomEvent.disableScrollPropagation($("#layers"));
  }

  /* ---------- areas ---------- */
  function median(xs) { const s = [...xs].sort((a, b) => a - b); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; }
  function renderAreas() {
    const el = $("#areas");
    if (!D.areas.length) { el.innerHTML = ""; return; }
    el.innerHTML = D.areas.map((a) => {
      const xs = D.listings.filter((x) => x.area === a.id);
      const m = xs.map((x) => x.monthly);
      const stats = xs.length
        ? `<div class="stats"><span>${t("area_rooms", { n: xs.length })}</span><span>${t("area_median")} <b>${yen(median(m))}</b></span><span>${t("area_range")} <b>${kyen(Math.min(...m))}–${kyen(Math.max(...m))}</b></span></div>`
        : `<div class="stats"><span>${t("no_area_rooms")}</span></div>`;
      const li = (arr) => (arr || []).map((s) => `<li>${esc(s)}</li>`).join("");
      const id = lang === "id";
      return `<article class="area">
        <h3>${esc(id ? a.name_id : a.name_en)}</h3>
        ${stats}
        <p>${esc(id ? a.summary_id : a.summary_en)}</p>
        <div class="pc"><div><h4>${t("pros")}</h4><ul>${li(id ? a.pros_id : a.pros_en)}</ul></div><div><h4>${t("cons")}</h4><ul>${li(id ? a.cons_id : a.cons_en)}</ul></div></div>
        ${xs.length ? `<button type="button" class="btn" data-area="${esc(a.id)}">${t("show_on_map")}</button>` : ""}
      </article>`;
    }).join("");
  }
  function bindAreas() {
    $("#areas").addEventListener("click", (e) => {
      const b = e.target.closest("[data-area]");
      if (!b) return;
      const xs = D.listings.filter((x) => x.area === b.dataset.area);
      if (!xs.length) return;
      if (isPhone()) setView("map");
      map.fitBounds(L.latLngBounds(xs.map((x) => [x.lat, x.lng])).pad(0.3), { maxZoom: 17 });
    });
  }

  /* ---------- tabs, views, language ---------- */
  function setTab(tab) {
    state.tab = tab;
    document.querySelectorAll(".tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === tab));
    for (const p of ["list", "areas", "guide"]) $("#pane-" + p).hidden = p !== tab;
  }
  const isPhone = () => matchMedia("(max-width: 820px)").matches;
  function setView(v) {
    $("#app").dataset.view = v;
    $("#vs-list").setAttribute("aria-pressed", v === "list");
    $("#vs-map").setAttribute("aria-pressed", v === "map");
    if (v === "map") setTimeout(() => map.invalidateSize(), 0);
  }

  function applyLang() {
    document.documentElement.lang = lang;
    document.title = t("title");
    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    $("#lang").textContent = lang === "en" ? "ID" : "EN";
    $("#lang").setAttribute("aria-label", t("lang"));
    $("#lang").title = t("lang");
    const snap = D.meta.snapshot_date ? fmtDate(D.meta.snapshot_date) : "";
    $("#snapshot").textContent = t("snapshot", { date: snap });
    $("#pane-guide").innerHTML = t("guide_html");
    buildFilterUI();
    buildLayersUI();
    renderAreas();
    render();
  }

  async function main() {
    await load();
    initMap();
    bindFilters();
    bindLayers();
    bindAreas();
    document.querySelectorAll(".tab").forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
    $("#vs-list").addEventListener("click", () => setView("list"));
    $("#vs-map").addEventListener("click", () => setView("map"));
    $("#lang").addEventListener("click", () => { lang = lang === "en" ? "id" : "en"; store.set("lang", lang); applyLang(); });
    applyLang();
    setTab("list");
    setView("list");
    if (isPhone()) $("#filters").open = false;
    // Fit both anchors plus walk zone on first load.
    if (zoneLayers.walk) map.fitBounds(zoneLayers.walk.getBounds().pad(0.15));
    addEventListener("resize", () => map.invalidateSize());
  }

  main();
})();
