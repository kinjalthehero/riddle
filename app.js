/* Riddle Flashcards — vanilla JS, no build step, state in localStorage. */
(function () {
  "use strict";

  var KEY_SOLVED = "riddle.solved.v1";
  var KEY_SHOW = "riddle.showSolved.v1";
  var KEY_THEME = "riddle.theme.v1";
  var FLIP_MS = 260;

  // localStorage throws in some private-browsing modes; degrade to memory-only.
  var store = {
    get: function (key) {
      try { return window.localStorage.getItem(key); } catch (e) { return null; }
    },
    set: function (key, value) {
      try { window.localStorage.setItem(key, value); } catch (e) { /* ignore */ }
    }
  };

  var el = {
    card: document.getElementById("card"),
    cardWrap: document.getElementById("cardWrap"),
    question: document.getElementById("question"),
    answer: document.getElementById("answer"),
    statusFront: document.getElementById("statusFront"),
    statusBack: document.getElementById("statusBack"),
    counterFront: document.getElementById("counterFront"),
    counterBack: document.getElementById("counterBack"),
    prevBtn: document.getElementById("prevBtn"),
    nextBtn: document.getElementById("nextBtn"),
    solveBtn: document.getElementById("solveBtn"),
    showSolved: document.getElementById("showSolved"),
    shuffleBtn: document.getElementById("shuffleBtn"),
    resetBtn: document.getElementById("resetBtn"),
    themeBtn: document.getElementById("themeBtn"),
    progressFill: document.getElementById("progressFill"),
    progressText: document.getElementById("progressText"),
    emptyState: document.getElementById("emptyState"),
    emptyShowBtn: document.getElementById("emptyShowBtn"),
    emptyResetBtn: document.getElementById("emptyResetBtn"),
    toast: document.getElementById("toast")
  };

  var byId = {};
  RIDDLES.forEach(function (r) { byId[r.id] = r; });

  var solved = loadSolved();
  var showSolved = store.get(KEY_SHOW) === "1";
  var deck = shuffle(RIDDLES.map(function (r) { return r.id; }));
  var currentId = null;

  /* ---------- state helpers ---------- */

  function loadSolved() {
    var set = {};
    try {
      var raw = JSON.parse(store.get(KEY_SOLVED) || "[]");
      if (Array.isArray(raw)) {
        raw.forEach(function (id) { if (byId[id]) set[id] = true; });
      }
    } catch (e) { /* corrupt value — start clean */ }
    return set;
  }

  function saveSolved() {
    store.set(KEY_SOLVED, JSON.stringify(Object.keys(solved).map(Number)));
  }

  function isSolved(id) { return solved[id] === true; }
  function isVisible(id) { return showSolved || !isSolved(id); }
  function visibleDeck() { return deck.filter(isVisible); }

  function shuffle(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  /* ---------- rendering ---------- */

  function setFlipped(flipped) {
    el.card.classList.toggle("flipped", flipped);
  }

  function isFlipped() { return el.card.classList.contains("flipped"); }

  // Swap content while the card is edge-on so the answer never flashes.
  function goTo(id) {
    var wasFlipped = isFlipped();
    currentId = id;
    setFlipped(false);
    if (wasFlipped && !prefersReducedMotion()) {
      window.setTimeout(render, FLIP_MS);
    } else {
      render();
    }
  }

  function prefersReducedMotion() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function render() {
    var visible = visibleDeck();
    var total = RIDDLES.length;
    var solvedCount = Object.keys(solved).length;

    var pct = total ? Math.round((solvedCount / total) * 100) : 0;
    el.progressFill.style.width = pct + "%";
    el.progressText.textContent = solvedCount + " / " + total + " solved (" + pct + "%)";

    if (visible.length === 0) {
      el.cardWrap.classList.add("hidden");
      el.emptyState.classList.remove("hidden");
      return;
    }

    el.emptyState.classList.add("hidden");
    el.cardWrap.classList.remove("hidden");

    if (visible.indexOf(currentId) === -1) currentId = visible[0];

    var riddle = byId[currentId];
    var done = isSolved(currentId);
    var position = visible.indexOf(currentId) + 1;
    var label = position + " of " + visible.length;

    el.question.textContent = riddle.q;
    el.answer.textContent = riddle.a;
    el.counterFront.textContent = label;
    el.counterBack.textContent = label;

    [el.statusFront, el.statusBack].forEach(function (badge) {
      badge.textContent = done ? "Solved" : "Unsolved";
      badge.classList.toggle("is-solved", done);
    });

    el.solveBtn.textContent = done ? "Marked solved" : "Mark as solved";
    el.solveBtn.classList.toggle("is-solved", done);
    el.solveBtn.setAttribute("aria-pressed", done ? "true" : "false");

    var single = visible.length < 2;
    el.prevBtn.disabled = single;
    el.nextBtn.disabled = single;
  }

  /* ---------- navigation ---------- */

  function step(delta) {
    var visible = visibleDeck();
    if (visible.length < 2) return;
    var i = visible.indexOf(currentId);
    if (i === -1) i = 0;
    var next = (i + delta + visible.length) % visible.length;
    goTo(visible[next]);
  }

  // Used after marking solved: the current card may have just left the deck.
  function advanceAfterSolve(previousVisible) {
    var i = previousVisible.indexOf(currentId);
    var visible = visibleDeck();
    if (visible.length === 0) { render(); return; }

    // Walk forward through the old ordering until we hit something still visible.
    for (var n = 1; n <= previousVisible.length; n++) {
      var candidate = previousVisible[(i + n) % previousVisible.length];
      if (isVisible(candidate)) { goTo(candidate); return; }
    }
    render();
  }

  function toggleSolved() {
    if (!currentId) return;
    var previousVisible = visibleDeck();
    var nowSolved = !isSolved(currentId);

    if (nowSolved) solved[currentId] = true;
    else delete solved[currentId];
    saveSolved();

    if (nowSolved) {
      toast("Solved ✓");
      advanceAfterSolve(previousVisible);
    } else {
      toast("Marked unsolved");
      render();
    }
  }

  /* ---------- theme ---------- */

  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var icons = { auto: "🌗", light: "☀️", dark: "🌙" };
    var next = { auto: "light", light: "dark", dark: "auto" };
    el.themeBtn.firstElementChild.textContent = icons[theme];
    el.themeBtn.title = "Theme: " + theme + " — tap for " + next[theme];
    el.themeBtn.setAttribute("aria-label", el.themeBtn.title);
  }

  function cycleTheme() {
    var order = ["auto", "light", "dark"];
    var current = document.documentElement.getAttribute("data-theme") || "auto";
    var theme = order[(order.indexOf(current) + 1) % order.length];
    store.set(KEY_THEME, theme);
    applyTheme(theme);
  }

  /* ---------- toast ---------- */

  var toastTimer = null;
  function toast(message) {
    el.toast.textContent = message;
    el.toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      el.toast.classList.remove("show");
    }, 1600);
  }

  /* ---------- actions ---------- */

  function doShuffle() {
    shuffle(deck);
    currentId = null;
    goTo(visibleDeck()[0] || null);
    toast("Shuffled 🔀");
  }

  function doReset() {
    if (!window.confirm("Clear your progress? All 100 riddles go back to unsolved.")) return;
    solved = {};
    saveSolved();
    shuffle(deck);
    currentId = deck[0];
    goTo(currentId);
    toast("Progress reset");
  }

  function setShowSolved(value) {
    showSolved = value;
    el.showSolved.checked = value;
    store.set(KEY_SHOW, value ? "1" : "0");
    render();
  }

  /* ---------- wiring ---------- */

  el.card.addEventListener("click", function () {
    if (swiped) { swiped = false; return; } // the tap was really a swipe
    setFlipped(!isFlipped());
  });
  el.prevBtn.addEventListener("click", function () { step(-1); });
  el.nextBtn.addEventListener("click", function () { step(1); });
  el.solveBtn.addEventListener("click", toggleSolved);
  el.shuffleBtn.addEventListener("click", doShuffle);
  el.resetBtn.addEventListener("click", doReset);
  el.emptyResetBtn.addEventListener("click", doReset);
  el.emptyShowBtn.addEventListener("click", function () { setShowSolved(true); });
  el.themeBtn.addEventListener("click", cycleTheme);
  el.showSolved.addEventListener("change", function () { setShowSolved(el.showSolved.checked); });

  // Keyboard shortcuts (desktop). Native button activation wins over our handler.
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var tag = (e.target.tagName || "").toLowerCase();
    var interactive = tag === "button" || tag === "input" || tag === "a";

    switch (e.key) {
      case " ":
      case "Enter":
        if (interactive) return; // let the focused control handle it
        e.preventDefault();
        setFlipped(!isFlipped());
        break;
      case "ArrowLeft": e.preventDefault(); step(-1); break;
      case "ArrowRight": e.preventDefault(); step(1); break;
      case "s": case "S":
        if (tag === "input") return;
        e.preventDefault(); toggleSolved(); break;
      case "r": case "R":
        if (tag === "input") return;
        e.preventDefault(); doShuffle(); break;
    }
  });

  // Swipe left/right on the card to navigate; suppress the flip if it was a swipe.
  var touchStart = null;
  var swiped = false;

  el.card.addEventListener("touchstart", function (e) {
    var t = e.changedTouches[0];
    touchStart = { x: t.clientX, y: t.clientY };
    swiped = false;
  }, { passive: true });

  el.card.addEventListener("touchend", function (e) {
    if (!touchStart) return;
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStart.x;
    var dy = t.clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 55 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped = true;
      step(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

  /* ---------- boot ---------- */

  applyTheme(store.get(KEY_THEME) || "auto");
  el.showSolved.checked = showSolved;
  currentId = visibleDeck()[0] || deck[0];
  render();
})();
