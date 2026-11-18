(() => {
  "use strict";
  const C = window.GARDEN;
  const $ = (s, r = document) => r.querySelector(s);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const small = () => window.innerWidth < 600;
  const PETAL_COLOURS = ["#F8C8DC", "#F4B6C2", "#FBD9E5", "#EFA3B8", "#FFE4EE"];

  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);

  /* ---------------- Falling petals ---------------- */
  const layer = $("#petals");
  function spawnPetals(count, burst = false) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "petal" + (burst ? " burst" : "");
      const s = p.style;
      s.setProperty("--x", Math.random() * 100 + "vw");
      s.setProperty("--size", 8 + Math.random() * 10 + "px");
      s.setProperty("--dur", (burst ? 3 + Math.random() * 2.5 : 10 + Math.random() * 9) + "s");
      s.setProperty("--delay", (burst ? Math.random() * 1.4 : -Math.random() * 19) + "s");
      s.setProperty("--sway", (18 + Math.random() * 45) * (Math.random() < 0.5 ? -1 : 1) + "px");
      s.setProperty("--c", PETAL_COLOURS[i % PETAL_COLOURS.length]);
      p.appendChild(document.createElement("i"));
      if (burst) p.addEventListener("animationend", e => { if (e.target === p) p.remove(); });
      frag.appendChild(p);
    }
    layer.appendChild(frag);
  }
  if (!reduce) spawnPetals(small() ? 12 : 20);

  function floatHearts(count) {
    for (let i = 0; i < count; i++) {
      const h = document.createElement("span");
      h.className = "float-heart";
      h.textContent = "♥";
      const s = h.style;
      s.setProperty("--x", 5 + Math.random() * 90 + "vw");
      s.setProperty("--s", 14 + Math.random() * 18 + "px");
      s.setProperty("--d", 4 + Math.random() * 3 + "s");
      s.setProperty("--delay", Math.random() * 1.5 + "s");
      s.setProperty("--dx", (Math.random() * 60 - 30) + "px");
      s.setProperty("--c", PETAL_COLOURS[i % PETAL_COLOURS.length]);
      h.addEventListener("animationend", () => h.remove());
      layer.appendChild(h);
    }
  }

  // Pause decorative animations when the tab/app is in the background
  document.addEventListener("visibilitychange", () =>
    document.body.classList.toggle("paused", document.hidden));

  /* ---------------- Landing → garden ---------------- */
  const landing = $("#landing");
  const garden = $("#garden");
  const musicBtn = $("#musicBtn");

  $("#enterBtn").addEventListener("click", () => {
    landing.classList.add("leaving");
    document.body.classList.remove("locked");
    garden.removeAttribute("inert");
    window.scrollTo(0, 0);
    musicBtn.hidden = false;
    updateBloom();
    setTimeout(() => { landing.hidden = true; }, reduce ? 0 : 1000);
  });

  /* ---------------- Scroll reveal ---------------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
  const observeReveals = () => document.querySelectorAll(".reveal:not(.in)").forEach(el => io.observe(el));

  /* ---------------- Gallery ---------------- */
  const gallery = $("#gallery");
  const tilts = [-3, 2.5, -1.5, 3, -2.5, 1.5];
  C.photos.forEach((ph, i) => {
    const fig = document.createElement("figure");
    fig.className = "polaroid reveal";
    fig.tabIndex = 0;
    fig.style.setProperty("--rot", (ph.rotate ?? tilts[i % tilts.length]) + "deg");
    fig.style.setProperty("--i", i % 3);

    const frame = document.createElement("div");
    frame.className = "photo-frame";
    const img = document.createElement("img");
    img.alt = ph.alt || "";
    img.loading = i < 2 ? "eager" : "lazy";
    img.decoding = "async";
    img.onload = () => img.classList.add("loaded");
    img.onerror = () => {
      frame.classList.add("missing");
      frame.innerHTML = "";
      const t = document.createElement("span");
      t.textContent = `Photo ${i + 1}\nadd ${ph.src}`;
      frame.appendChild(t);
    };
    img.src = ph.src;
    frame.appendChild(img);

    const sticker = document.createElement("span");
    sticker.className = "sticker";
    sticker.setAttribute("aria-hidden", "true");
    sticker.innerHTML = '<svg><use href="#blossom"/></svg>';

    const cap = document.createElement("figcaption");
    cap.textContent = ph.caption || "";

    fig.append(frame, sticker, cap);
    const toggle = () => {
      const was = fig.classList.contains("lifted");
      gallery.querySelectorAll(".lifted").forEach(el => el.classList.remove("lifted"));
      if (!was) fig.classList.add("lifted");
    };
    fig.addEventListener("click", toggle);
    fig.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
    gallery.appendChild(fig);
  });

  /* ---------------- Letter ---------------- */
  const envelope = $("#envelope");
  const stage = $("#envelopeStage");
  const letterWrap = $("#letterWrap");
  const paper = $("#letterPaper");
  const out = $("#letterText");
  const skip = $("#letterSkip");
  const fullText = C.letter.trim();
  $("#letterFull").textContent = fullText;

  envelope.addEventListener("click", () => {
    envelope.classList.add("open");
    envelope.setAttribute("aria-expanded", "true");
    $("#envHint").classList.add("gone");
    setTimeout(() => {
      stage.classList.add("gone");
      setTimeout(() => {
        stage.hidden = true;
        letterWrap.hidden = false;
        requestAnimationFrame(() => letterWrap.classList.add("show"));
        letterWrap.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
        typeLetter();
      }, reduce ? 0 : 450);
    }, reduce ? 0 : 1500);
  }, { once: true });

  function typeLetter() {
    if (reduce) { out.textContent = fullText; skip.hidden = true; return; }
    let i = 0, done = false, next = performance.now() + 500;
    out.classList.add("typing");
    const finish = () => {
      if (done) return;
      done = true;
      out.textContent = fullText;
      out.classList.remove("typing");
      skip.classList.add("gone");
    };
    paper.addEventListener("click", finish, { once: true });
    const step = now => {
      if (done) return;
      while (now >= next && i < fullText.length) {
        const ch = fullText[i++];
        next += ch === "\n" ? 220 : /[.,!?]/.test(ch) ? 160 : 20;
      }
      out.textContent = fullText.slice(0, i);
      i < fullText.length ? requestAnimationFrame(step) : finish();
    };
    requestAnimationFrame(step);
  }

  /* ---------------- Flowers (bloom via --open: 0 = bud, 1 = full bloom) ---------------- */
  function buildFlower(el) {
    const angle = (i, n, offset = 0) => { let a = (i * 360) / n + offset; if (a > 180) a -= 360; return a; };
    let html = '<div class="fl-stem"><span class="fl-leaf l"></span><span class="fl-leaf r"></span></div><div class="fl-head"><span class="fl-sepal"></span>';
    for (let i = 0; i < 8; i++) html += `<span class="fl-petal" style="--r:${angle(i, 8)}deg"></span>`;
    for (let i = 0; i < 6; i++) html += `<span class="fl-petal inner" style="--r:${angle(i, 6, 30)}deg"></span>`;
    html += '<span class="fl-center"></span></div>';
    el.innerHTML = html;
    el.style.setProperty("--open", 0);
  }
  const reminderFlower = $("#reminderFlower");
  const finalFlower = $("#finalFlower");
  buildFlower(reminderFlower);
  buildFlower(finalFlower);

  // Reminder flower blooms as you scroll into the section
  const reminderSec = $("#reminder");
  let ticking = false;
  function updateBloom() {
    ticking = false;
    if (reduce) { reminderFlower.style.setProperty("--open", 1); return; }
    const top = reminderSec.getBoundingClientRect().top;
    const vh = window.innerHeight;
    const p = Math.min(1, Math.max(0, (vh - top) / (vh * 0.75)));
    reminderFlower.style.setProperty("--open", (1 - Math.pow(1 - p, 2)).toFixed(3));
  }
  window.addEventListener("scroll", () => {
    if (!ticking) { ticking = true; requestAnimationFrame(updateBloom); }
  }, { passive: true });
  window.addEventListener("resize", updateBloom);

  function tweenOpen(el, ms) {
    if (!ms) { el.style.setProperty("--open", 1); return; }
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    const f = now => {
      const t = Math.min(1, (now - t0) / ms);
      el.style.setProperty("--open", ease(t).toFixed(3));
      if (t < 1) requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }

  /* ---------------- One special memory ---------------- */
  const card = $("#memoryCard");
  const m = C.memory || {};
  const add = (tag, cls, text) => {
    if (!text) return;
    const el = document.createElement(tag);
    el.className = cls;
    el.textContent = text;
    card.appendChild(el);
  };
  card.appendChild(Object.assign(document.createElement("span"), { className: "tape" }));
  if (m.photo) {
    const img = document.createElement("img");
    img.className = "memory-photo";
    img.alt = m.title || "";
    img.loading = "lazy";
    img.decoding = "async";
    img.onerror = () => img.remove();
    img.src = m.photo;
    card.appendChild(img);
  }
  add("p", "page-date", m.date);
  add("h3", "page-title", m.title);
  add("p", "page-text", m.text);

  /* ---------------- Final surprise ---------------- */
  const bloomBtn = $("#bloomBtn");
  const finalMsg = $("#finalMessage");
  bloomBtn.addEventListener("click", () => {
    bloomBtn.disabled = true;
    bloomBtn.classList.add("used");
    finalFlower.classList.add("bloomed");
    tweenOpen(finalFlower, reduce ? 0 : 2600);
    if (!reduce) {
      setTimeout(() => spawnPetals(small() ? 40 : 70, true), 800);
      setTimeout(() => floatHearts(small() ? 12 : 18), 1200);
    }
    setTimeout(() => {
      bloomBtn.hidden = true;
      finalMsg.hidden = false;
      requestAnimationFrame(() => finalMsg.classList.add("show"));
      finalMsg.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
    }, reduce ? 0 : 2000);
  }, { once: true });

  /* ---------------- Music ---------------- */
  const audio = $("#bgMusic");
  audio.src = C.music;
  const toastEl = $("#toast");
  let toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
  }
  function setPlaying(on) {
    musicBtn.classList.toggle("playing", on);
    musicBtn.setAttribute("aria-pressed", String(on));
    musicBtn.setAttribute("aria-label", on ? "Pause music" : "Play music");
  }
  musicBtn.addEventListener("click", async () => {
    if (audio.paused) {
      try { await audio.play(); setPlaying(true); }
      catch { toast("Add a song at " + C.music + " to play music ♡"); setPlaying(false); }
    } else { audio.pause(); setPlaying(false); }
  });
  audio.addEventListener("pause", () => setPlaying(false));
  audio.addEventListener("play", () => setPlaying(true));

  observeReveals();
})();