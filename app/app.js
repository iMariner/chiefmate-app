(function () {
  "use strict";

  var C = window.CONTENT;
  var view = document.getElementById("view");
  var STORE_KEY = "cmapp.v1";

  // ---------- progress (per device, localStorage; app works if storage is blocked) ----------
  var state = { ready: {}, oid: {}, qs: {} };
  try {
    var saved = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
    if (saved) state = Object.assign(state, saved);
  } catch (e) { /* storage blocked: keep in memory */ }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  var TOTAL_OUTCOMES = C.digital.outcomeCount;
  var TOTAL_COMP = C.orals.competences.length;
  var TOTAL_Q = C.orals.questions.length;

  function countReady() { return Object.keys(state.ready).filter(function (k) { return state.ready[k]; }).length; }
  function countOutcomes() { return Object.keys(state.oid).filter(function (k) { return state.oid[k]; }).length; }
  function countQs() { return Object.keys(state.qs).length; }
  function pct(n, t) { return t ? Math.round((n / t) * 100) : 0; }

  function partClass(key) { return "part-" + key; }
  function compById(num) {
    for (var i = 0; i < C.orals.competences.length; i++) {
      if (String(C.orals.competences[i].num) === String(num)) return C.orals.competences[i];
    }
    return null;
  }
  function partByKey(key) {
    for (var i = 0; i < C.orals.parts.length; i++) if (C.orals.parts[i].key === key) return C.orals.parts[i];
    return null;
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- routing ----------
  var TABS = ["home", "orals", "digital", "practice", "reference"];

  function route() {
    var hash = (location.hash || "#home").replace(/^#\/?/, "");
    var parts = hash.split("/");
    var tab = parts[0] || "home";
    if (TABS.indexOf(tab) === -1) tab = "home";

    document.querySelectorAll(".tabbar a").forEach(function (a) {
      var on = a.getAttribute("data-tab") === tab;
      a.classList.toggle("active", on);
      if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
    });
    var titles = { home: "Chief Mate Study", orals: "Orals", digital: "Digital written", practice: "Practice", reference: "Reference" };
    document.getElementById("topbar-title").textContent = titles[tab];

    var html = "";
    if (tab === "home") html = renderHome();
    else if (tab === "orals") {
      html = parts[1] ? renderCompetence(parts[1]) : renderOrals();
    } else if (tab === "digital") {
      html = parts[1] ? renderDigitalSection(parts[1]) : renderDigital();
    } else if (tab === "practice") html = renderPractice(parts[1]);
    else if (tab === "reference") html = renderReference();

    view.innerHTML = html;
    afterRender();
    window.scrollTo(0, 0);
    view.focus({ preventScroll: true });
  }

  // ---------- screens ----------
  function renderHome() {
    var next = null;
    for (var i = 0; i < C.orals.competences.length; i++) {
      if (!state.ready[C.orals.competences[i].num]) { next = C.orals.competences[i]; break; }
    }
    var rp = pct(countReady(), TOTAL_COMP);
    var op = pct(countOutcomes(), TOTAL_OUTCOMES);
    var qp = pct(countQs(), TOTAL_Q);

    return [
      '<h1>Chief Mate Study</h1>',
      '<p class="muted">' + escapeHtml(C.orals.audience) + '</p>',
      '<div class="stats">',
      '  <div class="stat"><div class="small">Orals ready</div><div class="n">' + countReady() + ' / ' + TOTAL_COMP + '</div><div class="bar"><span style="width:' + rp + '%"></span></div></div>',
      '  <div class="stat"><div class="small">Digital outcomes ticked</div><div class="n">' + countOutcomes() + ' / ' + TOTAL_OUTCOMES + '</div><div class="bar"><span style="width:' + op + '%"></span></div></div>',
      '  <div class="stat"><div class="small">Questions answered</div><div class="n">' + countQs() + ' / ' + TOTAL_Q + '</div><div class="bar"><span style="width:' + qp + '%"></span></div></div>',
      '</div>',
      next
        ? '<div class="card"><div class="small">Next up</div><div class="t-next"><b>' + next.num + '. ' + escapeHtml(next.title) + '</b></div><div class="btn-row"><a class="btn" href="#orals/' + next.num + '">Open</a></div></div>'
        : '<div class="card"><b>All 21 orals competences marked ready.</b> Keep practising the questions.</div>',
      '<div class="btn-row"><a class="btn secondary" href="#digital">Digital guide</a><a class="btn secondary" href="#practice">Practice questions</a></div>',
      '<div class="warn">' + (C.digital.intro.match(/<div class="warn">[\s\S]*?<\/div>/) || [""])[0] + '</div>',
      '<div class="info small">' + escapeHtml(C.orals.sourceLine) + '</div>'
    ].join("\n");
  }

  function renderOrals() {
    var out = ['<h1>Orals</h1>', '<p class="muted">21 competences in three parts. Tap one to study it.</p>'];
    C.orals.parts.forEach(function (p) {
      out.push('<div class="part-head ' + partClass(p.key) + '"><div class="k">' + escapeHtml(p.label) + ' · ' + escapeHtml(p.range) + '</div><div class="t">' + escapeHtml(p.title) + '</div><div class="small" style="color:#fff;opacity:.9">' + escapeHtml(p.sub) + '</div></div>');
      out.push('<ul class="list">');
      C.orals.competences.filter(function (c) { return c.func === p.key; }).forEach(function (c) {
        out.push('<li><a class="item" href="#orals/' + c.num + '"><span class="dot' + (state.ready[c.num] ? ' on' : '') + '"></span><span style="flex:1"><span class="t">' + c.num + '. ' + escapeHtml(c.title) + '</span></span><span class="chev">›</span></a></li>');
      });
      out.push('</ul>');
    });
    out.push('<h2>Before you start</h2>');
    out.push('<div class="card">' + C.orals.rules.map(function (r) { return '<p><b>' + escapeHtml(r[0]) + '.</b> ' + escapeHtml(r[1]) + '</p>'; }).join("") + '</div>');
    return out.join("\n");
  }

  function renderCompetence(num) {
    var c = compById(num);
    if (!c) return '<p class="empty">Competence not found.</p><a href="#orals">Back to orals</a>';
    var p = partByKey(c.func);
    var idx = C.orals.competences.indexOf(c);
    var prev = C.orals.competences[idx - 1];
    var next = C.orals.competences[idx + 1];
    var ready = !!state.ready[c.num];

    var out = [];
    out.push('<div class="crumb"><a href="#orals">Orals</a> › ' + escapeHtml(p.title) + '</div>');
    out.push('<div class="part-head ' + partClass(c.func) + '"><div class="k">Competence ' + c.num + ' of ' + TOTAL_COMP + '</div><div class="t">' + escapeHtml(c.title) + '</div></div>');
    out.push('<p><b>In one line:</b> ' + escapeHtml(c.one) + '</p>');
    if (c.say) out.push('<h3>Say it out loud</h3><div class="say">' + escapeHtml(c.say) + '</div>');
    if (c.know && c.know.length) {
      out.push('<details open><summary>What you must know</summary><div class="body"><ul>' + c.know.map(function (k) { return '<li>' + k + '</li>'; }).join("") + '</ul></div></details>');
    }
    if (c.steps && c.steps.length) {
      out.push('<details open><summary>How to answer, step by step</summary><div class="body">' + c.steps.map(function (s, i) {
        return '<div class="step"><span class="n">' + (i + 1) + '</span><div><b>' + escapeHtml(s[0]) + '</b><div>' + escapeHtml(s[1]) + '</div></div></div>';
      }).join("") + '</div></details>');
    }
    if (c.trap) out.push('<div class="warn"><b>Common trap.</b> ' + escapeHtml(c.trap) + '</div>');
    if (c.example) out.push('<div class="info"><b>Example from the ship.</b> ' + escapeHtml(c.example) + '</div>');
    if (c.questions && c.questions.length) {
      out.push('<details><summary>Questions the examiner may ask</summary><div class="body"><ul>' + c.questions.map(function (q) { return '<li>' + escapeHtml(q) + '</li>'; }).join("") + '</ul></div></details>');
    }
    if (c.checks && c.checks.length) {
      out.push('<details><summary>Check yourself before you move on</summary><div class="body">' + c.checks.map(function (k, i) {
        return '<label class="check"><input type="checkbox" data-check="' + c.num + '-' + i + '"><span>' + escapeHtml(k) + '</span></label>';
      }).join("") + '</div></details>');
    }
    if (c.deep) out.push('<details><summary>Deep dive</summary><div class="body deep">' + c.deep + '</div></details>');

    out.push('<div class="btn-row"><button class="btn ' + (ready ? 'done' : '') + '" data-toggle-ready="' + c.num + '">' + (ready ? '✓ Marked ready' : 'I can explain this without notes') + '</button></div>');
    out.push('<div class="btn-row">' +
      (prev ? '<a class="btn secondary" href="#orals/' + prev.num + '">‹ ' + prev.num + '</a>' : '<span></span>') +
      (next ? '<a class="btn secondary" href="#orals/' + next.num + '">' + next.num + ' ›</a>' : '<span></span>') +
      '</div>');
    return out.join("\n");
  }

  function renderDigital() {
    var out = ['<h1>Digital written</h1>', '<p class="muted">MCA digital syllabus: 16 items, 44 outcomes. Open a section and read it in order.</p>'];
    C.digital.sections.forEach(function (s) {
      out.push('<a class="item" href="#digital/' + s.id + '"><span style="flex:1"><span class="t">' + escapeHtml(s.title) + '</span><span class="s" style="display:block">' + (s.subs.length ? s.subs.length + ' topics' : 'reference') + '</span></span><span class="chev">›</span></a>');
    });
    out.push('<div class="info small">Outcome checklist: open section 6 and tick each outcome you can explain without notes. ' + countOutcomes() + ' of ' + TOTAL_OUTCOMES + ' ticked.</div>');
    return out.join("\n");
  }

  function renderDigitalSection(id) {
    var s = C.digital.sections.filter(function (x) { return x.id === id; })[0];
    if (!s) return '<p class="empty">Section not found.</p><a href="#digital">Back</a>';
    var idx = C.digital.sections.indexOf(s);
    var out = ['<div class="crumb"><a href="#digital">Digital</a> › ' + escapeHtml(s.title) + '</div>', '<h1>' + escapeHtml(s.title) + '</h1>'];
    out.push('<div class="lead">' + s.lead + '</div>');
    if (s.subs.length) {
      s.subs.forEach(function (sub, i) {
        out.push('<details' + (i === 0 ? ' open' : '') + '><summary>' + sub.title + '</summary><div class="body">' + sub.html + '</div></details>');
      });
    }
    out.push('<div class="btn-row">' +
      (idx > 0 ? '<a class="btn secondary" href="#digital/' + C.digital.sections[idx - 1].id + '">‹ Previous</a>' : '<span></span>') +
      (idx < C.digital.sections.length - 1 ? '<a class="btn secondary" href="#digital/' + C.digital.sections[idx + 1].id + '">Next ›</a>' : '<span></span>') +
      '</div>');
    return out.join("\n");
  }

  var deck = { list: [], i: 0, shown: false };
  var practiceFilter = "all";

  function renderPractice(sub) {
    var out = ['<h1>Practice</h1>'];
    out.push('<p class="muted">Answer out loud first, then check against the competence card.</p>');

    out.push('<h2>Question cards</h2>');
    out.push('<div class="card"><div class="small">Card <span id="qn"></span> of ' + TOTAL_Q + ' · answered ' + countQs() + '</div>' +
      '<div class="flash" id="qtext"></div>' +
      '<div class="btn-row"><button class="btn secondary" id="qshow">Show prompt</button></div>' +
      '<div class="btn-row"><button class="btn" id="qgood">I answered it</button><button class="btn secondary" id="qmiss">Need more practice</button></div>' +
      '<div class="btn-row"><button class="btn secondary" id="qnext">Next card ›</button><button class="btn secondary" id="qreset">Shuffle</button></div></div>');

    out.push('<h2>Warm-up questions by part</h2>');
    ["nav", "cargo", "control"].forEach(function (k) {
      var p = partByKey(k);
      out.push('<details><summary>' + escapeHtml(p.title) + '</summary><div class="body"><ul>' + (C.orals.warmup[k] || []).map(function (q) { return '<li>' + escapeHtml(q) + '</li>'; }).join("") + '</ul></div></details>');
    });

    out.push('<h2>Answer structure</h2>');
    out.push('<details><summary>STAR: for leadership and experience questions</summary><div class="body">' + C.orals.star.map(function (r) { return '<p><b>' + r[0] + ' · ' + escapeHtml(r[1]) + '.</b> ' + escapeHtml(r[2]) + '</p>'; }).join("") + '</div></details>');
    out.push('<details><summary>ACTS: for emergencies</summary><div class="body">' + C.orals.acts.map(function (r) { return '<p><b>' + r[0] + ' · ' + escapeHtml(r[1]) + '.</b> ' + escapeHtml(r[2]) + '</p>'; }).join("") + '</div></details>');
    return out.join("\n");
  }

  function renderReference() {
    var out = ['<h1>Reference</h1>'];
    out.push('<h2>Study plan: 6 weeks</h2>');
    C.orals.weeks.forEach(function (w) {
      out.push('<div class="card"><div class="small">Week ' + w.n + '</div><b>' + escapeHtml(w.title) + '</b><p>' + escapeHtml(w.focus) + '</p><p class="small"><b>Output:</b> ' + escapeHtml(w.output) + '</p></div>');
    });
    out.push('<h2>Last week before the exam</h2>');
    out.push('<div class="card">' + C.orals.lastWeek.map(function (d) { return '<p><b>' + escapeHtml(d[0]) + ' · ' + escapeHtml(d[1]) + '.</b> ' + escapeHtml(d[2]) + '</p>'; }).join("") + '</div>');
    out.push('<h2>Priorities</h2>');
    out.push('<div class="card">' + C.orals.priority.map(function (p) { return '<p><b>' + escapeHtml(p[0]) + ':</b> ' + escapeHtml(p[1]) + '</p>'; }).join("") + '</div>');
    out.push('<h2>Revision order</h2>');
    out.push('<details><summary>Navigation</summary><div class="body">' + escapeHtml(C.orals.revision.nav) + '</div></details>');
    out.push('<details><summary>Cargo</summary><div class="body">' + escapeHtml(C.orals.revision.cargo) + '</div></details>');
    out.push('<details><summary>Control</summary><div class="body">' + escapeHtml(C.orals.revision.control) + '</div></details>');
    out.push('<h2>Regulations at a glance</h2>');
    C.orals.regs.forEach(function (r) {
      out.push('<details><summary>' + escapeHtml(r[0]) + '</summary><div class="body"><p>' + escapeHtml(r[1]) + '</p><p class="small"><b>Records and certificates:</b> ' + escapeHtml(r[2]) + '</p><p class="small"><b>What you do:</b> ' + escapeHtml(r[3]) + '</p></div></details>');
    });
    return out.join("\n");
  }

  // ---------- after render: wire up interactive bits ----------
  function nextQuestion() {
    if (!deck.list.length) deck.list = C.orals.questions.map(function (_, i) { return i; });
    deck.i = (deck.i + 1) % deck.list.length;
    deck.shown = false;
  }
  function shuffle() {
    deck.list = C.orals.questions.map(function (_, i) { return i; });
    for (var i = deck.list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = deck.list[i]; deck.list[i] = deck.list[j]; deck.list[j] = t;
    }
    deck.i = 0; deck.shown = false;
  }
  function drawQuestion() {
    var el = document.getElementById("qtext");
    var n = document.getElementById("qn");
    if (!el) return;
    if (!deck.list.length) shuffle();
    var qi = deck.list[deck.i];
    n.textContent = (deck.i + 1);
    el.textContent = deck.shown ? C.orals.questions[qi] : "Tap “Show prompt”";
    if (deck.shown) el.textContent = C.orals.questions[qi];
    else el.textContent = "Say your answer out loud, then tap “Show prompt”.";
  }

  function afterRender() {
    // competence ready toggle
    view.querySelectorAll("[data-toggle-ready]").forEach(function (b) {
      b.addEventListener("click", function () {
        var num = b.getAttribute("data-toggle-ready");
        state.ready[num] = !state.ready[num];
        save();
        route();
      });
    });
    // checklist ticks inside competences
    view.querySelectorAll("[data-check]").forEach(function (cb) {
      var key = "c-" + cb.getAttribute("data-check");
      cb.checked = !!state[key];
      cb.addEventListener("change", function () { state[key] = cb.checked; save(); });
    });
    // digital outcome ticks
    view.querySelectorAll(".trow[data-oid]").forEach(function (row) {
      var oid = row.getAttribute("data-oid");
      row.classList.toggle("ticked", !!state.oid[oid]);
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.className = "ob";
      cb.setAttribute("aria-label", "Outcome explained without notes");
      cb.checked = !!state.oid[oid];
      cb.addEventListener("change", function () {
        state.oid[oid] = cb.checked;
        row.classList.toggle("ticked", cb.checked);
        save();
      });
      row.insertBefore(cb, row.firstChild);
    });
    // practice cards
    var show = document.getElementById("qshow");
    if (show) {
      if (!deck.list.length) shuffle();
      drawQuestion();
      show.addEventListener("click", function () { deck.shown = true; drawQuestion(); });
      document.getElementById("qnext").addEventListener("click", function () { nextQuestion(); drawQuestion(); });
      document.getElementById("qreset").addEventListener("click", function () { shuffle(); drawQuestion(); });
      function mark(v) {
        var qi = deck.list[deck.i];
        state.qs[qi] = v;
        save();
        nextQuestion();
        drawQuestion();
      }
      document.getElementById("qgood").addEventListener("click", function () { mark("yes"); route(); });
      document.getElementById("qmiss").addEventListener("click", function () { mark("no"); route(); });
    }
  }

  // ---------- theme ----------
  var root = document.documentElement;
  var themeBtn = document.getElementById("theme-btn");
  function applyTheme() {
    var t = null;
    try { t = localStorage.getItem("cmapp.theme"); } catch (e) { /* ignore */ }
    if (t) root.setAttribute("data-theme", t); else root.removeAttribute("data-theme");
  }
  themeBtn.addEventListener("click", function () {
    var dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var current = root.getAttribute("data-theme") || (dark ? "dark" : "light");
    var next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem("cmapp.theme", next); } catch (e) { /* ignore */ }
  });
  applyTheme();

  // ---------- service worker: offline use ----------
  if ("serviceWorker" in navigator && location.protocol.indexOf("http") === 0) {
    navigator.serviceWorker.register("sw.js").catch(function () { /* offline install not available */ });
  }

  window.addEventListener("hashchange", route);
  route();
})();
