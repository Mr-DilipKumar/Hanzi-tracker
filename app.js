/* ---------- CARD LAYOUT STATE ---------- */
const CARD_LAYOUT_KEY = "hanziTrackerCardLayout";
const DEFAULT_CARD_LAYOUT = { cols: 8, size: "medium" };

function getCardLayout() {
  try {
    const saved = JSON.parse(localStorage.getItem(CARD_LAYOUT_KEY) || "null");
    if (saved && [4, 5, 6, 8, 10].includes(Number(saved.cols)) &&
      ["large", "medium", "small"].includes(saved.size)) {
      return { cols: Number(saved.cols), size: saved.size };
    }
  } catch (e) { console.warn("[HanziTracker]", e); }
  return { ...DEFAULT_CARD_LAYOUT };
}

function applyCardLayout() {
  const layout = getCardLayout();
  ["tile-grid", "radical-grid", "word-grid"].forEach(id => {
    const grid = document.getElementById(id);
    if (grid) {
      grid.classList.remove(
        "card-cols-4", "card-cols-5", "card-cols-6", "card-cols-8", "card-cols-10",
        "card-size-large", "card-size-medium", "card-size-small"
      );
      grid.classList.add("card-cols-" + layout.cols, "card-size-" + layout.size);
    }
  });

  document.querySelectorAll(".card-layout-btn[data-card-cols]").forEach(btn => {
    btn.classList.toggle("active", Number(btn.dataset.cardCols) === layout.cols);
  });
  document.querySelectorAll(".card-layout-btn[data-card-size]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.cardSize === layout.size);
  });
}

function saveCardLayout(next) {
  const current = getCardLayout();
  const layout = { ...current, ...next };
  localStorage.setItem(CARD_LAYOUT_KEY, JSON.stringify(layout));
  applyCardLayout();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-side-status]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.sideStatus;
      const select = document.getElementById("browse-status-select");
      if (select) {
        select.value = target;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      document.getElementById("tab-browse")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
  document.querySelectorAll("[data-side-sort]").forEach(btn => {
    btn.addEventListener("click", () => {
      const select = document.getElementById("browse-sort");
      if (select) {
        select.value = btn.dataset.sideSort;
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
    });
  });
  document.querySelectorAll("[data-side-reset]").forEach(btn => {
    btn.addEventListener("click", () => {
      const status = document.getElementById("browse-status-select");
      if (status) { status.value = "all"; status.dispatchEvent(new Event("change", { bubbles: true })); }
      const level = document.getElementById("browse-level-select");
      if (level) { level.value = "all"; level.dispatchEvent(new Event("change", { bubbles: true })); }
      const srs = document.getElementById("browse-srs-select");
      if (srs) { srs.value = "all"; srs.dispatchEvent(new Event("change", { bubbles: true })); }
      const sort = document.getElementById("browse-sort");
      if (sort) { sort.value = "default"; sort.dispatchEvent(new Event("change", { bubbles: true })); }
      const search = document.getElementById("search-input");
      if (search) { search.value = ""; search.dispatchEvent(new Event("input", { bubbles: true })); }
    });
  });

  document.querySelectorAll(".card-layout-btn[data-card-cols]").forEach(btn => {
    btn.addEventListener("click", () => saveCardLayout({ cols: Number(btn.dataset.cardCols) }));
  });
  document.querySelectorAll(".card-layout-btn[data-card-size]").forEach(btn => {
    btn.addEventListener("click", () => saveCardLayout({ size: btn.dataset.cardSize }));
  });
  applyCardLayout();
});


(function () {
  "use strict";

  let HANZI_DATA = window.HANZI_DATA || [];
  let SENTENCE_DATA = window.SENTENCE_DATA || [];
  let RADICAL_DATA = window.RADICAL_DATA || [];
  let HSK_WORDS_DATA = window.HSK_WORDS_DATA || [];
  let LEVEL_GROUPS = window.LEVEL_GROUPS || [];
  let RADICAL_DETAILS = window.RADICAL_DETAILS || [];
  let RADICAL_DATA_URLS = window.RADICAL_DATA_URLS || [];
  let RADICAL_RSINDEX_URLS = window.RADICAL_RSINDEX_URLS || [];
  let LEVELS = window.LEVELS || [];
  let ACHIEVEMENTS = window.ACHIEVEMENTS || [];
  let PICTOGRAPH_DATA = window.PICTOGRAPH_DATA || [];

  let dataLoadPromise = null;
  async function loadDataFiles() {
    if (dataLoadPromise) return dataLoadPromise;
    dataLoadPromise = (async () => {
      try {
        const [dataRes, wordsRes, sentencesRes] = await Promise.all([
          (window.HANZI_DATA && window.HANZI_DATA.length)
            ? Promise.resolve(null)
            : fetch("data.json").then(r => r.ok ? r.json() : null).catch(() => null),
          (window.HSK_WORDS_DATA && window.HSK_WORDS_DATA.length)
            ? Promise.resolve(null)
            : fetch("words.json").then(r => r.ok ? r.json() : null).catch(() => null),
          (window.SENTENCE_DATA && window.SENTENCE_DATA.length)
            ? Promise.resolve(null)
            : fetch("sentences.json").then(r => r.ok ? r.json() : null).catch(() => null)
        ]);

        if (dataRes) {
          if (Array.isArray(dataRes)) {
            HANZI_DATA = dataRes;
            window.HANZI_DATA = dataRes;
          } else {
            if (dataRes.HANZI_DATA) { HANZI_DATA = dataRes.HANZI_DATA; window.HANZI_DATA = dataRes.HANZI_DATA; }
            if (dataRes.LEVEL_GROUPS) { LEVEL_GROUPS = dataRes.LEVEL_GROUPS; window.LEVEL_GROUPS = dataRes.LEVEL_GROUPS; }
            if (dataRes.RADICAL_DETAILS) { RADICAL_DETAILS = dataRes.RADICAL_DETAILS; window.RADICAL_DETAILS = dataRes.RADICAL_DETAILS; }
            if (dataRes.RADICAL_DATA_URLS) { RADICAL_DATA_URLS = dataRes.RADICAL_DATA_URLS; window.RADICAL_DATA_URLS = dataRes.RADICAL_DATA_URLS; }
            if (dataRes.RADICAL_RSINDEX_URLS) { RADICAL_RSINDEX_URLS = dataRes.RADICAL_RSINDEX_URLS; window.RADICAL_RSINDEX_URLS = dataRes.RADICAL_RSINDEX_URLS; }
            if (dataRes.LEVELS) { LEVELS = dataRes.LEVELS; window.LEVELS = dataRes.LEVELS; }
            if (dataRes.ACHIEVEMENTS) { ACHIEVEMENTS = dataRes.ACHIEVEMENTS; window.ACHIEVEMENTS = dataRes.ACHIEVEMENTS; }
            if (dataRes.PICTOGRAPH_DATA) { PICTOGRAPH_DATA = dataRes.PICTOGRAPH_DATA; window.PICTOGRAPH_DATA = dataRes.PICTOGRAPH_DATA; }
          }
        }

        if (wordsRes) {
          const words = Array.isArray(wordsRes) ? wordsRes : (wordsRes.HSK_WORDS_DATA || []);
          HSK_WORDS_DATA = words;
          window.HSK_WORDS_DATA = words;
        }

        if (sentencesRes) {
          const sentences = Array.isArray(sentencesRes) ? sentencesRes : (sentencesRes.SENTENCE_DATA || []);
          SENTENCE_DATA = sentences;
          window.SENTENCE_DATA = sentences;
        }
      } catch (err) {
        console.warn("[HanziTracker] Error loading JSON datasets:", err);
      }
    })();
    return dataLoadPromise;
  }

  const STORAGE_KEY = "hanzi-tracker-state-v1";
  let state = { progress: {}, sentenceProgress: {}, wordProgress: {}, streak: { count: 0, last: null }, activity: {} };
  let saveTimeout = null;
  let HANZI_BY_CHAR = {};

  function el(id) { return document.getElementById(id); }
  function escHtml(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- persistence ---------- */
  const FALLBACK_STORAGE_KEY = "hanzi-tracker-state-v1";
  let usingLocalStorageFallback = false;

  async function loadState() {
    const defaults = { progress: {}, sentenceProgress: {}, wordProgress: {}, streak: { count: 0, last: null } };

    // ChatGPT/host storage when available.
    try {
      if (window.storage && typeof window.storage.get === "function") {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const parsed = JSON.parse(res.value);
          state = Object.assign(defaults, parsed);
          if (!state.progress) state.progress = {};
          if (!state.sentenceProgress) state.sentenceProgress = {};
          if (!state.wordProgress) state.wordProgress = {};
          if (!state.streak) state.streak = { count: 0, last: null };
          return;
        }
      }
    } catch (e) { console.warn("[HanziTracker]", e); }

    // Standalone browser fallback.
    try {
      const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        state = Object.assign(defaults, parsed);
        if (!state.progress) state.progress = {};
        if (!state.sentenceProgress) state.sentenceProgress = {};
        if (!state.wordProgress) state.wordProgress = {};
        if (!state.streak) state.streak = { count: 0, last: null };
      }
      usingLocalStorageFallback = true;
    } catch (e) {
      state = defaults;
      usingLocalStorageFallback = true;
    }
  }

  function ensureActivityState() { if (!state.activity || typeof state.activity !== "object") state.activity = {}; }
  function recordActivity(kind) {
    ensureActivityState();
    const key = new Date().toISOString().slice(0, 10);
    if (!state.activity[key]) state.activity[key] = { reviews: 0, characters: 0, sentences: 0, words: 0 };
    state.activity[key].reviews = Number(state.activity[key].reviews || 0) + 1;
    if (kind === "character") state.activity[key].characters = Number(state.activity[key].characters || 0) + 1;
    if (kind === "sentence") state.activity[key].sentences = Number(state.activity[key].sentences || 0) + 1;
    if (kind === "word") state.activity[key].words = Number(state.activity[key].words || 0) + 1;
  }

  function saveState() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async () => {
      state.updatedAt = new Date().toISOString();
      const payload = JSON.stringify(state);

      try {
        if (window.storage && typeof window.storage.set === "function") {
          await window.storage.set(STORAGE_KEY, payload, false);
        }
      } catch (e) { console.warn("[HanziTracker]", e); }

      try {
        window.localStorage.setItem(FALLBACK_STORAGE_KEY, payload);
        usingLocalStorageFallback = true;
      } catch (e) {
        showToast("Couldn't save progress just now.", true);
      }
      if (typeof debouncedSync === "function") debouncedSync();
    }, 100);
  }

  /* ---------- toast ---------- */
  function showToast(msg, isError) {
    const t = document.createElement("div");
    t.className = "toast" + (isError ? " toast-error" : "");
    t.textContent = msg;
    el("toast-container").appendChild(t);
    requestAnimationFrame(() => t.classList.add("show"));
    setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 300); }, 2400);
  }

  function triggerStampFX(target) {
    const node = target || el("app");
    node.classList.add("stamp-fx");
    setTimeout(() => node.classList.remove("stamp-fx"), 480);
  }

  function spawnConfetti(target) {
    const node = target || el("app");
    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ["#FFD873", "#F5B942", "#FF7A54", "#2F8F6E", "#FFF6E0"];
    for (let i = 0; i < 16; i++) {
      const p = document.createElement("span");
      p.className = "confetti-piece";
      const angle = Math.random() * Math.PI * 2;
      const dist = 55 + Math.random() * 75;
      const size = 5 + Math.random() * 4;
      p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      p.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      p.style.setProperty("--rot", (Math.random() * 360) + "deg");
      p.style.left = cx + "px";
      p.style.top = cy + "px";
      p.style.width = size + "px";
      p.style.height = size + "px";
      p.style.borderRadius = (i % 2 === 0) ? "50%" : "2px";
      p.style.background = colors[i % colors.length];
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 850);
    }
  }

  /* ==========================================================================
   *  NATIVE MANDARIN AUDIO ENGINE (Youdao Neural HD + Baidu TTS Stream)
   * ========================================================================== */

  let currentActiveAudio = null;
  let activeAudioSequence = [];

  function playChineseAudio(text, options = {}) {
    if (!text || typeof text !== "string") return;
    const cleanText = text.replace(/[\uFFFD\u0000-\u001F]/g, "").trim();
    if (!cleanText) return;

    const rate = options.rate || 0.88;
    const onStart = options.onStart;
    const onEnd = options.onEnd;

    if (currentActiveAudio) {
      try {
        currentActiveAudio.pause();
      } catch (e) { }
      currentActiveAudio = null;
    }

    // Stop any previously playing sequence
    activeAudioSequence = [];

    if (onStart) onStart();

    if (typeof Audio !== "undefined") {
      if (options.audioPath || options.sentenceId) {
        let audioUrl = options.audioPath || `audio/${options.sentenceId}.mp3`;
        if (options.rate && options.rate < 0.8) {
          if (options.slowAudioPath) audioUrl = options.slowAudioPath;
          else if (options.sentenceId && !options.audioPath) audioUrl = `audio/${options.sentenceId}_slow.mp3`;
        }
        const a = new Audio(audioUrl);
        a.playbackRate = 1.0;
        a.load();
        activeAudioSequence = [a];
        currentActiveAudio = a;
        a.onended = () => {
          currentActiveAudio = null;
          if (onEnd) onEnd();
        };
        a.onerror = () => {
          // If local audio file cannot be loaded, fallback to online speech synthesis
          currentActiveAudio = null;
          playFallbackSpeech(cleanText, rate, onEnd);
        };
        a.play().catch(() => {
          currentActiveAudio = null;
          playFallbackSpeech(cleanText, rate, onEnd);
        });
        return;
      }

      let chunks = [];
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
        const segments = Array.from(segmenter.segment(cleanText));
        chunks = segments.filter(s => s.isWordLike).map(s => s.segment);
      } else {
        const chars = Array.from(cleanText).filter(ch => !/[，。！？；：“”《》、,.!?\s]/.test(ch));
        for (let i = 0; i < chars.length; i += 2) {
          chunks.push(chars.slice(i, i + 2).join(''));
        }
      }

      if (chunks.length === 0) {
        if (onEnd) onEnd();
        return;
      }

      // Pre-create all Audio elements and call load() SYNCHRONOUSLY 
      // during the user gesture to satisfy strict autoplay policies (e.g. Safari)
      const audioElements = chunks.map(chunkText => {
        let encoded = "";
        try {
          encoded = encodeURIComponent(chunkText);
        } catch (e) {
          encoded = encodeURIComponent(chunkText.replace(/[\uD800-\uDFFF]/g, ''));
        }
        const audioUrl = `https://dict.youdao.com/dictvoice?audio=${encoded}&le=zh`;
        const a = new Audio(audioUrl);
        a.playbackRate = rate > 0.95 ? 1.0 : (rate < 0.8 ? 0.8 : 0.9);
        a.load(); // CRITICAL for unlocking sequential playback
        return a;
      });

      activeAudioSequence = audioElements;
      let currentChunkIndex = 0;

      const playNextChunk = () => {
        // If the sequence was interrupted by another click, stop playing.
        if (activeAudioSequence !== audioElements || currentChunkIndex >= audioElements.length) {
          if (activeAudioSequence === audioElements) {
            currentActiveAudio = null;
            if (onEnd) onEnd();
          }
          return;
        }

        const audio = audioElements[currentChunkIndex++];
        currentActiveAudio = audio;

        audio.ontimeupdate = () => {
          // Trigger next chunk slightly before this one ends to eliminate the gap
          if (audio.duration && audio.currentTime > 0 && audio.duration - audio.currentTime < 0.15 && !audio.nextTriggered) {
            audio.nextTriggered = true;
            playNextChunk();
          }
        };

        audio.onended = () => {
          if (!audio.nextTriggered) {
            audio.nextTriggered = true;
            playNextChunk();
          }
        };

        audio.onerror = () => {
          if (!audio.nextTriggered) {
            audio.nextTriggered = true;
            playNextChunk();
          }
        };

        try {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch((err) => {
              console.error("Audio playback error:", err);
              setTimeout(playNextChunk, 50); // proceed to next chunk if blocked
            });
          }
        } catch (e) {
          setTimeout(playNextChunk, 50);
        }
      };

      playNextChunk();
    }
  }

  /* ---------- indexes ---------- */
  function buildIndexes() {
    HANZI_BY_CHAR = {};
    for (const item of HANZI_DATA) HANZI_BY_CHAR[item.c] = item;
  }

  function levelMatches(item, level) {
    if (level === "all") return true;
    if (level === "adv" || level === "7") return item.h >= 7 && item.h <= 9;
    if (level === "0") return item.h === 0;
    return item.h === Number(level);
  }

  function itemLevelKey(item) {
    if (item.h === 0) return "0";
    if (item.h >= 7) return "adv";
    return String(item.h);
  }

  function levelSetMatches(item, selectedSet) {
    if (!selectedSet || selectedSet.size === 0) return true;
    return selectedSet.has(itemLevelKey(item));
  }

  function levelLabel(h) {
    if (h === 0) return "Beyond HSK";
    if (h >= 7) return "HSK " + h + " · Advanced";
    return "HSK " + h;
  }

  const MS_PER_DAY = 86400000;

  /* ---------- status / progress core ---------- */
  function getEntry(char) { return state.progress[char] || null; }
  function getStatus(char) { const e = getEntry(char); return e ? e.status : "new"; }

  function getSentenceEntry(id) { return state.sentenceProgress[String(id)] || null; }
  function getSentenceStatus(id) { const e = getSentenceEntry(id); return e ? e.status : "new"; }

  function getWordKey(word) { return String(word || ""); }
  function getWordEntry(word) {
    if (!state.wordProgress || typeof state.wordProgress !== "object") state.wordProgress = {};
    return state.wordProgress[getWordKey(word)] || null;
  }
  function getWordStatus(word) { const e = getWordEntry(word); return e ? e.status : "new"; }

  function writeWordEntry(word, opts) {
    if (!state.wordProgress || typeof state.wordProgress !== "object") state.wordProgress = {};
    const now = Date.now();
    const prev = state.wordProgress[word] || { status: "new", interval: 0, reviews: 0, due: now, stampedAt: null };
    let stampedAt = prev.stampedAt || null;
    if (opts.status === "known" && !stampedAt) stampedAt = now;
    if (opts.status !== "known") stampedAt = null;
    const due = now + (opts.interval || 0) * MS_PER_DAY;
    state.wordProgress[word] = {
      status: opts.status,
      interval: opts.interval || 0,
      reviews: (prev.reviews || 0) + (opts.incrementReviews ? 1 : 0),
      due, stampedAt
    };
    bumpStreak();
    saveState();
  }

  function setWordStatusManual(word, status) {
    const prev = state.wordProgress[word] || { interval: 0 };
    let interval = prev.interval || 0;
    if (status === "known") interval = Math.max(interval, 30);
    if (status === "new") interval = 0;
    return writeWordEntry(word, { status, interval, incrementReviews: false });
  }

  function computeWordCounts() {
    let known = 0, learning = 0;
    for (const w in state.wordProgress) {
      const s = state.wordProgress[w].status;
      if (s === "known") known++; else if (s === "learning") learning++;
    }
    const total = WORD_DATA ? WORD_DATA.length : 0;
    return { known, learning, neu: Math.max(0, total - known - learning), total };
  }

  function updateWordSidebars() {
    const counts = computeWordCounts();
    el("word-stat-total").textContent = counts.total.toLocaleString();
    el("word-side-known").textContent = counts.known.toLocaleString();
    el("word-side-learning").textContent = counts.learning.toLocaleString();
    el("word-side-new").textContent = counts.neu.toLocaleString();
    const pct = counts.total ? (counts.known / counts.total * 100) : 0;
    el("word-side-progress-ring").style.setProperty("--pct", pct.toFixed(2));
    el("word-side-progress-pct").textContent = pct.toFixed(0) + "%";
    el("word-side-progress-known").textContent = counts.known.toLocaleString();
    el("word-side-progress-total").textContent = counts.total.toLocaleString();
  }

  function bumpStreak() {
    const today = new Date().toDateString();
    if (state.streak.last === today) return;
    if (state.streak.last) {
      const diffDays = Math.round((new Date(today) - new Date(new Date(state.streak.last).toDateString())) / MS_PER_DAY);
      state.streak.count = diffDays === 1 ? (state.streak.count || 0) + 1 : 1;
    } else {
      state.streak.count = 1;
    }
    state.streak.last = today;
  }


  /* ==========================================================================
     FSRS (FREE SPACED REPETITION SCHEDULER) ALGORITHM ENGINE (v4.5)
     ========================================================================== */
  const FSRS_DEFAULT_WEIGHTS = [
    0.40255, 1.18385, 3.173, 15.69105, // S0: Initial stability for Again, Hard, Good, Easy
    7.1949, 0.5345,                     // D0: Initial difficulty parameters
    1.4604, 0.0046,                     // Next difficulty & mean reversion
    1.54575, 0.1192, 1.01925,           // Stability after recall (Good/Hard/Easy)
    1.9395, 0.11, 0.29605, 0.22695,     // Stability after lapse (Again)
    0.56995, 2.85775,                   // Hard penalty, Easy bonus
    0.4795, 0.278                       // Decay factor & retrievability effect
  ];

  const FSRS_DECAY = -0.5;
  const FSRS_FACTOR = Math.pow(0.9, 1 / FSRS_DECAY) - 1; // 19/81 ≈ 0.2345679
  const FSRS_TARGET_RETENTION = 0.90; // Default 90% target retention

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function fsrsRetrievability(elapsedDays, stability) {
    if (!stability || stability <= 0) return 0;
    if (!elapsedDays || elapsedDays <= 0) return 1.0;
    return Math.pow(1 + FSRS_FACTOR * (elapsedDays / stability), FSRS_DECAY);
  }

  function fsrsInitialStability(grade) {
    return Math.max(0.1, FSRS_DEFAULT_WEIGHTS[grade - 1] || 1.0);
  }

  function fsrsInitialDifficulty(grade) {
    const d0 = FSRS_DEFAULT_WEIGHTS[4] - Math.exp(FSRS_DEFAULT_WEIGHTS[5] * (grade - 1)) + 1;
    return clamp(d0, 1.0, 10.0);
  }

  function fsrsNextDifficulty(d, grade) {
    const deltaD = -FSRS_DEFAULT_WEIGHTS[6] * (grade - 3);
    const rawD = (d || 5.0) + deltaD;
    const initD3 = fsrsInitialDifficulty(3);
    const nextD = FSRS_DEFAULT_WEIGHTS[7] * initD3 + (1 - FSRS_DEFAULT_WEIGHTS[7]) * rawD;
    return clamp(nextD, 1.0, 10.0);
  }

  function fsrsNextStabilityRecall(d, s, r, grade) {
    const hardPenalty = grade === 2 ? FSRS_DEFAULT_WEIGHTS[15] : 1.0;
    const easyBonus = grade === 4 ? FSRS_DEFAULT_WEIGHTS[16] : 1.0;
    const retrievabilityEffect = Math.exp(FSRS_DEFAULT_WEIGHTS[8]) *
      (11 - d) *
      Math.pow(s, -FSRS_DEFAULT_WEIGHTS[9]) *
      (Math.exp(FSRS_DEFAULT_WEIGHTS[10] * (1 - r)) - 1);
    const nextS = s * (1 + retrievabilityEffect * hardPenalty * easyBonus);
    return Math.max(0.1, nextS);
  }

  function fsrsNextStabilityLapse(d, s, r) {
    const nextS = FSRS_DEFAULT_WEIGHTS[11] *
      Math.pow(d, -FSRS_DEFAULT_WEIGHTS[12]) *
      (Math.pow(s + 1, FSRS_DEFAULT_WEIGHTS[13]) - 1) *
      Math.exp(FSRS_DEFAULT_WEIGHTS[14] * (1 - r));
    return Math.max(0.1, Math.min(s, nextS));
  }

  function fsrsNextInterval(stability, targetRetention = FSRS_TARGET_RETENTION) {
    const interval = (stability / FSRS_FACTOR) * (Math.pow(targetRetention, 1 / FSRS_DECAY) - 1);
    return Math.max(1, Math.round(interval));
  }

  function formatFSRSInterval(days) {
    if (days < 1 / 24) return "< 10m";
    if (days < 1) return Math.round(days * 24) + "h";
    if (days < 30) return Math.round(days) + "d";
    if (days < 365) return (days / 30).toFixed(1).replace('.0', '') + "mo";
    return (days / 365).toFixed(1).replace('.0', '') + "y";
  }

  function normalizeRatingGrade(rating) {
    if (typeof rating === "number" && rating >= 1 && rating <= 4) return rating;
    const map = {
      "again": 1, "new": 1, "1": 1,
      "hard": 2, "learning": 2, "2": 2,
      "good": 3, "3": 3,
      "easy": 4, "known": 4, "4": 4
    };
    return map[String(rating).toLowerCase()] || 3;
  }

  function scheduleFSRS(card, rawRating, now = Date.now()) {
    const grade = normalizeRatingGrade(rawRating);
    let { s = 0, d = 0, reps = 0, lapses = 0, state: cardState = 0, last_review = null, interval = 0 } = card || {};

    // Auto-migrate legacy cards
    if (card?.interval && !s) {
      s = Math.max(0.4, Number(card.interval));
      d = 5.0;
      cardState = card.status === "known" ? 2 : (card.status === "learning" ? 1 : 0);
    }

    let elapsedDays = 0;
    if (last_review) {
      elapsedDays = Math.max(0, (now - last_review) / MS_PER_DAY);
    } else if (card?.stampedAt) {
      elapsedDays = Math.max(0, (now - card.stampedAt) / MS_PER_DAY);
    }

    const r = (cardState === 0 || !s) ? 1.0 : fsrsRetrievability(elapsedDays, s);
    let nextS = s;
    let nextD = d || 5.0;
    let nextState = cardState;

    if (cardState === 0 || reps === 0 || !s) { // New card
      nextS = fsrsInitialStability(grade);
      nextD = fsrsInitialDifficulty(grade);
      nextState = (grade === 1) ? 1 : 2;
    } else if (cardState === 1 || cardState === 3) { // Learning or Relearning
      if (grade === 1) { // Again
        nextS = Math.min(s, fsrsInitialStability(1));
        nextD = fsrsNextDifficulty(nextD, grade);
        nextState = cardState;
      } else { // Hard, Good, Easy
        nextS = fsrsNextStabilityRecall(nextD, s, r, grade);
        nextD = fsrsNextDifficulty(nextD, grade);
        nextState = 2; // Promoted to Review
      }
    } else { // Review state
      if (grade === 1) { // Lapse
        nextS = fsrsNextStabilityLapse(nextD, s, r);
        nextD = fsrsNextDifficulty(nextD, grade);
        lapses = (lapses || 0) + 1;
        nextState = 3; // Relearning
      } else { // Recall
        nextS = fsrsNextStabilityRecall(nextD, s, r, grade);
        nextD = fsrsNextDifficulty(nextD, grade);
        nextState = 2; // Review
      }
    }

    const nextIntervalDays = (grade === 1) ? 1 : fsrsNextInterval(nextS);
    const nextDue = now + nextIntervalDays * MS_PER_DAY;
    reps = (reps || 0) + 1;

    // Harmonize status with user's collection goals
    const userStatus = (nextIntervalDays >= 21 || (nextState === 2 && reps >= 3 && grade >= 3)) ? "known" : "learning";

    return {
      s: Number(nextS.toFixed(4)),
      d: Number(nextD.toFixed(2)),
      r: Number((r * 100).toFixed(1)),
      reps,
      lapses,
      state: nextState,
      interval: nextIntervalDays,
      last_review: now,
      due: nextDue,
      status: userStatus
    };
  }

  function previewFSRSIntervals(card, now = Date.now()) {
    const grades = [1, 2, 3, 4];
    const previews = {};
    grades.forEach(g => {
      const scheduled = scheduleFSRS(card, g, now);
      previews[g] = formatFSRSInterval(scheduled.interval);
    });
    return previews;
  }

  function writeEntry(char, opts) {
    const now = Date.now();
    const prev = state.progress[char] || { status: "new", interval: 0, reviews: 0, s: 0, d: 0, reps: 0, lapses: 0, state: 0, due: now, stampedAt: null, last_review: null };
    let stampedAt = prev.stampedAt || null;
    if (opts.status === "known" && !stampedAt) stampedAt = now;
    if (opts.status !== "known") stampedAt = null;
    const due = opts.due != null ? opts.due : (now + (opts.interval || 0) * MS_PER_DAY);
    state.progress[char] = {
      status: opts.status,
      interval: opts.interval || 0,
      s: opts.s != null ? opts.s : prev.s || 0,
      d: opts.d != null ? opts.d : prev.d || 0,
      reps: opts.reps != null ? opts.reps : ((prev.reps || 0) + (opts.incrementReviews ? 1 : 0)),
      lapses: opts.lapses != null ? opts.lapses : (prev.lapses || 0),
      state: opts.state != null ? opts.state : (prev.state || 0),
      last_review: opts.last_review || (opts.incrementReviews ? now : prev.last_review),
      reviews: (prev.reviews || 0) + (opts.incrementReviews ? 1 : 0),
      due, stampedAt
    };
    bumpStreak();
    if (opts.incrementReviews) recordActivity("character");
    saveState();
    return state.progress[char];
  }

  function calculateRating(prev, rating) {
    return scheduleFSRS(prev, rating);
  }

  function rateCard(char, rating) {
    const prev = state.progress[char] || { status: "new", interval: 0, s: 0, d: 0, reps: 0, lapses: 0, state: 0 };
    const next = scheduleFSRS(prev, rating);
    return writeEntry(char, { ...next, incrementReviews: true });
  }

  function writeSentenceEntry(id, opts) {
    const now = Date.now();
    const key = String(id);
    const prev = state.sentenceProgress[key] || { status: "new", interval: 0, reviews: 0, s: 0, d: 0, reps: 0, lapses: 0, state: 0, due: now, last_review: null };
    const due = opts.due != null ? opts.due : (now + (opts.interval || 0) * MS_PER_DAY);
    state.sentenceProgress[key] = {
      status: opts.status,
      interval: opts.interval || 0,
      s: opts.s != null ? opts.s : prev.s || 0,
      d: opts.d != null ? opts.d : prev.d || 0,
      reps: opts.reps != null ? opts.reps : ((prev.reps || 0) + (opts.incrementReviews ? 1 : 0)),
      lapses: opts.lapses != null ? opts.lapses : (prev.lapses || 0),
      state: opts.state != null ? opts.state : (prev.state || 0),
      last_review: opts.last_review || (opts.incrementReviews ? now : prev.last_review),
      reviews: (prev.reviews || 0) + (opts.incrementReviews ? 1 : 0),
      due
    };
    bumpStreak();
    if (opts.incrementReviews) recordActivity("sentence");
    saveState();
    return state.sentenceProgress[key];
  }

  function writeWordEntry(word, opts) {
    const now = Date.now(); const key = getWordKey(word);
    const prev = state.wordProgress[key] || { status: "new", interval: 0, reviews: 0, s: 0, d: 0, reps: 0, lapses: 0, state: 0, due: now, last_review: null };
    const due = opts.due != null ? opts.due : (now + (opts.interval || 0) * MS_PER_DAY);
    state.wordProgress[key] = {
      status: opts.status,
      interval: opts.interval || 0,
      s: opts.s != null ? opts.s : prev.s || 0,
      d: opts.d != null ? opts.d : prev.d || 0,
      reps: opts.reps != null ? opts.reps : ((prev.reps || 0) + (opts.incrementReviews ? 1 : 0)),
      lapses: opts.lapses != null ? opts.lapses : (prev.lapses || 0),
      state: opts.state != null ? opts.state : (prev.state || 0),
      last_review: opts.last_review || (opts.incrementReviews ? now : prev.last_review),
      reviews: (prev.reviews || 0) + (opts.incrementReviews ? 1 : 0),
      due
    };
    bumpStreak(); if (opts.incrementReviews) recordActivity("word"); saveState();
    return state.wordProgress[key];
  }

  function rateWord(word, rating) {
    const prev = getWordEntry(word) || { status: "new", interval: 0, s: 0, d: 0, reps: 0, lapses: 0, state: 0 };
    const next = scheduleFSRS(prev, rating);
    return writeWordEntry(word, { ...next, incrementReviews: true });
  }

  function rateSentence(id, rating) {
    const prev = getSentenceEntry(id) || { status: "new", interval: 0, s: 0, d: 0, reps: 0, lapses: 0, state: 0 };
    const next = scheduleFSRS(prev, rating);
    return writeSentenceEntry(id, { ...next, incrementReviews: true });
  }

  function setSentenceStatus(id, status) {
    const prev = getSentenceEntry(id) || { interval: 0 };
    let interval = prev.interval || 0;
    if (status === "known") interval = Math.max(interval, 30);
    if (status === "new") interval = 0;
    return writeSentenceEntry(id, { status, interval, incrementReviews: false });
  }

  function setStatusManual(char, status) {
    const prev = state.progress[char] || { interval: 0 };
    let interval = prev.interval || 0;
    if (status === "known") interval = Math.max(interval, 30);
    if (status === "new") interval = 0;
    return writeEntry(char, { status, interval, incrementReviews: false });
  }

  function saveMnemonic(char, mnemonic) {
    const prev = state.progress[char] || { status: "new", interval: 0, reviews: 0, due: Date.now(), stampedAt: null };
    prev.mnemonic = mnemonic;
    state.progress[char] = prev;
    saveState();
  }

  function computeCounts() {
    let known = 0, learning = 0;
    for (const c in state.progress) {
      const s = state.progress[c].status;
      if (s === "known") known++; else if (s === "learning") learning++;
    }
    const total = HANZI_DATA.length;
    return { known, learning, neu: total - known - learning, total };
  }

  function getDueCount() {
    const now = Date.now();
    return getScopeData(reviewFilters.levels).filter(item => {
      const e = getEntry(item.c);
      return e && e.status !== "new" && e.status !== "known" && Number(e.due || 0) <= now;
    }).length;
  }

  function getWordDueCount() {
    const now = Date.now();
    return buildWordData().filter(w => {
      const e = getWordEntry(w.word);
      return e && e.status !== "new" && e.status !== "known" && Number(e.due || 0) <= now;
    }).length;
  }

  /* ---------- sync ---------- */
  function updateHeaderProgress() {
    const { known, total } = computeCounts();
    const pct = total ? (known / total * 100) : 0;
    el("progress-ring").style.setProperty("--pct", pct.toFixed(2));
    el("progress-ring-label").textContent = pct.toFixed(0) + "%";
    el("header-count").textContent = known.toLocaleString() + " / " + total.toLocaleString();
  }

  function refreshDueCount() {
    const due = reviewMode === "sentences" ? getSentenceDueCount() : reviewMode === "words" ? getWordDueCount() : reviewMode === "mixed" ? (getDueCount() + getSentenceDueCount()) : getDueCount();
    el("due-count").textContent = due.toLocaleString();
  }

  function updateBrowseSidebars() {
    const counts = computeCounts();
    const visible = getFilteredData ? getFilteredData().length : counts.total;
    const set = (id, val) => { const n = el(id); if (n) n.textContent = Number(val).toLocaleString(); };

    set("side-visible-count", visible);
    set("side-known", counts.known);
    set("side-learning", counts.learning);
    set("side-new", counts.neu);
    set("side-progress-known", counts.known);
    set("side-progress-total", counts.total);

    const pct = counts.total ? (counts.known / counts.total * 100) : 0;
    const ring = el("side-progress-ring");
    if (ring) ring.style.setProperty("--side-pct", pct.toFixed(2));
    const pctNode = el("side-progress-pct");
    if (pctNode) pctNode.textContent = pct.toFixed(0) + "%";
  }

  function syncUI() {
    updateHeaderProgress();
    refreshDueCount();
    renderBrowse();
    updateBrowseSidebars();
    if (el("tab-progress").classList.contains("active")) renderProgress();
    if (el("tab-sentences").classList.contains("active")) renderSentences();
    if (el("tab-words") && el("tab-words").classList.contains("active")) renderWords();
    if (el("tab-radicals").classList.contains("active")) renderRadicals();
    if (el("tab-pictographs") && el("tab-pictographs").classList.contains("active")) renderPictographsTab();
  }

  /* ---------- BROWSE ---------- */
  let browseFilters = { levels: new Set(), statuses: new Set(), srsStage: "all", query: "", sort: "default" };
  let browsePage = 0;
  const PAGE_SIZE = 96;

  function getSrsStage(char) {
    const entry = getEntry(char);
    if (!entry || !entry.reviews) return "new";
    const interval = Number(entry.interval) || 0;
    if (interval >= 90) return "mastered";
    if (interval >= 21) return "mature";
    return "learning";
  }

  function getFilteredData() {
    const q = browseFilters.query.trim().toLowerCase();
    const data = HANZI_DATA.filter(item => {
      if (!levelSetMatches(item, browseFilters.levels)) return false;
      if (browseFilters.statuses.size && !browseFilters.statuses.has(getStatus(item.c))) return false;
      if (browseFilters.srsStage !== "all" && getSrsStage(item.c) !== browseFilters.srsStage) return false;
      if (q && !(item.c.includes(q) || item.p.toLowerCase().includes(q) || item.m.toLowerCase().includes(q))) return false;
      return true;
    });

    if (browseFilters.sort === "frequency-asc") {
      return data.slice().sort((a, b) => (Number(a.f) || 999999) - (Number(b.f) || 999999));
    }
    if (browseFilters.sort === "frequency-desc") {
      return data.slice().sort((a, b) => (Number(b.f) || 999999) - (Number(a.f) || 999999));
    }
    return data;
  }

  let browseSelectionMode = "off";
  const selectedBrowseChars = new Set();

  function updateBrowseSelectionUI() {
    const bar = el("browse-selection-bar");
    if (!bar) return;
    bar.querySelectorAll("[data-selection-mode]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.selectionMode === browseSelectionMode);
    });
    el("selection-count").textContent = selectedBrowseChars.size + " selected";
    const hasSelection = selectedBrowseChars.size > 0;
    bar.querySelectorAll("[data-bulk-status], #clear-selection").forEach(btn => {
      btn.disabled = !hasSelection;
      btn.style.opacity = hasSelection ? "1" : ".45";
      btn.style.cursor = hasSelection ? "pointer" : "default";
    });
  }

  function setBrowseSelectionMode(mode) {
    browseSelectionMode = mode;
    if (mode === "off") selectedBrowseChars.clear();
    if (mode === "single" && selectedBrowseChars.size > 1) {
      const first = selectedBrowseChars.values().next().value;
      selectedBrowseChars.clear();
      if (first) selectedBrowseChars.add(first);
    }
    updateBrowseSelectionUI();
    renderBrowse();
  }

  function toggleBrowseSelection(char) {
    if (browseSelectionMode === "off") return;
    if (browseSelectionMode === "single") {
      if (selectedBrowseChars.has(char)) selectedBrowseChars.clear();
      else { selectedBrowseChars.clear(); selectedBrowseChars.add(char); }
    } else {
      if (selectedBrowseChars.has(char)) selectedBrowseChars.delete(char);
      else selectedBrowseChars.add(char);
    }
    updateBrowseSelectionUI();
    renderBrowse();
  }

  function applyBulkBrowseStatus(status) {
    const chars = Array.from(selectedBrowseChars);
    if (!chars.length) return;
    const newlyKnown = status === "known" ? chars.filter(c => getStatus(c) !== "known").length : 0;
    chars.forEach(char => setStatusManual(char, status));
    selectedBrowseChars.clear();
    syncUI();
    if (newlyKnown) {
      const tileEls = chars.map(c => document.querySelector('.tile[data-char="' + CSS.escape(c) + '"]')).filter(Boolean);
      if (tileEls.length) {
        tileEls.forEach(el => triggerStampFX(el));
        if (tileEls.length <= 24) tileEls.forEach(el => spawnConfetti(el));
      }
    }
    showToast(chars.length + " card" + (chars.length === 1 ? "" : "s") + " marked " + (status === "learning" ? "Learning" : "Already known") + ".");
  }

  let browseShowPinyin = true;
  let browseShowEnglish = false;
  const flippedBrowseChars = new Set();
  let sentenceShowPinyin = localStorage.getItem("hanziSentenceShowPinyin") === "1";
  let sentenceShowEnglish = localStorage.getItem("hanziSentenceShowEnglish") === "1";
  let sentenceShuffled = false;   // Feature 7: shuffle state
  let sentenceShuffleOrder = []; // shuffled sentence id order

  function tileHTML(item) {
    const status = getStatus(item.c);
    const selected = selectedBrowseChars.has(item.c);
    const flipped = flippedBrowseChars.has(item.c);
    const meaning = formatDefinition(item.m || 'No English meaning recorded.', item.c);
    return '<div class="tile selectable status-' + status + (selected ? ' selected' : '') + (flipped ? ' flipped' : '') + '" data-char="' + escHtml(item.c) + '" aria-pressed="' + (selected ? 'true' : 'false') + '" tabindex="0" role="button" aria-label="' + escHtml(item.c + ' card') + '">' +
      '<div class="tile-inner">' +
      '<div class="tile-face front">' +
      '<button type="button" class="tone-audio-btn-sm" data-speak-char="' + escHtml(item.c) + '" title="Listen" style="position:absolute; top:4px; right:4px; z-index:2;">🔊</button>' +
      '<span class="tile-hanzi">' + escHtml(item.c) + '</span>' +
      '<span class="tile-pinyin" ' + (browseShowPinyin ? '' : 'hidden') + '>' + escHtml(item.p) + '</span>' +
      '<span class="tile-english" ' + (browseShowEnglish ? '' : 'hidden') + '>' + escHtml(meaning) + '</span>' +
      '</div>' +
      '<div class="tile-face back">' +
      '<div class="tile-back-meaning">' + escHtml(meaning) + '</div>' +
      '<div class="tile-back-pinyin">' + escHtml(item.p || '—') + '</div>' +
      '</div>' +
      '</div>' +
      '</div>';
  }

  function renderBrowse() {
    const data = getFilteredData();
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    if (browsePage >= totalPages) browsePage = totalPages - 1;
    if (browsePage < 0) browsePage = 0;
    const pageItems = data.slice(browsePage * PAGE_SIZE, browsePage * PAGE_SIZE + PAGE_SIZE);
    el("result-count").textContent = data.length.toLocaleString() + " character" + (data.length === 1 ? "" : "s");
    el("page-indicator").textContent = (browsePage + 1) + " / " + totalPages;
    el("prev-page").disabled = browsePage === 0;
    el("next-page").disabled = browsePage >= totalPages - 1;
    el("tile-grid").innerHTML = pageItems.map(tileHTML).join("");
    updateBrowseSelectionUI();
  }

  // Curated high-frequency English meaning rankings for common characters
  const TOP_CURATED_MEANINGS = {
    '的': 'of, possessive particle, target/aim, clear',
    '一': 'one, single, a(n), whole',
    '是': 'is, am, are, to be, yes, correct',
    '不': 'not, no, non-',
    '了': 'completed action marker, modal particle',
    '在': 'at, in, on, exist, located',
    '人': 'person, people, human',
    '有': 'have, possess, there is, exist',
    '我': 'I, me, my, myself',
    '他': 'he, him, his',
    '这': 'this, these',
    '个': 'individual, measure word for general items',
    '们': 'plural marker for pronouns and people',
    '中': 'middle, center, in, within, China, Chinese',
    '来': 'come, arrive, return',
    '上': 'up, above, top, on, go up, previous',
    '大': 'big, large, great, huge',
    '为': 'for, because of, serve as, act as',
    '和': 'and, with, harmonious, peace',
    '国': 'country, nation, state, kingdom',
    '地': 'earth, ground, land, field, place, -ly (adverbial particle)',
    '到': 'arrive, reach, go to, until',
    '以': 'with, by means of, in order to, according to',
    '说': 'speak, say, talk, explain',
    '时': 'time, hour, period, season, when',
    '要': 'want, need, will, require, important',
    '就': 'then, at once, right away, only, with regard to',
    '出': 'go out, come out, produce, exceed',
    '会': 'can, able to, meet, assembly, meeting, association',
    '可': 'can, may, able to, feasible, but',
    '也': 'also, too, as well, either',
    '你': 'you (singular)',
    '对': 'correct, right, facing, toward, pair, opposite',
    '生': 'born, give birth, life, grow, raw, student',
    '能': 'can, able to, capable, energy, ability',
    '而': 'and, as well as, but, yet',
    '子': 'child, son, small thing, seed, suffix for nouns',
    '那': 'that, those, then',
    '得': 'obtain, get, gain, allow, suitable, particle expressing degree',
    '于': 'in, at, to, from, than',
    '着': 'aspect particle indicating ongoing action',
    '下': 'down, below, under, lower, next, descend',
    '自': 'self, oneself, from, since',
    '之': 'possessive particle, of, it, him, her, go to',
    '年': 'year, age, annual',
    '过': 'pass, cross, go over, spend time, experienced action marker',
    '发': 'send out, issue, emit, develop, hair',
    '后': 'back, behind, after, later, queen',
    '作': 'make, do, compose, write, act as',
    '里': 'inside, interior, neighborhood, Chinese mile (0.5 km)',
    '用': 'use, employ, apply, with, usefulness',
    '道': 'way, path, road, direction, method, Tao/principle, speak',
    '行': 'walk, go, travel, all right/capable, profession, row/line',
    '所': 'place, location, office, measure word for houses/schools, that which',
    '家': 'home, family, household, specialist (-ist/-er)',
    '种': 'kind, type, seed, species, to plant, to grow',
    '事': 'matter, thing, affair, business, event, trouble',
    '成': 'become, succeed, finish, accomplish, into',
    '方': 'direction, side, square, region, party, method',
    '多': 'many, much, more, multiple, excessive',
    '经': 'pass through, undergo, experience, classic text, economy',
    '么': 'interrogative suffix (什么, 怎么)',
    '去': 'go, leave, depart, remove',
    '法': 'law, method, way, France, French',
    '学': 'learn, study, science, school',
    '如': 'as, like, if, according to',
    '都': 'all, both, entirely, capital city (dū)',
    '同': 'same, similar, together, with',
    '现': 'appear, present, current, now, reveal',
    '当': 'be, act as, when, during, ought to, proper',
    '没': 'not have, there is not, not, drown/sink (mò)',
    '动': 'move, act, action, change, stir',
    '面': 'face, surface, side, aspect, noodles',
    '起': 'rise, get up, start, raise, initiate',
    '看': 'look, see, watch, read, visit, look after (kān)',
    '定': 'fix, settle, determine, stable, definite',
    '天': 'sky, heaven, day, weather, nature',
    '分': 'divide, part, minute, point, fraction, share',
    '打': 'hit, beat, strike, play (ball/games), make, dial, dozen',
    '老': 'old, aged, venerable, experienced, prefix for familiar names',
    '长': 'long, length, forever, grow (zhǎng), chief/elder',
    '重': 'heavy, serious, important, repeat (chóng), double, layer',
    '给': 'give, grant, to, for, let',
    '被': 'by (passive marker), quilt, cover, receive',
    '把': 'hold, grasp, handle, measure word for objects with handle, direct object marker',
    '还': 'still, yet, also, in addition, return (huán), repay',
    '便': 'convenient, handy, then, ordinary, plain, cheap (pián)'
  };

  // Smart definition formatting and frequency-first rearrangement:
  // Sorts multiple English meanings by most common everyday usage first,
  // pushing grammatical notes, surnames, and rare/archaic meanings to the back.
  function formatDefinition(value, char) {
    if (value == null || value === '') return 'No recorded meaning.';
    if (char && TOP_CURATED_MEANINGS[char]) {
      return TOP_CURATED_MEANINGS[char];
    }

    // Split by slashes, commas, and semicolons
    const rawParts = String(value).split(/[\/;,]+/).map(s => s.trim()).filter(Boolean);
    if (!rawParts.length) return String(value);

    const seen = new Set();
    const scored = [];

    for (const part of rawParts) {
      let clean = part.replace(/\s+/g, ' ');
      const lower = clean.toLowerCase();

      // Skip duplicates
      if (seen.has(lower)) continue;
      seen.add(lower);

      let score = 100; // Base score

      // Penalty for long verbose explanations
      if (clean.length > 35) score -= 40;
      else if (clean.length > 20) score -= 15;

      // Penalty for parenthetical grammatical notes
      if (/^\([^)]+\)$/.test(clean)) {
        score -= 50;
      } else if (clean.startsWith('(')) {
        score -= 30;
      }

      // Heavy penalty for archaic/variant/surname/rare markers
      if (/^surname\b/i.test(clean)) score -= 80;
      if (/^variant of\b/i.test(clean)) score -= 90;
      if (/^also written\b/i.test(clean)) score -= 80;
      if (/^also pr\.\b/i.test(clean)) score -= 80;
      if (/^abbr\.\b/i.test(clean)) score -= 60;
      if (/^ancient\b/i.test(clean)) score -= 70;
      if (/^archaic\b/i.test(clean)) score -= 75;
      if (/^unit of\b/i.test(clean)) score -= 40;
      if (/^measure word\b/i.test(clean)) score -= 35;
      if (/^particle\b/i.test(clean)) score -= 30;

      // Bonus for concise, common everyday words (1-2 words)
      const wordCount = clean.split(' ').length;
      if (wordCount === 1 && score > 50) score += 20;
      if (wordCount === 2 && score > 50) score += 10;

      // If part is like '(located) at', transform to 'at (located)'
      if (/^\([a-z\s]+\)\s+([a-z\s]+)$/i.test(clean)) {
        const match = clean.match(/^\(([a-z\s]+)\)\s+([a-z\s]+)$/i);
        if (match) {
          clean = match[2] + ' (' + match[1] + ')';
          score += 15;
        }
      }

      scored.push({ text: clean, score, originalIdx: scored.length });
    }

    // Sort by score descending, preserving natural order for ties
    scored.sort((a, b) => b.score - a.score || a.originalIdx - b.originalIdx);

    return scored.map(s => s.text).join(', ');
  }

  /* ---------- DRAWER ---------- */
  let currentDetailChar = null;
  let currentDetailWord = null;
  let currentRadicalChar = null;

  /* Sentence-first details: synonym/antonym enrichment intentionally removed. */

  function openDetail(char) {
    try {
      const __c = char;
      const __item = HANZI_BY_CHAR[__c];
      const q = id => document.getElementById(id);
      if (q("drawer-stat-char")) q("drawer-stat-char").textContent = __c || "—";
      if (q("drawer-stat-unicode") && __c) q("drawer-stat-unicode").textContent = "U+" + __c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
      if (q("drawer-stat-frequency")) q("drawer-stat-frequency").textContent = __item?.f != null ? "#" + Number(__item.f).toLocaleString() : "—";
      if (q("drawer-stat-status")) q("drawer-stat-status").textContent = __item?.status || __item?.s || "—";
      if (q("drawer-meaning-expanded")) q("drawer-meaning-expanded").textContent = formatDefinition(__item?.m || "No recorded meaning.", __c);
    } catch (__e) { console.warn("[HanziTracker]", __e); }

    const item = HANZI_BY_CHAR[char];
    if (!item) return;
    currentDetailChar = char;
    const status = getStatus(char);
    el("drawer-hanzi").textContent = item.c;
    el("drawer-hanzi").style.display = "";
    if (el("hanzi-writer-container")) {
      el("hanzi-writer-container").style.display = "none";
    }
    if (typeof window.hanziWriterInstance !== "undefined" && window.hanziWriterInstance) {
      window.hanziWriterInstance.cancelQuiz();
    }
    el("drawer-pinyin").textContent = item.p || "—";
    el("drawer-level").textContent = levelLabel(item.h);
    el("drawer-meaning").textContent = formatDefinition(item.m || "No recorded meaning for this character.", char);
    el("drawer-freq").textContent = item.f < 99999 ? ("Frequency rank #" + item.f.toLocaleString()) : "Frequency rank unavailable";

    // Load mnemonic if exists
    const entry = getEntry(char);
    el("drawer-mnemonic-input").value = (entry && entry.mnemonic) ? entry.mnemonic : "";
    el("drawer-mnemonic-saved").style.opacity = "0";

    renderDetailSentences(char);
    el("drawer-examples").innerHTML = item.e.length
      ? item.e.map(w => '<span class="example-chip">' + escHtml(w) + '</span>').join("")
      : '<span class="example-empty">No example words recorded</span>';
    ["new", "learning", "known"].forEach(s => el("status-btn-" + s).classList.toggle("active", status === s));
    el("detail-drawer").classList.add("open");
    el("drawer-backdrop").classList.add("open");
  }

  function closeDetail() {
    el("detail-drawer").classList.remove("open");
    el("drawer-backdrop").classList.remove("open");
    currentDetailChar = null;
    currentDetailWord = null;
    if (typeof window.hanziWriterInstance !== "undefined" && window.hanziWriterInstance) {
      window.hanziWriterInstance.cancelQuiz();
    }
  }

  function openWordDetail(wordText) {
    if (!WORD_DATA) buildWordData();
    const item = (WORD_DATA || []).find(w => w.word === wordText);
    if (!item) return;

    currentDetailChar = null;
    currentDetailWord = wordText;
    
    if (el("drawer-stat-char")) el("drawer-stat-char").textContent = wordText;
    if (el("drawer-stat-unicode")) el("drawer-stat-unicode").textContent = Array.from(wordText).map(c => "U+" + c.codePointAt(0).toString(16).toUpperCase().padStart(4, "0")).join(" ");
    if (el("drawer-stat-frequency")) el("drawer-stat-frequency").textContent = item.avgRank < 99999 ? "Avg. rank #" + Math.round(item.avgRank).toLocaleString() : "—";
    
    const status = getWordStatus(wordText) || "new";
    if (el("drawer-stat-status")) el("drawer-stat-status").textContent = status;

    el("drawer-hanzi").textContent = item.word;
    el("drawer-hanzi").style.display = "";
    if (el("hanzi-writer-container")) {
      el("hanzi-writer-container").style.display = "none";
    }
    if (typeof window.hanziWriterInstance !== "undefined" && window.hanziWriterInstance) {
      window.hanziWriterInstance.cancelQuiz();
    }
    
    el("drawer-pinyin").textContent = item.pinyin || "—";
    el("drawer-level").textContent = item.level ? (item.level >= 7 ? "HSK 7–9" : "HSK " + item.level) : "HSK Word";
    el("drawer-meaning").textContent = formatDefinition(item.meaning || item.english || "No recorded meaning.");
    if (el("drawer-meaning-expanded")) el("drawer-meaning-expanded").textContent = formatDefinition(item.meaning || item.english || "No recorded meaning.");
    
    el("drawer-freq").textContent = item.corpusCount ? (item.corpusCount.toLocaleString() + " occurrences in sentence corpus") : (item.avgRank < 99999 ? ("Character freq avg #" + Math.round(item.avgRank).toLocaleString()) : "HSK 3.0 vocabulary");
    
    // Clear mnemonic (currently char only)
    if (el("drawer-mnemonic-input")) {
      el("drawer-mnemonic-input").value = "";
      el("drawer-mnemonic-saved").style.opacity = "0";
    }

    const charBreakdown = Array.from(item.word).map(c => {
      const ci = HANZI_BY_CHAR[c];
      const p = ci ? ci.p : '';
      const m = ci ? (ci.m || '').slice(0, 32) : '';
      return '<span class="example-chip" style="cursor:pointer; display:inline-flex; align-items:center; gap:6px; margin:3px;" onclick="event.stopPropagation(); setTimeout(() => openDetail(\'' + escHtml(c) + '\'), 50);"><strong style="font-size:1.15em;">' + escHtml(c) + '</strong>' + (p ? '<span style="color:var(--gold-dark); font-weight:700;">' + escHtml(p) + '</span>' : '') + (m ? '<small style="opacity:0.8; font-weight:normal;">' + escHtml(m) + '</small>' : '') + '</span>';
    }).join('');
    el("drawer-examples").innerHTML = '<div style="margin-bottom:8px;font-size:0.8rem;color:var(--text-lighter);text-transform:uppercase;letter-spacing:1px;">Constituent Characters (tap to inspect)</div>' + charBreakdown;
    
    renderDetailSentences(wordText);

    ["new", "learning", "known"].forEach(s => el("status-btn-" + s).classList.toggle("active", status === s));
    el("detail-drawer").classList.add("open");
    el("drawer-backdrop").classList.add("open");
  }

  /* ---------- SENTENCES ---------- */
  let sentenceFilters = { query: "", hsk: "all", srs: "all", difficulty: "all", sort: "order" };
  let sentencePage = 0;
  let sentencePageSize = Number(localStorage.getItem("hanziSentencePageSize")) || 24;
  let sentenceLayoutCols = localStorage.getItem("hanziSentenceLayoutCols") || "3";
  let sentenceLayoutSize = localStorage.getItem("hanziSentenceLayoutSize") || "medium";
  let sentenceIndexByChar = null;

  function applySentenceLayout() {
    const grid = el("sentence-grid");
    if (grid) {
      grid.className = `sentence-grid card-cols-${sentenceLayoutCols} card-size-${sentenceLayoutSize}`;
    }
    document.querySelectorAll("[data-sentence-cols]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.sentenceCols === String(sentenceLayoutCols));
    });
    document.querySelectorAll("[data-sentence-size]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.sentenceSize === String(sentenceLayoutSize));
    });
    document.querySelectorAll("[data-sentence-per-page]").forEach(btn => {
      btn.classList.toggle("active", Number(btn.dataset.sentencePerPage) === sentencePageSize);
    });
  }

  function sentencePinyin(input) {
    if (!input) return "";
    if (typeof input === "object" && input.p) return input.p;
    const zh = typeof input === "string" ? input : (input.z || "");
    if (!zh) return "";
    try {
      const pinyinFn = window.pinyinPro && typeof window.pinyinPro.pinyin === "function"
        ? window.pinyinPro.pinyin
        : null;
      if (pinyinFn) {
        const out = pinyinFn(zh, { toneType: "symbol", type: "string", v: true });
        if (out && typeof out === "string") return out.replace(/\s+([，。！？、；：,.!?])/g, "$1").replace(/\s+([”’）》〉])/g, "$1");
      }
    } catch (e) { console.warn("[HanziTracker]", e); }
    const chars = Array.from(zh), out = []; let pendingSpace = false;
    for (const ch of chars) {
      const item = HANZI_BY_CHAR[ch];
      if (item && item.p) { if (pendingSpace && out.length) out.push(" "); out.push(item.p); pendingSpace = true; }
      else { if (pendingSpace && out.length && /[A-Za-z0-9]/.test(ch)) out.push(" "); out.push(ch); pendingSpace = /[\u3400-\u9FFF\uF900-\uFAFF]/.test(ch); }
    }
    return out.join("").replace(/\s+([，。！？、；：,.!?])/g, "$1");
  }

  let sentenceLoadPromise = null;
  async function ensureSentenceData() {
    if (SENTENCE_DATA && SENTENCE_DATA.length) {
      return SENTENCE_DATA;
    }
    if (window.SENTENCE_DATA && window.SENTENCE_DATA.length) {
      SENTENCE_DATA = window.SENTENCE_DATA;
      return SENTENCE_DATA;
    }
    if (!sentenceLoadPromise) {
      sentenceLoadPromise = fetch("sentences.json")
        .then(r => r.ok ? r.json() : [])
        .then(data => {
          SENTENCE_DATA = data;
          window.SENTENCE_DATA = data;
          return data;
        })
        .catch(err => {
          console.warn("[HanziTracker] Failed to load sentences.json", err);
          return [];
        });
    }
    return sentenceLoadPromise;
  }

  function buildSentenceIndex() {
    if (sentenceIndexByChar || !window.SENTENCE_DATA || !window.SENTENCE_DATA.length) return;
    sentenceIndexByChar = {};
    for (const sentence of window.SENTENCE_DATA) {
      for (const ch of Array.from(sentence.z)) {
        if (!HANZI_BY_CHAR[ch]) continue;
        if (!sentenceIndexByChar[ch]) sentenceIndexByChar[ch] = [];
        if (sentenceIndexByChar[ch].length < 3) sentenceIndexByChar[ch].push(sentence);
      }
    }
  }
  function getSentencesForChar(char) { buildSentenceIndex(); return (sentenceIndexByChar && sentenceIndexByChar[char]) || []; }

  function sentenceHskLevel(item) {
    if (item.h !== undefined && Number.isFinite(Number(item.h))) return Number(item.h);
    if (item._h !== undefined) return item._h;
    let max = 0;
    for (const ch of Array.from(item.z || "")) { const h = HANZI_BY_CHAR[ch]?.h; if (Number.isFinite(Number(h)) && Number(h) > max) max = Number(h); }
    item._h = max || 0;
    return item._h;
  }
  function sentenceHskLabel(item) { const h = sentenceHskLevel(item); return h <= 6 && h > 0 ? "HSK " + h : "HSK 7–9+"; }
  // Feature 6: personal difficulty based on % of chars the user already knows
  function sentencePersonalDifficulty(item) {
    const chars = Array.from(item.z || "").filter(ch => /[\u3400-\u9FFF\uF900-\uFAFF]/.test(ch) && HANZI_BY_CHAR[ch]);
    if (!chars.length) return "medium";
    const knownCount = chars.filter(ch => getStatus(ch) === "known").length;
    const ratio = knownCount / chars.length;
    if (ratio >= 0.8) return "easy";
    if (ratio >= 0.4) return "medium";
    return "hard";
  }
  function sentencePersonalLabel(item) {
    const d = sentencePersonalDifficulty(item);
    return d === "easy" ? "Personal: Easy" : d === "medium" ? "Personal: Medium" : "Personal: Hard";
  }

  function sentenceDifficulty(item) {
    if (item._d !== undefined) return item._d;
    const len = Array.from(item.z || "").filter(ch => /[\u3400-\u9FFF\uF900-\uFAFF]/.test(ch)).length;
    const h = sentenceHskLevel(item);
    if (len <= 7 && h <= 2) item._d = "easy";
    else if (len <= 14 && h <= 4) item._d = "medium";
    else item._d = "hard";
    return item._d;
  }
  function sentenceDifficultyLabel(item) { const d = sentenceDifficulty(item); return d === "easy" ? "Beginner" : d === "medium" ? "Intermediate" : "Advanced"; }

  function renderDetailSentences(char) {
    const node = el("drawer-sentences"); if (!node) return;
    if (!window.SENTENCE_DATA || !window.SENTENCE_DATA.length) {
      node.innerHTML = '<div class="drawer-sentence-empty">Loading sentence examples…</div>';
      ensureSentenceData().then(() => renderDetailSentences(char));
      return;
    }
    const sentences = getSentencesForChar(char);
    node.innerHTML = sentences.length ? sentences.map(sentence =>
      '<article class="drawer-sentence">' +
      '<div class="drawer-sentence-top">' +
      '<div class="drawer-sentence-zh">' + escHtml(sentence.z) + '</div>' +
      '<div class="drawer-sentence-audio-group">' +
      '<button type="button" class="drawer-sentence-audio-btn" data-speak-sentence="' + escHtml(sentence.i) + '" title="Listen (Normal speed)">🔊</button>' +
      '<button type="button" class="drawer-sentence-audio-btn slow" data-speak-sentence-slow="' + escHtml(sentence.i) + '" title="Listen (Slow speed)">🐢</button>' +
      '</div>' +
      '</div>' +
      '<div class="drawer-sentence-pinyin">' + escHtml(sentencePinyin(sentence)) + '</div>' +
      '<div class="drawer-sentence-en">' + escHtml(sentence.t) + '</div>' +
      '</article>'
    ).join("") : '<div class="drawer-sentence-empty">No sentence examples recorded for this character.</div>';
  }

  function sentenceStatusLabel(item) {
    const e = getSentenceEntry(item.i), now = Date.now();
    if (!e || e.status === "new") return "New";
    if (e.status === "known") return "Mastered";
    return e.due && e.due <= now ? "Due" : "Learning";
  }
  function sentenceStatusClass(item) {
    const status = getSentenceStatus(item.i);
    if (status === "known") return "known";
    if (status === "learning") return "learning";
    return "new";
  }

  function getFilteredSentences() {
    const q = sentenceFilters.query.trim().toLowerCase();
    let data = SENTENCE_DATA.filter(x => {
      if (q && !(x.z.toLowerCase().includes(q) || x.t.toLowerCase().includes(q))) return false;
      if (/[a-zA-Z]/.test(x.z)) return false;
      const h = sentenceHskLevel(x);
      if (sentenceFilters.hsk !== "all") {
        if (sentenceFilters.hsk === "adv" ? (h > 0 && h < 7) : h !== Number(sentenceFilters.hsk)) return false;
      }
      const d = sentenceDifficulty(x); if (sentenceFilters.difficulty !== "all" && d !== sentenceFilters.difficulty) return false;
      if (sentenceFilters.srs !== "all") {
        const st = sentenceStatusLabel(x).toLowerCase();
        if (sentenceFilters.srs === "known") {
          if (st !== "mastered" && st !== "known") return false;
        } else if (st !== sentenceFilters.srs) {
          return false;
        }
      }
      return true;
    });
    if (sentenceFilters.sort === "due") data.sort((a, b) => (getSentenceEntry(a.i)?.due || Infinity) - (getSentenceEntry(b.i)?.due || Infinity));
    else if (sentenceFilters.sort === "new") data.sort((a, b) => String(b.i).localeCompare(String(a.i), undefined, { numeric: true }));
    else if (sentenceFilters.sort === "length") data.sort((a, b) => Array.from(a.z).length - Array.from(b.z).length);
    else if (sentenceFilters.sort === "length-desc") data.sort((a, b) => Array.from(b.z).length - Array.from(a.z).length); // Feature 8: longest first
    // Feature 7: apply shuffle order
    if (sentenceShuffled && sentenceFilters.sort === "order") {
      if (!sentenceShuffleOrder.length) sentenceShuffleOrder = shuffle(data.map(x => x.i));
      const idxMap = {}; sentenceShuffleOrder.forEach((id, i) => { idxMap[id] = i; });
      data.sort((a, b) => (idxMap[a.i] ?? 9999) - (idxMap[b.i] ?? 9999));
    }
    return data;
  }

  // Feature 1: per-char pinyin tooltips via data-pinyin attribute
  function sentenceCharsHTML(zh) {
    return Array.from(zh).map(ch => {
      const hd = HANZI_BY_CHAR[ch];
      if (hd) {
        const py = escHtml(hd.p || "");
        return '<span class="sentence-char" data-sentence-char="' + escHtml(ch) + '" data-pinyin="' + py + '" title="Open ' + escHtml(ch) + ' details">' + escHtml(ch) + '</span>';
      }
      return escHtml(ch);
    }).join("");
  }

  function sentenceCardHTML(item) {
    const status = sentenceStatusLabel(item);
    const statusClass = sentenceStatusClass(item);
    const due = getSentenceEntry(item.i)?.due;
    const isDue = status === "Due";
    const charCount = Array.from(item.z).filter(ch => /[\u3400-\u9FFF\uF900-\uFAFF]/.test(ch)).length;
    const pd = sentencePersonalDifficulty(item);
    const pdLabel = sentencePersonalLabel(item);

    // Status badge config — consistent amber/jade/slate/red
    const dotClass = isDue ? "sc-dot-due" : "sc-dot-" + statusClass;
    const statusLabel = isDue ? "Due now" : statusClass === "known" ? "Mastered" : statusClass === "learning" ? "Learning" : "New";
    const dueText = due && status === "Learning" ? "Review " + new Date(due).toLocaleDateString() : "";

    // Global reveal state — respect the Show Pinyin / Show English toggles
    const pOpen = sentenceShowPinyin ? " open" : "";
    const eOpen = sentenceShowEnglish ? " open" : "";

    return '<article class="sentence-card sc-card status-' + escHtml(statusClass) + (isDue ? " status-due" : "") + '" data-sentence-id="' + escHtml(item.i) + '">' +
      '<div class="sc-strip"></div>' +
      '<div class="sc-body">' +

      // ── Top bar ──────────────────────────────────────────
      '<div class="sc-top">' +
      '<div class="sc-badges">' +
      '<span class="sc-hsk-badge">' + escHtml(sentenceHskLabel(item)) + '</span>' +
      '<span class="sc-diff-badge">' + escHtml(sentenceDifficultyLabel(item)) + '</span>' +
      '<span class="sc-status-badge ' + escHtml(dotClass) + '">' + escHtml(statusLabel) + '</span>' +
      '</div>' +
      '<div class="sc-audio-group">' +
      '<button type="button" class="sc-audio" data-speak-sentence="' + escHtml(item.i) + '" title="Listen (Normal speed)">🔊</button>' +
      '<button type="button" class="sc-audio sc-audio-slow" data-speak-sentence-slow="' + escHtml(item.i) + '" title="Listen (Slow speed)">🐢</button>' +
      '</div>' +
      '</div>' +

      // ── Chinese hero text ─────────────────────────────────
      '<div class="sc-zh">' + sentenceCharsHTML(item.z) + '</div>' +

      // ── Reveal buttons ────────────────────────────────────
      '<div class="sc-reveal-row">' +
      '<button type="button" class="sc-reveal-btn sc-reveal-pinyin' + pOpen + '" data-reveal-panel="sc-pinyin-' + escHtml(item.i) + '">拼 Pinyin</button>' +
      '<button type="button" class="sc-reveal-btn sc-reveal-en' + eOpen + '" data-reveal-panel="sc-en-' + escHtml(item.i) + '">A English</button>' +
      '</div>' +

      // ── Collapsible panels ────────────────────────────────
      '<div class="sc-pinyin-panel' + pOpen + '" id="sc-pinyin-' + escHtml(item.i) + '">' + escHtml(sentencePinyin(item)) + '</div>' +
      '<div class="sc-en-panel' + eOpen + '" id="sc-en-' + escHtml(item.i) + '">' + escHtml(item.t) + '</div>' +

      // ── Footer ────────────────────────────────────────────
      '<div class="sc-footer">' +
      '<span class="sc-chars-badge">' + charCount + ' chars</span>' +
      (dueText ? '<span class="sc-due-text">' + escHtml(dueText) + '</span>' : '') +
      '<span class="sc-pd-badge ' + escHtml(pd) + '">' + escHtml(pdLabel) + '</span>' +
      '<div class="sc-actions">' +
      '<button type="button" class="sc-quick-btn" data-quick-study-sentence="' + escHtml(item.i) + '" title="Quick study">⚡</button>' +
      '<button type="button" class="sc-study-btn" data-review-sentence="' + escHtml(item.i) + '">Study →</button>' +
      '</div>' +
      '</div>' +

      '</div>' + // .sc-body
      '</article>';
  }

  function renderSentenceDashboard() {
    const now = Date.now();
    const due = SENTENCE_DATA.filter(x => { const e = getSentenceEntry(x.i); return e && e.status !== "new" && e.status !== "known" && e.due <= now; }).length;
    const fresh = SENTENCE_DATA.filter(x => getSentenceStatus(x.i) === "new").length;
    const known = SENTENCE_DATA.filter(x => getSentenceStatus(x.i) === "known").length;
    el("sentence-stat-due").textContent = due.toLocaleString();
    el("sentence-stat-new").textContent = fresh.toLocaleString();
    el("sentence-stat-known").textContent = known.toLocaleString();
    el("sentence-stat-streak").textContent = state.streak.count || 0;
  }

  function renderSentences() {
    if (!window.SENTENCE_DATA || !window.SENTENCE_DATA.length) {
      const grid = el("sentence-grid");
      if (grid) {
        grid.innerHTML = '<div class="sentence-empty" style="padding:48px 20px;text-align:center;"><div class="seal-spin" style="margin:0 auto 12px;width:38px;height:38px;line-height:38px;font-size:1.2rem;">句</div><p style="color:var(--gold-dark);font-weight:600;margin:0;">Loading sentence library…</p></div>';
      }
      ensureSentenceData().then(() => renderSentences());
      return;
    }
    renderSentenceDashboard();
    applySentenceLayout();
    const data = getFilteredSentences();
    const totalPages = Math.max(1, Math.ceil(data.length / sentencePageSize));
    if (sentencePage >= totalPages) sentencePage = totalPages - 1; if (sentencePage < 0) sentencePage = 0;
    const pageItems = data.slice(sentencePage * sentencePageSize, sentencePage * sentencePageSize + sentencePageSize);
    el("sentence-count").textContent = data.length.toLocaleString() + " sentences";
    el("sentence-page-indicator").textContent = (sentencePage + 1) + " / " + totalPages;
    el("sentence-prev-page").disabled = sentencePage === 0; el("sentence-next-page").disabled = sentencePage >= totalPages - 1;
    el("sentence-grid").innerHTML = pageItems.length ? pageItems.map(sentenceCardHTML).join("") : '<div class="sentence-empty">No sentences match your filters.</div>';
  }

  let currentDetailSentenceId = null;
  function speakSentence(item, isSlow = false) {
    if (!item) return;
    const text = typeof item === "string" ? item : (item.z || "");
    const sentenceId = typeof item === "object" ? item.i : null;
    const audioPath = typeof item === "object" ? (isSlow && item.as ? item.as : item.a) : null;
    const slowAudioPath = typeof item === "object" ? item.as : null;
    playChineseAudio(text, {
      rate: isSlow ? 0.75 : 0.9,
      sentenceId,
      audioPath,
      slowAudioPath
    });
  }

  function openSentenceDetails(id) {
    if (!window.SENTENCE_DATA || !window.SENTENCE_DATA.length) {
      ensureSentenceData().then(() => openSentenceDetails(id));
      return;
    }
    const item = SENTENCE_DATA.find(x => String(x.i) === String(id)); if (!item) return;
    currentDetailSentenceId = id;
    el("sentence-detail-zh").textContent = item.z;
    el("sentence-detail-pinyin").textContent = sentencePinyin(item);
    el("sentence-detail-en").textContent = item.t;
    el("sentence-word-list").innerHTML = Array.from(new Set(Array.from(item.z).filter(ch => HANZI_BY_CHAR[ch]))).map(ch => '<button type="button" class="sentence-word-chip" data-sentence-char="' + escHtml(ch) + '">' + escHtml(ch) + ' ' + escHtml(HANZI_BY_CHAR[ch].p || "") + '</button>').join("");
    el("sentence-detail-review").dataset.reviewSentence = id;
    updateSentenceDetailStatusUI(id);
    el("sentence-detail-modal").classList.add("open");
    el("sentence-detail-modal").setAttribute("aria-hidden", "false");
  }
  function updateSentenceDetailStatusUI(id) {
    const status = getSentenceStatus(id);
    const label = status === "known" ? "Mastered" : status === "learning" ? "Learning" : "New";
    el("sentence-detail-status").textContent = label;
    ["new", "learning", "known"].forEach(s => {
      const btn = el("sentence-status-btn-" + s);
      if (btn) btn.classList.toggle("active", status === s);
    });
  }
  function closeSentenceDetails() { el("sentence-detail-modal").classList.remove("open"); el("sentence-detail-modal").setAttribute("aria-hidden", "true"); currentDetailSentenceId = null; }

  function openSentenceReview(id) {
    const tab = document.querySelector('.tab-btn[data-tab="review"]'); if (tab) tab.click();
    reviewMode = "sentences"; setReviewModeUI();
    reviewQueue = SENTENCE_DATA.filter(x => String(x.i) === String(id)).map(x => ({ ...x, __reviewType: "sentence" })); reviewIndex = 0; sessionStats = { reviewed: 0, known: 0, correct: 0, streak: 0, bestStreak: 0, characters: 0, sentences: 0, mistakes: [], skipped: 0, flagged: 0 }; reviewStartedAt = Date.now();
    if (!reviewQueue.length) { showToast("Sentence not found.", true); return; }
    el("review-setup").classList.add("hidden"); el("review-summary").classList.add("hidden"); el("review-session").classList.remove("hidden"); showCard();
  }

  /* ---------- REVIEW ---------- */
  let reviewFilters = { levels: new Set() };
  let reviewMode = "characters";

  let reviewQueue = [];
  let reviewIndex = 0;
  let reviewRevealed = false;
  let sessionStats = { reviewed: 0, known: 0, correct: 0, streak: 0, bestStreak: 0, characters: 0, sentences: 0, words: 0, mistakes: [], skipped: [], flagged: [] };
  let reviewDifficulty = "all";
  let reviewFocusWeak = false;
  let reviewFocusMode = false;
  let reviewStartedAt = null;
  // Per-card reveal preferences (reset on each new card, informed by setup checkboxes)
  let reviewShowPinyin = localStorage.getItem("hanziReviewShowPinyin") !== "false";
  let reviewShowEnglish = localStorage.getItem("hanziReviewShowEnglish") !== "false";
  // Track flagged items across sessions in state
  if (!state.flaggedItems) state.flaggedItems = [];

  function getScopeData(levelSet) {
    return HANZI_DATA.filter(item => levelSetMatches(item, levelSet));
  }

  function getSentenceDueCount() {
    const now = Date.now();
    return SENTENCE_DATA.filter(item => {
      const e = getSentenceEntry(item.i);
      return e && e.status !== "new" && e.status !== "known" && Number(e.due || 0) <= now;
    }).length;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function setReviewModeUI() {
    document.querySelectorAll("[data-review-mode]").forEach(btn => btn.classList.toggle("active", btn.dataset.reviewMode === reviewMode));
    const chars = reviewMode === "characters";
    const sentences = reviewMode === "sentences";
    const mixed = reviewMode === "mixed";
    // Level chips only make sense for characters/mixed
    el("review-level-chips").style.display = (chars || mixed) ? "flex" : "none";
    el("review-scope-hint").textContent = chars ? "Tap multiple chips to combine levels" : sentences ? "Sentence review uses the sentence collection." : mixed ? "Smart Review will mix your highest-priority characters and sentences." : "Word review uses your generated word collection.";
    el("new-pool-label").textContent = chars ? "characters" : sentences ? "sentences" : mixed ? "items" : "words";
    // Difficulty only applies to characters/sentences — hide for words
    const diffRow = el("review-difficulty")?.closest(".review-focus-row");
    if (diffRow) diffRow.style.opacity = reviewMode === "words" ? "0.4" : "1";
    refreshDueCount();
    updateReviewEstimate();
  }

  function reviewDifficultyMatch(item, mode) {
    if (reviewDifficulty === "all") return true;
    if (mode === "sentences") return sentenceDifficulty(item) === reviewDifficulty;
    if (mode === "characters") {
      const h = Number(item.h || 0);
      return reviewDifficulty === "easy" ? h <= 2 : reviewDifficulty === "medium" ? (h >= 3 && h <= 4) : h >= 5;
    }
    if (mode === "words") {
      // Filter words by corpus frequency as a difficulty proxy
      const count = Number(item.corpusCount || 0);
      return reviewDifficulty === "easy" ? count >= 50 : reviewDifficulty === "medium" ? (count >= 10 && count < 50) : count < 10;
    }
    return true;
  }

  function isWeakItem(entry) {
    if (!entry) return false;
    // Weak: has lapses, or difficulty >= 6, or low interval after multiple reviews
    const lapses = Number(entry.lapses || 0);
    const d = Number(entry.d || 5);
    const reviews = Number(entry.reviews || 0);
    const interval = Number(entry.interval || 0);
    return lapses > 0 || d >= 6 || (reviews >= 2 && interval <= 1);
  }

  function smartScore(item, mode) {
    const now = Date.now();
    const type = mode || (item.__reviewType ? (item.__reviewType === "sentence" ? "sentences" : (item.__reviewType === "word" ? "words" : "characters")) : (reviewMode || "characters"));
    const e = type === "sentences" ? getSentenceEntry(item.i) : (type === "words" ? getWordEntry(item.word) : getEntry(item.c));

    // 1. Unreviewed New Card
    if (!e || e.status === "new" || !e.reviews) {
      return 100000;
    }

    // 2. Known / Mastered Card
    if (e.status === "known") {
      if (Number(e.due || 0) <= now) {
        // Due maintenance review for known card
        return 800000 + Math.min(100000, (now - Number(e.due || 0)) / 1000);
      }
      return -10000;
    }

    // 3. Learning Card
    const isDue = Number(e.due || 0) <= now;
    const lapses = Number(e.lapses || 0);
    const overdueMs = now - Number(e.due || 0);

    if (isDue) {
      // Due learning cards have highest priority (>= 1,000,000)
      let score = 1000000 + Math.min(200000, overdueMs / 1000);
      if (reviewFocusWeak) {
        score += lapses * 25000 + (Number(e.d || 5) >= 6 ? 15000 : 0);
      }
      return score;
    } else {
      // Not due yet (scheduled for future date)
      if (reviewFocusWeak && lapses > 0) {
        return 50000 + lapses * 5000;
      }
      const msUntilDue = Number(e.due || 0) - now;
      const daysUntilDue = msUntilDue / 86400000;
      return Math.max(0, 10000 - Math.min(10000, daysUntilDue * 1000));
    }
  }

  function buildPool(poolType) {
    const now = Date.now();
    const type = poolType || (document.querySelector('input[name="pool"]:checked')?.value || "smart");

    const buildChars = () => {
      const scope = getScopeData(reviewFilters.levels);
      let data = scope.filter(item => reviewDifficultyMatch(item, "characters"));
      if (type === "due") {
        return data.filter(item => {
          const e = getEntry(item.c);
          return e && e.status !== "new" && e.status !== "known" && Number(e.due || 0) <= now;
        }).sort((a, b) => smartScore(b, "characters") - smartScore(a, "characters"));
      }
      if (type === "new") {
        return data.filter(item => getStatus(item.c) === "new");
      }
      if (type === "all") {
        return data.filter(item => getStatus(item.c) !== "known");
      }
      // Smart pool
      return data.filter(item => {
        const e = getEntry(item.c);
        return getStatus(item.c) !== "known" || (e && Number(e.due || 0) <= now);
      }).sort((a, b) => smartScore(b, "characters") - smartScore(a, "characters"));
    };

    const buildSentences = () => {
      let data = SENTENCE_DATA.filter(item => reviewDifficultyMatch(item, "sentences"));
      if (type === "due") {
        return data.filter(item => {
          const e = getSentenceEntry(item.i);
          return e && e.status !== "new" && e.status !== "known" && Number(e.due || 0) <= now;
        }).sort((a, b) => smartScore(b, "sentences") - smartScore(a, "sentences"));
      }
      if (type === "new") {
        return data.filter(item => getSentenceStatus(item.i) === "new");
      }
      if (type === "all") {
        return data.filter(item => getSentenceStatus(item.i) !== "known");
      }
      return data.filter(item => {
        const e = getSentenceEntry(item.i);
        return getSentenceStatus(item.i) !== "known" || (e && Number(e.due || 0) <= now);
      }).sort((a, b) => smartScore(b, "sentences") - smartScore(a, "sentences"));
    };

    const buildWords = () => {
      let words = buildWordData().filter(w => w.word);
      if (type === "due") {
        return words.filter(w => {
          const e = getWordEntry(w.word);
          return e && e.status !== "new" && e.status !== "known" && Number(e.due || 0) <= now;
        }).sort((a, b) => smartScore(b, "words") - smartScore(a, "words"));
      }
      if (type === "new") {
        return words.filter(w => getWordStatus(w.word) === "new");
      }
      if (type === "all") {
        return words.filter(w => getWordStatus(w.word) !== "known");
      }
      return words.filter(w => {
        const e = getWordEntry(w.word);
        return getWordStatus(w.word) !== "known" || (e && Number(e.due || 0) <= now);
      }).sort((a, b) => smartScore(b, "words") - smartScore(a, "words"));
    };

    // Apply focus-weak filter: if enabled, only include weak items (+ always include new items)
    const applyWeakFilter = (items, getEntry) => {
      if (!reviewFocusWeak) return items;
      return items.filter(x => {
        const e = getEntry(x);
        if (!e || e.status === "new" || !e.reviews) return true; // always include new
        return isWeakItem(e);
      });
    };

    if (reviewMode === "characters") {
      const chars = applyWeakFilter(buildChars(), x => getEntry(x.c));
      return chars.map(x => ({ ...x, __reviewType: "character" }));
    }
    if (reviewMode === "sentences") {
      const sents = applyWeakFilter(buildSentences(), x => getSentenceEntry(x.i));
      return sents.map(x => ({ ...x, __reviewType: "sentence" }));
    }
    if (reviewMode === "words") {
      const words = applyWeakFilter(buildWords(), x => getWordEntry(x.word));
      return words.map(x => ({ ...x, __reviewType: "word" }));
    }
    if (reviewMode === "mixed") {
      const c = applyWeakFilter(buildChars(), x => getEntry(x.c)).map(x => ({ ...x, __reviewType: "character" }));
      const se = applyWeakFilter(buildSentences(), x => getSentenceEntry(x.i)).map(x => ({ ...x, __reviewType: "sentence" }));
      return [...c, ...se].sort((a, b) => smartScore(b, a.__reviewType === "sentence" ? "sentences" : "characters") - smartScore(a, b.__reviewType === "sentence" ? "sentences" : "characters"));
    }
    return buildChars().map(x => ({ ...x, __reviewType: "character" }));
  }

  function updateReviewEstimate() {
    if (!el("review-ready-count")) return;
    const poolType = document.querySelector('input[name="pool"]:checked')?.value || "smart";
    const pool = buildPool(poolType);
    const size = Number(el("session-size")?.value || 20);
    const ready = Math.min(size, pool.length);
    const smartPool = buildPool("smart");
    const duePool = buildPool("due");
    const newPool = buildPool("new");
    const allPool = buildPool("all");

    el("review-ready-count").textContent = ready.toLocaleString();
    el("smart-count").textContent = smartPool.length.toLocaleString();
    if (el("due-count")) el("due-count").textContent = duePool.length.toLocaleString();
    if (el("new-count")) el("new-count").textContent = newPool.length.toLocaleString();
    if (el("all-count")) el("all-count").textContent = allPool.length.toLocaleString();
    el("review-estimated-min").textContent = (Math.max(1, Math.ceil(ready * .35)) + "–" + (Math.max(2, Math.ceil(ready * .65))) + " min");

    const total = pool.slice(0, ready).reduce((n, x) => {
      let e = null;
      if (x.__reviewType === "sentence" || reviewMode === "sentences") e = getSentenceEntry(x.i);
      else if (x.__reviewType === "word" || reviewMode === "words") e = getWordEntry(x.word);
      else e = getEntry(x.c);
      return n + Number(e?.reviews || 0);
    }, 0);
    el("review-estimated-accuracy").textContent = total ? Math.round(Math.min(98, 55 + (total / Math.max(1, ready)) * 10)) + "%" : "—";
  }

  function startReview() {
    reviewShowPinyin = el("review-show-pinyin")?.checked ?? true;
    reviewShowEnglish = el("review-show-english")?.checked ?? true;
    localStorage.setItem("hanziReviewShowPinyin", String(reviewShowPinyin));
    localStorage.setItem("hanziReviewShowEnglish", String(reviewShowEnglish));
    const poolType = document.querySelector('input[name="pool"]:checked')?.value || "smart";
    const size = Number(el("session-size")?.value || 20);
    let pool = buildPool(poolType);
    if (!pool.length) {
      showToast(poolType === "due" ? "No items are due for review right now." : "No items match this review setup.");
      return;
    }

    let queue = [];
    if (poolType === "smart") {
      const topSlice = pool.slice(0, size);
      queue = shuffle(topSlice);
    } else {
      queue = shuffle(pool).slice(0, size);
    }

    reviewQueue = queue;
    reviewIndex = 0;
    sessionStats = { reviewed: 0, known: 0, correct: 0, streak: 0, bestStreak: 0, characters: 0, sentences: 0, words: 0, mistakes: [], skipped: [], flagged: [] };
    reviewStartedAt = Date.now();
    window.__reviewRatingBusy = false;
    reviewFocusMode = false;
    el("review-session").classList.remove("focus-mode");
    el("review-setup").classList.add("hidden");
    el("review-summary").classList.add("hidden");
    el("review-session").classList.remove("hidden");
    // Set per-card reveal prefs from setup checkboxes
    reviewShowPinyin = el("review-show-pinyin")?.checked ?? reviewShowPinyin;
    reviewShowEnglish = el("review-show-english")?.checked ?? reviewShowEnglish;
    showCard();
  }

  function fitSentenceLine(el) {
    if (!el) return;
    el.style.whiteSpace = "normal";
    el.style.wordBreak = "break-word";
    el.style.width = "100%";
    el.style.maxWidth = "100%";
    const len = Array.from(el.textContent || "").length;
    if (len > 32) el.style.fontSize = "1.55rem";
    else if (len > 20) el.style.fontSize = "1.9rem";
    else if (len > 12) el.style.fontSize = "2.2rem";
    else el.style.fontSize = "2.5rem";
  }

  function updateIntervalPreviews(item) {
    if (!item) return;
    const type = item.__reviewType || (reviewMode === "sentences" ? "sentence" : reviewMode === "words" ? "word" : "character");
    const entry = type === "sentence" ? getSentenceEntry(item.i) : (type === "word" ? getWordEntry(item.word) : getEntry(item.c));
    const previews = previewFSRSIntervals(entry);
    if (el("rate-interval-again")) el("rate-interval-again").textContent = previews[1] || "1d";
    if (el("rate-interval-hard")) el("rate-interval-hard").textContent = previews[2] || "2d";
    if (el("rate-interval-good")) el("rate-interval-good").textContent = previews[3] || "4d";
    if (el("rate-interval-easy")) el("rate-interval-easy").textContent = previews[4] || "14d";
  }

  function showCard() {
    if (!reviewQueue.length || reviewIndex < 0 || reviewIndex >= reviewQueue.length) return;
    reviewRevealed = false;
    const item = reviewQueue[reviewIndex];
    if (!item) return;
    const type = item.__reviewType || (reviewMode === "sentences" ? "sentence" : reviewMode === "words" ? "word" : "character");
    const sentenceMode = type === "sentence";
    const wordMode = type === "word";
    el("flashcard").classList.toggle("sentence-flashcard", sentenceMode);
    el("review-session").classList.toggle("sentence-review-active", sentenceMode);
    el("flashcard").classList.remove("revealed");
    el("fc-hanzi").hidden = sentenceMode || wordMode;
    el("fc-sentence-front").hidden = !sentenceMode;
    el("fc-hanzi-small").hidden = sentenceMode || wordMode;
    el("fc-pinyin").hidden = sentenceMode;
    el("fc-meaning").hidden = sentenceMode;
    el("fc-examples").hidden = true;
    el("fc-sentence-back").hidden = !sentenceMode;
    el("fc-sentence-pinyin").hidden = true;
    el("fc-sentence-en").hidden = true;
    el("fc-related").hidden = true;
    if (el("review-example-toggle")) el("review-example-toggle").style.display = sentenceMode ? "none" : "";

    if (sentenceMode) {
      el("fc-sentence-front").textContent = item.z || "";
      el("fc-sentence-back").textContent = item.z || "";
      el("fc-sentence-pinyin").textContent = sentencePinyin(item) || "";
      el("fc-sentence-en").textContent = item.t || "";
      fitSentenceLine(el("fc-sentence-front"));
      fitSentenceLine(el("fc-sentence-back"));
      const se = getSentenceEntry(item.i);
      el("review-card-reason").textContent = (se?.due && se.due <= Date.now()) ? "🔴 Due for review" : (se?.reviews ? "🟡 Learning sentence" : "🆕 New sentence");
    } else if (wordMode) {
      el("fc-hanzi").hidden = false;
      el("fc-hanzi").textContent = item.word;
      el("fc-pinyin").hidden = false;
      el("fc-pinyin").textContent = item.pinyin || "—";
      el("fc-meaning").hidden = false;
      el("fc-meaning").textContent = item.english || "No English translation in current data.";
      el("fc-examples").innerHTML = (item.exampleTranslations || []).slice(0, 3).map(x => '<span class="example-chip">' + escHtml(x) + "</span>").join("");
      const we = getWordEntry(item.word);
      el("review-card-reason").textContent = (we?.due && we.due <= Date.now()) ? "🔴 Due for review" : "🧩 Word · " + Number(item.corpusCount || 0).toLocaleString() + " uses";
    } else {
      el("fc-hanzi").hidden = false;
      el("fc-hanzi").textContent = item.c;
      el("fc-hanzi-small").textContent = item.c;
      el("fc-pinyin").hidden = false;
      el("fc-pinyin").textContent = item.p || "—";
      el("fc-meaning").textContent = formatDefinition(item.m || "No recorded meaning.");
      el("fc-examples").innerHTML = item.e?.length ? item.e.map(w => '<span class="example-chip">' + escHtml(w) + "</span>").join("") : "";
      const e = getEntry(item.c);
      el("review-card-reason").textContent = (e?.due && e.due <= Date.now()) ? "🔴 Due for review" : (e?.reviews >= 2 ? "🟡 Previously missed / weak" : (e?.reviews ? "🟡 Learning character" : "🆕 New character"));
      const related = [...(item.e || [])].slice(0, 3);
      try {
        const wordRelated = buildWordData().filter(w => w.word.includes(item.c)).slice(0, 3).map(w => w.word + " · " + (w.pinyin || ""));
        related.push(...wordRelated);
      } catch (e) { console.warn("[HanziTracker]", e); }
      if (related.length) {
        el("fc-related").hidden = false;
        el("fc-related-list").innerHTML = related.slice(0, 6).map(w => '<span class="fc-related-chip">' + escHtml(w) + "</span>").join("");
      }
    }

    // Front of card: NEVER show pinyin/english before reveal — it's a flashcard test
    // Reveal tools are visible but disabled until after reveal
    el("review-pinyin-toggle").classList.remove("active");
    el("review-english-toggle").classList.remove("active");
    el("review-example-toggle").classList.remove("active");
    el("review-example-toggle").textContent = "Show examples";
    el("review-pinyin-toggle").textContent = "Show pinyin";
    el("review-english-toggle").textContent = "Show English";
    // Always hide pinyin/english on front (before reveal)
    el("fc-pinyin").hidden = true;
    if (sentenceMode) {
      el("fc-sentence-pinyin").hidden = true;
      el("fc-sentence-en").hidden = true;
    } else {
      el("fc-meaning").hidden = false; // meaning on front helps context
    }
    // Disable reveal tools until card is flipped
    document.querySelectorAll(".review-reveal-tool").forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = "0.4";
    });
    el("review-audio-btn").disabled = false;
    el("review-audio-btn").style.opacity = "1";
    updateIntervalPreviews(item);
    el("reveal-btn").classList.remove("hidden");
    el("rate-buttons").classList.add("hidden");
    el("review-progress-fill").style.width = ((reviewIndex / reviewQueue.length) * 100) + "%";
    el("review-counter").textContent = (reviewIndex + 1) + " / " + reviewQueue.length;
    updateLiveReviewStats();
  }

  function revealCard() {
    if (reviewRevealed || !reviewQueue.length || reviewIndex >= reviewQueue.length) return;
    reviewRevealed = true;
    el("flashcard").classList.add("revealed");
    el("reveal-btn").classList.add("hidden");
    el("rate-buttons").classList.remove("hidden");
    const item = reviewQueue[reviewIndex];
    const type = item.__reviewType || (reviewMode === "sentences" ? "sentence" : reviewMode === "words" ? "word" : "character");
    // Now enable reveal tools after flip
    document.querySelectorAll(".review-reveal-tool").forEach(btn => {
      btn.disabled = false;
      btn.style.opacity = "1";
    });
    // Show pinyin/english based on user prefs (now on the back face)
    if (type === "sentence") {
      el("fc-sentence-pinyin").hidden = !reviewShowPinyin;
      el("fc-sentence-en").hidden = !reviewShowEnglish;
      el("review-pinyin-toggle").textContent = reviewShowPinyin ? "Hide pinyin" : "Show pinyin";
      el("review-english-toggle").textContent = reviewShowEnglish ? "Hide English" : "Show English";
    } else {
      el("fc-pinyin").hidden = !reviewShowPinyin;
      el("fc-meaning").hidden = false;
      el("review-pinyin-toggle").textContent = reviewShowPinyin ? "Hide pinyin" : "Show pinyin";
      el("review-english-toggle").textContent = reviewShowEnglish ? "Hide English" : "Show English";
    }
    el("review-pinyin-toggle").classList.toggle("active", reviewShowPinyin);
    el("review-english-toggle").classList.toggle("active", reviewShowEnglish);
    updateIntervalPreviews(item);
    // Auto-play audio on reveal if supported
    try {
      const text = type === "sentence" ? item.z : (type === "word" ? item.word : item.c);
      const sentenceId = type === "sentence" ? item.i : null;
      playChineseAudio(text, { rate: 0.88, sentenceId });
    } catch (e) { /* audio not critical */ }
  }

  function updateLiveReviewStats() {
    const total = sessionStats.reviewed;
    el("live-reviewed").textContent = total;
    el("live-accuracy").textContent = total ? Math.round(sessionStats.correct / total * 100) + "%" : "—";
    el("live-streak").textContent = sessionStats.streak || 0;
    el("live-streak").classList.toggle("hot-streak", sessionStats.streak > 5);
  }

  function rateCurrent(rating) {
    if (!reviewRevealed || !reviewQueue.length || reviewIndex < 0 || reviewIndex >= reviewQueue.length) return;
    if (window.__reviewRatingBusy) return;
    window.__reviewRatingBusy = true;

    const currentIndex = reviewIndex;
    const item = reviewQueue[currentIndex];
    let rated = false;

    try {
      if (!item) throw new Error("Review item unavailable");
      const type = item.__reviewType || (reviewMode === "sentences" ? "sentence" : reviewMode === "words" ? "word" : "character");
      const grade = normalizeRatingGrade(rating);
      const isRecallSuccess = grade >= 2;
      let entry = null, prevStatus = "new";

      if (type === "word") {
        prevStatus = getWordStatus(item.word);
        entry = rateWord(item.word, rating);
        sessionStats.reviewed++;
        sessionStats.words = (sessionStats.words || 0) + 1;
        if (isRecallSuccess) {
          sessionStats.correct++;
          sessionStats.streak++;
          sessionStats.bestStreak = Math.max(sessionStats.bestStreak, sessionStats.streak);
        } else {
          sessionStats.mistakes.push(item);
          sessionStats.streak = 0;
        }
        if (entry?.status === "known" && prevStatus !== "known") {
          sessionStats.known++;
          triggerStampFX(el("flashcard"));
          spawnConfetti(el("flashcard"));
        }
      } else if (type === "sentence") {
        prevStatus = getSentenceStatus(item.i);
        entry = rateSentence(item.i, rating);
        sessionStats.reviewed++;
        sessionStats.sentences = (sessionStats.sentences || 0) + 1;
        if (isRecallSuccess) {
          sessionStats.correct++;
          sessionStats.streak++;
          sessionStats.bestStreak = Math.max(sessionStats.bestStreak, sessionStats.streak);
        } else {
          sessionStats.mistakes.push(item);
          sessionStats.streak = 0;
        }
        if (entry?.status === "known" && prevStatus !== "known") {
          sessionStats.known++;
          triggerStampFX(el("flashcard"));
          spawnConfetti(el("flashcard"));
        }
      } else {
        prevStatus = getStatus(item.c);
        entry = rateCard(item.c, rating);
        sessionStats.reviewed++;
        sessionStats.characters = (sessionStats.characters || 0) + 1;
        if (isRecallSuccess) {
          sessionStats.correct++;
          sessionStats.streak++;
          sessionStats.bestStreak = Math.max(sessionStats.bestStreak, sessionStats.streak);
        } else {
          sessionStats.mistakes.push(item);
          sessionStats.streak = 0;
        }
        if (entry?.status === "known" && prevStatus !== "known") {
          sessionStats.known++;
          triggerStampFX(el("flashcard"));
          spawnConfetti(el("flashcard"));
        }
      }
      rated = true;
    } catch (err) {
      console.error("Review rating failed", err);
    }

    if (!rated) {
      window.__reviewRatingBusy = false;
      showToast("Could not save this rating. Please try again.");
      return;
    }

    reviewRevealed = false;
    reviewIndex = currentIndex + 1;

    try {
      updateLiveReviewStats();
    } catch (e) { console.warn("Review stats update failed", e); }

    if (reviewIndex >= reviewQueue.length) {
      window.__reviewRatingBusy = false;
      finishReview();
      return;
    }

    try {
      showCard();
    } catch (err) {
      console.error("Review card render failed", err);
    }
    window.__reviewRatingBusy = false;
  }

  function skipCurrent() {
    if (!reviewQueue.length) return;
    const item = reviewQueue[reviewIndex];
    if (item) sessionStats.skipped.push(item);
    reviewIndex++;
    reviewRevealed = false;
    if (reviewIndex >= reviewQueue.length) finishReview();
    else showCard();
  }

  function flagCurrent() {
    const item = reviewQueue[reviewIndex];
    if (!item) return;
    const type = item.__reviewType || "character";
    const key = type === "sentence" ? String(item.i) : (type === "word" ? item.word : item.c);
    const label = type === "sentence" ? (item.z || "").slice(0, 24) : key;
    // Avoid duplicate flags
    if (!state.flaggedItems) state.flaggedItems = [];
    const alreadyFlagged = state.flaggedItems.some(f => f.key === key && f.type === type);
    if (alreadyFlagged) {
      showToast("Already flagged: " + label);
      return;
    }
    sessionStats.flagged.push(item);
    state.flaggedItems.push({ key, type, label, flaggedAt: Date.now() });
    saveState();
    showToast("🚩 Flagged: " + label);
    el("review-flag-btn").textContent = "🚩 Flagged!";
    el("review-flag-btn").disabled = true;
    setTimeout(() => {
      el("review-flag-btn").textContent = "🚩 Flag";
      el("review-flag-btn").disabled = false;
    }, 1500);
  }
  function updateReviewReveal(which) {
    if (!reviewRevealed) return; // Only allow toggling after card is revealed
    if (which === "pinyin") reviewShowPinyin = !reviewShowPinyin;
    if (which === "english") reviewShowEnglish = !reviewShowEnglish;
    localStorage.setItem("hanziReviewShowPinyin", String(reviewShowPinyin));
    localStorage.setItem("hanziReviewShowEnglish", String(reviewShowEnglish));
    const item = reviewQueue[reviewIndex];
    const type = item?.__reviewType || (reviewMode === "sentences" ? "sentence" : reviewMode === "words" ? "word" : "character");
    el("review-pinyin-toggle").classList.toggle("active", reviewShowPinyin);
    el("review-english-toggle").classList.toggle("active", reviewShowEnglish);
    el("review-pinyin-toggle").textContent = reviewShowPinyin ? "Hide pinyin" : "Show pinyin";
    el("review-english-toggle").textContent = reviewShowEnglish ? "Hide English" : "Show English";
    if (type === "sentence") {
      el("fc-sentence-pinyin").hidden = !reviewShowPinyin;
      el("fc-sentence-en").hidden = !reviewShowEnglish;
    } else {
      el("fc-pinyin").hidden = !reviewShowPinyin;
      el("fc-meaning").hidden = false; // meaning always visible after reveal
    }
  }

  function stopReview() {
    if (reviewStartedAt) { const mins = Math.max(1, Math.round((Date.now() - reviewStartedAt) / 60000)); ensureActivityState(); const key = new Date().toISOString().slice(0, 10); if (!state.activity[key]) state.activity[key] = { reviews: 0, characters: 0, sentences: 0, words: 0, minutes: 0 }; state.activity[key].minutes = Number(state.activity[key].minutes || 0) + mins; saveState(); reviewStartedAt = null; }
    // Leave the current card unanswered and return to the review setup.
    // Ratings already given during the session remain saved.
    el("review-session").classList.add("hidden");
    el("review-summary").classList.add("hidden");
    el("review-setup").classList.remove("hidden");
    reviewQueue = [];
    reviewIndex = 0;
    reviewRevealed = false;
    window.__reviewRatingBusy = false;
    refreshDueCount();
    updateReviewEstimate();
  }

  function finishReview() {
    let mins = 0;
    if (reviewStartedAt) {
      mins = Math.max(1, Math.round((Date.now() - reviewStartedAt) / 60000));
      ensureActivityState();
      const key = new Date().toISOString().slice(0, 10);
      if (!state.activity[key]) state.activity[key] = { reviews: 0, characters: 0, sentences: 0, words: 0, minutes: 0 };
      state.activity[key].minutes = Number(state.activity[key].minutes || 0) + mins;
      saveState();
      reviewStartedAt = null;
    }
    const accuracy = sessionStats.reviewed ? Math.round(sessionStats.correct / sessionStats.reviewed * 100) : 0;
    const skippedCount = Array.isArray(sessionStats.skipped) ? sessionStats.skipped.length : (sessionStats.skipped || 0);
    const flaggedCount = Array.isArray(sessionStats.flagged) ? sessionStats.flagged.length : (sessionStats.flagged || 0);
    setTimeout(() => {
      el("review-session").classList.add("hidden");
      el("review-summary").classList.remove("hidden");
      el("summary-reviewed").textContent = sessionStats.reviewed;
      el("summary-known").textContent = sessionStats.known;
      el("summary-accuracy").textContent = accuracy + "%";
      el("summary-minutes").textContent = mins;
      el("summary-breakdown-text").innerHTML = "Characters · " + (sessionStats.characters || 0) + "<br>Sentences · " + (sessionStats.sentences || 0) + "<br>Words · " + (sessionStats.words || 0) + "<br>Skipped · " + skippedCount + "<br>Flagged · " + flaggedCount + "<br>Best streak · " + (sessionStats.bestStreak || 0);
      const nextMsgParts = [];
      if (sessionStats.mistakes.length) nextMsgParts.push(sessionStats.mistakes.length + " mistake(s) need another look.");
      if (skippedCount) nextMsgParts.push(skippedCount + " item(s) were skipped.");
      if (!nextMsgParts.length) nextMsgParts.push("Great recall! All items remembered.");
      el("summary-next-text").textContent = nextMsgParts.join(" ");
      el("review-mistakes-btn").disabled = !sessionStats.mistakes.length;
      el("review-mistakes-btn").textContent = sessionStats.mistakes.length ? ("Review Mistakes (" + sessionStats.mistakes.length + ")") : "No Mistakes";
      // Skipped button
      const skippedBtn = el("review-skipped-btn");
      if (skippedBtn) {
        skippedBtn.disabled = !skippedCount;
        skippedBtn.textContent = skippedCount ? ("Review Skipped (" + skippedCount + ")") : "No Skipped Items";
      }
      window._lastReviewMistakes = sessionStats.mistakes.slice();
      window._lastReviewSkipped = Array.isArray(sessionStats.skipped) ? sessionStats.skipped.slice() : [];
      window._lastReviewMinutes = mins;
    }, 260);
  }

  /* ---------- PROGRESS ---------- */


  function renderProgress() {
    ensureActivityState();
    const { known, learning, neu, total } = computeCounts(); const dueChars = getDueCount(); const dueSentences = getSentenceDueCount(); const due = dueChars + dueSentences;
    const todayKey = new Date().toISOString().slice(0, 10); const today = state.activity[todayKey] || { reviews: 0, characters: 0, sentences: 0, words: 0, minutes: 0 };
    el("progress-today-reviews").textContent = Number(today.reviews || 0).toLocaleString(); el("progress-today-minutes").textContent = Number(today.minutes || 0).toLocaleString(); el("progress-today-characters").textContent = Number(today.characters || 0).toLocaleString(); el("progress-today-sentences").textContent = Number(today.sentences || 0).toLocaleString(); el("progress-today-streak").textContent = state.streak.count || 0;
    el("smart-due").textContent = due.toLocaleString(); el("smart-learning").textContent = (learning + SENTENCE_DATA.filter(x => getSentenceStatus(x.i) === "learning").length).toLocaleString();
    const weakChars = HANZI_DATA.filter(item => { const e = getEntry(item.c); return e && e.status === "learning" && (Number(e.reviews || 0) >= 2 || Number(e.interval || 0) <= 1) }).sort((a, b) => (Number(getEntry(b.c)?.reviews || 0) - Number(getEntry(a.c)?.reviews || 0))).slice(0, 5);
    const weakSentences = SENTENCE_DATA.filter(item => { const e = getSentenceEntry(item.i); return e && e.status === "learning" && Number(e.reviews || 0) >= 2 }).sort((a, b) => (Number(getSentenceEntry(b.i)?.reviews || 0) - Number(getSentenceEntry(a.i)?.reviews || 0))).slice(0, 3);
    el("smart-weak").textContent = (weakChars.length + weakSentences.length).toLocaleString();
    el("progress-weak-list").innerHTML = (weakChars.map(item => { const e = getEntry(item.c); return '<div class="weak-item"><div class="weak-item-main"><span class="weak-glyph">' + escHtml(item.c) + '</span><div class="weak-copy"><strong>' + escHtml(item.p || "") + '</strong><span>' + Number(e.reviews || 0) + ' reviews · still learning</span></div></div><button type="button" data-progress-char="' + escHtml(item.c) + '">Open</button></div>' }).join("") + weakSentences.map(item => { const e = getSentenceEntry(item.i); return '<div class="weak-item"><div class="weak-item-main"><span class="weak-glyph">句</span><div class="weak-copy"><strong>' + escHtml(item.z.slice(0, 18)) + (item.z.length > 18 ? '…' : '') + '</strong><span>' + Number(e.reviews || 0) + ' reviews · sentence</span></div></div><button type="button" data-progress-sentence="' + escHtml(item.i) + '">Open</button></div>' }).join("")) || '<p class="progress-sub">No weak areas yet. Keep reviewing to build a useful history.</p>';
    const totalBase = total || 1, kp = known / totalBase * 100, lp = learning / totalBase * 100, np = neu / totalBase * 100, dp = Math.min(100, due / totalBase * 100);
    el("srs-known-fill").style.width = kp + "%"; el("srs-learning-fill").style.width = lp + "%"; el("srs-new-fill").style.width = np + "%"; el("srs-due-fill").style.width = dp + "%";
    el("srs-known-count").textContent = known.toLocaleString(); el("srs-learning-count").textContent = learning.toLocaleString(); el("srs-new-count").textContent = neu.toLocaleString(); el("srs-due-count").textContent = due.toLocaleString();
    const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i); const key = d.toISOString().slice(0, 10); days.push({ key, label: d.toLocaleDateString(undefined, { month: "numeric", day: "numeric" }), ...(state.activity[key] || { reviews: 0, characters: 0, sentences: 0, words: 0, minutes: 0 }) }) } const maxA = Math.max(1, ...days.map(d => Number(d.reviews || 0)));
    el("progress-activity-chart").innerHTML = days.map(d => '<div class="progress-bar-day" style="height:' + Math.max(3, Number(d.reviews || 0) / maxA * 100) + '%" title="' + d.label + ': ' + Number(d.reviews || 0) + ' reviews"><span>' + d.label + '</span></div>').join("");
    el("level-bars").innerHTML = LEVEL_GROUPS.map(g => { const items = HANZI_DATA.filter(item => levelMatches(item, g.key)); let k = 0, l = 0; items.forEach(item => { const st = getStatus(item.c); if (st === "known") k++; else if (st === "learning") l++ }); const pk = items.length ? k / items.length * 100 : 0, pl = items.length ? l / items.length * 100 : 0; return '<div class="level-bar-row"><span class="level-bar-label">' + g.label + '</span><div class="level-bar-track"><div class="level-bar-fill known" style="width:' + pk + '%"></div><div class="level-bar-fill learning" style="width:' + pl + '%"></div></div><span class="level-bar-count">' + k.toLocaleString() + ' known · ' + l.toLocaleString() + ' learning</span></div>' }).join("");
    const acts = Object.entries(state.activity).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 7); el("progress-activity-list").innerHTML = acts.length ? acts.map(([date, a]) => '<div class="activity-item"><span class="activity-icon">📚</span><div class="activity-copy"><strong>' + escHtml(date) + '</strong><span>' + Number(a.reviews || 0) + ' reviews · ' + Number(a.characters || 0) + ' characters · ' + Number(a.sentences || 0) + ' sentences</span></div></div>').join("") : '<p class="progress-sub">Your study activity will appear here after your first review.</p>';
    const knownEntries = Object.entries(state.progress).filter(([c, e]) => e.status === "known" && e.stampedAt).sort((a, b) => b[1].stampedAt - a[1].stampedAt).slice(0, 48); el("seal-album-grid").innerHTML = knownEntries.length ? knownEntries.map(([c]) => '<span class="seal-chip" data-char="' + escHtml(c) + '" title="' + escHtml(c) + '">' + escHtml(c) + '</span>').join("") : '<p class="empty-note">Stamp your first character to start your collection.</p>';
    renderSentenceProgress();
  }

  function renderSentenceProgress() {
    const total = SENTENCE_DATA.length;
    const known = SENTENCE_DATA.filter(item => getSentenceStatus(item.i) === "known").length;
    const fresh = SENTENCE_DATA.filter(item => getSentenceStatus(item.i) === "new").length;
    const learning = total - known - fresh;
    const due = getSentenceDueCount();
    const pctNew = total ? (fresh / total * 100) : 0;
    const pctLearning = total ? (learning / total * 100) : 0;
    const pctKnown = total ? (known / total * 100) : 0;

    const fillNew = el("sentence-progress-fill-new");
    const fillLearning = el("sentence-progress-fill-learning");
    const fillKnown = el("sentence-progress-fill-known");
    if (fillNew) fillNew.style.width = pctNew + "%";
    if (fillLearning) fillLearning.style.width = pctLearning + "%";
    if (fillKnown) fillKnown.style.width = pctKnown + "%";

    const labelNew = el("sentence-progress-new");
    const labelLearning = el("sentence-progress-learning");
    const labelKnown = el("sentence-progress-known");
    const labelDue = el("sentence-progress-due");
    if (labelNew) labelNew.textContent = fresh.toLocaleString();
    if (labelLearning) labelLearning.textContent = learning.toLocaleString();
    if (labelKnown) labelKnown.textContent = known.toLocaleString();
    if (labelDue) labelDue.textContent = due.toLocaleString();
  }

  /* ---------- WORDS (HSK 3.0 VOCABULARY) ---------- */
  let wordFilters = { query: "", sort: "hsk", level: "all", length: "all", usage: "all", srs: "all", status: "all" };
  let wordPage = 0;
  let wordPageSize = 96;
  let WORD_DATA = null;
  let wordsShowPinyin = true;
  let wordsShowEnglish = false;
  let wordSelectionMode = "off";
  let selectedWords = new Set();
  let sentenceCorpusIndexed = false;

  function isHanWord(value) {
    return /^[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]{2,6}$/.test(String(value || ""));
  }

  function indexSentenceCorpusForWords() {
    if (sentenceCorpusIndexed || !WORD_DATA || !window.SENTENCE_DATA || !window.SENTENCE_DATA.length) return;
    const wordMap = new Map();
    for (const item of WORD_DATA) {
      wordMap.set(item.word, item);
    }

    for (const sentence of window.SENTENCE_DATA) {
      const zh = String(sentence.z || "").trim();
      const en = String(sentence.t || "").trim();
      if (!zh || !en) continue;

      for (let i = 0; i < zh.length; i++) {
        for (let len = 2; len <= 4 && i + len <= zh.length; len++) {
          const sub = zh.substring(i, i + len);
          const item = wordMap.get(sub);
          if (item) {
            item.corpusCount++;
            if (item.exampleSentences.length < 3 && !item.exampleSentences.some(x => x.en === en)) {
              item.exampleSentences.push({ zh, en });
              item.exampleSentences.sort((a, b) => a.zh.length - b.zh.length);
            }
          }
        }
      }
    }
    sentenceCorpusIndexed = true;
  }

  function buildWordData() {
    if (WORD_DATA) {
      if (!sentenceCorpusIndexed && window.SENTENCE_DATA && window.SENTENCE_DATA.length) {
        indexSentenceCorpusForWords();
      }
      return WORD_DATA;
    }

    if (Array.isArray(window.HSK_WORDS_DATA) && window.HSK_WORDS_DATA.length) {
      WORD_DATA = window.HSK_WORDS_DATA.filter(item => Array.from(item.w || "").length >= 2).map(item => {
        const word = item.w;
        const pinyin = item.p || "";
        const level = Number(item.l) || 7;
        const meaning = item.d || "";
        const charItems = Array.from(word).map(ch => HANZI_BY_CHAR[ch]).filter(Boolean);
        const freqRanks = charItems.map(x => Number(x.f)).filter(x => Number.isFinite(x) && x < 99999);
        const avgRank = freqRanks.length ? freqRanks.reduce((a, b) => a + b, 0) / freqRanks.length : 99999;
        return {
          word,
          pinyin,
          level,
          meaning,
          english: meaning,
          corpusCount: 0,
          avgRank,
          charItems,
          exampleSentences: []
        };
      });

      if (window.SENTENCE_DATA && window.SENTENCE_DATA.length) {
        indexSentenceCorpusForWords();
      } else {
        ensureSentenceData().then(() => {
          indexSentenceCorpusForWords();
          if (activeTab === "words") renderWords();
        });
      }

      WORD_DATA._sourceExamples = WORD_DATA.length;
      return WORD_DATA;
    }

    // Fallback: minimal dataset if words.js is missing
    WORD_DATA = [];
    return WORD_DATA;
  }

  function getWordSrsStage(word) {
    const entry = getWordEntry(word);
    if (!entry || !entry.reviews) return "new";
    const interval = Number(entry.interval) || 0;
    if (interval >= 90) return "mastered";
    if (interval >= 21) return "mature";
    return "learning";
  }

  function renderWords() {
    const data = buildWordData();
    const q = wordFilters.query.trim().toLowerCase();
    let items = data.filter(item => {
      if (wordFilters.level !== "all") {
        const lvl = Number(wordFilters.level);
        if (lvl === 7) {
          if (item.level < 7) return false;
        } else if (item.level !== lvl) {
          return false;
        }
      }
      if (wordFilters.length !== "all") {
        const wLen = Array.from(item.word).length;
        const fLen = Number(wordFilters.length);
        if (fLen === 4 ? wLen < 4 : wLen !== fLen) return false;
      }
      if (wordFilters.usage === "used" && item.corpusCount < 1) return false;
      if (wordFilters.usage === "very-common" && item.corpusCount < 2) return false;
      if (wordFilters.status !== "all" && getWordStatus(item.word) !== wordFilters.status) return false;
      if (wordFilters.srs !== "all" && getWordSrsStage(item.word) !== wordFilters.srs) return false;
      if (q) {
        const matchWord = item.word.toLowerCase().includes(q);
        const matchPinyin = (item.pinyin || "").toLowerCase().includes(q);
        const matchMeaning = (item.meaning || item.english || "").toLowerCase().includes(q);
        if (!matchWord && !matchPinyin && !matchMeaning) return false;
      }
      return true;
    });

    items.sort((a, b) => {
      if (wordFilters.sort === "hsk") return (a.level - b.level) || (b.corpusCount - a.corpusCount) || (a.avgRank - b.avgRank) || a.word.localeCompare(b.word, "zh-Hans");
      if (wordFilters.sort === "common") return (b.corpusCount - a.corpusCount) || (a.level - b.level) || (a.avgRank - b.avgRank) || (a.word.localeCompare(b.word));
      if (wordFilters.sort === "rare") return (a.corpusCount - b.corpusCount) || (b.level - a.level) || (b.avgRank - a.avgRank) || (a.word.localeCompare(b.word));
      if (wordFilters.sort === "charfreq") return (a.avgRank - b.avgRank) || (a.level - b.level) || (b.corpusCount - a.corpusCount);
      if (wordFilters.sort === "length") return (Array.from(b.word).length - Array.from(a.word).length) || (a.level - b.level) || (b.corpusCount - a.corpusCount);
      return a.word.localeCompare(b.word, "zh-Hans");
    });

    const totalPages = Math.max(1, Math.ceil(items.length / wordPageSize));
    if (wordPage >= totalPages) wordPage = totalPages - 1;
    if (wordPage < 0) wordPage = 0;
    const pageItems = items.slice(wordPage * wordPageSize, wordPage * wordPageSize + wordPageSize);
    if (el("word-count")) el("word-count").textContent = items.length.toLocaleString() + " words";
    if (el("word-page-indicator")) el("word-page-indicator").textContent = (wordPage + 1) + " / " + totalPages;
    if (el("word-page-indicator-top")) el("word-page-indicator-top").textContent = (wordPage + 1) + " / " + totalPages;
    if (el("word-prev-page")) el("word-prev-page").disabled = wordPage === 0;
    if (el("word-next-page")) el("word-next-page").disabled = wordPage >= totalPages - 1;

    const grid = el("word-grid");
    if (grid) {
      grid.innerHTML = pageItems.length ? pageItems.map(word => {
        const example = word.exampleSentences && word.exampleSentences.length ? word.exampleSentences[0] : null;
        const meaningText = word.meaning || word.english || "Meaning not available";
        const status = getWordStatus(word.word);
        const isSelected = selectedWords.has(word.word);
        let classes = "word-card status-" + status;
        if (isSelected) classes += " selected";
        const lvlLabel = word.level >= 7 ? "HSK 7–9" : ("HSK " + (word.level || 1));

        return '<article class="' + classes + '" data-word="' + escHtml(word.word) + '" tabindex="0" role="button" aria-label="Flip ' + escHtml(word.word) + ' card to reveal meaning">' +
          '<div class="word-card-inner">' +
          '<div class="word-card-face front">' +
          '<span class="word-level-badge level-' + (word.level || 1) + '">' + escHtml(lvlLabel) + '</span>' +
          '<button type="button" class="tone-audio-btn-sm" data-speak-word="' + escHtml(word.word) + '" title="Listen to ' + escHtml(word.word) + '" style="position:absolute; top:10px; right:10px; z-index:2;">🔊</button>' +
          '<div class="word-zh">' + escHtml(word.word) + '</div>' +
          '<div class="word-pinyin" ' + (wordsShowPinyin ? '' : 'hidden') + '>' + escHtml(word.pinyin || "—") + '</div>' +
          '</div>' +
          '<div class="word-card-face back">' +
          '<div class="word-pinyin" style="font-size: 1.15rem; color: var(--gold-dark); font-weight: 700; margin-bottom: 4px;">' + escHtml(word.pinyin || "—") + '</div>' +
          '<div class="word-card-back-meaning">' + escHtml(meaningText) + '</div>' +
          '<div class="word-example" ' + (wordsShowEnglish ? '' : 'hidden') + '>' +
          '<div class="word-example-label">Simple example</div>' +
          (example ? '<div class="word-example-zh">' + escHtml(example.zh) + '</div>' + (window.pinyinPro && typeof window.pinyinPro.pinyin === "function" ? '<div class="word-example-py" ' + (wordsShowPinyin ? '' : 'hidden') + '>' + escHtml(window.pinyinPro.pinyin(example.zh, { toneType: "symbol", type: "string", v: true })) + '</div>' : '') + '<div class="word-example-en">' + escHtml(example.en) + '</div>' : '<div class="word-example-empty">No example sentence in current corpus.</div>') +
          '</div>' +
          '</div>' +
          '</div>' +
          '</article>';
      }).join("") : '<div class="word-empty">No words match these filters.</div>';
    }

    updateWordSidebars();
    updateWordSelectionBar();
  }

  function wireWords() {
    const search = el("word-search");
    if (search) {
      let wordSearchTimeout;
      search.addEventListener("input", () => {
        clearTimeout(wordSearchTimeout);
        const val = search.value;
        wordSearchTimeout = setTimeout(() => {
          wordFilters.query = val;
          wordPage = 0;
          renderWords();
        }, 150);
      });
    }

    const lvlSelect = el("word-level-select");
    if (lvlSelect) {
      lvlSelect.addEventListener("change", () => {
        wordFilters.level = lvlSelect.value;
        wordPage = 0;
        renderWords();
      });
    }

    ["word-sort", "word-length", "word-common-only"].forEach(id => {
      const node = el(id); if (!node) return;
      node.addEventListener("change", () => {
        wordFilters[id === "word-sort" ? "sort" : id === "word-length" ? "length" : "usage"] = node.value;
        wordPage = 0;
        renderWords();
      });
    });

    el("word-prev-page")?.addEventListener("click", () => { wordPage--; renderWords(); });
    el("word-next-page")?.addEventListener("click", () => { wordPage++; renderWords(); });
    const showPinyin = el("words-show-pinyin");
    const showEnglish = el("words-show-english");
    showPinyin?.addEventListener("click", () => {
      wordsShowPinyin = !wordsShowPinyin;
      showPinyin.classList.toggle("active", wordsShowPinyin);
      renderWords();
    });
    showEnglish?.addEventListener("click", () => {
      wordsShowEnglish = !wordsShowEnglish;
      showEnglish.classList.toggle("active", wordsShowEnglish);
      renderWords();
    });

    const srsSelect = el("word-srs-select");
    if (srsSelect) srsSelect.addEventListener("change", (e) => { wordFilters.srs = e.target.value; wordPage = 0; renderWords(); });
    const statusSelect = el("word-status-select");
    if (statusSelect) statusSelect.addEventListener("change", (e) => { wordFilters.status = e.target.value; wordPage = 0; renderWords(); });

    el("word-selection-bar")?.querySelectorAll("[data-word-selection-mode]").forEach(btn => {
      btn.addEventListener("click", () => setWordSelectionMode(btn.dataset.wordSelectionMode));
    });
    el("word-selection-bar")?.querySelectorAll("[data-word-bulk-status]").forEach(btn => {
      btn.addEventListener("click", () => applyBulkWordStatus(btn.dataset.wordBulkStatus));
    });
    el("word-clear-selection")?.addEventListener("click", () => {
      selectedWords.clear(); updateWordSelectionBar(); renderWords();
    });

    el("word-grid")?.addEventListener("click", e => {
      const speakBtn = e.target.closest("[data-speak-word]");
      if (speakBtn) {
        e.stopPropagation();
        playChineseAudio(speakBtn.dataset.speakWord);
        return;
      }
      const statusBtn = e.target.closest("[data-word-set-status]");
      if (statusBtn) {
        e.stopPropagation();
        const card = statusBtn.closest(".word-card");
        if (!card) return;
        const word = card.dataset.word;
        const newStatus = statusBtn.dataset.wordSetStatus;
        const wasKnown = getWordStatus(word) === "known";
        setWordStatusManual(word, newStatus);
        if (newStatus === "known" && !wasKnown) {
          triggerStampFX(card);
          spawnConfetti(card);
        }
        renderWords();
        return;
      }
      const part = e.target.closest("[data-word-char]");
      if (part) {
        e.stopPropagation();
        openDetail(part.dataset.wordChar);
        return;
      }
      const card = e.target.closest(".word-card");
      if (!card) return;
      const word = card.dataset.word;
      if (wordSelectionMode === "single") {
        selectedWords.clear(); selectedWords.add(word); updateWordSelectionBar(); renderWords();
      } else if (wordSelectionMode === "multi") {
        if (selectedWords.has(word)) selectedWords.delete(word); else selectedWords.add(word);
        updateWordSelectionBar(); renderWords();
      } else {
        card.classList.toggle("flipped");
      }
    });

    el("word-grid")?.addEventListener("keydown", e => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".word-card");
      if (!card || e.target.closest("[data-word-char]")) return;
      e.preventDefault();
      const word = card.dataset.word;
      if (wordSelectionMode === "single") {
        selectedWords.clear(); selectedWords.add(word); updateWordSelectionBar(); renderWords();
      } else if (wordSelectionMode === "multi") {
        if (selectedWords.has(word)) selectedWords.delete(word); else selectedWords.add(word);
        updateWordSelectionBar(); renderWords();
      } else {
        card.classList.toggle("flipped");
      }
    });

    document.querySelectorAll("[data-word-side-level]").forEach(btn => {
      btn.addEventListener("click", () => {
        wordFilters.level = btn.dataset.wordSideLevel;
        if (lvlSelect) lvlSelect.value = wordFilters.level;
        wordPage = 0;
        renderWords();
      });
    });

    document.querySelectorAll("[data-word-side-status]").forEach(btn => {
      btn.addEventListener("click", () => {
        wordFilters.status = btn.dataset.wordSideStatus;
        if (statusSelect) statusSelect.value = wordFilters.status;
        wordPage = 0; renderWords();
      });
    });
    document.querySelectorAll("[data-word-side-sort]").forEach(btn => {
      btn.addEventListener("click", () => {
        wordFilters.sort = btn.dataset.wordSideSort;
        const sel = el("word-sort"); if (sel) sel.value = wordFilters.sort;
        wordPage = 0; renderWords();
      });
    });
    document.querySelectorAll("[data-word-side-reset]").forEach(btn => {
      btn.addEventListener("click", () => {
        wordFilters = { query: "", sort: "hsk", level: "all", length: "all", usage: "all", srs: "all", status: "all" };
        if (lvlSelect) lvlSelect.value = "all";
        if (statusSelect) statusSelect.value = "all";
        if (srsSelect) srsSelect.value = "all";
        const lenSel = el("word-length"); if (lenSel) lenSel.value = "all";
        const sortSel = el("word-sort"); if (sortSel) sortSel.value = "hsk";
        const search = el("word-search"); if (search) search.value = "";
        wordPage = 0; renderWords();
      });
    });
  }

  function setWordSelectionMode(mode) {
    wordSelectionMode = mode;
    if (mode === "off") selectedWords.clear();
    updateWordSelectionBar();
    renderWords();
  }

  function updateWordSelectionBar() {
    const bar = el("word-selection-bar");
    if (!bar) return;
    bar.querySelectorAll("[data-word-selection-mode]").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.wordSelectionMode === wordSelectionMode);
    });
    el("word-selection-count").textContent = selectedWords.size + " selected";
    const saveState = el("word-selection-save-state");
    saveState.textContent = "Saved automatically";
    saveState.classList.remove("saving", "saved");
    const actions = bar.querySelector(".selection-actions");
    if (selectedWords.size > 0 && wordSelectionMode !== "off") {
      bar.classList.add("active");
      actions.style.display = "flex";
    } else {
      bar.classList.remove("active");
      actions.style.display = "none";
    }
  }

  function applyBulkWordStatus(status) {
    if (selectedWords.size === 0) return;
    const saveState = el("word-selection-save-state");
    saveState.textContent = "Saving…";
    saveState.classList.add("saving");
    saveState.classList.remove("saved");
    selectedWords.forEach(word => {
      setWordStatusManual(word, status);
    });
    setTimeout(() => {
      saveState.textContent = "Saved!";
      saveState.classList.remove("saving");
      saveState.classList.add("saved");
      setTimeout(() => {
        saveState.textContent = "Saved automatically";
        saveState.classList.remove("saved");
      }, 1500);
      if (wordSelectionMode === "single") {
        selectedWords.clear();
        setWordSelectionMode("off");
      }
      renderWords();
    }, 200);
  }

  /* ---------- wiring ---------- */
  function openSmartReview() {
    const tab = document.querySelector('.tab-btn[data-tab="review"]');
    if (tab) tab.click();
    const r = document.querySelector('input[name="pool"][value="smart"]');
    if (r) r.checked = true;
    updateReviewEstimate();
    const b = el("start-review");
    if (b) setTimeout(() => b.click(), 80);
  }

  function wireReadings() {
    const parseBtn = el('readings-parse-btn');
    const input = el('readings-input');
    const output = el('readings-output');
    const statsContainer = el('readings-stats');
    const pinyinUnknownOnlyCheckbox = el('reading-pinyin-unknown-only');
    const libraryView = el('readings-library-view');
    const readerView = el('readings-reader-view');
    const readingsList = el('readings-list');
    const titleInput = el('readings-title-input');
    const saveBtn = el('readings-save-btn');
    const newBtn = el('readings-new-btn');
    const backBtn = el('readings-back-btn');
    const deleteBtn = el('readings-delete-btn');

    let currentReadingText = '';
    let currentReadingId = null;
    let readingShowPinyin = false;
    let readingPinyinUnknownOnly = false;
    let wordDict = new Set();
    let maxWordLen = 1;

    // Build dict for MaxMatch
    if (typeof WORD_DATA !== "undefined" && WORD_DATA) {
      wordDict = new Set(WORD_DATA.map(w => w.word));
      maxWordLen = Math.max(...WORD_DATA.map(w => Array.from(w.word).length));
    }

    function renderLibrary() {
      if (!state.readings) state.readings = [];
      readingsList.innerHTML = state.readings.length === 0
        ? '<div style="color: var(--text-light); font-style: italic;">No saved readings yet. Click "Add New Reading" to get started.</div>'
        : state.readings.map(r =>
          '<div class="reading-item" data-id="' + r.id + '" style="background: rgba(255,255,255,0.05); padding: 16px; border-radius: 8px; border: 1px solid var(--border); cursor: pointer; transition: transform 0.2s;">' +
          '<h3 style="margin: 0 0 8px 0; color: var(--gold-bright);">' + escHtml(r.title || 'Untitled Reading') + '</h3>' +
          '<p style="margin: 0; color: var(--text-light); font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">' + escHtml((r.text || "").substring(0, 50)) + '...</p>' +
          '</div>'
        ).join('');

      // Bind clicks
      readingsList.querySelectorAll('.reading-item').forEach(e => {
        e.addEventListener('click', () => {
          const id = e.dataset.id;
          const reading = state.readings.find(r => r.id === id);
          if (reading) {
            currentReadingId = id;
            titleInput.value = reading.title || '';
            input.value = reading.text || '';
            currentReadingText = reading.text || '';
            deleteBtn.style.display = 'block';
            libraryView.classList.add('hidden');
            readerView.classList.remove('hidden');
            renderReadingOutput();
          }
        });
      });
    }

    newBtn?.addEventListener('click', () => {
      currentReadingId = null;
      titleInput.value = '';
      input.value = '';
      currentReadingText = '';
      output.innerHTML = '<div style="color: var(--ink-soft); text-align: center; font-size: 1.1rem; margin-top: 40px; font-family: var(--font-ui);">Your parsed text will appear here.</div>';
      statsContainer?.classList.add('hidden');
      deleteBtn.style.display = 'none';
      libraryView.classList.add('hidden');
      readerView.classList.remove('hidden');
    });

    backBtn?.addEventListener('click', () => {
      libraryView.classList.remove('hidden');
      readerView.classList.add('hidden');
      renderLibrary();
    });

    deleteBtn?.addEventListener('click', () => {
      if (!currentReadingId) return;
      state.readings = state.readings.filter(r => r.id !== currentReadingId);
      saveState();
      libraryView.classList.remove('hidden');
      readerView.classList.add('hidden');
      renderLibrary();
    });

    saveBtn?.addEventListener('click', () => {
      const text = input.value.trim();
      if (!text) return;

      currentReadingText = text;
      const title = titleInput.value.trim();

      if (currentReadingId) {
        const reading = state.readings.find(r => r.id === currentReadingId);
        if (reading) {
          reading.text = text;
          reading.title = title;
        }
      } else {
        currentReadingId = Date.now().toString();
        state.readings.push({ id: currentReadingId, title, text, date: Date.now() });
      }

      saveState();
      renderReadingOutput();
    });

    parseBtn?.addEventListener("click", () => {
      const text = input.value;
      if (!text.trim()) return;
      currentReadingText = text;
      renderReadingOutput();
    });

    pinyinUnknownOnlyCheckbox?.addEventListener('change', (e) => {
      readingPinyinUnknownOnly = e.target.checked;
      renderReadingOutput();
    });

    function renderReadingOutput() {
      if (!currentReadingText) return;

      let known = 0, learning = 0, newCount = 0;

      // Tokenizer: MaxMatch
      const chars = Array.from(currentReadingText);
      let tokens = [];
      let i = 0;
      while (i < chars.length) {
        let matched = false;
        for (let len = maxWordLen; len >= 1; len--) {
          if (i + len <= chars.length) {
            const candidate = chars.slice(i, i + len).join('');
            if (wordDict.has(candidate)) {
              tokens.push({ text: candidate, isWord: true });
              i += len;
              matched = true;
              break;
            }
          }
        }
        if (!matched) {
          tokens.push({ text: chars[i], isWord: false });
          i++;
        }
      }

      output.innerHTML = tokens.map(token => {
        if (token.isWord) {
          // Multi-char word
          let wordHtml = '';
          let allKnown = true;

          const charSpans = Array.from(token.text).map(ch => {
            if (HANZI_BY_CHAR && HANZI_BY_CHAR[ch]) {
              const status = getStatus(ch);
              if (status === 'known') known++;
              else if (status === 'learning') { learning++; allKnown = false; }
              else { newCount++; allKnown = false; }

              const statusClass = status === 'known' ? 'status-known' : status === 'learning' ? 'status-learning' : 'status-new';
              return '<span class="sentence-char ' + statusClass + '" style="display:inline-block; padding: 0 1px;">' + escHtml(ch) + '</span>';
            } else {
              return escHtml(ch);
            }
          }).join('');

          if (readingShowPinyin) {
            let showThisPinyin = true;
            if (readingPinyinUnknownOnly && allKnown) showThisPinyin = false;

            const wordObj = WORD_DATA.find(w => w.word === token.text);
            const py = wordObj ? wordObj.pinyin : sentencePinyin(token.text);
            const rtContent = showThisPinyin ? escHtml(py) : '&nbsp;';
            wordHtml = '<ruby class="sentence-word" data-sentence-word="' + escHtml(token.text) + '" style="display:inline-flex; flex-direction:column-reverse; align-items:center; cursor:pointer;" title="' + escHtml(wordObj?.meaning || '') + '">' + charSpans + '<rt style="font-size:0.5em; color:var(--text-light); line-height:1; transform:translateY(2px); visibility:' + (showThisPinyin ? 'visible' : 'hidden') + ';">' + rtContent + '</rt></ruby>';
          } else {
            wordHtml = '<span class="sentence-word" data-sentence-word="' + escHtml(token.text) + '" style="cursor:pointer; display:inline-block;" title="' + escHtml(WORD_DATA.find(w => w.word === token.text)?.meaning || '') + '">' + charSpans + '</span>';
          }
          return wordHtml;

        } else {
          // Single char
          const ch = token.text;
          if (HANZI_BY_CHAR && HANZI_BY_CHAR[ch]) {
            const status = getStatus(ch);
            if (status === 'known') known++;
            else if (status === 'learning') learning++;
            else newCount++;

            const statusClass = status === 'known' ? 'status-known' : status === 'learning' ? 'status-learning' : 'status-new';
            let html = '<span class="sentence-char ' + statusClass + '" style="display:inline-block; padding: 0 1px;">' + escHtml(ch) + '</span>';

            if (readingShowPinyin) {
              let showThisPinyin = true;
              if (readingPinyinUnknownOnly && status === 'known') showThisPinyin = false;
              const py = sentencePinyin(ch);
              const rtContent = showThisPinyin ? escHtml(py) : '&nbsp;';
              html = '<ruby style="display:inline-flex; flex-direction:column-reverse; align-items:center;">' + html + '<rt style="font-size:0.5em; color:var(--text-light); line-height:1; transform:translateY(2px); visibility:' + (showThisPinyin ? 'visible' : 'hidden') + ';">' + rtContent + '</rt></ruby>';
            }
            return html;
          }
          return escHtml(ch);
        }
      }).join('');

      if (statsContainer) {
        statsContainer.classList.remove('hidden');
        el('reading-stat-known').textContent = known;
        el('reading-stat-learning').textContent = learning;
        el('reading-stat-new').textContent = newCount;
      }
    }

    if (output) {
      output.addEventListener('click', e => {
        const word = e.target.closest('[data-sentence-word]');
        if (word) {
          e.stopPropagation();
          openWordDetail(word.dataset.sentenceWord);
          return;
        }
        const char = e.target.closest('[data-sentence-char]');
        if (char) {
          e.stopPropagation();
          openDetail(char.dataset.sentenceChar);
        }
      });
    }

    const toggleBtn = el('reading-toggle-pinyin');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        readingShowPinyin = !readingShowPinyin;
        toggleBtn.classList.toggle('active', readingShowPinyin);
        renderReadingOutput();
      });
    }

    const playBtn = el('reading-play-audio');
    if (playBtn) {
      playBtn.addEventListener('click', () => {
        if (currentReadingText) {
          playChineseAudio(currentReadingText, { rate: 0.9 });
        }
      });
    }

    // Initial render
    setTimeout(() => {
      if (libraryView && !libraryView.classList.contains('hidden')) {
        renderLibrary();
      }
    }, 100);
  }

  function wireTabs() {
    document.querySelectorAll(".tab-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
        btn.classList.add("active");
        el("tab-" + btn.dataset.tab).classList.add("active");
        if (btn.dataset.tab === "evolution") renderEvolutionTab();
        if (btn.dataset.tab === "pictographs") renderPictographsTab();
        if (btn.dataset.tab === "progress") renderProgress();
        if (btn.dataset.tab === "sentences") renderSentences();
        if (btn.dataset.tab === "words") renderWords();
        if (btn.dataset.tab === "tones") renderTonesTab();
        if (btn.dataset.tab === "review") { refreshDueCount(); updateReviewEstimate(); }
        if (btn.dataset.tab === "readings") {
          const libraryView = el("readings-library-view");
          if (libraryView && !libraryView.classList.contains("hidden")) {
            // Re-render library when tab clicked
            const list = el("readings-list");
            if (list && list.innerHTML === "") {
              // trigger initial render indirectly
              setTimeout(() => document.getElementById("readings-new-btn")?.click(), 10);
              setTimeout(() => document.getElementById("readings-back-btn")?.click(), 20);
            }
          }
        }
      });
    });
  }

  function toggleMultiChip(chip, container, dataAttr, targetSet, afterChange) {
    const value = chip.dataset[dataAttr];
    if (value === "all") {
      targetSet.clear();
    } else {
      if (targetSet.has(value)) targetSet.delete(value);
      else targetSet.add(value);
    }
    container.querySelectorAll(".chip").forEach(c => {
      const v = c.dataset[dataAttr];
      const active = v === "all" ? targetSet.size === 0 : targetSet.has(v);
      c.classList.toggle("active", active);
    });
    afterChange();
  }

  function wireBrowse() {
    const levelSelect = el("browse-level-select");
    if (levelSelect) levelSelect.addEventListener("change", (e) => {
      browseFilters.levels = e.target.value === "all" ? new Set() : new Set([e.target.value]);
      browsePage = 0;
      renderBrowse();
    });

    const srsSelect = el("browse-srs-select");
    if (srsSelect) srsSelect.addEventListener("change", (e) => {
      browseFilters.srsStage = e.target.value;
      browsePage = 0;
      renderBrowse();
    });

    const statusSelect = el("browse-status-select");
    if (statusSelect) statusSelect.addEventListener("change", (e) => {
      browseFilters.statuses = e.target.value === "all" ? new Set() : new Set([e.target.value]);
      browsePage = 0;
      renderBrowse();
    });

    el("browse-sort").addEventListener("change", (e) => {
      browseFilters.sort = e.target.value;
      browsePage = 0;
      renderBrowse();
    });

    let searchTimeout;
    el("search-input").addEventListener("input", (e) => {
      clearTimeout(searchTimeout);
      const val = e.target.value;
      searchTimeout = setTimeout(() => { browseFilters.query = val; browsePage = 0; renderBrowse(); }, 150);
    });
    el("prev-page").addEventListener("click", () => { if (browsePage > 0) { browsePage--; renderBrowse(); } });
    el("next-page").addEventListener("click", () => { browsePage++; renderBrowse(); });
    const browsePinyin = el("browse-show-pinyin");
    const browseEnglish = el("browse-show-english");
    browsePinyin?.addEventListener("click", () => { browseShowPinyin = !browseShowPinyin; browsePinyin.classList.toggle("active", browseShowPinyin); renderBrowse(); });
    browseEnglish?.addEventListener("click", () => { browseShowEnglish = !browseShowEnglish; browseEnglish.classList.toggle("active", browseShowEnglish); renderBrowse(); });
    el("tile-grid").addEventListener("click", (e) => {
      const speak = e.target.closest("[data-speak-char]");
      if (speak) {
        e.stopPropagation();
        playChineseAudio(speak.dataset.speakChar, { rate: 0.88 });
        return;
      }
      const tile = e.target.closest(".tile");
      if (!tile) return;
      const char = tile.dataset.char;

      // In normal browsing, clicking/tapping the card itself flips it.
      // Selection mode keeps its existing selection behavior.
      if (browseSelectionMode !== "off") {
        toggleBrowseSelection(char);
        return;
      }

      const isFlipped = tile.classList.toggle("flipped");
      if (isFlipped) flippedBrowseChars.add(char);
      else flippedBrowseChars.delete(char);
    });
    el("tile-grid").addEventListener("keydown", (e) => {
      const tile = e.target.closest(".tile");
      if (!tile) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (browseSelectionMode !== "off") {
          toggleBrowseSelection(tile.dataset.char);
          return;
        }
        const isFlipped = tile.classList.toggle("flipped");
        const char = tile.dataset.char;
        if (isFlipped) flippedBrowseChars.add(char);
        else flippedBrowseChars.delete(char);
      }
    });
    el("browse-selection-bar").querySelectorAll("[data-selection-mode]").forEach(btn => {
      btn.addEventListener("click", () => setBrowseSelectionMode(btn.dataset.selectionMode));
    });
    el("browse-selection-bar").querySelectorAll("[data-bulk-status]").forEach(btn => {
      btn.addEventListener("click", () => applyBulkBrowseStatus(btn.dataset.bulkStatus));
    });
    el("clear-selection").addEventListener("click", () => {
      selectedBrowseChars.clear(); updateBrowseSelectionUI(); renderBrowse();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && browseSelectionMode !== "off") {
        selectedBrowseChars.clear(); updateBrowseSelectionUI(); renderBrowse();
      }
    });
  }

  function wireDrawer() {
    el("drawer-close").addEventListener("click", closeDetail);
    el("drawer-backdrop").addEventListener("click", closeDetail);

    const saveMnemBtn = el("drawer-mnemonic-save");
    if (saveMnemBtn) {
      saveMnemBtn.addEventListener("click", () => {
        if (currentDetailChar) {
          const val = el("drawer-mnemonic-input").value.trim();
          saveMnemonic(currentDetailChar, val);
          const savedMsg = el("drawer-mnemonic-saved");
          savedMsg.style.opacity = "1";
          setTimeout(() => { savedMsg.style.opacity = "0"; }, 2000);
        }
      });
    }

    ["new", "learning", "known"].forEach(s => {
      el("status-btn-" + s).addEventListener("click", () => {
        if (currentDetailChar) {
          const wasKnown = getStatus(currentDetailChar) === "known";
          setStatusManual(currentDetailChar, s);
          if (s === "known" && !wasKnown) { triggerStampFX(el("drawer-hanzi")); spawnConfetti(el("detail-drawer")); }
          openDetail(currentDetailChar);
          syncUI();
        } else if (currentDetailWord) {
          const wasKnown = getWordStatus(currentDetailWord) === "known";
          setWordStatusManual(currentDetailWord, s);
          if (s === "known" && !wasKnown) { triggerStampFX(el("drawer-hanzi")); spawnConfetti(el("detail-drawer")); }
          openWordDetail(currentDetailWord);
          const libView = el("readings-library-view");
          if (libView && libView.classList.contains("hidden")) {
            const parseBtn = el('readings-parse-btn');
            if (parseBtn) parseBtn.click();
          }
        }
      });
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeDetail();
    });

    const initHanziWriter = () => {
      if (!window.hanziWriterInstance && window.HanziWriter) {
        window.hanziWriterInstance = HanziWriter.create('hanzi-writer-container', currentDetailChar, {
          width: 160,
          height: 160,
          padding: 5,
          strokeAnimationSpeed: 1.5,
          delayBetweenStrokes: 50,
          strokeColor: '#C4841C',
          radicalColor: '#2F8F6E',
        });
      } else if (window.hanziWriterInstance) {
        window.hanziWriterInstance.setCharacter(currentDetailChar);
      }
    };

    el("drawer-btn-animate")?.addEventListener("click", () => {
      initHanziWriter();
      el("drawer-hanzi").style.display = "none";
      el("hanzi-writer-container").style.display = "";
      window.hanziWriterInstance.animateCharacter();
    });

    el("drawer-btn-practice")?.addEventListener("click", () => {
      initHanziWriter();
      el("drawer-hanzi").style.display = "none";
      el("hanzi-writer-container").style.display = "";
      window.hanziWriterInstance.quiz();
    });

    el("drawer-speak")?.addEventListener("click", () => {
      if (!currentDetailChar) return;
      playChineseAudio(currentDetailChar, { rate: 0.82 });
    });

    el("drawer-sentences")?.addEventListener("click", e => {
      const speakSlow = e.target.closest("[data-speak-sentence-slow]");
      if (speakSlow) {
        e.stopPropagation();
        const item = SENTENCE_DATA.find(x => String(x.i) === String(speakSlow.dataset.speakSentenceSlow));
        speakSentence(item, true);
        return;
      }
      const speak = e.target.closest("[data-speak-sentence]");
      if (speak) {
        e.stopPropagation();
        const item = SENTENCE_DATA.find(x => String(x.i) === String(speak.dataset.speakSentence));
        speakSentence(item, false);
        return;
      }
    });
  }

  function wireReview() {
    const reviewLevelContainer = el("review-level-chips");
    reviewLevelContainer.querySelectorAll(".chip").forEach(chip => chip.addEventListener("click", () => {
      toggleMultiChip(chip, reviewLevelContainer, "level", reviewFilters.levels, () => { refreshDueCount(); updateReviewEstimate(); });
    }));
    document.querySelectorAll("[data-review-mode]").forEach(btn => btn.addEventListener("click", () => { reviewMode = btn.dataset.reviewMode; setReviewModeUI(); }));
    el("review-difficulty")?.addEventListener("change", e => { reviewDifficulty = e.target.value; updateReviewEstimate(); });
    el("review-focus-weak")?.addEventListener("change", e => { reviewFocusWeak = e.target.checked; updateReviewEstimate(); });
    document.querySelectorAll('input[name="pool"]').forEach(r => r.addEventListener("change", updateReviewEstimate));
    el("session-size").addEventListener("input", e => { el("session-size-label").textContent = e.target.value; updateReviewEstimate(); });
    el("review-show-pinyin").checked = reviewShowPinyin;
    el("review-show-english").checked = reviewShowEnglish;
    el("review-show-pinyin").addEventListener("change", () => { reviewShowPinyin = el("review-show-pinyin").checked; localStorage.setItem("hanziReviewShowPinyin", String(reviewShowPinyin)); });
    el("review-show-english").addEventListener("change", () => { reviewShowEnglish = el("review-show-english").checked; localStorage.setItem("hanziReviewShowEnglish", String(reviewShowEnglish)); });
    el("review-pinyin-toggle").addEventListener("click", () => updateReviewReveal("pinyin"));
    el("review-english-toggle").addEventListener("click", () => updateReviewReveal("english"));
    el("review-example-toggle").addEventListener("click", () => {
      const box = el("fc-examples");
      const show = box.hidden;
      box.hidden = !show;
      el("review-example-toggle").classList.toggle("active", show);
      el("review-example-toggle").textContent = show ? "Hide examples" : "Show examples";
    });
    // Audio button (normal speed) with visual loading feedback
    el("review-audio-btn").addEventListener("click", () => {
      const item = reviewQueue[reviewIndex];
      if (!item) return;
      const btn = el("review-audio-btn");
      const type = item.__reviewType || (reviewMode === "sentences" ? "sentence" : reviewMode === "words" ? "word" : "character");
      const text = type === "sentence" ? item.z : (type === "word" ? item.word : item.c);
      const sentenceId = type === "sentence" ? item.i : null;
      const audioPath = type === "sentence" ? item.a : null;
      const slowAudioPath = type === "sentence" ? item.as : null;
      btn.textContent = "⏳ Playing…";
      btn.disabled = true;
      playChineseAudio(text, {
        rate: 0.9,
        sentenceId,
        audioPath,
        slowAudioPath,
        onEnd: () => {
          btn.textContent = "🔊 Listen";
          btn.disabled = false;
        }
      });
      // Fallback re-enable in case audio ends without calling onEnd
      setTimeout(() => {
        if (btn.disabled) { btn.textContent = "🔊 Listen"; btn.disabled = false; }
      }, 5000);
    });
    // Audio button (slow speed)
    el("review-audio-slow-btn")?.addEventListener("click", () => {
      const item = reviewQueue[reviewIndex];
      if (!item) return;
      const btn = el("review-audio-slow-btn");
      const type = item.__reviewType || (reviewMode === "sentences" ? "sentence" : reviewMode === "words" ? "word" : "character");
      const text = type === "sentence" ? item.z : (type === "word" ? item.word : item.c);
      const sentenceId = type === "sentence" ? item.i : null;
      const audioPath = type === "sentence" ? (item.as || item.a) : null;
      const slowAudioPath = type === "sentence" ? item.as : null;
      btn.textContent = "⏳ Playing…";
      btn.disabled = true;
      playChineseAudio(text, {
        rate: 0.72,
        sentenceId,
        audioPath,
        slowAudioPath,
        onEnd: () => {
          btn.textContent = "🐢 Slow";
          btn.disabled = false;
        }
      });
      setTimeout(() => {
        if (btn.disabled) { btn.textContent = "🐢 Slow"; btn.disabled = false; }
      }, 5000);
    });
    el("start-review").addEventListener("click", startReview);
    el("stop-review").addEventListener("click", stopReview);
    el("reveal-btn").addEventListener("click", revealCard);
    el("review-skip-btn").addEventListener("click", skipCurrent);
    el("review-flag-btn").addEventListener("click", flagCurrent);
    // Add right click context menu for radical grid so they can still see details or mark known via right click
    el("radical-grid")?.addEventListener("contextmenu", e => {
      const btn = e.target.closest(".radical-card");
      if (btn) {
        e.preventDefault();
        openRadicalDrawer(btn.dataset.radical);
      }
    });
    el("flashcard").addEventListener("click", e => {
      if (e.target.closest("button,a")) return;
      if (!reviewRevealed) revealCard();
    });
    el("flashcard").setAttribute("tabindex", "0");
    el("flashcard").setAttribute("role", "button");
    el("review-focus-toggle").addEventListener("click", () => {
      reviewFocusMode = !reviewFocusMode;
      el("review-session").classList.toggle("focus-mode", reviewFocusMode);
      document.body.classList.toggle("review-focus-active", reviewFocusMode);
      el("review-focus-toggle").classList.toggle("active", reviewFocusMode);
      el("review-focus-toggle").textContent = reviewFocusMode ? "⛶ Exit Focus" : "⛶ Focus";
    });
    document.querySelectorAll("#rate-buttons .status-btn, #rate-buttons .fsrs-rate-btn").forEach(btn => btn.addEventListener("click", () => rateCurrent(btn.dataset.rate)));
    el("back-to-setup").addEventListener("click", () => {
      reviewFocusMode = false;
      document.body.classList.remove("review-focus-active");
      el("review-summary").classList.add("hidden");
      el("review-session").classList.add("hidden");
      el("review-setup").classList.remove("hidden");
      refreshDueCount();
      updateReviewEstimate();
    });
    el("review-again-btn").addEventListener("click", () => {
      reviewFocusMode = false;
      document.body.classList.remove("review-focus-active");
      el("review-summary").classList.add("hidden");
      startReview();
    });
    el("review-mistakes-btn").addEventListener("click", () => {
      if (!window._lastReviewMistakes?.length) return;
      reviewQueue = shuffle(window._lastReviewMistakes).slice();
      reviewIndex = 0;
      sessionStats = { reviewed: 0, known: 0, correct: 0, streak: 0, bestStreak: 0, characters: 0, sentences: 0, words: 0, mistakes: [], skipped: [], flagged: [] };
      reviewStartedAt = Date.now();
      el("review-summary").classList.add("hidden");
      el("review-session").classList.remove("hidden");
      showCard();
    });
    // Wire "Review Skipped" button
    el("review-skipped-btn")?.addEventListener("click", () => {
      const skipped = window._lastReviewSkipped;
      if (!skipped?.length) return;
      reviewQueue = shuffle(skipped).slice();
      reviewIndex = 0;
      sessionStats = { reviewed: 0, known: 0, correct: 0, streak: 0, bestStreak: 0, characters: 0, sentences: 0, words: 0, mistakes: [], skipped: [], flagged: [] };
      reviewStartedAt = Date.now();
      el("review-summary").classList.add("hidden");
      el("review-session").classList.remove("hidden");
      showCard();
    });
    document.addEventListener("keydown", e => {
      if (!el("tab-review")?.classList.contains("active") || el("review-session")?.classList.contains("hidden")) return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target?.tagName)) return;
      if (e.code === "Space" || e.key === "Enter") {
        e.preventDefault();
        if (!reviewRevealed) revealCard();
      } else if (reviewRevealed) {
        if (e.key === "1") rateCurrent("again");
        else if (e.key === "2") rateCurrent("hard");
        else if (e.key === "3") rateCurrent("good");
        else if (e.key === "4") rateCurrent("easy");
        else if (e.key.toLowerCase() === "f") flagCurrent();
      } else if (e.key.toLowerCase() === "s") {
        skipCurrent();
      }
    });
    setReviewModeUI();
  }

  // ---- Quick-study modal logic (Feature 5) ----
  let quickStudyCurrentId = null;
  function openQuickStudy(id) {
    const item = SENTENCE_DATA.find(x => String(x.i) === String(id)); if (!item) return;
    quickStudyCurrentId = id;
    el("sentence-quick-zh").textContent = item.z;
    el("sentence-quick-pinyin").textContent = sentencePinyin(item);
    el("sentence-quick-pinyin").hidden = true;
    el("sentence-quick-en").textContent = item.t;
    el("sentence-quick-en").hidden = true;
    el("sentence-quick-show-pinyin").textContent = "Show Pinyin";
    el("sentence-quick-show-en").textContent = "Show English";
    const pd = sentencePersonalDifficulty(item);
    el("sentence-quick-personal-wrap").innerHTML = '<span class="sentence-quick-personal-badge ' + pd + '">' + escHtml(sentencePersonalLabel(item)) + '</span>';
    el("sentence-quick-modal").classList.add("open");
    el("sentence-quick-modal").setAttribute("aria-hidden", "false");
  }
  function closeQuickStudy() { el("sentence-quick-modal").classList.remove("open"); el("sentence-quick-modal").setAttribute("aria-hidden", "true"); quickStudyCurrentId = null; }

  // ---- Bulk selection (Feature 2) ----
  let sentenceSelMode = "off";
  const selectedSentences = new Set();
  function updateSentenceSelCount() { el("sentence-sel-count").textContent = selectedSentences.size + " selected"; }
  function clearSentenceSelection() { selectedSentences.clear(); document.querySelectorAll(".sentence-card.sentence-selected").forEach(c => c.classList.remove("sentence-selected")); updateSentenceSelCount(); }

  function wireSentences() {
    let timeout;
    el("sentence-search").addEventListener("input", e => { clearTimeout(timeout); sentencePage = 0; timeout = setTimeout(() => { sentenceFilters.query = e.target.value; renderSentences(); }, 120); });
    ["sentence-hsk-filter", "sentence-srs-filter", "sentence-difficulty-filter", "sentence-sort"].forEach(id => el(id).addEventListener("change", e => { sentenceFilters[id.replace("sentence-", "").replace("-filter", "")] = e.target.value; sentencePage = 0; renderSentences(); }));
    el("sentence-prev-page").addEventListener("click", () => { if (sentencePage > 0) { sentencePage--; renderSentences(); } });
    el("sentence-next-page").addEventListener("click", () => { sentencePage++; renderSentences(); });
    const sentencePinyinBtn = el("sentence-show-pinyin");
    const sentenceEnglishBtn = el("sentence-show-english");
    // Feature 4: persist toggle state, restore on load
    if (sentencePinyinBtn) sentencePinyinBtn.classList.toggle("active", sentenceShowPinyin);
    if (sentenceEnglishBtn) sentenceEnglishBtn.classList.toggle("active", sentenceShowEnglish);
    sentencePinyinBtn?.addEventListener("click", () => {
      sentenceShowPinyin = !sentenceShowPinyin;
      localStorage.setItem("hanziSentenceShowPinyin", sentenceShowPinyin ? "1" : "0");
      sentencePinyinBtn.classList.toggle("active", sentenceShowPinyin);
      renderSentences();
    });
    sentenceEnglishBtn?.addEventListener("click", () => {
      sentenceShowEnglish = !sentenceShowEnglish;
      localStorage.setItem("hanziSentenceShowEnglish", sentenceShowEnglish ? "1" : "0");
      sentenceEnglishBtn.classList.toggle("active", sentenceShowEnglish);
      renderSentences();
    });

    // Feature 7: Shuffle button
    el("sentence-shuffle")?.addEventListener("click", () => {
      sentenceShuffled = !sentenceShuffled;
      sentenceShuffleOrder = [];
      el("sentence-shuffle").classList.toggle("active", sentenceShuffled);
      sentencePage = 0;
      renderSentences();
      showToast(sentenceShuffled ? "Shuffled! \uD83D\uDD00" : "Shuffle off");
    });

    // Feature 9: Voice search
    el("sentence-voice-btn")?.addEventListener("click", () => {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { showToast("Voice search not supported in this browser.", true); return; }
      const rec = new SR();
      rec.lang = "zh-CN"; rec.interimResults = false; rec.maxAlternatives = 1;
      const btn = el("sentence-voice-btn");
      btn.classList.add("recording"); btn.title = "Listening\u2026";
      rec.start();
      rec.onresult = e => {
        const t = e.results[0][0].transcript;
        el("sentence-search").value = t;
        sentenceFilters.query = t;
        sentencePage = 0;
        renderSentences();
      };
      rec.onerror = () => showToast("Voice recognition error.", true);
      rec.onend = () => { btn.classList.remove("recording"); btn.title = "Voice search"; };
    });

    // Feature 10: Export CSV
    el("sentence-export-csv")?.addEventListener("click", () => {
      const data = getFilteredSentences();
      if (!data.length) { showToast("No sentences to export.", true); return; }
      const rows = [["ID", "Chinese", "Pinyin", "English", "HSK", "Difficulty", "Status"]];
      data.forEach(item => rows.push([item.i, item.z, sentencePinyin(item), item.t, sentenceHskLabel(item), sentenceDifficultyLabel(item), sentenceStatusLabel(item)]));
      const csv = rows.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(",")).join("\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = "hanzi-sentences.csv"; a.click();
      URL.revokeObjectURL(url);
      showToast("Exported " + data.length + " sentences \u2713");
    });

    // Feature 2: Bulk selection modes
    document.querySelectorAll("[data-sentence-sel]").forEach(btn => {
      btn.addEventListener("click", () => {
        sentenceSelMode = btn.dataset.sentenceSel;
        document.querySelectorAll("[data-sentence-sel]").forEach(b => b.classList.toggle("active", b === btn));
        if (sentenceSelMode === "off") clearSentenceSelection();
      });
    });
    el("sentence-bulk-learning")?.addEventListener("click", () => {
      if (!selectedSentences.size) { showToast("No sentences selected.", true); return; }
      selectedSentences.forEach(id => setSentenceStatus(id, "learning"));
      showToast(selectedSentences.size + " set to Learning \uD83D\uDCDA");
      clearSentenceSelection(); syncUI();
    });
    el("sentence-bulk-mastered")?.addEventListener("click", () => {
      if (!selectedSentences.size) { showToast("No sentences selected.", true); return; }
      selectedSentences.forEach(id => setSentenceStatus(id, "known"));
      showToast(selectedSentences.size + " set to Mastered \u2714");
      clearSentenceSelection(); syncUI();
    });
    el("sentence-bulk-clear")?.addEventListener("click", clearSentenceSelection);

    // Feature 5: Quick-study modal wiring
    el("sentence-quick-close")?.addEventListener("click", closeQuickStudy);
    el("sentence-quick-modal")?.addEventListener("click", e => { if (e.target === el("sentence-quick-modal")) closeQuickStudy(); });
    el("sentence-quick-audio-btn")?.addEventListener("click", () => {
      if (!quickStudyCurrentId) return;
      const item = SENTENCE_DATA.find(x => String(x.i) === String(quickStudyCurrentId));
      if (item) speakSentence(item, false);
    });
    el("sentence-quick-audio-slow-btn")?.addEventListener("click", () => {
      if (!quickStudyCurrentId) return;
      const item = SENTENCE_DATA.find(x => String(x.i) === String(quickStudyCurrentId));
      if (item) speakSentence(item, true);
    });
    el("sentence-quick-show-pinyin")?.addEventListener("click", () => {
      const p = el("sentence-quick-pinyin"); p.hidden = !p.hidden;
      el("sentence-quick-show-pinyin").textContent = p.hidden ? "Show Pinyin" : "Hide Pinyin";
    });
    el("sentence-quick-show-en")?.addEventListener("click", () => {
      const p = el("sentence-quick-en"); p.hidden = !p.hidden;
      el("sentence-quick-show-en").textContent = p.hidden ? "Show English" : "Hide English";
    });
    document.querySelectorAll("[data-quick-rate]").forEach(btn => {
      btn.addEventListener("click", () => {
        if (!quickStudyCurrentId) return;
        const status = btn.dataset.quickRate;
        const wasKnown = getSentenceStatus(quickStudyCurrentId) === "known";
        setSentenceStatus(quickStudyCurrentId, status);
        if (status === "known" && !wasKnown) { triggerStampFX(btn); spawnConfetti(btn); }
        closeQuickStudy(); syncUI();
      });
    });

    // Sentence layout controls
    document.querySelectorAll("[data-sentence-cols]").forEach(btn => {
      btn.addEventListener("click", () => {
        sentenceLayoutCols = btn.dataset.sentenceCols || "3";
        localStorage.setItem("hanziSentenceLayoutCols", sentenceLayoutCols);
        applySentenceLayout();
      });
    });
    document.querySelectorAll("[data-sentence-size]").forEach(btn => {
      btn.addEventListener("click", () => {
        sentenceLayoutSize = btn.dataset.sentenceSize || "medium";
        localStorage.setItem("hanziSentenceLayoutSize", sentenceLayoutSize);
        applySentenceLayout();
      });
    });
    document.querySelectorAll("[data-sentence-per-page]").forEach(btn => {
      btn.addEventListener("click", () => {
        sentencePageSize = Number(btn.dataset.sentencePerPage) || 24;
        localStorage.setItem("hanziSentencePageSize", String(sentencePageSize));
        sentencePage = 0;
        applySentenceLayout();
        renderSentences();
      });
    });

    el("sentence-grid")?.addEventListener("click", e => {
      const char = e.target.closest("[data-sentence-char]");
      if (char) {
        e.stopPropagation();
        openDetail(char.dataset.sentenceChar);
        return;
      }
      const speakSlow = e.target.closest("[data-speak-sentence-slow]");
      if (speakSlow) {
        e.stopPropagation();
        const item = SENTENCE_DATA.find(x => String(x.i) === String(speakSlow.dataset.speakSentenceSlow));
        speakSentence(item, true);
        return;
      }
      const speak = e.target.closest("[data-speak-sentence]");
      if (speak) {
        e.stopPropagation();
        const item = SENTENCE_DATA.find(x => String(x.i) === String(speak.dataset.speakSentence));
        speakSentence(item, false);
        return;
      }
      // Reveal panel toggle (new flat-card design)
      const reveal = e.target.closest("[data-reveal-panel]");
      if (reveal) {
        e.stopPropagation();
        const panelId = reveal.dataset.revealPanel;
        const panel = document.getElementById(panelId);
        if (panel) {
          const isOpen = panel.classList.toggle("open");
          reveal.classList.toggle("open", isOpen);
        }
        return;
      }
      const detail = e.target.closest("[data-detail-sentence]");
      if (detail) {
        e.stopPropagation();
        openSentenceDetails(detail.dataset.detailSentence);
        return;
      }
      // Feature 5: Quick-study button
      const quickStudy = e.target.closest("[data-quick-study-sentence]");
      if (quickStudy) {
        e.stopPropagation();
        openQuickStudy(quickStudy.dataset.quickStudySentence);
        return;
      }
      const review = e.target.closest("[data-review-sentence]");
      if (review) {
        e.stopPropagation();
        openSentenceReview(review.dataset.reviewSentence);
        return;
      }
      const card = e.target.closest(".sentence-card");
      if (card && !e.target.closest("button,a,input,select")) {
        // Feature 2: bulk selection mode
        if (sentenceSelMode === "single" || sentenceSelMode === "multi") {
          const id = card.dataset.sentenceId;
          if (sentenceSelMode === "single") {
            const alreadySel = selectedSentences.has(id);
            clearSentenceSelection();
            if (!alreadySel) { selectedSentences.add(id); card.classList.add("sentence-selected"); }
          } else {
            if (selectedSentences.has(id)) { selectedSentences.delete(id); card.classList.remove("sentence-selected"); }
            else { selectedSentences.add(id); card.classList.add("sentence-selected"); }
          }
          updateSentenceSelCount();
          return;
        }
        // New flat card — no flip needed
      }
    });
    el("sentence-study-due").addEventListener("click", () => startSentencePool("due"));
    el("sentence-study-new").addEventListener("click", () => startSentencePool("new"));
    el("sentence-detail-close").addEventListener("click", closeSentenceDetails);
    el("sentence-detail-audio-btn")?.addEventListener("click", () => {
      if (!currentDetailSentenceId) return;
      const item = SENTENCE_DATA.find(x => String(x.i) === String(currentDetailSentenceId));
      if (item) speakSentence(item, false);
    });
    el("sentence-detail-audio-slow-btn")?.addEventListener("click", () => {
      if (!currentDetailSentenceId) return;
      const item = SENTENCE_DATA.find(x => String(x.i) === String(currentDetailSentenceId));
      if (item) speakSentence(item, true);
    });
    el("sentence-detail-modal").addEventListener("click", e => { if (e.target === el("sentence-detail-modal")) closeSentenceDetails(); const ch = e.target.closest("[data-sentence-char]"); if (ch) { closeSentenceDetails(); openDetail(ch.dataset.sentenceChar); } });
    el("sentence-detail-review").addEventListener("click", () => { const id = el("sentence-detail-review").dataset.reviewSentence; closeSentenceDetails(); openSentenceReview(id); });
    ["new", "learning", "known"].forEach(status => {
      const btn = el("sentence-status-btn-" + status);
      if (!btn) return;
      btn.addEventListener("click", () => {
        const id = el("sentence-detail-review").dataset.reviewSentence;
        if (!id) return;
        const wasKnown = getSentenceStatus(id) === "known";
        setSentenceStatus(id, status);
        if (status === "known" && !wasKnown) { triggerStampFX(btn); spawnConfetti(btn); }
        updateSentenceDetailStatusUI(id);
        syncUI();
      });
    });
  }

  function startSentencePool(poolType) {
    const tab = document.querySelector('.tab-btn[data-tab="review"]'); if (tab) tab.click();
    reviewMode = "sentences"; setReviewModeUI();
    const pool = buildPool(poolType); if (!pool.length) { showToast(poolType === "due" ? "No sentence reviews are due right now." : "No new sentences are available right now."); return; }
    reviewQueue = shuffle(pool).slice(0, Number(el("session-size").value) || 10); reviewIndex = 0; sessionStats = { reviewed: 0, known: 0, correct: 0, streak: 0, bestStreak: 0, characters: 0, sentences: 0, mistakes: [], skipped: 0, flagged: 0 }; reviewStartedAt = Date.now();
    el("review-setup").classList.add("hidden"); el("review-summary").classList.add("hidden"); el("review-session").classList.remove("hidden"); showCard();
  }

  /* ---------- DATA IMPORT / EXPORT ---------- */
  function buildExportPayload() {
    return {
      app: "hanzi-tracker",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      state: state
    };
  }

  function downloadJson(filename, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function exportData() {
    const date = new Date().toISOString().slice(0, 10);
    downloadJson("hanzi-tracker-backup-" + date + ".json", buildExportPayload());
    showToast("Progress exported.");
  }

  function normalizeImportedState(raw) {
    const candidate = raw && raw.state && typeof raw.state === "object" ? raw.state : raw;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new Error("Invalid data file.");
    }

    const progress = candidate.progress;
    const sentenceProgress = candidate.sentenceProgress;
    const streak = candidate.streak;
    if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
      throw new Error("The file does not contain valid progress data.");
    }
    if (streak != null && (typeof streak !== "object" || Array.isArray(streak))) {
      throw new Error("The file contains invalid streak data.");
    }

    const cleanProgress = {};
    Object.keys(progress).forEach(char => {
      if (!HANZI_BY_CHAR[char]) return;
      const entry = progress[char];
      if (!entry || typeof entry !== "object") return;
      const status = ["new", "learning", "known"].includes(entry.status) ? entry.status : "new";
      cleanProgress[char] = {
        status,
        interval: Number.isFinite(Number(entry.interval)) ? Number(entry.interval) : 0,
        reviews: Number.isFinite(Number(entry.reviews)) ? Number(entry.reviews) : 0,
        due: Number.isFinite(Number(entry.due)) ? Number(entry.due) : Date.now()
      };
    });

    const cleanSentenceProgress = {};
    if (sentenceProgress && typeof sentenceProgress === "object" && !Array.isArray(sentenceProgress)) {
      Object.keys(sentenceProgress).forEach(id => {
        const entry = sentenceProgress[id];
        if (!entry || typeof entry !== "object") return;
        const status = ["new", "learning", "known"].includes(entry.status) ? entry.status : "new";
        cleanSentenceProgress[String(id)] = {
          status,
          interval: Number.isFinite(Number(entry.interval)) ? Number(entry.interval) : 0,
          reviews: Number.isFinite(Number(entry.reviews)) ? Number(entry.reviews) : 0,
          due: Number.isFinite(Number(entry.due)) ? Number(entry.due) : Date.now()
        };
      });
    }

    return {
      progress: cleanProgress,
      sentenceProgress: cleanSentenceProgress,
      streak: {
        count: streak && Number.isFinite(Number(streak.count)) ? Number(streak.count) : 0,
        last: streak && typeof streak.last === "string" ? streak.last : null
      }
    };
  }

  async function importData(file) {
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text());
      const importedState = normalizeImportedState(raw);
      const importedCount = Object.keys(importedState.progress).length;

      if (!confirm(
        "Import " + importedCount.toLocaleString() +
        " saved characters and replace your current progress? This cannot be undone."
      )) return;

      state = importedState;
      const payload = JSON.stringify(state);

      try {
        if (window.storage && typeof window.storage.set === "function") {
          await window.storage.set(STORAGE_KEY, payload, false);
        }
      } catch (e) { console.warn("[HanziTracker]", e); }
      try {
        window.localStorage.setItem(FALLBACK_STORAGE_KEY, payload);
        usingLocalStorageFallback = true;
      } catch (e) { console.warn("[HanziTracker]", e); }

      syncUI();
      renderProgress();
      refreshDueCount();
      showToast("Progress imported.");
    } catch (e) {
      showToast("Couldn't import that file. Choose a valid Hanzi Tracker JSON backup.", true);
    }
  }

  function wireDataManagement() {
    el("export-data").addEventListener("click", exportData);
    el("import-data").addEventListener("click", () => el("import-file").click());
    el("import-file").addEventListener("change", async (e) => {
      const file = e.target.files && e.target.files[0];
      await importData(file);
      e.target.value = "";
    });
  }

  function wireProgress() {
    el("reset-progress").addEventListener("click", async () => {
      if (!confirm("Reset all progress? This clears every status, streak, and stamp. This cannot be undone.")) return;
      state = { progress: {}, sentenceProgress: {}, streak: { count: 0, last: null }, activity: {} };
      try {
        if (window.storage && typeof window.storage.set === "function") {
          await window.storage.set(STORAGE_KEY, JSON.stringify(state), false);
        }
      } catch (e) { console.warn("[HanziTracker]", e); }
      try { window.localStorage.removeItem(FALLBACK_STORAGE_KEY); } catch (e) { console.warn("[HanziTracker]", e); }
      syncUI();
      renderProgress();
      showToast("Progress reset.");
    });
  }

  /* ---------- CONTEXT MENU ---------- */
  let contextMenuChar = null;
  let contextMenuTarget = null;
  let contextMenuType = "char";

  function openContextMenu(x, y, type, id, target) {
    contextMenuType = type;
    contextMenuChar = id;
    contextMenuTarget = target || null;
    const menu = el("context-menu");
    menu.classList.remove("hidden");
    menu.style.left = "-999px";
    menu.style.top = "-999px";
    const rect = menu.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    let left = x, top = y;
    if (left + rect.width > vw - 8) left = Math.max(8, vw - rect.width - 8);
    if (top + rect.height > vh - 8) top = Math.max(8, vh - rect.height - 8);
    menu.style.left = left + "px";
    menu.style.top = top + "px";
  }

  function closeContextMenu() {
    el("context-menu").classList.add("hidden");
    contextMenuChar = null;
    contextMenuTarget = null;
    contextMenuType = "char";
  }

  function wireContextMenu() {
    el("tile-grid").addEventListener("contextmenu", (e) => {
      const tile = e.target.closest(".tile");
      if (!tile) return;
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, "char", tile.dataset.char, tile);
    });
    el("seal-album-grid").addEventListener("contextmenu", (e) => {
      const chip = e.target.closest(".seal-chip");
      if (!chip) return;
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, "char", chip.dataset.char, chip);
    });
    el("sentence-grid").addEventListener("contextmenu", (e) => {
      const card = e.target.closest(".sentence-card");
      if (!card) return;
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, "sentence", card.dataset.sentenceId, card);
    });
    el("radical-grid").addEventListener("contextmenu", (e) => {
      const card = e.target.closest(".radical-card");
      if (!card) return;
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, "radical", card.dataset.radical || card.getAttribute("data-radical"), card);
    });
    el("word-grid")?.addEventListener("contextmenu", (e) => {
      const card = e.target.closest(".word-card");
      if (!card) return;
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, "word", card.dataset.word, card);
    });
    el("context-menu").addEventListener("click", (e) => {
      const btn = e.target.closest(".context-menu-item");
      if (!btn || !contextMenuChar) return;
      const action = btn.dataset.action;
      const id = contextMenuChar;
      if (action === "details") {
        const type = contextMenuType;
        closeContextMenu();
        if (type === "sentence") openSentenceDetails(id);
        else if (type === "radical") openRadicalDetail(Number(id));
        else if (type === "word") { /* no detail drawer for words yet */ }
        else openDetail(id);
        return;
      }
      if (contextMenuType === "word") {
        const wasKnown = getWordStatus(id) === "known";
        setWordStatusManual(id, action);
        if (action === "known" && !wasKnown) {
          triggerStampFX(contextMenuTarget || el("app"));
          spawnConfetti(contextMenuTarget || el("app"));
        }
        closeContextMenu();
        renderWords();
        return;
      } else if (contextMenuType === "sentence") {
        const wasKnown = getSentenceStatus(id) === "known";
        setSentenceStatus(id, action);
        if (action === "known" && !wasKnown) {
          triggerStampFX(contextMenuTarget || el("app"));
          spawnConfetti(contextMenuTarget || el("app"));
        }
      } else {
        const statusChar = contextMenuType === "radical"
          ? (contextMenuTarget?.dataset.char || contextMenuTarget?.getAttribute("data-char") || id)
          : id;
        const wasKnown = getStatus(statusChar) === "known";
        setStatusManual(statusChar, action);
        if (action === "known" && !wasKnown) {
          const tileEl = document.querySelector('.tile[data-char="' + CSS.escape(statusChar) + '"]');
          triggerStampFX(tileEl || contextMenuTarget || el("app"));
          spawnConfetti(tileEl || contextMenuTarget || el("app"));
        }
      }
      closeContextMenu();
      syncUI();
      if (el("tab-progress").classList.contains("active")) renderProgress();
    });
    document.addEventListener("click", (e) => {
      if (!el("context-menu").classList.contains("hidden") && !e.target.closest("#context-menu")) closeContextMenu();
    });
    document.addEventListener("contextmenu", (e) => {
      if (!e.target.closest(".tile") && !e.target.closest(".seal-chip") && !e.target.closest(".sentence-card") && !e.target.closest(".radical-card") && !e.target.closest(".word-card")) closeContextMenu();
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeContextMenu(); });
    window.addEventListener("scroll", closeContextMenu, true);
    window.addEventListener("resize", closeContextMenu);
  }

  /* ---------- RADICALS ---------- */


  // Correct a few stroke-count / metadata entries while keeping the standard Kangxi order.
  const RADICALS = RADICAL_DETAILS.map((r, i) => ({
    number: i + 1, char: r[0], meaning: r[1], pinyin: r[2],
    strokes: Number(r[3]), base: r[4], variants: r[5],
    position: r[6], examples: r[7].split("、")
  }));

  function radicalCodePoint(char) {
    return "U+" + char.codePointAt(0).toString(16).toUpperCase().padStart(4, "0");
  }

  let radicalsShowPinyin = false;
  let radicalsShowEnglish = false;
  let radicalSort = "order";

  function radicalUsageScore(r) {
    const index = radicalCharacterIndex;
    if (!index) return 0;
    const chars = index[r.number] || [];
    const trackerMap = new Map(HANZI_DATA.map(item => [item.c, item]));
    let score = 0;
    for (const ch of chars) {
      const item = trackerMap.get(ch);
      if (!item) continue;
      const f = Number(item.f);
      if (Number.isFinite(f) && f > 0) score += 1 / f;
    }
    return score;
  }

  function renderRadicals() {
    const searchEl = el("radical-search");
    const query = searchEl ? (searchEl.value || "").trim().toLowerCase() : "";
    let filtered = RADICALS.filter(r =>
      !query ||
      String(r.number).includes(query) ||
      r.char.includes(query) ||
      r.meaning.toLowerCase().includes(query) ||
      r.pinyin.toLowerCase().includes(query)
    );

    if (radicalSort === "most" && radicalCharacterIndex) {
      filtered = filtered.slice().sort((a, b) => radicalUsageScore(b) - radicalUsageScore(a) || a.number - b.number);
    } else if (radicalSort === "least" && radicalCharacterIndex) {
      filtered = filtered.slice().sort((a, b) => radicalUsageScore(a) - radicalUsageScore(b) || a.number - b.number);
    }

    el("radical-count").textContent = filtered.length + " of 214 radicals";
    el("radical-grid").innerHTML = filtered.map(r => {
      const char = r.base && r.base !== "—" ? r.base : r.char;
      const status = getStatus(char);
      return `
      <article class="radical-card status-${status}" data-radical="${r.number}" data-char="${escHtml(char)}" tabindex="0" role="button" aria-label="Open details for radical ${r.number}: ${escHtml(r.meaning)}">
        <div class="radical-card-inner">
          <div class="radical-card-face front">
            <span class="radical-number">#${r.number}</span>
            <button type="button" class="tone-audio-btn-sm radical-card-audio" data-speak-char="${escHtml(char)}" title="Listen to ${escHtml(char)}" aria-label="Listen to ${escHtml(char)}">🔊</button>
            <span class="radical-char">${r.char}</span>
            <span class="radical-name" ${radicalsShowEnglish ? "" : "hidden"}>${escHtml(r.meaning)}</span>
            <span class="radical-pinyin" ${radicalsShowPinyin ? "" : "hidden"}>${escHtml(r.pinyin)}</span>
          </div>
          <div class="radical-card-face back">
            <span class="radical-name">${escHtml(r.meaning)}</span>
            <span class="radical-pinyin">${escHtml(r.pinyin)}</span>
          </div>
        </div>
      </article>
    `;
    }).join("");
  }


  /* ---------- RADICAL CHARACTER INDEX ---------- */
  /*
   * Unicode provides two useful sources:
   * 1) RSIndex.txt: complete radical-stroke collation data.
   * 2) Unihan_RadicalStrokeCounts.txt: kRSUnicode assignments for Han ideographs.
   *
   * We use both. The Unihan file is especially robust because it is a direct
   * property file and includes every kRSUnicode assignment, including multiple
   * radical assignments when Unicode has them.
   */



  let radicalCharacterIndex = null;
  let radicalIndexPromise = null;

  function parseUnihanRadicalStroke(raw) {
    const byRadical = Array.from({ length: 215 }, () => []);
    const seen = Array.from({ length: 215 }, () => new Set());

    for (const line of raw.split(/\r?\n/)) {
      if (!line || line[0] === "#") continue;
      const parts = line.split(/\t+/);
      if (parts.length < 3 || parts[1] !== "kRSUnicode") continue;

      const cp = parts[0].match(/^U\+([0-9A-Fa-f]{4,6})$/);
      if (!cp) continue;

      const char = String.fromCodePoint(parseInt(cp[1], 16));
      // kRSUnicode may contain multiple assignments, e.g. "1.2 1.3".
      for (const assignment of parts[2].split(/\s+/)) {
        const m = assignment.match(/^(\d{1,3})\./);
        if (!m) continue;
        const radical = Number(m[1]);
        if (radical < 1 || radical > 214) continue;
        if (!seen[radical].has(char)) {
          seen[radical].add(char);
          byRadical[radical].push(char);
        }
      }
    }
    return byRadical;
  }

  function parseRadicalStrokeIndex(raw) {
    const byRadical = Array.from({ length: 215 }, () => []);
    const seen = Array.from({ length: 215 }, () => new Set());

    for (const line of raw.split(/\r?\n/)) {
      if (!line || line[0] === "#") continue;
      const parts = line.split(/\t/);
      if (parts.length < 2) continue;

      const match = parts[0].match(/^(\d{1,3})\./);
      if (!match) continue;
      const radical = Number(match[1]);
      if (radical < 1 || radical > 214) continue;

      const cps = parts[1].match(/U\+[0-9A-Fa-f]{4,6}/g) || [];
      for (const cp of cps) {
        const value = parseInt(cp.slice(2), 16);
        if (Number.isNaN(value)) continue;
        const char = String.fromCodePoint(value);
        if (!seen[radical].has(char)) {
          seen[radical].add(char);
          byRadical[radical].push(char);
        }
      }
    }
    return byRadical;
  }

  function mergeRadicalIndexes(a, b) {
    const merged = Array.from({ length: 215 }, () => []);
    for (let r = 1; r <= 214; r++) {
      const seen = new Set();
      for (const c of [...(a[r] || []), ...(b[r] || [])]) {
        if (!seen.has(c)) { seen.add(c); merged[r].push(c); }
      }
    }
    return merged;
  }

  async function fetchText(url) {
    const res = await fetch(url, {
      cache: "force-cache",
      mode: "cors",
      headers: { "Accept": "text/plain" }
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.text();
  }

  async function loadRadicalCharacterIndex() {
    if (radicalCharacterIndex) return radicalCharacterIndex;
    if (radicalIndexPromise) return radicalIndexPromise;

    radicalIndexPromise = (async () => {
      const errors = [];
      let unihan = null;
      let rsindex = null;

      // Try the direct official files first.
      for (const url of RADICAL_DATA_URLS) {
        try {
          const raw = await fetchText(url);
          const parsed = parseUnihanRadicalStroke(raw);
          if (parsed.some(list => list.length)) {
            unihan = parsed;
            break;
          }
        } catch (e) { errors.push("Unihan: " + e); }
      }

      for (const url of RADICAL_RSINDEX_URLS) {
        try {
          const raw = await fetchText(url);
          const parsed = parseRadicalStrokeIndex(raw);
          if (parsed.some(list => list.length)) {
            rsindex = parsed;
            break;
          }
        } catch (e) { errors.push("RSIndex: " + e); }
      }

      if (unihan || rsindex) {
        radicalCharacterIndex = unihan && rsindex
          ? mergeRadicalIndexes(unihan, rsindex)
          : (unihan || rsindex);

        // Keep the complete parsed data in localStorage as JSON so the app
        // remains useful when reopened offline.
        try {
          localStorage.setItem(
            "hanzi-tracker-radical-index-v17-json",
            JSON.stringify(radicalCharacterIndex)
          );
        } catch (e) { console.warn("[HanziTracker]", e); }
        return radicalCharacterIndex;
      }

      // Offline fallback from a previous successful load.
      try {
        const cached = localStorage.getItem("hanzi-tracker-radical-index-v17-json");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length === 215) {
            radicalCharacterIndex = parsed;
            return parsed;
          }
        }
      } catch (e) { console.warn("[HanziTracker]", e); }

      throw new Error(errors.join("; ") || "Unable to load Unicode radical data.");
    })();

    try {
      return await radicalIndexPromise;
    } finally {
      radicalIndexPromise = null;
    }
  }

  async function renderRadicalCharacters(number) {
    const status = el("radical-data-status");
    const summary = el("detail-radical-character-summary");
    const list = el("detail-radical-character-list");
    const tracker = el("detail-radical-tracker-count");
    const mostUsedOnly = el("radical-most-used-only");
    const limitEl = el("radical-character-limit");

    if (!status || !summary || !list || !tracker) return;

    status.className = "radical-data-status loading";
    status.textContent = "Loading radical characters…";
    summary.textContent = "Finding characters for this radical…";
    list.innerHTML = "";
    tracker.textContent = "";

    try {
      const index = await loadRadicalCharacterIndex();
      const chars = index[number] || [];
      const trackerMap = new Map(HANZI_DATA.map(item => [item.c, item]));

      // "Most used" is based on the frequency rank already stored in the
      // Hanzi Tracker dataset (lower f = more frequent). Characters absent
      // from that dataset are placed after all ranked characters.
      const ranked = chars.slice().sort((a, b) => {
        const af = trackerMap.has(a) ? Number(trackerMap.get(a).f) : Infinity;
        const bf = trackerMap.has(b) ? Number(trackerMap.get(b).f) : Infinity;
        if (af !== bf) return af - bf;
        return a.codePointAt(0) - b.codePointAt(0);
      });

      const limit = Math.max(1, Number(limitEl && limitEl.value) || 50);
      const visible = mostUsedOnly && mostUsedOnly.checked
        ? ranked.slice(0, Math.min(limit, ranked.length))
        : chars;

      const rankedInTracker = ranked.filter(c => trackerMap.has(c));

      summary.textContent = mostUsedOnly && mostUsedOnly.checked
        ? "Showing the " + visible.length.toLocaleString() + " most-used characters for Radical " + number + "."
        : "Showing all " + chars.length.toLocaleString() + " characters assigned to Radical " + number + ".";

      list.innerHTML = visible.map((c, i) => {
        return '<button type="button" class="radical-character" data-char="' +
          escHtml(c) + '" title="' +
          escHtml((trackerMap.get(c)?.m || "") + (trackerMap.has(c) ? " · frequency rank " + trackerMap.get(c).f : "")) +
          '">' + escHtml(c) + '</button>';
      }).join("");

      tracker.textContent =
        rankedInTracker.length.toLocaleString() + " characters from this radical are in your Hanzi Tracker dataset. " +
        (mostUsedOnly && mostUsedOnly.checked
          ? "Sorted by the dataset's frequency rank."
          : "Unicode-indexed characters outside your dataset are also shown.");

      status.className = "radical-data-status";
      status.textContent = mostUsedOnly && mostUsedOnly.checked
        ? "Most-used mode is based on Hanzi Tracker frequency data."
        : "Showing the complete Unicode radical-stroke list.";
    } catch (e) {
      summary.textContent = "The character list could not be loaded.";
      status.className = "radical-data-status error";
      status.textContent = "Connect to the internet once and try again.";
    }
  }


  function openRadicalDetail(number) {
    const r = RADICALS[number - 1];
    const panel = el("radical-detail");
    const backdrop = el("radical-detail-backdrop");
    if (!r || !panel || !backdrop) return;

    el("detail-radical-char").textContent = r.char;
    el("detail-radical-name").textContent = r.meaning;
    el("detail-radical-pinyin").textContent = r.pinyin;
    el("detail-radical-number").textContent = "#" + r.number;
    el("detail-radical-strokes").textContent = r.strokes;
    const radicalCode = "U+" + (0x2F00 + r.number - 1).toString(16).toUpperCase().padStart(4, "0");
    const baseCode = radicalCodePoint(r.base);
    el("detail-radical-unicode").textContent = radicalCode;
    el("detail-radical-base").textContent = r.base;
    el("detail-radical-base-unicode").textContent = baseCode;

    const trackedChar = r.base && r.base !== "—" ? r.base : r.char;
    currentRadicalChar = trackedChar;
    const radicalStatus = getStatus(trackedChar);
    const statusLabel = radicalStatus === "known" ? "Mastered" : radicalStatus === "learning" ? "Learning" : "New";
    const statusNode = el("detail-radical-current-status");
    if (statusNode) statusNode.textContent = statusLabel;
    ["new", "learning", "known"].forEach(s => {
      const btn = el("detail-radical-status-btn-" + s);
      if (btn) btn.classList.toggle("active", s === radicalStatus);
    });

    const yb = el("radical-source-yellowbridge");
    const mdbg = el("radical-source-mdbg");
    const unicode = el("radical-source-unicode");
    if (yb) yb.href = "https://www.yellowbridge.com/chinese/charsearch.php?zi=" + encodeURIComponent(r.base);
    if (mdbg) mdbg.href = "https://www.mdbg.net/chinese/dictionary?cdqrad=" + r.number;
    if (unicode) unicode.href = "https://www.unicode.org/charts/nameslist/n_2F00.html#" + radicalCode;
    el("detail-radical-meaning").textContent =
      "Kangxi radical " + r.number + " is “" + r.meaning + ".” This is a dictionary classification label; it may provide a semantic clue in some characters, but not every character using the radical is semantically related.";
    el("detail-radical-variants").textContent =
      r.variants === "—" ? "No common variant/component form is listed." : r.variants;
    el("detail-radical-position").textContent =
      r.position.charAt(0).toUpperCase() + r.position.slice(1) + ".";

    el("detail-radical-note").textContent =
      "Unicode’s radical-stroke indexes use the 214 Kangxi radicals and count the remaining strokes after the radical. Unicode notes that some ideographs can be classified under more than one radical or have differing stroke counts, so a character can appear in more than one index position.";

    backdrop.classList.add("open");
    panel.classList.add("open");
    document.body.classList.add("radical-modal-open");
    renderRadicalCharacters(number);
  }

  function closeRadicalDetail() {
    const panel = el("radical-detail");
    const backdrop = el("radical-detail-backdrop");
    if (panel) panel.classList.remove("open");
    if (backdrop) backdrop.classList.remove("open");
    document.body.classList.remove("radical-modal-open");
    currentRadicalChar = null;
  }




  function wireRadicals() {
    const search = el("radical-search");
    const grid = el("radical-grid");
    const closeBtn = el("radical-detail-close");
    const backdrop = el("radical-detail-backdrop");

    if (search) search.addEventListener("input", renderRadicals);

    const sort = el("radical-sort");
    if (sort) sort.addEventListener("change", async () => {
      radicalSort = sort.value;
      if (radicalSort !== "order" && !radicalCharacterIndex) {
        try { await loadRadicalCharacterIndex(); } catch (e) { console.warn("[HanziTracker]", e); }
      }
      renderRadicals();
    });

    el("radical-show-pinyin").addEventListener("click", (e) => {
      radicalsShowPinyin = !radicalsShowPinyin;
      e.target.classList.toggle("active", radicalsShowPinyin);
      document.querySelectorAll(".front .radical-pinyin").forEach(n => n.hidden = !radicalsShowPinyin);
    });
    el("radical-show-english").addEventListener("click", (e) => {
      radicalsShowEnglish = !radicalsShowEnglish;
      e.target.classList.toggle("active", radicalsShowEnglish);
      document.querySelectorAll(".front .radical-name").forEach(n => n.hidden = !radicalsShowEnglish);
    });

    if (grid) grid.addEventListener("click", (e) => {
      const audio = e.target.closest("[data-speak-char]");
      if (audio) {
        e.stopPropagation();
        playChineseAudio(audio.dataset.speakChar, { rate: 0.88 });
        return;
      }
      const card = e.target.closest(".radical-card");
      if (card) card.classList.toggle("flipped");
    });
    if (grid) grid.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      const card = e.target.closest(".radical-card");
      if (!card || e.target.closest("[data-speak-char]")) return;
      e.preventDefault();
      card.classList.toggle("flipped");
    });

    el("detail-radical-audio")?.addEventListener("click", () => {
      const radical = RADICALS[Number(el("detail-radical-number").textContent.replace("#", "")) - 1];
      if (radical) playChineseAudio(radical.base && radical.base !== "—" ? radical.base : radical.char, { rate: 0.88 });
    });

    ["new", "learning", "known"].forEach(s => {
      const btn = el("detail-radical-status-btn-" + s);
      if (!btn) return;
      btn.addEventListener("click", function () {
        if (!currentRadicalChar) return;
        const wasKnown = getStatus(currentRadicalChar) === "known";
        setStatusManual(currentRadicalChar, s);
        if (s === "known" && !wasKnown) {
          triggerStampFX(el("detail-radical-char"));
          spawnConfetti(el("radical-detail"));
        }
        const n = Number(el("detail-radical-number").textContent.replace("#", ""));
        if (n) openRadicalDetail(n);
        syncUI();
      });
    });

    const mostUsedOnly = el("radical-most-used-only");
    const limitEl = el("radical-character-limit");
    if (mostUsedOnly) mostUsedOnly.addEventListener("change", () => {
      const n = Number(el("detail-radical-number").textContent.replace("#", ""));
      if (n) renderRadicalCharacters(n);
    });
    if (limitEl) limitEl.addEventListener("change", () => {
      const n = Number(el("detail-radical-number").textContent.replace("#", ""));
      if (n) renderRadicalCharacters(n);
    });

    const characterList = el("detail-radical-character-list");
    if (characterList) {
      characterList.addEventListener("click", function (e) {
        const btn = e.target.closest(".radical-character");
        if (!btn) return;
        const ch = btn.getAttribute("data-char");
        if (HANZI_BY_CHAR[ch]) {
          closeRadicalDetail();
          openDetail(ch);
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      closeRadicalDetail();
    });

    if (backdrop) backdrop.addEventListener("click", closeRadicalDetail);

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeRadicalDetail();
    });

    renderRadicals();
  }

  /* ==========================================================================
   *  TONE & PRONUNCIATION LAB MODULE (声调)
   * ========================================================================== */

  const TONE_DATA = [
    {
      num: 1,
      name: "1st Tone (阴平)",
      pinyin: "mā",
      pitch: "55 · High Level",
      desc: "High, flat, steady pitch held at the top of your natural speaking range (like singing 'ahhh' to a doctor).",
      points: "M 10 14 L 190 14",
      color: "#e11d48",
      samples: [{ zh: "妈", py: "mā", en: "Mother" }, { zh: "天", py: "tiān", en: "Sky/Day" }, { zh: "高", py: "gāo", en: "High" }, { zh: "飞", py: "fēi", en: "Fly" }]
    },
    {
      num: 2,
      name: "2nd Tone (阳平)",
      pinyin: "má",
      pitch: "35 · Rising",
      desc: "Rises from mid pitch to high pitch, identical to an English question inflection ('What?!' or 'Huh?').",
      points: "M 10 38 L 190 12",
      color: "#f59e0b",
      samples: [{ zh: "麻", py: "má", en: "Hemp/Numb" }, { zh: "人", py: "rén", en: "Person" }, { zh: "学", py: "xué", en: "Learn" }, { zh: "国", py: "guó", en: "Country" }]
    },
    {
      num: 3,
      name: "3rd Tone (上声)",
      pinyin: "mǎ",
      pitch: "214 · Dipping / Low",
      desc: "Dips down into the lower vocal register before rising. In natural speech, it is often a low flat tone.",
      points: "M 10 26 Q 100 44 190 16",
      color: "#10b981",
      samples: [{ zh: "马", py: "mǎ", en: "Horse" }, { zh: "好", py: "hǎo", en: "Good" }, { zh: "水", py: "shuǐ", en: "Water" }, { zh: "小", py: "xiǎo", en: "Small" }]
    },
    {
      num: 4,
      name: "4th Tone (去声)",
      pinyin: "mà",
      pitch: "51 · Falling / Sharp",
      desc: "Drops steeply and sharply from top to bottom, like a definitive command in English ('No!' or 'Stop!').",
      points: "M 10 12 L 190 42",
      color: "#6366f1",
      samples: [{ zh: "骂", py: "mà", en: "Scold" }, { zh: "大", py: "dà", en: "Big" }, { zh: "去", py: "qù", en: "Go" }, { zh: "看", py: "kàn", en: "Look" }]
    },
    {
      num: 5,
      name: "Neutral Tone (轻声)",
      pinyin: "ma",
      pitch: "· · Light & Short",
      desc: "Soft, brief, unstressed tone whose pitch depends on the preceding syllable (e.g. question particle 吗).",
      points: "M 95 24 A 4 4 0 1 1 105 24",
      color: "#8b5cf6",
      samples: [{ zh: "吗", py: "ma", en: "Question?" }, { zh: "的", py: "de", en: "Possessive" }, { zh: "子", py: "zi", en: "Noun suffix" }, { zh: "了", py: "le", en: "Aspect" }]
    }
  ];

  const TONE_PAIRS_DATA = [
    {
      base: "1", pair: "1-1", title: "1st + 1st", pitch: "55-55 ── ──", desc: "Steady high plateau", items: [
        { zh: "今天", py: "jīntiān", en: "Today" },
        { zh: "飞机", py: "fēijī", en: "Airplane" },
        { zh: "医生", py: "yīshēng", en: "Doctor" }
      ]
    },
    {
      base: "1", pair: "1-2", title: "1st + 2nd", pitch: "55-35 ── ↗", desc: "High plateau then rises", items: [
        { zh: "中国", py: "zhōngguó", en: "China" },
        { zh: "新年", py: "xīnnián", en: "New Year" },
        { zh: "帮忙", py: "bāngmáng", en: "Help" }
      ]
    },
    {
      base: "1", pair: "1-3", title: "1st + 3rd", pitch: "55-214 ── ↘↗", desc: "High plateau drops to low", items: [
        { zh: "机场", py: "jīchǎng", en: "Airport" },
        { zh: "经理", py: "jīnglǐ", en: "Manager" },
        { zh: "身体", py: "shēntǐ", en: "Body/Health" }
      ]
    },
    {
      base: "1", pair: "1-4", title: "1st + 4th", pitch: "55-51 ── ↘", desc: "High plateau then drops sharply", items: [
        { zh: "帮助", py: "bāngzhù", en: "Help" },
        { zh: "音乐", py: "yīnyuè", en: "Music" },
        { zh: "方便", py: "fāngbiàn", en: "Convenient" }
      ]
    },
    {
      base: "1", pair: "1-0", title: "1st + Neutral", pitch: "55-· ── ·", desc: "High plateau then soft drop", items: [
        { zh: "妈妈", py: "māma", en: "Mother" },
        { zh: "东西", py: "dōngxi", en: "Things" },
        { zh: "清楚", py: "qīngchu", en: "Clear" }
      ]
    },
    {
      base: "2", pair: "2-1", title: "2nd + 1st", pitch: "35-55 ↗ ──", desc: "Rises up to high plateau", items: [
        { zh: "国家", py: "guójiā", en: "Country" },
        { zh: "时间", py: "shíjiān", en: "Time" },
        { zh: "银行", py: "yínháng", en: "Bank" }
      ]
    },
    {
      base: "2", pair: "2-2", title: "2nd + 2nd", pitch: "35-35 ↗ ↗", desc: "Double rising wave", items: [
        { zh: "学习", py: "xuéxí", en: "Study" },
        { zh: "常常", py: "chángcháng", en: "Often" },
        { zh: "留学", py: "liúxué", en: "Study abroad" }
      ]
    },
    {
      base: "2", pair: "2-3", title: "2nd + 3rd", pitch: "35-214 ↗ ↘↗", desc: "Rises then dips down", items: [
        { zh: "苹果", py: "píngguǒ", en: "Apple" },
        { zh: "游泳", py: "yóuyǒng", en: "Swim" },
        { zh: "传统", py: "chuántǒng", en: "Tradition" }
      ]
    },
    {
      base: "2", pair: "2-4", title: "2nd + 4th", pitch: "35-51 ↗ ↘", desc: "Rises then plunges down", items: [
        { zh: "决定", py: "juédìng", en: "Decide" },
        { zh: "习惯", py: "xíguàn", en: "Habit" },
        { zh: "难过", py: "nánguò", en: "Sad" }
      ]
    },
    {
      base: "2", pair: "2-0", title: "2nd + Neutral", pitch: "35-· ↗ ·", desc: "Rises then soft landing", items: [
        { zh: "学生", py: "xuésheng", en: "Student" },
        { zh: "朋友", py: "péngyou", en: "Friend" },
        { zh: "便宜", py: "piányi", en: "Cheap" }
      ]
    },
    {
      base: "3", pair: "3-1", title: "3rd + 1st", pitch: "21-55 ↘ ──", desc: "Low dip jumps to high", items: [
        { zh: "北京", py: "běijīng", en: "Beijing" },
        { zh: "手机", py: "shǒujī", en: "Mobile phone" },
        { zh: "老师", py: "lǎoshī", en: "Teacher" }
      ]
    },
    {
      base: "3", pair: "3-2", title: "3rd + 2nd", pitch: "21-35 ↘ ↗", desc: "Low dip rises upward", items: [
        { zh: "语言", py: "yǔyán", en: "Language" },
        { zh: "旅行", py: "lǚxíng", en: "Travel" },
        { zh: "每年", py: "měinián", en: "Every year" }
      ]
    },
    {
      base: "3", pair: "3-3", title: "3rd + 3rd (Sandhi)", pitch: "35-214 ↗ ↘↗", desc: "Changes to 2nd + 3rd!", items: [
        { zh: "你好", py: "nǐhǎo (ní hǎo)", en: "Hello" },
        { zh: "可以", py: "kěyǐ (ké yǐ)", en: "Can / May" },
        { zh: "了解", py: "liǎojiě (liáo jiě)", en: "Understand" }
      ]
    },
    {
      base: "3", pair: "3-4", title: "3rd + 4th", pitch: "21-51 ↘ ↘", desc: "Low dip followed by sharp drop", items: [
        { zh: "比赛", py: "bǐsài", en: "Match/Game" },
        { zh: "努力", py: "nǔlì", en: "Hard-working" },
        { zh: "准备", py: "zhǔnbèi", en: "Prepare" }
      ]
    },
    {
      base: "3", pair: "3-0", title: "3rd + Neutral", pitch: "21-· ↘ ·", desc: "Low dip then light high neutral", items: [
        { zh: "喜欢", py: "xǐhuan", en: "Like" },
        { zh: "姐姐", py: "jiějie", en: "Older sister" },
        { zh: "怎么", py: "zěnme", en: "How" }
      ]
    },
    {
      base: "4", pair: "4-1", title: "4th + 1st", pitch: "51-55 ↘ ──", desc: "Sharp drop leaps to high", items: [
        { zh: "面包", py: "miànbāo", en: "Bread" },
        { zh: "认真", py: "rènzhēn", en: "Earnest" },
        { zh: "汽车", py: "qìchē", en: "Automobile" }
      ]
    },
    {
      base: "4", pair: "4-2", title: "4th + 2nd", pitch: "51-35 ↘ ↗", desc: "Sharp drop then rises", items: [
        { zh: "练习", py: "liànxí", en: "Practice" },
        { zh: "热情", py: "rèqíng", en: "Enthusiastic" },
        { zh: "特别", py: "tèbié", en: "Special" }
      ]
    },
    {
      base: "4", pair: "4-3", title: "4th + 3rd", pitch: "51-214 ↘ ↘↗", desc: "Sharp drop into dipping", items: [
        { zh: "电影", py: "diànyǐng", en: "Movie" },
        { zh: "电脑", py: "diànnǎo", en: "Computer" },
        { zh: "办法", py: "bànfǎ", en: "Method" }
      ]
    },
    {
      base: "4", pair: "4-4", title: "4th + 4th", pitch: "51-51 ↘ ↘", desc: "Double sharp falls", items: [
        { zh: "汉字", py: "hànzì", en: "Chinese character" },
        { zh: "再见", py: "zàijiàn", en: "Goodbye" },
        { zh: "变化", py: "biànhuà", en: "Change" }
      ]
    },
    {
      base: "4", pair: "4-0", title: "4th + Neutral", pitch: "51-· ↘ ·", desc: "Sharp drop then low neutral", items: [
        { zh: "谢谢", py: "xièxie", en: "Thank you" },
        { zh: "爸爸", py: "bàba", en: "Father" },
        { zh: "漂亮", py: "piàoliang", en: "Pretty" }
      ]
    }
  ];

  const MINIMAL_PAIRS_DATA = [
    { a: { zh: "买", py: "mǎi", en: "Buy (3rd Tone)" }, b: { zh: "卖", py: "mài", en: "Sell (4th Tone)" } },
    { a: { zh: "知道", py: "zhīdào", en: "Know (1-4)" }, b: { zh: "迟到", py: "chídào", en: "Late (2-4)" } },
    { a: { zh: "练习", py: "liànxí", en: "Practice (4-2)" }, b: { zh: "联系", py: "liánxì", en: "Contact (2-4)" } },
    { a: { zh: "眼睛", py: "yǎnjing", en: "Eyes (3-0)" }, b: { zh: "眼镜", py: "yǎnjìng", en: "Glasses (3-4)" } },
    { a: { zh: "汤", py: "tāng", en: "Soup (1st Tone)" }, b: { zh: "糖", py: "táng", en: "Sugar/Candy (2nd Tone)" } },
    { a: { zh: "狮子", py: "shīzi", en: "Lion (1-0)" }, b: { zh: "柿子", py: "shìzi", en: "Persimmon (4-0)" } },
    { a: { zh: "问", py: "wèn", en: "Ask (4th Tone)" }, b: { zh: "吻", py: "wěn", en: "Kiss (3rd Tone)" } },
    { a: { zh: "十", py: "shí", en: "Ten (2nd Tone)" }, b: { zh: "四", py: "sì", en: "Four (4th Tone)" } },
    { a: { zh: "睡觉", py: "shuìjiào", en: "Sleep (4-4)" }, b: { zh: "水饺", py: "shuǐjiǎo", en: "Dumpling (3-3)" } },
    { a: { zh: "老师", py: "lǎoshī", en: "Teacher (3-1)" }, b: { zh: "老实", py: "lǎoshi", en: "Honest (3-0)" } }
  ];

  const TRICKY_SOUNDS_DATA = [
    {
      title: "zh / ch / sh vs z / c / s",
      desc: "Retroflex (curled tongue tip toward roof of mouth) vs Dental (flat tongue tip against back of upper teeth).",
      samples: [
        { zh: "知道 / 自己", py: "zhīdào (curled) vs zìjǐ (flat)" },
        { zh: "吃饭 / 菜单", py: "chīfàn (curled) vs càidān (flat)" },
        { zh: "老师 / 三个", py: "lǎoshī (curled) vs sāngè (flat)" }
      ]
    },
    {
      title: "j / q / x vs zh / ch / sh",
      desc: "Palatal sounds (j, q, x) are pronounced with flat tongue body touching the hard palate and lips spread wide. Only pair with 'i' and 'ü'.",
      samples: [
        { zh: "今天 / 知道", py: "jīntiān (palatal) vs zhīdào (retroflex)" },
        { zh: "请问 / 吃饭", py: "qǐngwèn (palatal) vs chīfàn (retroflex)" },
        { zh: "谢谢 / 学习", py: "xièxie (palatal) vs xuéxí (palatal)" }
      ]
    },
    {
      title: "ü vs u (Front Rounded vs Back Vowel)",
      desc: "To pronounce ü, shape your tongue for 'ee' (as in 'see') while rounding your lips tightly like whistling. Don't move your tongue!",
      samples: [
        { zh: "绿 / 路", py: "lǜ (green) vs lù (road)" },
        { zh: "女 / 努", py: "nǚ (female) vs nǔ (strive)" },
        { zh: "去 / 出", py: "qù (go) vs chū (exit)" }
      ]
    }
  ];

  let toneQuizScore = 0;
  let toneQuizStreak = 0;
  let toneQuizBest = 0;
  let currentQuizItem = null;
  let currentQuizMode = "single";
  let toneQuizAnswered = false;
  let tonePairFilterBase = "all";

  function speakToneText(text, onEnd) {
    playChineseAudio(text, { rate: 0.84, onEnd });
  }

  function renderToneCards() {
    const container = el("tone-cards-grid");
    if (!container) return;
    container.innerHTML = TONE_DATA.map(t => {
      const sampleChips = t.samples.map(s => `
        <button type="button" class="tone-example-chip" data-speak-text="${s.zh}" title="${s.py} · ${s.en}">
          <strong>${s.zh}</strong> ${s.py}
        </button>
      `).join("");

      return `
        <article class="tone-card">
          <div class="tone-card-top">
            <span class="tone-num-badge">${t.name}</span>
            <button type="button" class="tone-audio-btn-sm" data-speak-text="${t.samples[0].zh}" aria-label="Listen to ${t.name}">🔊</button>
          </div>
          <div class="tone-pinyin-hero">${t.pinyin}</div>
          <div class="tone-pitch-code">${t.pitch}</div>
          <svg class="tone-pitch-svg" viewBox="0 0 200 50">
            <line x1="10" y1="12" x2="190" y2="12" stroke="rgba(0,0,0,0.08)" stroke-width="1" stroke-dasharray="3,3" />
            <line x1="10" y1="20" x2="190" y2="20" stroke="rgba(0,0,0,0.08)" stroke-width="1" stroke-dasharray="3,3" />
            <line x1="10" y1="28" x2="190" y2="28" stroke="rgba(0,0,0,0.08)" stroke-width="1" stroke-dasharray="3,3" />
            <line x1="10" y1="36" x2="190" y2="36" stroke="rgba(0,0,0,0.08)" stroke-width="1" stroke-dasharray="3,3" />
            <line x1="10" y1="44" x2="190" y2="44" stroke="rgba(0,0,0,0.08)" stroke-width="1" stroke-dasharray="3,3" />
            <path d="${t.points}" fill="none" stroke="${t.color}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <p class="tone-card-desc">${t.desc}</p>
          <div class="tone-example-row">
            ${sampleChips}
          </div>
        </article>
      `;
    }).join("");
  }

  function renderTonePairs(baseTone = "all") {
    const container = el("tone-pairs-grid");
    if (!container) return;
    const filtered = baseTone === "all"
      ? TONE_PAIRS_DATA
      : TONE_PAIRS_DATA.filter(p => p.base === String(baseTone));

    container.innerHTML = filtered.map(p => {
      const itemsHtml = p.items.map(item => `
        <div class="tone-pair-item">
          <div>
            <span class="tone-pair-zh">${item.zh}</span>
            <span class="tone-pair-py">${item.py}</span>
          </div>
          <span class="tone-pair-en">${item.en}</span>
          <button type="button" class="tone-audio-btn-sm" data-speak-text="${item.zh}" aria-label="Listen to ${item.zh}">🔊</button>
        </div>
      `).join("");

      return `
        <div class="tone-pair-card">
          <div class="tone-pair-top">
            <span class="tone-pair-title">${p.title}</span>
            <span class="tone-pair-pitch-badge">${p.pitch}</span>
          </div>
          <p style="font-size:0.85rem; color:var(--ink-soft); margin:0 0 10px;">${p.desc}</p>
          <div class="tone-pair-examples">
            ${itemsHtml}
          </div>
        </div>
      `;
    }).join("");
  }

  function renderTrickySounds() {
    const container = el("tricky-sounds-grid");
    if (!container) return;
    container.innerHTML = TRICKY_SOUNDS_DATA.map(s => {
      const samplesHtml = s.samples.map(sample => `
        <div class="tricky-sample-item">
          <span class="tricky-sample-zh">${sample.zh}</span>
          <span class="tricky-sample-py">${sample.py}</span>
          <button type="button" class="tone-audio-btn-sm" data-speak-text="${sample.zh.split('/')[0].trim()}" aria-label="Listen to ${sample.zh}">🔊</button>
        </div>
      `).join("");

      return `
        <article class="tricky-sound-card">
          <div class="tricky-sound-header">
            <span class="tricky-sound-title">${s.title}</span>
          </div>
          <p class="tricky-sound-desc">${s.desc}</p>
          <div class="tricky-sound-samples">
            ${samplesHtml}
          </div>
        </article>
      `;
    }).join("");
  }

  function generateQuizQuestion(mode) {
    toneQuizAnswered = false;
    el("tone-quiz-feedback")?.classList.add("hidden");
    const optContainer = el("tone-quiz-options");
    if (!optContainer) return;

    if (mode === "single") {
      const toneIndex = Math.floor(Math.random() * 4);
      const toneObj = TONE_DATA[toneIndex];
      const sample = toneObj.samples[Math.floor(Math.random() * toneObj.samples.length)];
      currentQuizItem = {
        mode: "single",
        correctIndex: toneIndex,
        spokenText: sample.zh,
        pinyin: sample.py,
        meaning: sample.en,
        toneName: toneObj.name,
        options: [
          { label: "1st Tone", sub: "High Flat (55) · ¯", value: 0 },
          { label: "2nd Tone", sub: "Rising (35) · ˊ", value: 1 },
          { label: "3rd Tone", sub: "Dipping (214) · ˇ", value: 2 },
          { label: "4th Tone", sub: "Falling (51) · ˋ", value: 3 }
        ]
      };
      if (el("tone-quiz-hint")) el("tone-quiz-hint").textContent = "Which tone did you hear?";
    } else if (mode === "pairs") {
      const pairIndex = Math.floor(Math.random() * TONE_PAIRS_DATA.length);
      const pairObj = TONE_PAIRS_DATA[pairIndex];
      const sample = pairObj.items[Math.floor(Math.random() * pairObj.items.length)];

      const otherPairs = TONE_PAIRS_DATA.filter((_, idx) => idx !== pairIndex);
      const distractors = shuffle(otherPairs).slice(0, 3);
      const allChoices = shuffle([pairObj, ...distractors]);
      const correctIdx = allChoices.indexOf(pairObj);

      currentQuizItem = {
        mode: "pairs",
        correctIndex: correctIdx,
        spokenText: sample.zh,
        pinyin: sample.py,
        meaning: sample.en,
        toneName: pairObj.title + " (" + pairObj.pitch + ")",
        options: allChoices.map((c, i) => ({
          label: c.title,
          sub: c.pitch,
          value: i
        }))
      };
      if (el("tone-quiz-hint")) el("tone-quiz-hint").textContent = "Which tone pair did you hear?";
    } else {
      const pair = MINIMAL_PAIRS_DATA[Math.floor(Math.random() * MINIMAL_PAIRS_DATA.length)];
      const isA = Math.random() < 0.5;
      const target = isA ? pair.a : pair.b;
      const distractor = isA ? pair.b : pair.a;

      const opts = shuffle([
        { label: target.zh, sub: target.py + " · " + target.en, isCorrect: true },
        { label: distractor.zh, sub: distractor.py + " · " + distractor.en, isCorrect: false }
      ]);

      currentQuizItem = {
        mode: "minimal",
        correctIndex: opts.findIndex(o => o.isCorrect),
        spokenText: target.zh,
        pinyin: target.py,
        meaning: target.en,
        toneName: target.zh + " (" + target.py + ")",
        options: opts
      };
      if (el("tone-quiz-hint")) el("tone-quiz-hint").textContent = "Listen and distinguish the meaning:";
    }

    optContainer.innerHTML = currentQuizItem.options.map((opt, idx) => `
      <button type="button" class="tone-quiz-opt-btn" data-quiz-opt="${idx}">
        <span>${opt.label}</span>
        <span class="opt-sub">${opt.sub}</span>
      </button>
    `).join("");

    setTimeout(() => {
      speakToneText(currentQuizItem.spokenText);
    }, 150);
  }

  function checkToneQuizAnswer(chosenIdx) {
    if (toneQuizAnswered || !currentQuizItem) return;
    toneQuizAnswered = true;
    const isCorrect = chosenIdx === currentQuizItem.correctIndex;

    const optButtons = document.querySelectorAll(".tone-quiz-opt-btn");
    optButtons.forEach((btn, idx) => {
      if (idx === currentQuizItem.correctIndex) {
        btn.classList.add("correct");
      } else if (idx === chosenIdx && !isCorrect) {
        btn.classList.add("wrong");
      }
    });

    const feedback = el("tone-quiz-feedback");
    const fIcon = el("tone-feedback-icon");
    const fTitle = el("tone-feedback-title");
    const fSub = el("tone-feedback-sub");

    if (isCorrect) {
      toneQuizScore += 10;
      toneQuizStreak++;
      toneQuizBest = Math.max(toneQuizBest, toneQuizStreak);
      awardXP(10, "Tone Listening Quiz");

      if (feedback) {
        feedback.className = "tone-quiz-feedback is-correct";
        if (fIcon) fIcon.textContent = "✓";
        if (fTitle) fTitle.textContent = "Correct! +10 XP";
        if (fSub) fSub.textContent = `${currentQuizItem.spokenText} · ${currentQuizItem.pinyin} · ${currentQuizItem.toneName} (${currentQuizItem.meaning})`;
        feedback.classList.remove("hidden");
      }
      if (toneQuizStreak > 0 && toneQuizStreak % 5 === 0) {
        showToast(`🔥 ${toneQuizStreak} in a row on Tone Quiz!`);
      }
    } else {
      toneQuizStreak = 0;
      if (feedback) {
        feedback.className = "tone-quiz-feedback is-wrong";
        if (fIcon) fIcon.textContent = "✗";
        if (fTitle) fTitle.textContent = "Not quite!";
        if (fSub) fSub.textContent = `Correct answer: ${currentQuizItem.spokenText} · ${currentQuizItem.pinyin} · ${currentQuizItem.toneName} (${currentQuizItem.meaning})`;
        feedback.classList.remove("hidden");
      }
    }

    if (el("tone-quiz-score")) el("tone-quiz-score").textContent = toneQuizScore;
    if (el("tone-quiz-streak")) el("tone-quiz-streak").textContent = toneQuizStreak;
    if (el("tone-quiz-best")) el("tone-quiz-best").textContent = toneQuizBest;
  }

  function wireToneLab() {
    const chipContainer = el("tone-pair-filter-chips");
    if (chipContainer) {
      chipContainer.addEventListener("click", e => {
        const chip = e.target.closest(".chip");
        if (!chip) return;
        chipContainer.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        tonePairFilterBase = chip.dataset.toneBase || "all";
        renderTonePairs(tonePairFilterBase);
      });
    }

    el("tab-tones")?.addEventListener("click", e => {
      const speakBtn = e.target.closest("[data-speak-text]");
      if (speakBtn) {
        speakToneText(speakBtn.dataset.speakText);
        return;
      }
      const optBtn = e.target.closest("[data-quiz-opt]");
      if (optBtn) {
        checkToneQuizAnswer(Number(optBtn.dataset.quizOpt));
        return;
      }
    });

    el("tone-quiz-play-btn")?.addEventListener("click", () => {
      if (currentQuizItem) {
        const playBtn = el("tone-quiz-play-btn");
        playBtn?.classList.add("playing");
        speakToneText(currentQuizItem.spokenText, () => {
          playBtn?.classList.remove("playing");
        });
        setTimeout(() => playBtn?.classList.remove("playing"), 1200);
      }
    });

    el("tone-quiz-next-btn")?.addEventListener("click", () => {
      generateQuizQuestion(currentQuizMode);
    });

    document.querySelectorAll(".tone-quiz-mode-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tone-quiz-mode-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        currentQuizMode = btn.dataset.quizMode || "single";
        generateQuizQuestion(currentQuizMode);
      });
    });

    el("btn-start-tone-quiz")?.addEventListener("click", () => {
      el("section-tone-quiz")?.scrollIntoView({ behavior: "smooth" });
    });

    el("btn-scroll-tone-pairs")?.addEventListener("click", () => {
      el("section-tone-pairs")?.scrollIntoView({ behavior: "smooth" });
    });
  }

  function renderTonesTab() {
    renderToneCards();
    renderTonePairs(tonePairFilterBase);
    renderTrickySounds();
    if (!currentQuizItem) {
      generateQuizQuestion(currentQuizMode);
    }
  }

  function enhanceThemeDropdowns() {
    const selects = [...document.querySelectorAll('.filter-select,.sentence-filter')];
    if (!selects.length) return;
    selects.forEach(select => {
      if (select.dataset.goldEnhanced === '1') return;
      select.dataset.goldEnhanced = '1';
      const wrap = document.createElement('div');
      wrap.className = 'gold-select-wrap';
      select.parentNode.insertBefore(wrap, select);
      wrap.appendChild(select);
      select.classList.add('gold-select-native');

      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.className = 'gold-select-trigger';
      trigger.setAttribute('aria-haspopup', 'listbox');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-label', select.getAttribute('aria-label') || select.id);
      trigger.innerHTML = '<span class="gold-select-value"></span><span class="gold-select-chevron" aria-hidden="true"></span>';
      wrap.appendChild(trigger);

      const menu = document.createElement('div');
      menu.className = 'gold-select-menu';
      menu.setAttribute('role', 'listbox');
      wrap.appendChild(menu);

      const valueEl = trigger.querySelector('.gold-select-value');
      const close = () => {
        menu.classList.remove('open');
        trigger.classList.remove('open');
        trigger.setAttribute('aria-expanded', 'false');
      };
      const sync = () => {
        const current = select.options[select.selectedIndex];
        valueEl.textContent = current ? current.textContent : '';
        menu.querySelectorAll('.gold-select-option').forEach(btn => {
          const active = btn.dataset.value === select.value;
          btn.classList.toggle('selected', active);
          btn.setAttribute('aria-selected', active ? 'true' : 'false');
        });
      };
      select.addEventListener('change', sync);

      [...select.options].forEach(option => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'gold-select-option';
        btn.dataset.value = option.value;
        btn.setAttribute('role', 'option');
        btn.textContent = option.textContent;
        btn.addEventListener('click', () => {
          if (select.value !== option.value) {
            select.value = option.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
          } else sync();
          close();
          trigger.focus();
        });
        menu.appendChild(btn);
      });

      trigger.addEventListener('click', e => {
        e.stopPropagation();
        const open = !menu.classList.contains('open');
        document.querySelectorAll('.gold-select-menu.open').forEach(m => {
          m.classList.remove('open');
          m.previousElementSibling?.classList.remove('open');
          m.previousElementSibling?.setAttribute('aria-expanded', 'false');
        });
        menu.classList.toggle('open', open);
        trigger.classList.toggle('open', open);
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
        sync();
      });
      trigger.addEventListener('keydown', e => {
        if (e.key === 'Escape') { close(); return; }
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); trigger.click(); return; }
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          if (!menu.classList.contains('open')) trigger.click();
          const opts = [...menu.querySelectorAll('.gold-select-option')];
          let idx = opts.findIndex(x => x.dataset.value === select.value);
          idx = e.key === 'ArrowDown' ? Math.min(opts.length - 1, idx + 1) : Math.max(0, idx - 1);
          opts[idx]?.focus();
        }
      });
      menu.addEventListener('keydown', e => {
        const opts = [...menu.querySelectorAll('.gold-select-option')];
        const idx = opts.indexOf(document.activeElement);
        if (e.key === 'Escape') { e.preventDefault(); close(); trigger.focus(); }
        else if (e.key === 'ArrowDown') { e.preventDefault(); opts[Math.min(opts.length - 1, idx + 1)]?.focus(); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); opts[Math.max(0, idx - 1)]?.focus(); }
      });
      sync();
    });
    document.addEventListener('click', () => document.querySelectorAll('.gold-select-menu.open').forEach(m => {
      m.classList.remove('open');
      const t = m.previousElementSibling;
      t?.classList.remove('open');
      t?.setAttribute('aria-expanded', 'false');
    }));
  }


  /* =========================================================
   *  XP ENGINE, ACHIEVEMENTS & GAMIFICATION
   * ========================================================= */

  const XP_CONFIG = {
    reviewCard: 10,
    reviewGood: 5,
    reviewEasy: 10,
    markLearning: 5,
    markKnown: 20,
    completeSession: 50,
    dailyLogin: 25,
    streakBonus: 10,
  };





  const XP_STORAGE_KEY = "hanzi-tracker-xp";

  function getXPState() {
    try {
      const raw = localStorage.getItem(XP_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) { console.warn("[HanziTracker]", e); }
    return {
      totalXP: 0,
      level: 1,
      todayXP: 0,
      lastActiveDate: "",
      streakDays: 0,
      longestStreak: 0,
      achievements: [],
      achievementsSeen: [],
      uniqueDays: [],
      easyStreak: 0,
      wordsViewed: 0,
      radicalsViewed: new Array(215).fill(false),
    };
  }

  function saveXPState(state) {
    try { localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(state)); } catch (e) { console.warn("[HanziTracker]", e); }
  }

  function getLevelForXP(xp) {
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (xp >= LEVELS[i].xp) return LEVELS[i];
    }
    return LEVELS[0];
  }

  function getNextLevel(currentLevel) {
    const idx = LEVELS.findIndex(l => l.level === currentLevel);
    return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
  }

  function awardXP(amount, reason) {
    const state = getXPState();
    const today = new Date().toISOString().slice(0, 10);
    const oldLevel = getLevelForXP(state.totalXP);

    // Daily login bonus
    if (state.lastActiveDate !== today) {
      const yesterday = new Date(Date.now() - MS_PER_DAY).toISOString().slice(0, 10);
      if (state.lastActiveDate === yesterday) {
        state.streakDays++;
      } else if (state.lastActiveDate) {
        state.streakDays = 1;
      } else {
        state.streakDays = 1;
      }
      state.longestStreak = Math.max(state.longestStreak, state.streakDays);
      state.todayXP = 0;
      state.lastActiveDate = today;

      // Track unique days
      if (!state.uniqueDays) state.uniqueDays = [];
      if (!state.uniqueDays.includes(today)) {
        state.uniqueDays.push(today);
        if (state.uniqueDays.length > 365) state.uniqueDays = state.uniqueDays.slice(-365);
      }

      // Daily login bonus XP
      amount += XP_CONFIG.dailyLogin + (state.streakDays * XP_CONFIG.streakBonus);
    }

    state.totalXP += amount;
    state.todayXP += amount;
    state.level = getLevelForXP(state.totalXP).level;

    saveXPState(state);
    updateXPDisplay(state);

    // Level up?
    const newLevel = getLevelForXP(state.totalXP);
    if (newLevel.level > oldLevel.level) {
      showLevelUp(newLevel);
    }

    // Check achievements
    checkAchievements(state);
  }

  function updateXPDisplay(stateOpt) {
    const state = stateOpt || getXPState();
    const level = getLevelForXP(state.totalXP);
    const next = getNextLevel(level.level);

    const levelEl = el("level-number");
    const titleEl = el("level-badge-title");
    const xpEl = el("xp-display");
    const barEl = el("xp-bar-fill");
    const streakEl = el("streak-display");
    const streakCount = el("streak-count");

    if (levelEl) levelEl.textContent = level.level;
    if (titleEl) titleEl.textContent = level.title;
    if (xpEl) xpEl.textContent = state.totalXP.toLocaleString();

    if (barEl) {
      if (next) {
        const pct = ((state.totalXP - level.xp) / (next.xp - level.xp)) * 100;
        barEl.style.width = Math.min(pct, 100) + "%";
      } else {
        barEl.style.width = "100%";
      }
    }

    if (streakEl && streakCount) {
      if (state.streakDays > 0) {
        streakEl.style.display = "";
        streakCount.textContent = state.streakDays;
      } else {
        streakEl.style.display = "none";
      }
    }

    const badge = el("level-badge");
    if (badge) badge.title = "Level " + level.level + " · " + level.title;
  }

  function showLevelUp(level) {
    const overlay = document.createElement("div");
    overlay.className = "level-up-overlay";
    overlay.innerHTML =
      '<div class="level-up-text">Level ' + level.level + '</div>' +
      '<div class="level-up-subtitle">' + level.title + '</div>';
    document.body.appendChild(overlay);
    setTimeout(() => overlay.remove(), 2600);
  }

  function checkAchievements(stateOpt) {
    const state = stateOpt || getXPState();
    if (!state.achievements) state.achievements = [];

    const knownCount = HANZI_DATA.filter(h => getStatus(h.c) === "known").length;
    const learningCount = HANZI_DATA.filter(h => getStatus(h.c) === "learning").length;
    const knownSentences = SENTENCE_DATA.filter(s => {
      const key = "hanzi-tracker-sentence-" + s.i;
      try { const d = JSON.parse(localStorage.getItem(key) || "{}"); return d.status === "known"; } catch (e) { return false; }
    }).length;

    const checks = {
      "first-flame": state.streakDays >= 3,
      "week-warrior": state.streakDays >= 7,
      "month-master": state.streakDays >= 30,
      "century-club": state.streakDays >= 100,
      "first-steps": learningCount >= 1 || knownCount >= 1,
      "first-stamp": knownCount >= 1,
      "centurion": knownCount >= 100,
      "half-way": knownCount >= 500,
      "thousand-club": knownCount >= 1000,
      "dragon-scholar": knownCount >= 3000,
      "rising-star": state.level >= 3,
      "bright-star": state.level >= 5,
      "supernova": state.level >= 8,
      "grand-master": state.level >= 10,
      "sentence-sage": knownSentences >= 50,
      "daily-devotee": (state.uniqueDays || []).length >= 7,
    };

    // HSK checks
    for (let lv = 1; lv <= 6; lv++) {
      const lvChars = HANZI_DATA.filter(h => String(h.l) === String(lv));
      const allKnown = lvChars.length > 0 && lvChars.every(h => getStatus(h.c) === "known");
      checks["hsk" + lv] = allKnown;
    }

    let changed = false;
    for (const [id, met] of Object.entries(checks)) {
      if (met && !state.achievements.includes(id)) {
        state.achievements.push(id);
        changed = true;
        showAchievementToast(id);
      }
    }

    if (changed) saveXPState(state);
  }

  function showAchievementToast(id) {
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return;
    const container = el("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "achievement-toast";
    toast.innerHTML =
      '<span class="achievement-toast-icon">' + ach.icon + '</span>' +
      '<div class="achievement-toast-text">' +
      '<span class="achievement-toast-label">Achievement Unlocked!</span>' +
      '<span class="achievement-toast-name">' + ach.name + '</span>' +
      '</div>';
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = "0"; toast.style.transition = "opacity .4s"; }, 3500);
    setTimeout(() => toast.remove(), 4000);
  }

  function renderAchievementGrid() {
    const grid = el("achievement-grid");
    if (!grid) return;
    const state = getXPState();
    const unlocked = state.achievements || [];
    grid.innerHTML = ACHIEVEMENTS.map(a => {
      const isUnlocked = unlocked.includes(a.id);
      return '<div class="achievement-card ' + (isUnlocked ? "unlocked" : "locked") + '">' +
        '<span class="achievement-card-icon">' + a.icon + '</span>' +
        '<span class="achievement-card-name">' + a.name + '</span>' +
        '<span class="achievement-card-desc">' + a.desc + '</span>' +
        '</div>';
    }).join("");
  }


  /* =========================================================
   *  SUPABASE AUTH & CLOUD SYNC ENGINE
   * ========================================================= */

  const DEFAULT_SUPABASE_URL = "https://gyafdvspybhyspasbifo.supabase.co";
  const DEFAULT_SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wgx0UQzbw3X7POQeeUT6MQ_YBF-fvHX";
  const CUSTOM_SUPABASE_STORAGE_KEY = "hanzi_custom_supabase_v1";

  let supabaseClient = null;
  let currentUser = null;
  let syncDebounceTimer = null;
  let lastSyncedTime = null;
  let authMode = "password"; // "password" or "magic"
  let isSignUpMode = false;

  function getSupabaseConfig() {
    try {
      const custom = window.localStorage.getItem(CUSTOM_SUPABASE_STORAGE_KEY);
      if (custom) {
        const parsed = JSON.parse(custom);
        if (parsed && parsed.url && parsed.key) {
          return { url: parsed.url.trim(), key: parsed.key.trim(), isCustom: true };
        }
      }
    } catch (e) {
      console.warn("[Sync] Custom config parse error:", e);
    }
    return { url: DEFAULT_SUPABASE_URL, key: DEFAULT_SUPABASE_PUBLISHABLE_KEY, isCustom: false };
  }

  function initSupabase() {
    const config = getSupabaseConfig();
    if (!config.url || !config.key || config.url === "YOUR_PROJECT_URL") {
      console.log("[Sync] Supabase not configured — running in local-only mode");
      return;
    }
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      console.warn("[Sync] Supabase client library not loaded — running in local mode");
      return;
    }

    try {
      supabaseClient = window.supabase.createClient(config.url, config.key, {
        auth: {
          storage: window.localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true
        }
      });

      supabaseClient.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        updateAuthUI(currentUser);
        if (currentUser && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          loadFromCloud({ silent: event === 'TOKEN_REFRESHED' });
        }
      });

      // Initial session check
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
        currentUser = session?.user || null;
        updateAuthUI(currentUser);
        if (currentUser) {
          loadFromCloud({ silent: true });
        }
      }).catch(e => console.warn("[Sync] getSession failed:", e));
    } catch (err) {
      console.warn("[Sync] Failed to initialize Supabase:", err);
    }
  }

  function updateAuthUI(user) {
    const signInBtn = el("auth-sign-in-btn");
    const userSection = el("auth-user");
    const avatar = el("auth-avatar");
    const nameEl = el("auth-name");
    const indicator = el("sync-indicator");

    if (user) {
      if (signInBtn) signInBtn.classList.add("hidden");
      if (userSection) userSection.classList.remove("hidden");
      if (avatar) {
        avatar.src = user.user_metadata?.avatar_url || "icons/icon-192.png";
      }
      const displayName = user.user_metadata?.user_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";
      if (nameEl) nameEl.textContent = displayName;
      if (indicator) {
        indicator.title = lastSyncedTime ? "Synced " + formatTimeAgo(lastSyncedTime) : "Synced";
        indicator.classList.remove("error");
      }
    } else {
      if (signInBtn) signInBtn.classList.remove("hidden");
      if (userSection) userSection.classList.add("hidden");
      if (indicator) {
        indicator.title = "Not signed in";
        indicator.classList.remove("syncing", "error");
      }
    }

    updateAccountModalInfo();
  }

  function formatTimeAgo(date) {
    if (!date) return "Never";
    const sec = Math.max(0, Math.floor((Date.now() - new Date(date).getTime()) / 1000));
    if (sec < 45) return "just now";
    if (sec < 90) return "1 min ago";
    const mins = Math.floor(sec / 60);
    if (mins < 60) return mins + " mins ago";
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + (hours === 1 ? " hour ago" : " hours ago");
    return new Date(date).toLocaleDateString();
  }

  function updateAccountModalInfo() {
    if (!currentUser) return;
    const emailEl = el("account-modal-email");
    const avatarEl = el("account-modal-avatar");
    const lastSyncEl = el("account-last-sync-time");
    const charCountEl = el("account-char-count");
    const wordCountEl = el("account-word-count");
    const statusTextEl = el("account-status-text");
    const statusDotEl = el("account-status-dot");

    if (emailEl) emailEl.textContent = currentUser.email || currentUser.id || "Signed In";
    if (avatarEl) avatarEl.src = currentUser.user_metadata?.avatar_url || "icons/icon-192.png";
    if (lastSyncEl) lastSyncEl.textContent = formatTimeAgo(lastSyncedTime);

    const knownChars = Object.values(state.progress || {}).filter(p => p && (p.status === "known" || p.status === "learning")).length;
    const knownWords = Object.values(state.wordProgress || {}).filter(p => p && (p.status === "known" || p.status === "learning")).length;

    if (charCountEl) charCountEl.textContent = knownChars.toLocaleString();
    if (wordCountEl) wordCountEl.textContent = knownWords.toLocaleString();

    if (statusTextEl) statusTextEl.textContent = "Cloud Sync Active";
    if (statusDotEl) {
      statusDotEl.className = "status-dot online";
    }

    // Populate custom supabase fields
    const config = getSupabaseConfig();
    const urlInput = el("custom-supabase-url");
    const keyInput = el("custom-supabase-key");
    if (urlInput && config.isCustom) urlInput.value = config.url;
    if (keyInput && config.isCustom) keyInput.value = config.key;
  }

  /* ---------- MERGE STATE ENGINE ---------- */
  function mergeState(local, remote) {
    if (!remote || typeof remote !== "object") return local;

    const merged = {
      progress: Object.assign({}, local.progress || {}),
      wordProgress: Object.assign({}, local.wordProgress || {}),
      sentenceProgress: Object.assign({}, local.sentenceProgress || {}),
      streak: {
        count: Math.max(local.streak?.count || 0, remote.streak?.count || 0),
        last: (local.streak?.last && remote.streak?.last)
          ? (new Date(local.streak.last) >= new Date(remote.streak.last) ? local.streak.last : remote.streak.last)
          : (local.streak?.last || remote.streak?.last || null)
      },
      activity: Object.assign({}, local.activity || {}),
      updatedAt: new Date().toISOString()
    };

    // 1. Merge Characters
    if (remote.progress && typeof remote.progress === "object") {
      Object.keys(remote.progress).forEach(char => {
        const localItem = merged.progress[char];
        const remoteItem = remote.progress[char];

        if (!localItem) {
          merged.progress[char] = remoteItem;
        } else if (remoteItem) {
          // Compare review count, timestamps, and status
          const localRev = Number(localItem.reviews || 0);
          const remoteRev = Number(remoteItem.reviews || 0);
          const localTime = Math.max(localItem.last_review || 0, localItem.stampedAt || 0, 0);
          const remoteTime = Math.max(remoteItem.last_review || 0, remoteItem.stampedAt || 0, 0);

          if (remoteRev > localRev || (remoteRev === localRev && remoteTime > localTime)) {
            merged.progress[char] = Object.assign({}, localItem, remoteItem);
          } else if (localItem.status === "new" && remoteItem.status && remoteItem.status !== "new") {
            merged.progress[char] = Object.assign({}, localItem, remoteItem);
          }
        }
      });
    }

    // 2. Merge Words
    if (remote.wordProgress && typeof remote.wordProgress === "object") {
      Object.keys(remote.wordProgress).forEach(word => {
        const localItem = merged.wordProgress[word];
        const remoteItem = remote.wordProgress[word];

        if (!localItem) {
          merged.wordProgress[word] = remoteItem;
        } else if (remoteItem) {
          const localRev = Number(localItem.reviews || 0);
          const remoteRev = Number(remoteItem.reviews || 0);
          const localTime = Math.max(localItem.last_review || 0, localItem.stampedAt || 0, 0);
          const remoteTime = Math.max(remoteItem.last_review || 0, remoteItem.stampedAt || 0, 0);

          if (remoteRev > localRev || (remoteRev === localRev && remoteTime > localTime)) {
            merged.wordProgress[word] = Object.assign({}, localItem, remoteItem);
          } else if (localItem.status === "new" && remoteItem.status && remoteItem.status !== "new") {
            merged.wordProgress[word] = Object.assign({}, localItem, remoteItem);
          }
        }
      });
    }

    // 3. Merge Sentences
    if (remote.sentenceProgress && typeof remote.sentenceProgress === "object") {
      Object.keys(remote.sentenceProgress).forEach(id => {
        const localItem = merged.sentenceProgress[id];
        const remoteItem = remote.sentenceProgress[id];

        if (!localItem) {
          merged.sentenceProgress[id] = remoteItem;
        } else if (remoteItem) {
          const localRev = Number(localItem.reviews || 0);
          const remoteRev = Number(remoteItem.reviews || 0);
          const localTime = Math.max(localItem.last_review || 0, 0);
          const remoteTime = Math.max(remoteItem.last_review || 0, 0);

          if (remoteRev > localRev || (remoteRev === localRev && remoteTime > localTime)) {
            merged.sentenceProgress[id] = Object.assign({}, localItem, remoteItem);
          } else if (localItem.status === "new" && remoteItem.status && remoteItem.status !== "new") {
            merged.sentenceProgress[id] = Object.assign({}, localItem, remoteItem);
          }
        }
      });
    }

    // 4. Merge Activity History
    if (remote.activity && typeof remote.activity === "object") {
      Object.keys(remote.activity).forEach(date => {
        const localAct = merged.activity[date] || { reviews: 0, characters: 0, sentences: 0, words: 0, minutes: 0 };
        const remoteAct = remote.activity[date] || {};

        merged.activity[date] = {
          reviews: Math.max(Number(localAct.reviews || 0), Number(remoteAct.reviews || 0)),
          characters: Math.max(Number(localAct.characters || 0), Number(remoteAct.characters || 0)),
          sentences: Math.max(Number(localAct.sentences || 0), Number(remoteAct.sentences || 0)),
          words: Math.max(Number(localAct.words || 0), Number(remoteAct.words || 0)),
          minutes: Math.max(Number(localAct.minutes || 0), Number(remoteAct.minutes || 0))
        };
      });
    }

    return merged;
  }

  function hasAnyLocalProgress() {
    const chars = Object.values(state.progress || {}).some(p => p && p.status && p.status !== "new");
    const words = Object.values(state.wordProgress || {}).some(p => p && p.status && p.status !== "new");
    const sentences = Object.values(state.sentenceProgress || {}).some(p => p && p.status && p.status !== "new");
    const streak = (state.streak?.count || 0) > 0;
    return chars || words || sentences || streak;
  }

  /* ---------- SYNC TO CLOUD ---------- */
  async function syncToCloud(options = {}) {
    if (!currentUser || !supabaseClient) return;

    const indicator = el("sync-indicator");
    const statusTextEl = el("account-status-text");
    const statusDotEl = el("account-status-dot");

    if (indicator) {
      indicator.classList.add("syncing");
      indicator.classList.remove("error");
      indicator.title = "Syncing with cloud…";
    }
    if (statusTextEl) statusTextEl.textContent = "Syncing…";
    if (statusDotEl) statusDotEl.className = "status-dot syncing";

    try {
      const nowIso = new Date().toISOString();
      const totalReviews = Object.values(state.progress || {}).reduce((sum, p) => sum + (p.reviews || 0), 0);
      const totalKnown = Object.values(state.progress || {}).filter(p => p.status === "known").length;

      // 1. Primary Full State Snapshot row
      const primaryRow = {
        user_id: currentUser.id,
        character: "__app_state_v1__",
        status: JSON.stringify(state),
        attempts: totalReviews,
        correct: totalKnown,
        last_practiced: nowIso,
        updated_at: nowIso
      };

      const { error: primaryError } = await supabaseClient
        .from("hanzi_progress")
        .upsert(primaryRow, { onConflict: "user_id,character" });

      if (primaryError) throw primaryError;

      // 2. Granular rows for non-new characters, words, sentences (for relational queries)
      const granularRows = [];

      Object.entries(state.progress || {}).forEach(([char, entry]) => {
        if (entry && entry.status && entry.status !== "new") {
          granularRows.push({
            user_id: currentUser.id,
            character: char,
            status: entry.status,
            attempts: entry.reviews || 0,
            correct: entry.interval || 0,
            last_practiced: entry.last_review ? new Date(entry.last_review).toISOString() : nowIso,
            updated_at: nowIso
          });
        }
      });

      Object.entries(state.wordProgress || {}).forEach(([word, entry]) => {
        if (entry && entry.status && entry.status !== "new") {
          granularRows.push({
            user_id: currentUser.id,
            character: "word:" + word,
            status: entry.status,
            attempts: entry.reviews || 0,
            correct: entry.interval || 0,
            last_practiced: entry.last_review ? new Date(entry.last_review).toISOString() : nowIso,
            updated_at: nowIso
          });
        }
      });

      Object.entries(state.sentenceProgress || {}).forEach(([id, entry]) => {
        if (entry && entry.status && entry.status !== "new") {
          granularRows.push({
            user_id: currentUser.id,
            character: "sentence:" + id,
            status: entry.status,
            attempts: entry.reviews || 0,
            correct: entry.interval || 0,
            last_practiced: entry.last_review ? new Date(entry.last_review).toISOString() : nowIso,
            updated_at: nowIso
          });
        }
      });

      // Upsert in safe batches of 150
      for (let i = 0; i < granularRows.length; i += 150) {
        const chunk = granularRows.slice(i, i + 150);
        const { error: chunkError } = await supabaseClient
          .from("hanzi_progress")
          .upsert(chunk, { onConflict: "user_id,character" });
        if (chunkError) console.warn("[Sync] Granular batch warning:", chunkError);
      }

      lastSyncedTime = new Date();
      if (indicator) {
        indicator.classList.remove("syncing", "error");
        indicator.title = "Synced just now";
      }
      if (statusTextEl) statusTextEl.textContent = "Cloud Sync Active";
      if (statusDotEl) statusDotEl.className = "status-dot online";

      updateAccountModalInfo();

      if (options.isManual) {
        showToast("☁️ Progress backed up to cloud!");
      }
    } catch (err) {
      console.warn("[Sync] Cloud save failed:", err);
      if (indicator) {
        indicator.classList.remove("syncing");
        indicator.classList.add("error");
        indicator.title = "Sync error: " + (err.message || "Failed to sync");
      }
      if (statusTextEl) statusTextEl.textContent = "Sync Error";
      if (statusDotEl) statusDotEl.className = "status-dot error";

      if (options.isManual) {
        showToast("Cloud sync failed: " + (err.message || "Unknown error"), true);
      }
    }
  }

  function debouncedSync() {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(() => syncToCloud(), 1500);
  }

  /* ---------- LOAD FROM CLOUD ---------- */
  async function loadFromCloud(options = {}) {
    if (!currentUser || !supabaseClient) return;

    const indicator = el("sync-indicator");
    const statusTextEl = el("account-status-text");
    const statusDotEl = el("account-status-dot");

    if (indicator) {
      indicator.classList.add("syncing");
      indicator.classList.remove("error");
    }
    if (statusTextEl) statusTextEl.textContent = "Syncing…";
    if (statusDotEl) statusDotEl.className = "status-dot syncing";

    try {
      const { data, error } = await supabaseClient
        .from("hanzi_progress")
        .select("*")
        .eq("user_id", currentUser.id);

      if (error) throw error;

      if (!data || data.length === 0) {
        // Cloud is empty. If local state has progress, upload it automatically!
        if (hasAnyLocalProgress()) {
          console.log("[Sync] Cloud empty — uploading local progress to cloud");
          await syncToCloud();
          if (!options.silent) {
            showToast("☁️ Cloud connected: Local progress uploaded!");
          }
        }
        lastSyncedTime = new Date();
        if (indicator) indicator.classList.remove("syncing");
        if (statusTextEl) statusTextEl.textContent = "Cloud Sync Active";
        if (statusDotEl) statusDotEl.className = "status-dot online";
        updateAccountModalInfo();
        return;
      }

      // Look for full state row
      const stateRow = data.find(r => r.character === "__app_state_v1__");
      if (stateRow && stateRow.status) {
        try {
          const cloudState = JSON.parse(stateRow.status);
          state = mergeState(state, cloudState);
        } catch (e) {
          console.warn("[Sync] Parse cloud state JSON failed:", e);
        }
      } else {
        // Legacy format reconstruction
        data.forEach(row => {
          if (!row.character || row.character === "__app_state_v1__") return;
          if (row.character.startsWith("word:")) {
            const word = row.character.slice(5);
            if (!state.wordProgress[word]) {
              state.wordProgress[word] = { status: row.status || "learning", interval: row.correct || 0, reviews: row.attempts || 0, due: Date.now() };
            }
          } else if (row.character.startsWith("sentence:")) {
            const id = row.character.slice(9);
            if (!state.sentenceProgress[id]) {
              state.sentenceProgress[id] = { status: row.status || "learning", interval: row.correct || 0, reviews: row.attempts || 0, due: Date.now() };
            }
          } else {
            const current = getStatus(row.character);
            if (row.status && row.status !== current) {
              setStatusRaw(row.character, row.status, row.correct, row.attempts);
            }
          }
        });
      }

      // Persist merged state locally
      const payload = JSON.stringify(state);
      try { window.localStorage.setItem(FALLBACK_STORAGE_KEY, payload); } catch (e) { }
      try { if (window.storage && typeof window.storage.set === "function") await window.storage.set(STORAGE_KEY, payload, false); } catch (e) { }

      // Refresh all UI tabs and views
      syncUI();
      const activeTabBtn = document.querySelector('.tab-btn.active');
      const activeTab = activeTabBtn ? activeTabBtn.dataset.tab : 'browse';
      if (activeTab === 'browse') renderBrowse();
      if (activeTab === 'sentences') renderSentences();
      if (activeTab === 'words') renderWords();
      if (activeTab === 'progress') renderProgress();
      if (activeTab === 'tones') renderTonesTab();
      if (activeTab === 'pictographs') renderPictographsTab();
      updateHeaderProgress();
      refreshDueCount();
      updateXPDisplay();
      renderAchievementGrid();
      if (typeof renderSealAlbum === "function") renderSealAlbum();

      lastSyncedTime = new Date();
      if (indicator) {
        indicator.classList.remove("syncing", "error");
        indicator.title = "Synced just now";
      }
      if (statusTextEl) statusTextEl.textContent = "Cloud Sync Active";
      if (statusDotEl) statusDotEl.className = "status-dot online";

      updateAccountModalInfo();

      if (!options.silent) {
        showToast("☁️ Progress synced from cloud");
      }
    } catch (err) {
      console.warn("[Sync] Cloud load failed:", err);
      if (indicator) {
        indicator.classList.remove("syncing");
        indicator.classList.add("error");
        indicator.title = "Sync error: " + (err.message || "Failed to load");
      }
      if (statusTextEl) statusTextEl.textContent = "Sync Error";
      if (statusDotEl) statusDotEl.className = "status-dot error";

      if (!options.silent) {
        showToast("Cloud sync failed: " + (err.message || "Unknown error"), true);
      }
    }
  }

  function setStatusRaw(char, status, interval = 0, reviews = 0) {
    if (!state.progress[char]) {
      state.progress[char] = { status: status, interval: interval || 0, reviews: reviews || 0, due: Date.now(), stampedAt: null };
    } else {
      state.progress[char].status = status;
      if (reviews) state.progress[char].reviews = reviews;
      if (interval) state.progress[char].interval = interval;
    }
  }

  /* ---------- FORCE ACTIONS ---------- */
  async function forceUploadToCloud() {
    if (!currentUser || !supabaseClient) {
      showToast("Sign in first to sync to cloud", true);
      return;
    }
    if (!confirm("Upload local progress to cloud and overwrite cloud backup?")) return;
    await syncToCloud({ isManual: true });
  }

  async function forceRestoreFromCloud() {
    if (!currentUser || !supabaseClient) {
      showToast("Sign in first to restore from cloud", true);
      return;
    }
    if (!confirm("Restore cloud backup and replace current local progress? This cannot be undone.")) return;

    try {
      const { data, error } = await supabaseClient
        .from("hanzi_progress")
        .select("*")
        .eq("user_id", currentUser.id);

      if (error) throw error;
      const stateRow = data?.find(r => r.character === "__app_state_v1__");
      if (!stateRow || !stateRow.status) {
        showToast("No full cloud backup found for this account.", true);
        return;
      }

      state = JSON.parse(stateRow.status);
      const payload = JSON.stringify(state);
      try { window.localStorage.setItem(FALLBACK_STORAGE_KEY, payload); } catch (e) { }
      try { if (window.storage) window.storage.set(STORAGE_KEY, payload, false); } catch (e) { }

      syncUI();
      const activeTabBtn = document.querySelector('.tab-btn.active');
      const activeTab = activeTabBtn ? activeTabBtn.dataset.tab : 'browse';
      if (activeTab === 'browse') renderBrowse();
      if (activeTab === 'sentences') renderSentences();
      if (activeTab === 'words') renderWords();
      if (activeTab === 'progress') renderProgress();
      if (activeTab === 'tones') renderTonesTab();
      if (activeTab === 'pictographs') renderPictographsTab();
      updateHeaderProgress();
      refreshDueCount();
      updateXPDisplay();
      renderAchievementGrid();
      if (typeof renderSealAlbum === "function") renderSealAlbum();

      lastSyncedTime = new Date();
      updateAccountModalInfo();
      showToast("☁️ Progress restored from cloud!");
      closeAccountModal();
    } catch (e) {
      showToast("Restore failed: " + (e.message || "Unknown error"), true);
    }
  }

  /* ---------- AUTH ACTIONS ---------- */
  function setAuthStatusMessage(text, type = "info") {
    const msgEl = el("auth-status-message");
    if (!msgEl) return;
    if (!text) {
      msgEl.classList.add("hidden");
      msgEl.textContent = "";
      return;
    }
    msgEl.className = "auth-status-message " + type;
    msgEl.textContent = text;
    msgEl.classList.remove("hidden");
  }

  async function signInWithGithub() {
    if (!supabaseClient) { showToast("Supabase not configured", true); return; }
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin + window.location.pathname }
    });
    if (error) {
      setAuthStatusMessage("GitHub sign-in failed: " + error.message, "error");
    }
  }

  async function signInWithEmail() {
    if (!supabaseClient) { showToast("Supabase not configured", true); return; }
    const email = el("auth-email")?.value.trim();
    const password = el("auth-password")?.value;
    if (!email || !password) {
      setAuthStatusMessage("Please enter both email and password.", "error");
      return;
    }

    setAuthStatusMessage("Signing in…", "info");
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes("Email not confirmed")) {
        setAuthStatusMessage("Email not confirmed. Check your inbox to confirm before signing in.", "error");
      } else {
        setAuthStatusMessage(error.message, "error");
      }
    } else {
      currentUser = data.user;
      closeAuthModal();
      showToast("☁️ Signed in successfully!");
      loadFromCloud();
    }
  }

  async function signUpWithEmail() {
    if (!supabaseClient) { showToast("Supabase not configured", true); return; }
    const email = el("auth-email")?.value.trim();
    const password = el("auth-password")?.value;
    if (!email || !password) {
      setAuthStatusMessage("Please enter both email and password.", "error");
      return;
    }
    if (password.length < 6) {
      setAuthStatusMessage("Password must be at least 6 characters.", "error");
      return;
    }

    setAuthStatusMessage("Creating account…", "info");
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin + window.location.pathname }
    });

    if (error) {
      setAuthStatusMessage(error.message, "error");
    } else {
      if (data.session) {
        currentUser = data.user;
        closeAuthModal();
        showToast("☁️ Account created & signed in!");
        loadFromCloud();
      } else {
        setAuthStatusMessage("Account created! Check your email to confirm your address.", "success");
      }
    }
  }

  async function signInWithMagicLink() {
    if (!supabaseClient) { showToast("Supabase not configured", true); return; }
    const email = el("auth-email")?.value.trim();
    if (!email) {
      setAuthStatusMessage("Please enter your email address.", "error");
      return;
    }

    setAuthStatusMessage("Sending magic sign-in link…", "info");
    const { error } = await supabaseClient.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin + window.location.pathname }
    });

    if (error) {
      setAuthStatusMessage(error.message, "error");
    } else {
      setAuthStatusMessage("Magic link sent! Check your inbox to sign in with one click.", "success");
    }
  }

  async function signOutUser() {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
      currentUser = null;
      lastSyncedTime = null;
      updateAuthUI(null);
      closeAccountModal();
      showToast("Signed out of cloud sync");
    }
  }

  /* ---------- MODAL CONTROLS ---------- */
  function openAuthModal() {
    setAuthStatusMessage("");
    el("auth-modal")?.classList.remove("hidden");
  }

  function closeAuthModal() {
    el("auth-modal")?.classList.add("hidden");
    setAuthStatusMessage("");
  }

  function openAccountModal() {
    updateAccountModalInfo();
    el("account-modal")?.classList.remove("hidden");
  }

  function closeAccountModal() {
    el("account-modal")?.classList.add("hidden");
  }

  function setAuthMode(mode) {
    authMode = mode;
    const pwTab = el("auth-tab-password");
    const magicTab = el("auth-tab-magic");
    const pwInput = el("auth-password");
    const magicHint = el("auth-magic-hint");
    const submitBtn = el("auth-submit-btn");
    const toggleWrap = el("auth-signup-toggle-wrap");

    if (mode === "magic") {
      pwTab?.classList.remove("active");
      magicTab?.classList.add("active");
      if (pwInput) pwInput.style.display = "none";
      if (magicHint) magicHint.classList.remove("hidden");
      if (submitBtn) submitBtn.textContent = "Send Magic Link";
      if (toggleWrap) toggleWrap.style.display = "none";
    } else {
      pwTab?.classList.add("active");
      magicTab?.classList.remove("active");
      if (pwInput) pwInput.style.display = "block";
      if (magicHint) magicHint.classList.hidden = "hidden";
      if (submitBtn) submitBtn.textContent = isSignUpMode ? "Create account" : "Sign in";
      if (toggleWrap) toggleWrap.style.display = "block";
    }
    setAuthStatusMessage("");
  }

  function toggleSignUpMode() {
    isSignUpMode = !isSignUpMode;
    const btn = el("auth-submit-btn");
    const toggle = el("auth-signup-toggle");
    const title = el("auth-modal-title");

    if (btn && authMode === "password") btn.textContent = isSignUpMode ? "Create account" : "Sign in";
    if (toggle) toggle.textContent = isSignUpMode ? "Sign in" : "Create account";
    if (title) title.textContent = isSignUpMode ? "Create an account" : "Sign in to sync";
    setAuthStatusMessage("");
  }

  function handleCustomSupabaseSave() {
    const url = (el("custom-supabase-url")?.value || el("auth-custom-url")?.value || "").trim();
    const key = (el("custom-supabase-key")?.value || el("auth-custom-key")?.value || "").trim();

    if (!url || !key) {
      showToast("Enter both Supabase URL and Key", true);
      return;
    }

    try {
      window.localStorage.setItem(CUSTOM_SUPABASE_STORAGE_KEY, JSON.stringify({ url, key }));
      initSupabase();
      showToast("Custom Supabase configured!");
    } catch (e) {
      showToast("Failed to save config: " + e.message, true);
    }
  }

  function handleCustomSupabaseReset() {
    try {
      window.localStorage.removeItem(CUSTOM_SUPABASE_STORAGE_KEY);
      const urlInput = el("custom-supabase-url");
      const keyInput = el("custom-supabase-key");
      if (urlInput) urlInput.value = "";
      if (keyInput) keyInput.value = "";
      initSupabase();
      showToast("Reset to default Supabase server");
    } catch (e) {
      showToast("Failed to reset: " + e.message, true);
    }
  }

  /* ---------- WIRE AUTH & SYNC UI ---------- */
  function wireAuth() {
    // Auth Modal triggers
    el("auth-sign-in-btn")?.addEventListener("click", openAuthModal);
    el("auth-modal-close")?.addEventListener("click", closeAuthModal);
    el("auth-close-link")?.addEventListener("click", e => { e.preventDefault(); closeAuthModal(); });

    // Account modal triggers (avatar & sync indicator)
    el("auth-user")?.addEventListener("click", openAccountModal);
    el("auth-user")?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openAccountModal(); }
    });
    el("account-modal-close")?.addEventListener("click", closeAccountModal);

    // Auth forms
    el("auth-github-btn")?.addEventListener("click", signInWithGithub);
    el("auth-tab-password")?.addEventListener("click", () => setAuthMode("password"));
    el("auth-tab-magic")?.addEventListener("click", () => setAuthMode("magic"));
    el("auth-signup-toggle")?.addEventListener("click", e => { e.preventDefault(); toggleSignUpMode(); });

    el("auth-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      if (authMode === "magic") {
        signInWithMagicLink();
      } else if (isSignUpMode) {
        signUpWithEmail();
      } else {
        signInWithEmail();
      }
    });

    el("auth-submit-btn")?.addEventListener("click", () => {
      if (authMode === "magic") {
        signInWithMagicLink();
      } else if (isSignUpMode) {
        signUpWithEmail();
      } else {
        signInWithEmail();
      }
    });

    // Account Modal actions
    el("account-sync-now-btn")?.addEventListener("click", async () => {
      await syncToCloud({ isManual: true });
      await loadFromCloud({ silent: true });
    });
    el("account-upload-btn")?.addEventListener("click", forceUploadToCloud);
    el("account-restore-btn")?.addEventListener("click", forceRestoreFromCloud);
    el("account-export-btn")?.addEventListener("click", exportData);
    el("account-import-btn")?.addEventListener("click", () => el("import-file")?.click());
    el("account-signout-btn")?.addEventListener("click", signOutUser);

    // Custom Server actions
    el("custom-supabase-save-btn")?.addEventListener("click", handleCustomSupabaseSave);
    el("custom-supabase-reset-btn")?.addEventListener("click", handleCustomSupabaseReset);
    el("auth-custom-save-btn")?.addEventListener("click", handleCustomSupabaseSave);
    el("auth-custom-reset-btn")?.addEventListener("click", handleCustomSupabaseReset);

    // Close modals on outside backdrop click
    el("auth-modal")?.addEventListener("click", (e) => {
      if (e.target === el("auth-modal")) closeAuthModal();
    });
    el("account-modal")?.addEventListener("click", (e) => {
      if (e.target === el("account-modal")) closeAccountModal();
    });
  }

  // showToast is already defined earlier with full animation and error support

  /* ---------- init ---------- */
  function initFiltersPersistence() {
    const persistFields = [
      "browse-level-select", "browse-srs-select", "browse-status-select", "browse-sort",
      "review-difficulty", "review-focus-weak", "session-size",
      "radical-sort", "radical-character-limit",
      "sentence-hsk-filter", "sentence-srs-filter", "sentence-difficulty-filter", "sentence-sort",
      "word-level-select", "word-length", "word-common-only", "word-srs-select", "word-status-select", "word-sort"
    ];

    persistFields.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const isCheckbox = el.type === "checkbox";
      const key = "hanzi_pref_" + id;
      
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        if (isCheckbox) el.checked = saved === "true";
        else el.value = saved;
        setTimeout(() => el.dispatchEvent(new Event("change")), 10);
      }

      el.addEventListener("change", () => {
        localStorage.setItem(key, isCheckbox ? String(el.checked) : el.value);
      });
    });

    const savedPool = localStorage.getItem("hanzi_pref_pool");
    if (savedPool) {
      const r = document.querySelector(`input[name="pool"][value="${savedPool}"]`);
      if (r) { r.checked = true; setTimeout(() => r.dispatchEvent(new Event("change")), 10); }
    }
    document.querySelectorAll('input[name="pool"]').forEach(r => {
      r.addEventListener("change", () => localStorage.setItem("hanzi_pref_pool", r.value));
    });

    const savedReviewMode = localStorage.getItem("hanzi_pref_reviewMode");
    if (savedReviewMode) {
      const btn = document.querySelector(`[data-review-mode="${savedReviewMode}"]`);
      if (btn) { setTimeout(() => btn.click(), 10); }
    }
    document.querySelectorAll("[data-review-mode]").forEach(btn => {
      btn.addEventListener("click", () => localStorage.setItem("hanzi_pref_reviewMode", btn.dataset.reviewMode));
    });

    const savedEvoLevel = localStorage.getItem("hanzi_pref_evoLevel");
    if (savedEvoLevel) {
      const btn = document.querySelector(`[data-evo-level="${savedEvoLevel}"]`);
      if (btn) { setTimeout(() => btn.click(), 10); }
    }
    document.querySelectorAll("[data-evo-level]").forEach(btn => {
      btn.addEventListener("click", () => localStorage.setItem("hanzi_pref_evoLevel", btn.dataset.evoLevel));
    });
  }

  async function init() {
    const dismissLoading = () => {
      const appEl = el("app");
      const loadEl = el("loading-screen");
      if (appEl) appEl.classList.remove("loading");
      if (loadEl) {
        loadEl.classList.add("hidden");
        setTimeout(() => { loadEl.style.display = "none"; }, 400);
      }
    };

    // Failsafe timer: Ensure the loading screen is never stuck if any initialization step encounters an issue
    const failsafe = setTimeout(dismissLoading, 2500);

    try {
      await loadDataFiles();
      buildIndexes();
      await loadState();
      wireReadings();
      wireTabs();
      wireWords();
      el("smart-review-btn")?.addEventListener("click", openSmartReview);
      el("progress-review-due")?.addEventListener("click", () => {
        const tab = document.querySelector('.tab-btn[data-tab="review"]');
        if (tab) tab.click();
        const r = document.querySelector('input[name="pool"][value="due"]');
        if (r) r.checked = true;
      });
      el("progress-review-sentences")?.addEventListener("click", () => {
        const tab = document.querySelector('.tab-btn[data-tab="sentences"]');
        if (tab) tab.click();
      });
      el("progress-weak-list")?.addEventListener("click", e => {
        const c = e.target.closest("[data-progress-char]");
        if (c) { openDetail(c.dataset.progressChar); return; }
        const x = e.target.closest("[data-progress-sentence]");
        if (x) openSentenceDetails(x.dataset.progressSentence);
      });
      wireBrowse();
      wireDrawer();
      wireReview();
      wireSentences();
      wireToneLab();
      enhanceThemeDropdowns();
      wireProgress();
      wireDataManagement();
      wireRadicals();
      wireContextMenu();
      initThemeEngine();
      initEvolution();
      initPictographs();
      initFiltersPersistence();
      // Render initial active tab
      renderBrowse();
      updateHeaderProgress();
      refreshDueCount();

      // --- Commercial features & sync ---
      updateXPDisplay();
      renderAchievementGrid();
      wireAuth();
      initSupabase();

      // Register service worker for PWA
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.register("sw.js").catch(e => console.warn("SW:", e));
      }

      // Background prefetch sentences dataset without blocking initial render
      if (typeof window !== "undefined") {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(() => ensureSentenceData());
        } else {
          setTimeout(ensureSentenceData, 300);
        }
      }
    } catch (err) {
      console.error("[HanziTracker] App init error:", err);
    } finally {
      clearTimeout(failsafe);
      dismissLoading();
    }
  }

  /* ============================================================
   EVOLUTION MODULE — 古文字演变
   ============================================================ */

  // ---- Script stage registry ----
  const EVO_STAGES_META = [
    { key: "oracle", name: "Oracle Bone", era: "甲骨文 c.1250\u20131000 BC" },
    { key: "bronze", name: "Bronze Script", era: "\u91d1\u6587 c.1100\u2013221 BC" },
    { key: "seal", name: "Seal Script", era: "\u7bc6\u4e66 c.221 BC" },
    { key: "clerical", name: "Clerical", era: "\u96b6\u4e66 c.200 BC\u2013200 AD" },
    { key: "regular", name: "Regular", era: "\u6977\u4e66 c.200 AD+" },
    { key: "modern", name: "Modern", era: "\u73b0\u4ee3 Simplified" },
  ];

  // ---- Curated evolution data ----
  // Glyph key priority:
  //   oracle/bronze: Unicode CJK Extension codepoint if known, else same as modern (marked placeholder)
  //   seal/clerical/regular: traditional character form where applicable (REAL historical difference)
  //   modern: current simplified/standard form
  // The traditional form IS a genuine historical form — used until PRC script reform (1956\u20131964).
  const EVO_DATA = {
    // ── Pictographs (oracle = modern, no simplification) ──────────────────────
    "\u4e00": {
      oracle: "\u4e00", bronze: "\u4e00", seal: "\u4e00", clerical: "\u4e00", regular: "\u4e00", modern: "\u4e00",
      notes: { oracle: "A single horizontal stroke \u2014 the simplest pictograph of unity.", seal: "Standardised by the Qin dynasty.", clerical: "Horizontal stroke with slight brush lift.", modern: "Unchanged for 3,000+ years." }
    },
    "\u5c71": {
      oracle: "\u5c71", bronze: "\u5c71", seal: "\u5c71", clerical: "\u5c71", regular: "\u5c71", modern: "\u5c71",
      notes: { oracle: "Three peaks of a mountain \u2014 iconic pictograph.", bronze: "Three vertical strokes, longer centre peak.", seal: "Regularised strokes of even weight.", clerical: "Horizontal base bar added.", modern: "Mountain silhouette retained." }
    },
    "\u6c34": {
      oracle: "\u6c34", bronze: "\u6c34", seal: "\u6c34", clerical: "\u6c34", regular: "\u6c34", modern: "\u6c34",
      notes: { oracle: "Wavy lines depicting flowing water.", bronze: "Central stream with flanking ripples.", seal: "Central vertical with angled strokes.", clerical: "Four strokes; angles sharpen.", modern: "Standard 4-stroke form; radical in \u6c5f,\u6d77,\u6cb3." }
    },
    "\u706b": {
      oracle: "\u706b", bronze: "\u706b", seal: "\u706b", clerical: "\u706b", regular: "\u706b", modern: "\u706b",
      notes: { oracle: "Flames leaping from a base \u2014 direct pictograph of fire.", seal: "Four symmetric strokes.", modern: "Radical in \u7130,\u70e7,\u70df." }
    },
    "\u6728": {
      oracle: "\u6728", bronze: "\u6728", seal: "\u6728", clerical: "\u6728", regular: "\u6728", modern: "\u6728",
      notes: { oracle: "Tree: trunk, branches above, roots below.", seal: "Symmetrical balanced form.", modern: "Radical in \u6797,\u68ee,\u684c." }
    },
    "\u5927": {
      oracle: "\u5927", bronze: "\u5927", seal: "\u5927", clerical: "\u5927", regular: "\u5927", modern: "\u5927",
      notes: { oracle: "Person standing with arms spread wide \u2014 \u2018big\u2019.", bronze: "Arms clearly extended laterally.", modern: "Radical in \u5929,\u592a,\u592b." }
    },
    "\u4e2d": {
      oracle: "\u4e2d", bronze: "\u4e2d", seal: "\u4e2d", clerical: "\u4e2d", regular: "\u4e2d", modern: "\u4e2d",
      notes: { oracle: "A flag through the centre of a target \u2014 \u2018middle\u2019.", seal: "Rectangular frame with vertical axis.", modern: "One of the most common characters." }
    },
    "\u53e3": {
      oracle: "\u53e3", bronze: "\u53e3", seal: "\u53e3", clerical: "\u53e3", regular: "\u53e3", modern: "\u53e3",
      notes: { oracle: "An open square \u2014 the mouth or opening.", seal: "Perfect square standardised.", modern: "Radical in \u5403,\u559d,\u53eb." }
    },
    "\u624b": {
      oracle: "\u624b", bronze: "\u624b", seal: "\u624b", clerical: "\u624b", regular: "\u624b", modern: "\u624b",
      notes: { oracle: "Five finger lines from a palm \u2014 direct pictograph.", seal: "4 horizontal strokes + vertical.", modern: "Radical in \u6253,\u62ff,\u63e1." }
    },
    "\u5fc3": {
      oracle: "\u5fc3", bronze: "\u5fc3", seal: "\u5fc3", clerical: "\u5fc3", regular: "\u5fc3", modern: "\u5fc3",
      notes: { oracle: "Heart shape with ventricles \u2014 ancient anatomical knowledge.", seal: "Curved base with three points.", modern: "Radical in \u60f3,\u5fd8,\u60c5." }
    },
    "\u6708": {
      oracle: "\u6708", bronze: "\u6708", seal: "\u6708", clerical: "\u6708", regular: "\u6708", modern: "\u6708",
      notes: { oracle: "Crescent with interior dots representing stars.", seal: "Near-rectangular form.", modern: "Radical in \u6709,\u670d,\u671f." }
    },
    "\u76ee": {
      oracle: "\u76ee", bronze: "\u76ee", seal: "\u76ee", clerical: "\u76ee", regular: "\u76ee", modern: "\u76ee",
      notes: { oracle: "An eye drawn vertically \u2014 later rotated 90\u00b0.", seal: "Standardised rectangle with pupil bar.", modern: "Radical in \u770b,\u771f,\u77e5." }
    },
    "\u8033": {
      oracle: "\u8033", bronze: "\u8033", seal: "\u8033", clerical: "\u8033", regular: "\u8033", modern: "\u8033",
      notes: { oracle: "An ear with inner curves \u2014 detailed pictograph.", seal: "Formalised into rectangular outer form.", modern: "Radical in \u806a,\u8046." }
    },
    "\u5973": {
      oracle: "\u5973", bronze: "\u5973", seal: "\u5973", clerical: "\u5973", regular: "\u5973", modern: "\u5973",
      notes: { oracle: "A woman kneeling with arms crossed \u2014 respectful posture.", seal: "Simplified into flowing strokes.", modern: "Radical in \u59b9,\u5979,\u5983." }
    },
    "\u5b50": {
      oracle: "\u5b50", bronze: "\u5b50", seal: "\u5b50", clerical: "\u5b50", regular: "\u5b50", modern: "\u5b50",
      notes: { oracle: "A baby with arms outstretched \u2014 pictograph of a child.", seal: "Standardised with rounded head stroke.", modern: "Radical in \u5b66,\u5b66,\u5b78." }
    },
    "\u725b": {
      oracle: "\u725b", bronze: "\u725b", seal: "\u725b", clerical: "\u725b", regular: "\u725b", modern: "\u725b",
      notes: { oracle: "Ox head with horns pointing up \u2014 top-down view.", seal: "Horns and body regularised.", modern: "Radical in \u7269,\u7272,\u7248." }
    },
    "\u7f8a": {
      oracle: "\u7f8a", bronze: "\u7f8a", seal: "\u7f8a", clerical: "\u7f8a", regular: "\u7f8a", modern: "\u7f8a",
      notes: { oracle: "Sheep/goat head with curved horns \u2014 clear pictograph.", seal: "Horns balanced over body strokes.", modern: "Radical in \u7f8e,\u7fa4,\u7fa3." }
    },
    "\u9e1f": {
      oracle: "\u9ce5", bronze: "\u9ce5", seal: "\u9ce5", clerical: "\u9ce5", regular: "\u9ce5", modern: "\u9e1f",
      notes: { oracle: "A bird with beak, body, wings, tail and feet visible.", bronze: "Wing and tail feathers prominent.", seal: "Stylised; body and tail compressed.", clerical: "Traditional \u9ce5 \u2014 11 strokes.", modern: "Simplified to \u9e1f (5 strokes)." }
    },
    // ── Simplified \u2192 Traditional (major visual difference) ───────────────────────────
    "\u4eba": {
      oracle: "\ud840\udc89", bronze: "\ud840\udc89", seal: "\u4eba", clerical: "\u4eba", regular: "\u4eba", modern: "\u4eba",
      notes: { oracle: "Person in side profile, arms at sides.", bronze: "Simplified silhouette.", seal: "Two strokes established.", modern: "Universal modern form." }
    },
    "\u65e5": {
      oracle: "\ud841\uddb8", bronze: "\u65e5", seal: "\u65e5", clerical: "\u65e5", regular: "\u65e5", modern: "\u65e5",
      notes: { oracle: "Circle with a dot inside \u2014 the sun.", bronze: "Rectangular; dot centred.", seal: "Squared form.", modern: "Square with internal bar." }
    },
    "\u56fd": {
      oracle: "\u6216", bronze: "\u6216", seal: "\u56fd", clerical: "\u570b", regular: "\u570B", modern: "\u56fd",
      notes: { oracle: "\u6208 (weapon) + \u53e3 (people) \u2014 to defend.", bronze: "Enclosure begins to form.", seal: "Full enclosure: \u56d7 wraps inner element.", clerical: "Traditional \u570B with \u7389 jade inside.", regular: "Full 11-stroke traditional form.", modern: "Simplified: \u738b inside \u56d7 (1956)." }
    },
    "\u9a6c": {
      oracle: "\u99AC", bronze: "\u99AC", seal: "\u99AC", clerical: "\u99AC", regular: "\u99ac", modern: "\u9a6c",
      notes: { oracle: "Horse in full profile: mane, body, four legs.", bronze: "Mane and legs prominent.", seal: "Legs compressed to parallel strokes.", clerical: "Traditional \u99ac with four leg dots.", regular: "Full traditional form pre-1956.", modern: "\u9a6c (3 strokes) \u2014 dramatic reduction." }
    },
    "\u9c7c": {
      oracle: "\u9b5a", bronze: "\u9b5a", seal: "\u9b5a", clerical: "\u9b5a", regular: "\u9b5a", modern: "\u9c7c",
      notes: { oracle: "Fish with head, scales, and tail fin.", bronze: "Grid-like scale pattern.", seal: "Stylised fish outline.", clerical: "Traditional \u9b5a with four bottom strokes.", regular: "Full traditional form.", modern: "\u9c7c \u2014 four bottom strokes become one." }
    },
    "\u8f66": {
      oracle: "\u8eca", bronze: "\u8eca", seal: "\u8eca", clerical: "\u8eca", regular: "\u8eca", modern: "\u8f66",
      notes: { oracle: "Top-down chariot view: axle, wheels, yoke.", bronze: "Wheels and axle visible.", seal: "Balanced rectangular structure.", clerical: "Traditional \u8eca \u2014 7 strokes.", modern: "\u8f66 (4 strokes) \u2014 most dramatic simplification." }
    },
    "\u9f99": {
      oracle: "\u9f8d", bronze: "\u9f8d", seal: "\u9f8d", clerical: "\u9f8d", regular: "\u9f8d", modern: "\u9f99",
      notes: { oracle: "Dragon rearing: head, body, claws, scales.", bronze: "Serpentine body with horns.", seal: "Dragon elements compressed.", clerical: "Traditional \u9f8d \u2014 16 strokes.", modern: "\u9f99 (5 strokes) \u2014 modern marvel." }
    },
    "\u7231": {
      oracle: "\u611b", bronze: "\u611b", seal: "\u611b", clerical: "\u611b", regular: "\u611b", modern: "\u7231",
      notes: { oracle: "Walking person (\u5902) + heart (\u5fc3) \u2014 feeling.", bronze: "Hand/gift + heart.", seal: "\u65e1 (person) + \u5fc3 (heart) + \u5902 (foot).", clerical: "Traditional \u611b \u2014 13 strokes.", modern: "\u7231 \u2014 \u5fc3 replaced by \u53cb stroke." }
    },
    "\u4e66": {
      oracle: "\u7c50", bronze: "\u7c50", seal: "\u7c50", clerical: "\u66f8", regular: "\u66f8", modern: "\u4e66",
      notes: { oracle: "A hand holding a brush \u2014 pictograph of writing.", bronze: "Brush and bamboo tablet shown.", seal: "Stylised writing implement.", clerical: "Traditional \u66f8 \u2014 10 strokes.", modern: "\u4e66 (4 strokes) \u2014 simplified." }
    },
    "\u65f6": {
      oracle: "\u6642", bronze: "\u6642", seal: "\u6642", clerical: "\u6642", regular: "\u6642", modern: "\u65f6",
      notes: { oracle: "\u65e5 (sun) + \u5bfa (temple/time) \u2014 time measured by sun at temple.", seal: "Compound fully formed.", clerical: "Traditional \u6642 \u2014 10 strokes.", modern: "\u65f6 (7 strokes) \u2014 simplified." }
    },
    "\u6765": {
      oracle: "\u4f86", bronze: "\u4f86", seal: "\u4f86", clerical: "\u4f86", regular: "\u4f86", modern: "\u6765",
      notes: { oracle: "A wheat stalk \u2014 original meaning: grain coming in.", bronze: "Grain stalk with hanging seeds.", seal: "Stylised stalk form.", clerical: "Traditional \u4f86 \u2014 8 strokes.", modern: "\u6765 (7 strokes) \u2014 simplified." }
    },
    "\u4e1c": {
      oracle: "\u6771", bronze: "\u6771", seal: "\u6771", clerical: "\u6771", regular: "\u6771", modern: "\u4e1c",
      notes: { oracle: "Sun rising through a tree \u2014 east is where sun rises.", bronze: "Tree silhouette with rising sun.", seal: "Stylised tree + sun compound.", clerical: "Traditional \u6771 \u2014 8 strokes.", modern: "\u4e1c (5 strokes) \u2014 simplified." }
    },
    "\u5f00": {
      oracle: "\u958b", bronze: "\u958b", seal: "\u958b", clerical: "\u958b", regular: "\u958b", modern: "\u5f00",
      notes: { oracle: "Hands pulling a door bolt open.", seal: "Door frame + hands compound.", clerical: "Traditional \u958b \u2014 12 strokes.", modern: "\u5f00 (4 strokes) \u2014 simplified." }
    },
    "\u957f": {
      oracle: "\u9577", bronze: "\u9577", seal: "\u9577", clerical: "\u9577", regular: "\u9577", modern: "\u957f",
      notes: { oracle: "An elder with long hair \u2014 \u2018long/elder\u2019.", bronze: "Hair strands flowing from head.", seal: "Stylised long-hair figure.", clerical: "Traditional \u9577 \u2014 8 strokes.", modern: "\u957f (4 strokes) \u2014 simplified." }
    },
    "\u5934": {
      oracle: "\u982d", bronze: "\u982d", seal: "\u982d", clerical: "\u982d", regular: "\u982d", modern: "\u5934",
      notes: { oracle: "\u9875 (page/head) + \u8c46 (bean/person shape) \u2014 head.", seal: "Compound head pictograph.", clerical: "Traditional \u982d \u2014 16 strokes.", modern: "\u5934 (5 strokes) \u2014 simplified." }
    },
    "\u542c": {
      oracle: "\u807d", bronze: "\u807d", seal: "\u807d", clerical: "\u807d", regular: "\u807d", modern: "\u542c",
      notes: { oracle: "\u8033 (ear) + \u5fb7 (virtue/king listening) \u2014 to hear.", seal: "Ear + directional compound.", clerical: "Traditional \u807d \u2014 22 strokes!", modern: "\u542c (7 strokes) \u2014 dramatically simplified." }
    },
    "\u95e8": {
      oracle: "\u9580", bronze: "\u9580", seal: "\u9580", clerical: "\u9580", regular: "\u9580", modern: "\u95e8",
      notes: { oracle: "Double-door gate viewed from the front.", bronze: "Two door panels clearly shown.", seal: "Symmetrical double-door form.", clerical: "Traditional \u9580 \u2014 8 strokes.", modern: "\u95e8 (3 strokes) \u2014 simplified." }
    },
    "\u95ee": {
      oracle: "\u554f", bronze: "\u554f", seal: "\u554f", clerical: "\u554f", regular: "\u554f", modern: "\u95ee",
      notes: { oracle: "\u95e8 (door) + \u53e3 (mouth) \u2014 calling through a door.", seal: "Mouth at the door compound.", clerical: "Traditional \u554f \u2014 11 strokes.", modern: "\u95ee (6 strokes) \u2014 simplified." }
    },
    "\u8bed": {
      oracle: "\u8a9e", bronze: "\u8a9e", seal: "\u8a9e", clerical: "\u8a9e", regular: "\u8a9e", modern: "\u8bed",
      notes: { oracle: "\u8a00 (speech) + \u543e (I/my) \u2014 my speech/language.", seal: "Speech radical + phonetic.", clerical: "Traditional \u8a9e \u2014 14 strokes.", modern: "\u8bed (9 strokes) \u2014 simplified." }
    },
    "\u8bf4": {
      oracle: "\u8aaa", bronze: "\u8aaa", seal: "\u8aaa", clerical: "\u8aaa", regular: "\u8aaa", modern: "\u8bf4",
      notes: { oracle: "\u8a00 (speech) + \u5151 (exchange) \u2014 to speak.", seal: "Speech + phonetic compound.", clerical: "Traditional \u8aaa \u2014 14 strokes.", modern: "\u8bf4 (9 strokes) \u2014 simplified." }
    },
    "\u89c1": {
      oracle: "\u898b", bronze: "\u898b", seal: "\u898b", clerical: "\u898b", regular: "\u898b", modern: "\u89c1",
      notes: { oracle: "An eye on top of a person \u2014 to see.", bronze: "Eye perched on human legs.", seal: "Stylised eye-on-person compound.", clerical: "Traditional \u898b \u2014 7 strokes.", modern: "\u89c1 (4 strokes) \u2014 simplified." }
    },
    "\u98de": {
      oracle: "\u98db", bronze: "\u98db", seal: "\u98db", clerical: "\u98db", regular: "\u98db", modern: "\u98de",
      notes: { oracle: "A bird in flight with wings spread \u2014 pictograph of flying.", bronze: "Wings and body in dynamic pose.", seal: "Stylised flying form.", clerical: "Traditional \u98db \u2014 9 strokes.", modern: "\u98de (3 strokes) \u2014 simplified." }
    },
    "\u98ce": {
      oracle: "\u98a8", bronze: "\u98a8", seal: "\u98a8", clerical: "\u98a8", regular: "\u98a8", modern: "\u98ce",
      notes: { oracle: "\u51e0 (sails) + \u866b (insects swarming, wind-blown) \u2014 wind.", seal: "Sail + insect compound.", clerical: "Traditional \u98a8 \u2014 9 strokes.", modern: "\u98ce (4 strokes) \u2014 simplified." }
    },
    "\u4e91": {
      oracle: "\u96f2", bronze: "\u96f2", seal: "\u96f2", clerical: "\u96f2", regular: "\u96f2", modern: "\u4e91",
      notes: { oracle: "Billowing cloud shapes \u2014 natural pictograph.", bronze: "Cloud curves with rain below.", seal: "\u96e8 (rain) + cloud form \u2014 \u96f2.", clerical: "Traditional \u96f2 \u2014 12 strokes.", modern: "\u4e91 (4 strokes) = original cloud-only form." }
    },
    "\u6c14": {
      oracle: "\u6c23", bronze: "\u6c23", seal: "\u6c23", clerical: "\u6c23", regular: "\u6c23", modern: "\u6c14",
      notes: { oracle: "Rising vapour/breath lines \u2014 pictograph of air/steam.", bronze: "Three undulating breath-vapour lines.", seal: "Vapour + rice (\u7c73) \u2014 steam from cooking.", clerical: "Traditional \u6c23 \u2014 10 strokes.", modern: "\u6c14 (4 strokes) \u2014 simplified." }
    },
    "\u7535": {
      oracle: "\u96fb", bronze: "\u96fb", seal: "\u96fb", clerical: "\u96fb", regular: "\u96fb", modern: "\u7535",
      notes: { oracle: "Lightning bolt beneath a rain cloud \u2014 electricity from lightning.", seal: "Rain + lightning compound \u96fb.", clerical: "Traditional \u96fb \u2014 13 strokes.", modern: "\u7535 (5 strokes) \u2014 simplified." }
    },
    "\u5b66": {
      oracle: "\u5b78", bronze: "\u5b78", seal: "\u5b78", clerical: "\u5b78", regular: "\u5b78", modern: "\u5b66",
      notes: { oracle: "Hands teaching a child in a building \u2014 to learn.", bronze: "Teacher + child + roof compound.", seal: "Stylised teaching scene \u5b78.", clerical: "Traditional \u5b78 \u2014 16 strokes.", modern: "\u5b66 (8 strokes) \u2014 simplified." }
    },
    "\u4e70": {
      oracle: "\u8cb7", bronze: "\u8cb7", seal: "\u8cb7", clerical: "\u8cb7", regular: "\u8cb7", modern: "\u4e70",
      notes: { oracle: "\u8ca1 (goods) + net \u2014 catch goods in trade.", seal: "Net catching goods \u8cb7.", clerical: "Traditional \u8cb7 \u2014 12 strokes.", modern: "\u4e70 (6 strokes) \u2014 simplified." }
    },
    "\u5356": {
      oracle: "\u8ce3", bronze: "\u8ce3", seal: "\u8ce3", clerical: "\u8ce3", regular: "\u8ce3", modern: "\u5356",
      notes: { oracle: "\u58eb (person) + \u8cb7 (buy) \u2014 the other side of trade.", seal: "Seller compound \u8ce3.", clerical: "Traditional \u8ce3 \u2014 15 strokes.", modern: "\u5356 (8 strokes) \u2014 simplified." }
    },
    "\u793e": {
      oracle: "\u793e", bronze: "\u793e", seal: "\u793e", clerical: "\u793e", regular: "\u793e", modern: "\u793e",
      notes: { oracle: "\u793a (spirit/altar) + \u571f (earth) \u2014 earth altar/society.", seal: "Altar + earth compound.", modern: "Unchanged across scripts." }
    },
    "\u4e07": {
      oracle: "\u842c", bronze: "\u842c", seal: "\u842c", clerical: "\u842c", regular: "\u842c", modern: "\u4e07",
      notes: { oracle: "A scorpion \u2014 originally meant scorpion, borrowed for 10,000.", bronze: "Scorpion body and claws visible.", seal: "Stylised \u842c.", clerical: "Traditional \u842c \u2014 3 strokes (same count).", modern: "\u4e07 \u2014 simplified cursive-derived form." }
    },
    "\u4e3a": {
      oracle: "\u70ba", bronze: "\u70ba", seal: "\u70ba", clerical: "\u70ba", regular: "\u70ba", modern: "\u4e3a",
      notes: { oracle: "A hand leading an elephant \u2014 to do/make.", bronze: "Person + elephant compound.", seal: "Stylised \u70ba.", clerical: "Traditional \u70ba \u2014 9 strokes.", modern: "\u4e3a (4 strokes) \u2014 simplified." }
    },
    "\u4e0e": {
      oracle: "\u8207", bronze: "\u8207", seal: "\u8207", clerical: "\u8207", regular: "\u8207", modern: "\u4e0e",
      notes: { oracle: "Two hands extending together \u2014 to give/and.", seal: "Hands-together compound \u8207.", clerical: "Traditional \u8207 \u2014 13 strokes.", modern: "\u4e0e (3 strokes) \u2014 simplified." }
    },
    "\u4e1a": {
      oracle: "\u696d", bronze: "\u696d", seal: "\u696d", clerical: "\u696d", regular: "\u696d", modern: "\u4e1a",
      notes: { oracle: "A musical instrument frame \u2014 craft and profession.", seal: "Stylised craft/work symbol \u696d.", clerical: "Traditional \u696d \u2014 13 strokes.", modern: "\u4e1a (5 strokes) \u2014 simplified." }
    },
    "\u4e2a": {
      oracle: "\u500b", bronze: "\u500b", seal: "\u500b", clerical: "\u500b", regular: "\u500b", modern: "\u4e2a",
      notes: { oracle: "Classifier for individual things.", clerical: "Traditional \u500b \u2014 10 strokes.", modern: "\u4e2a (3 strokes) \u2014 simplified." }
    },
    "\u51fa": {
      oracle: "\u51fa", bronze: "\u51fa", seal: "\u51fa", clerical: "\u51fa", regular: "\u51fa", modern: "\u51fa",
      notes: { oracle: "A foot stepping out of an enclosure \u2014 to exit.", seal: "Foot + enclosure compound.", modern: "Unchanged across scripts." }
    },
    "\u8fdb": {
      oracle: "\u9032", bronze: "\u9032", seal: "\u9032", clerical: "\u9032", regular: "\u9032", modern: "\u8fdb",
      notes: { oracle: "A bird (\u96bc) moving into a space \u2014 to advance.", seal: "Bird + movement compound \u9032.", clerical: "Traditional \u9032 \u2014 11 strokes.", modern: "\u8fdb (7 strokes) \u2014 simplified." }
    },
    "\u8fd0": {
      oracle: "\u904b", bronze: "\u904b", seal: "\u904b", clerical: "\u904b", regular: "\u904b", modern: "\u8fd0",
      notes: { oracle: "A cart (\u8eca) moving along a road \u2014 transport.", seal: "Road + cart compound \u904b.", clerical: "Traditional \u904b \u2014 12 strokes.", modern: "\u8fd0 (7 strokes) \u2014 simplified." }
    },
    "\u5173": {
      oracle: "\u95dc", bronze: "\u95dc", seal: "\u95dc", clerical: "\u95dc", regular: "\u95dc", modern: "\u5173",
      notes: { oracle: "Two hands sealing a door \u2014 to close/concern.", seal: "Door-sealing compound \u95dc.", clerical: "Traditional \u95dc \u2014 18 strokes!", modern: "\u5173 (6 strokes) \u2014 simplified." }
    },
    "\u5c31": {
      oracle: "\u5c31", bronze: "\u5c31", seal: "\u5c31", clerical: "\u5c31", regular: "\u5c31", modern: "\u5c31",
      notes: { oracle: "A person near a high structure \u2014 to approach/accomplish.", modern: "Unchanged across scripts." }
    },
    "\u8c03": {
      oracle: "\u8abf", bronze: "\u8abf", seal: "\u8abf", clerical: "\u8abf", regular: "\u8abf", modern: "\u8c03",
      notes: { oracle: "\u8a00 (speech) + \u5468 (all around) \u2014 to coordinate/tune.", clerical: "Traditional \u8abf \u2014 15 strokes.", modern: "\u8c03 (10 strokes) \u2014 simplified." }
    },
    "\u60c5": {
      oracle: "\u60c5", bronze: "\u60c5", seal: "\u60c5", clerical: "\u60c5", regular: "\u60c5", modern: "\u60c5",
      notes: { oracle: "\u5fc3 (heart) + \u9752 (blue/pure) \u2014 feelings from the heart.", modern: "Unchanged across scripts." }
    },
    "\u5bf9": {
      oracle: "\u5c0d", bronze: "\u5c0d", seal: "\u5c0d", clerical: "\u5c0d", regular: "\u5c0d", modern: "\u5bf9",
      notes: { oracle: "Two hands meeting \u2014 facing/correct.", seal: "Hands-meeting compound \u5c0d.", clerical: "Traditional \u5c0d \u2014 14 strokes.", modern: "\u5bf9 (5 strokes) \u2014 simplified." }
    },
    "\u5f53": {
      oracle: "\u7576", bronze: "\u7576", seal: "\u7576", clerical: "\u7576", regular: "\u7576", modern: "\u5f53",
      notes: { oracle: "Granary (\u7530) + opposing forces \u2014 to serve/be.", clerical: "Traditional \u7576 \u2014 13 strokes.", modern: "\u5f53 (6 strokes) \u2014 simplified." }
    },
    "\u70ed": {
      oracle: "\u71b1", bronze: "\u71b1", seal: "\u71b1", clerical: "\u71b1", regular: "\u71b1", modern: "\u70ed",
      notes: { oracle: "Fire (\u706b) heating something \u2014 hot.", seal: "Fire compound \u71b1.", clerical: "Traditional \u71b1 \u2014 15 strokes.", modern: "\u70ed (10 strokes) \u2014 simplified." }
    },
    "\u5b9e": {
      oracle: "\u5be6", bronze: "\u5be6", seal: "\u5be6", clerical: "\u5be6", regular: "\u5be6", modern: "\u5b9e",
      notes: { oracle: "Roof (\u5b80) + goods (\u8ca1) \u2014 filled storehouse = real.", seal: "Storehouse of goods \u5be6.", clerical: "Traditional \u5be6 \u2014 14 strokes.", modern: "\u5b9e (8 strokes) \u2014 simplified." }
    },
    "\u58f0": {
      oracle: "\u8072", bronze: "\u8072", seal: "\u8072", clerical: "\u8072", regular: "\u8072", modern: "\u58f0",
      notes: { oracle: "\u8033 (ear) + instrument \u2014 sound heard.", seal: "Sound + ear compound \u8072.", clerical: "Traditional \u8072 \u2014 17 strokes.", modern: "\u58f0 (7 strokes) \u2014 simplified." }
    },
    "\u8ba4": {
      oracle: "\u8a8d", bronze: "\u8a8d", seal: "\u8a8d", clerical: "\u8a8d", regular: "\u8a8d", modern: "\u8ba4",
      notes: { oracle: "\u8a00 (speech) + \u5fcd (endure) \u2014 to acknowledge.", clerical: "Traditional \u8a8d \u2014 14 strokes.", modern: "\u8ba4 (5 strokes) \u2014 simplified." }
    },
    "\u9009": {
      oracle: "\u9078", bronze: "\u9078", seal: "\u9078", clerical: "\u9078", regular: "\u9078", modern: "\u9009",
      notes: { oracle: "\u5df1 (self) + \u8fba (movement/road) \u2014 choose your path.", clerical: "Traditional \u9078 \u2014 15 strokes.", modern: "\u9009 (9 strokes) \u2014 simplified." }
    },
  };

  // Simplified \u2192 Traditional quick-lookup for characters not in full EVO_DATA.
  // Provides the single most important historical difference: pre-reform form.
  const SIMPLIFIED_TO_TRADITIONAL = {
    "\u4e86": "\u4e86", "\u4e0d": "\u4e0d", "\u4e5f": "\u4e5f", "\u548c": "\u548c", "\u6709": "\u6709", "\u6ca1": "\u6c92",
    "\u8fd9": "\u9019", "\u90a3": "\u90a3", "\u4ec0": "\u4ec0", "\u4e48": "\u9ebc", "\u5403": "\u5403", "\u559d": "\u559d",
    "\u770b": "\u770b", "\u53bb": "\u53bb", "\u60f3": "\u60f3", "\u4f1a": "\u6703", "\u80fd": "\u80fd", "\u8981": "\u8981",
    "\u53ef": "\u53ef", "\u4ee5": "\u4ee5", "\u5e74": "\u5e74", "\u53f7": "\u865f", "\u4eca": "\u4eca", "\u660e": "\u660e",
    "\u6628": "\u6628", "\u5929": "\u5929", "\u661f": "\u661f", "\u671f": "\u671f", "\u4e0a": "\u4e0a", "\u4e0b": "\u4e0b",
    "\u5de6": "\u5de6", "\u53f3": "\u53f3", "\u524d": "\u524d", "\u540e": "\u5f8c", "\u91cc": "\u88e1", "\u5916": "\u5916",
    "\u591a": "\u591a", "\u5c11": "\u5c11", "\u597d": "\u597d", "\u574f": "\u58de", "\u51b7": "\u51b7", "\u9ad8": "\u9ad8",
    "\u4f4e": "\u4f4e", "\u8fdc": "\u9060", "\u8fd1": "\u8fd1", "\u5feb": "\u5feb", "\u6162": "\u6162", "\u65e9": "\u65e9",
    "\u665a": "\u665a", "\u65b0": "\u65b0", "\u65e7": "\u820a", "\u5c0f": "\u5c0f", "\u5730": "\u5730", "\u5bb6": "\u5bb6",
    "\u623f": "\u623f", "\u8def": "\u8def", "\u5e97": "\u5e97", "\u996d": "\u98ef", "\u7236": "\u7236", "\u6bcd": "\u6bcd",
    "\u5144": "\u5144", "\u5f1f": "\u5f1f", "\u59d0": "\u59d0", "\u59b9": "\u59b9", "\u513f": "\u5152", "\u8001": "\u8001",
    "\u5e08": "\u5e2b", "\u670b": "\u670b", "\u53cb": "\u53cb", "\u4f60": "\u4f60", "\u6211": "\u6211", "\u4ed6": "\u4ed6",
    "\u5979": "\u5979", "\u5b83": "\u5b83", "\u4eec": "\u5011", "\u5728": "\u5728", "\u4e0a": "\u4e0a", "\u4e2a": "\u500b",
    "\u751f": "\u751f", "\u697c": "\u6a13", "\u5c71": "\u5c71", "\u5317": "\u5317", "\u5357": "\u5357", "\u897f": "\u897f",
    "\u5927": "\u5927", "\u9053": "\u9053", "\u673a": "\u6a5f", "\u9898": "\u984c", "\u603b": "\u7e3d", "\u7b2c": "\u7b2c",
    "\u671f": "\u671f", "\u5e02": "\u5e02", "\u4ea4": "\u4ea4", "\u901a": "\u901a", "\u516c": "\u516c", "\u5171": "\u5171",
    "\u52a8": "\u52d5", "\u73af": "\u74b0", "\u5883": "\u5883", "\u8ba1": "\u8a08", "\u5212": "\u5283", "\u5206": "\u5206",
    "\u6cbb": "\u6cbb", "\u7406": "\u7406", "\u4ee3": "\u4ee3", "\u8868": "\u8868", "\u8003": "\u8003", "\u8bc6": "\u8b58",
    "\u5ea6": "\u5ea6", "\u80dc": "\u52dd", "\u4efb": "\u4efb", "\u52a1": "\u52d9", "\u5e9f": "\u5ee2", "\u5c55": "\u5c55",
    "\u5185": "\u5167", "\u5916": "\u5916", "\u5f39": "\u5f48", "\u5355": "\u55ae", "\u5171": "\u5171", "\u56e2": "\u5718",
    "\u5708": "\u5708", "\u753b": "\u756b", "\u5199": "\u5beb", "\u62a5": "\u5831", "\u7f51": "\u7db2", "\u7ebf": "\u7dda",
    "\u8fb9": "\u908a", "\u53d1": "\u9aee", "\u4e30": "\u8c50", "\u4ea7": "\u7522", "\u4ece": "\u5f9e", "\u5c42": "\u5c64",
    "\u8ba8": "\u8a0e", "\u8bae": "\u8b70", "\u8bba": "\u8ad6", "\u8bc4": "\u8a55", "\u8bfe": "\u8ab2", "\u8bcd": "\u8a5e",
    "\u8bef": "\u8aa4", "\u8c01": "\u8ab0", "\u8ba9": "\u8b93", "\u8bed": "\u8a9e", "\u8bf4": "\u8aaa", "\u8bfb": "\u8b80",
    "\u8d26": "\u8cec", "\u8d27": "\u8ca8", "\u8d39": "\u8cbb", "\u8d70": "\u8d70", "\u8d77": "\u8d77", "\u8d34": "\u8cbc",
    "\u5c40": "\u5c40", "\u5c71": "\u5c71", "\u573a": "\u5834", "\u5899": "\u7246", "\u5929": "\u5929", "\u5730": "\u5730",
  };

  // Get the traditional (or best historical) form for a character.
  // Returns the traditional char if different, otherwise null.
  function getTraditionalForm(char) {
    const trad = SIMPLIFIED_TO_TRADITIONAL[char];
    return (trad && trad !== char) ? trad : null;
  }

  // Build all 6 stage objects for a character.
  // For curated chars: use EVO_DATA.
  // For others: derive what we can from the traditional form + mark unknowns.
  function getEvoStages(char) {
    const d = EVO_DATA[char];
    if (d) {
      return EVO_STAGES_META.map(s => ({
        key: s.key, name: s.name, era: s.era,
        glyph: d[s.key] || char,
        note: (d.notes && d.notes[s.key]) || '',
        placeholder: false
      }));
    }
    // Derived fallback: use traditional form for regular/clerical, modern for rest
    const trad = getTraditionalForm(char);
    return EVO_STAGES_META.map(s => {
      const isHistorical = s.key === 'regular' || s.key === 'clerical';
      const glyph = (isHistorical && trad) ? trad : char;
      const hasDiff = isHistorical && trad && trad !== char;
      return {
        key: s.key, name: s.name, era: s.era,
        glyph,
        note: hasDiff
          ? `Traditional form ${trad} \u2014 used before the 1956 script simplification reform.`
          : (s.key === 'modern' ? '' : 'Historical glyph not yet catalogued for this character.'),
        placeholder: !hasDiff && s.key !== 'modern'
      };
    });
  }

  // ---- Evolution state ----
  let evoFilters = { query: '', level: 'all' };
  let evoPage = 0;
  const EVO_PAGE_SIZE = 40;
  let evoData = [];
  let evoCurrentChar = null;

  function buildEvoData() {
    evoData = HANZI_DATA.filter(item => {
      const lvNum = Number(item.h || item.l || 0);
      if (evoFilters.level !== 'all' && String(lvNum) !== evoFilters.level) return false;
      if (evoFilters.query) {
        const q = evoFilters.query.toLowerCase();
        if (!item.c.includes(q) && !(item.p || '').toLowerCase().includes(q) && !(item.m || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }

  function renderEvolutionTab() {
    buildEvoData();
    const grid = el('evolution-grid');
    if (!grid) return;
    const count = el('evolution-count');
    if (count) count.textContent = evoData.length.toLocaleString() + ' characters';
    const totalPages = Math.max(1, Math.ceil(evoData.length / EVO_PAGE_SIZE));
    if (evoPage >= totalPages) evoPage = 0;
    const pageItems = evoData.slice(evoPage * EVO_PAGE_SIZE, (evoPage + 1) * EVO_PAGE_SIZE);

    grid.innerHTML = pageItems.map(item => {
      const stages = getEvoStages(item.c);
      const ribbonHtml = stages.map(s =>
        `<div class="evo-ribbon-stage${s.placeholder ? ' placeholder' : ''}" title="${escHtml(s.name)}">` +
        `<span class="evo-ribbon-glyph">${escHtml(s.glyph)}</span>` +
        `<span class="evo-ribbon-label">${escHtml(s.name.split(' ')[0])}</span>` +
        `</div>`
      ).join('');
      const hskLabel = item.h && Number(item.h) > 0 ? (Number(item.h) <= 6 ? 'HSK ' + item.h : 'HSK 7-9') : 'Beyond';
      const meaning = formatDefinition(item.m || '');
      return `<div class="evolution-card" data-evo-char="${escHtml(item.c)}" tabindex="0" role="button" aria-label="Explore evolution of ${escHtml(item.c)}">` +
        `<div class="evolution-card-top">` +
        `<span class="evolution-card-hanzi">${escHtml(item.c)}</span>` +
        `<div class="evolution-card-meta">` +
        `<span class="evolution-card-pinyin">${escHtml(item.p || '')}</span>` +
        `<span class="evolution-card-hsk">${hskLabel}</span>` +
        `</div></div>` +
        `<div class="evolution-card-meaning">${escHtml(meaning.slice(0, 48))}</div>` +
        `<div class="evolution-card-ribbon">${ribbonHtml}</div>` +
        `</div>`;
    }).join('');

    // Pager
    const ind = el('evolution-page-indicator');
    if (ind) ind.textContent = (evoPage + 1) + ' / ' + totalPages;
    if (el('evolution-prev-page')) el('evolution-prev-page').disabled = evoPage === 0;
    if (el('evolution-next-page')) el('evolution-next-page').disabled = evoPage >= totalPages - 1;

    // Card click
    grid.querySelectorAll('.evolution-card').forEach(card => {
      card.addEventListener('click', () => openEvolutionDetail(card.dataset.evoChar));
      card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openEvolutionDetail(card.dataset.evoChar); } });
    });
  }

  function openEvolutionDetail(char) {
    evoCurrentChar = char;
    const item = HANZI_BY_CHAR[char];
    if (!item) return;

    // Switch views
    el('evolution-grid-view').classList.add('hidden');
    el('evolution-detail-view').classList.remove('hidden');
    el('evolution-detail-view').scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Hero
    el('evo-detail-char').textContent = char;
    el('evo-detail-pinyin').textContent = item.p || '—';
    el('evo-detail-meaning').textContent = formatDefinition(item.m || 'No recorded meaning.');
    const hskLabel = item.h && Number(item.h) > 0 ? (Number(item.h) <= 6 ? 'HSK ' + item.h : 'HSK 7–9') : 'Beyond HSK';
    el('evo-detail-level').textContent = hskLabel;
    el('evo-detail-freq').textContent = item.f && item.f < 99999 ? 'Frequency #' + Number(item.f).toLocaleString() : '';

    // Open drawer button
    const drawerBtn = el('evo-open-drawer');
    if (drawerBtn) {
      drawerBtn.onclick = () => openDetail(char);
    }

    // Timeline
    const stages = getEvoStages(char);
    renderEvoTimeline(stages, char);

    // Spotlight: activate first stage
    if (stages.length > 0) activateEvoStage(stages[0], char);

    // Components
    renderEvoComponents(char, item);

    // Etymology (async fetch)
    fetchWiktionaryEtymology(char);

    // Source links
    renderEvoSources(char);
  }

  function renderEvoTimeline(stages, char) {
    const timeline = el('evo-timeline');
    if (!timeline) return;
    timeline.innerHTML = stages.map((stage, idx) => {
      return `<div class="evo-stage" data-stage-idx="${idx}">` +
        `<div class="evo-stage-chip${idx === 0 ? ' active' : ''}${stage.placeholder ? ' placeholder' : ''}" tabindex="0" role="button" aria-label="${escHtml(stage.name)} form">` +
        `<span class="evo-stage-glyph">${escHtml(stage.glyph)}</span>` +
        `<span class="evo-stage-name">${escHtml(stage.name)}</span>` +
        `<span class="evo-stage-era">${escHtml(stage.era.split(' ').slice(1).join(' '))}</span>` +
        `</div></div>`;
    }).join('');

    // Wire clicks
    timeline.querySelectorAll('.evo-stage-chip').forEach((chip, idx) => {
      const stage = stages[idx];
      chip.addEventListener('click', () => {
        timeline.querySelectorAll('.evo-stage-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        activateEvoStage(stage, char);
      });
      chip.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); chip.click(); }
      });
    });
  }

  function activateEvoStage(stage, char) {
    const glyphEl = el('evo-spotlight-glyph');
    const eraEl = el('evo-spotlight-era');
    const periodEl = el('evo-spotlight-period');
    const noteEl = el('evo-spotlight-note');
    if (!glyphEl) return;

    // Animate glyph change
    glyphEl.style.opacity = '0';
    glyphEl.style.transform = 'scale(0.8)';
    setTimeout(() => {
      glyphEl.textContent = stage.glyph;
      glyphEl.style.opacity = '1';
      glyphEl.style.transform = 'scale(1)';
    }, 150);
    glyphEl.style.transition = 'opacity .15s ease, transform .15s ease';

    if (eraEl) eraEl.textContent = stage.name;
    if (periodEl) periodEl.textContent = stage.era;
    if (noteEl) {
      const item = HANZI_BY_CHAR[char];
      const defaultNote = `The ${stage.name} form of ${char} (${item ? (item.p || '') : ''}).`;
      noteEl.textContent = stage.note || defaultNote;
    }
  }

  function renderEvoComponents(char, item) {
    const comp = el('evo-components');
    if (!comp) return;
    // Extract character components from the radical and the character itself
    const components = [];
    // Add radical if found
    const radicals = (typeof RADICAL_DATA !== 'undefined' ? RADICAL_DATA : []);
    const matchedRadical = radicals.find(r => r.base === char || r.char === char || (Array.from(char).length === 1 && r.examples && r.examples.includes(char)));
    if (matchedRadical) {
      components.push({ hanzi: matchedRadical.char || matchedRadical.base || char, label: 'Radical', meaning: matchedRadical.meaning || matchedRadical.name || '' });
    }
    // Add individual character strokes as sub-characters if multi-character
    if (char.length > 1) {
      Array.from(char).forEach(c => {
        const sub = HANZI_BY_CHAR[c];
        if (sub) components.push({ hanzi: c, label: 'Component', meaning: formatDefinition(sub.m || '') });
      });
    } else {
      // For single chars, try to find characters whose radical matches this character
      const entry = item;
      // Show examples that use this char as a component
      const examples = (entry.e || []).slice(0, 3).map(w => {
        const first = HANZI_BY_CHAR[w[0]];
        return { hanzi: w, label: 'Used in', meaning: first ? formatDefinition(first.m || '') : '' };
      });
      examples.forEach(ex => components.push(ex));
    }

    if (components.length === 0) {
      comp.innerHTML = '<span style="color:var(--ink-soft);font-size:.9rem;">No component data available for this character.</span>';
      return;
    }

    comp.innerHTML = components.map(c =>
      `<button type="button" class="evo-component-chip" data-comp-char="${escHtml(c.hanzi)}">` +
      `<span class="evo-component-hanzi">${escHtml(c.hanzi)}</span>` +
      `<span class="evo-component-info">` +
      `<span class="evo-component-label">${escHtml(c.label)}</span>` +
      `<span class="evo-component-meaning">${escHtml((c.meaning || '').slice(0, 30))}</span>` +
      `</span></button>`
    ).join('');

    comp.querySelectorAll('.evo-component-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        const c = btn.dataset.compChar;
        if (c && HANZI_BY_CHAR[c]) openDetail(c);
      });
    });
  }

  function renderEvoSources(char) {
    const src = el('evo-sources');
    if (!src) return;
    const enc = encodeURIComponent(char);
    src.innerHTML = [
      { name: 'Wiktionary', desc: 'Full etymology, cognates, and historical usage notes', url: `https://en.wiktionary.org/wiki/${enc}#Chinese`, action: 'Open ↗' },
      { name: 'CHISE', desc: 'Ideographic description sequences (IDS) and component analysis', url: `http://www.chise.org/est/view/character/${enc}`, action: 'Open ↗' },
      { name: '小學堂', desc: 'Academia Sinica — oracle bone, bronze, and seal script images', url: `https://xiaoxue.iis.sinica.edu.tw/yanbian?kaiOrder=${enc}`, action: 'Open ↗' },
      { name: 'YellowBridge', desc: 'Etymology, stroke order, and related characters', url: `https://www.yellowbridge.com/chinese/character-etymology.php?zi=${enc}`, action: 'Open ↗' },
    ].map(s =>
      `<a class="evo-source-card" href="${s.url}" target="_blank" rel="noopener">` +
      `<span class="evo-source-name">${escHtml(s.name)}</span>` +
      `<span class="evo-source-desc">${escHtml(s.desc)}</span>` +
      `<span class="evo-source-action">${s.action}</span>` +
      `</a>`
    ).join('');
  }

  async function fetchWiktionaryEtymology(char) {
    const story = el('evo-story');
    if (!story) return;
    story.innerHTML = '<div class="evo-story-loading">Loading etymology…</div>';
    try {
      const enc = encodeURIComponent(char);
      const url = `https://en.wiktionary.org/api/rest_v1/page/summary/${enc}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      const extract = data.extract || '';
      if (extract && extract.length > 20) {
        story.innerHTML =
          `<p>${escHtml(extract)}</p>` +
          `<blockquote>Source: Wiktionary · <a href="https://en.wiktionary.org/wiki/${enc}#Chinese" target="_blank" rel="noopener" style="color:var(--gold-dark);">Open full entry ↗</a></blockquote>`;
      } else {
        throw new Error('No extract');
      }
    } catch {
      // Fallback: construct a minimal story from our own data
      const item = HANZI_BY_CHAR[evoCurrentChar || char];
      const m = item ? formatDefinition(item.m || '') : '';
      const fallbackText = m
        ? `<p>The character <strong>${escHtml(char)}</strong> means <em>${escHtml(m)}</em>. ` +
        `Its evolution can be traced through the script stages shown above, from ancient pictographic or ideographic forms to the modern standardised character used in contemporary Chinese.</p>` +
        `<blockquote>For a full etymology, open the <a href="https://en.wiktionary.org/wiki/${encodeURIComponent(char)}#Chinese" target="_blank" rel="noopener" style="color:var(--gold-dark);">Wiktionary entry ↗</a></blockquote>`
        : `<p>Etymology data not available offline. Open the source links below for detailed etymology information.</p>`;
      story.innerHTML = fallbackText;
    }
  }

  function initEvolution() {
    // Search
    const search = el('evolution-search');
    if (search) {
      let debounce = null;
      search.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
          evoFilters.query = search.value.trim();
          evoPage = 0;
          renderEvolutionTab();
        }, 220);
      });
    }

    // Level chips
    const levelChips = el('evolution-level-chips');
    if (levelChips) {
      levelChips.querySelectorAll('.chip').forEach(chip => {
        chip.addEventListener('click', () => {
          levelChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          evoFilters.level = chip.dataset.evoLevel || 'all';
          evoPage = 0;
          renderEvolutionTab();
        });
      });
    }

    // Pager
    const prev = el('evolution-prev-page');
    const next = el('evolution-next-page');
    if (prev) prev.addEventListener('click', () => { if (evoPage > 0) { evoPage--; renderEvolutionTab(); el('evolution-grid').scrollIntoView({ behavior: 'smooth', block: 'start' }); } });
    if (next) next.addEventListener('click', () => { evoPage++; renderEvolutionTab(); el('evolution-grid').scrollIntoView({ behavior: 'smooth', block: 'start' }); });

    // Back button
    const backBtn = el('evolution-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        el('evolution-detail-view').classList.add('hidden');
        el('evolution-grid-view').classList.remove('hidden');
        evoCurrentChar = null;
      });
    }
  }
  /* ============================================================
   END EVOLUTION MODULE
   ============================================================ */


  /* ============================================================
   PICTOGRAPHS MODULE — 象形画字与绘画工坊
   ============================================================ */

  let pictoActiveView = "gallery";
  let pictoFilterCat = "all";
  let pictoSearchQuery = "";
  let pictoShowPinyin = localStorage.getItem("hanziPictoShowPinyin") !== "0";
  let pictoShowMeaning = localStorage.getItem("hanziPictoShowMeaning") !== "0";
  let pictoActiveChar = "山";
  let pictoModalActiveLayer = "drawing";

  // Drawing Canvas State
  let pictoCanvas = null;
  let pictoCtx = null;
  let pictoIsDrawing = false;
  let pictoBrushColor = "#FFD873";
  let pictoBrushSize = 8;
  let pictoDrawHistory = [];
  let pictoGhostHanziActive = true;
  let pictoGridOverlayActive = true;
  let pictoGhostSvgActive = false;

  // Quiz State
  let pictoQuizMode = "pic2char";
  let pictoQuizItem = null;
  let pictoQuizScore = 0;
  let pictoQuizStreak = 0;
  let pictoQuizBest = 0;
  let pictoQuizAnswered = false;

  function getPictographItem(char) {
    if (typeof PICTOGRAPH_DATA === "undefined" || !PICTOGRAPH_DATA) return null;
    return PICTOGRAPH_DATA.find(p => p.c === char) || null;
  }

  function getFilteredPictographs() {
    if (typeof PICTOGRAPH_DATA === "undefined" || !PICTOGRAPH_DATA) return [];
    const q = pictoSearchQuery.trim().toLowerCase();
    return PICTOGRAPH_DATA.filter(item => {
      if (pictoFilterCat !== "all" && item.cat !== pictoFilterCat) return false;
      if (q) {
        const matchesChar = item.c.includes(q);
        const matchesPinyin = (item.p || "").toLowerCase().includes(q);
        const matchesMeaning = (item.m || "").toLowerCase().includes(q);
        if (!matchesChar && !matchesPinyin && !matchesMeaning) return false;
      }
      return true;
    });
  }

  function renderPictographsTab() {
    if (pictoActiveView === "gallery") {
      renderPictographGrid();
    } else if (pictoActiveView === "canvas") {
      renderCanvasStudio();
    } else if (pictoActiveView === "quiz") {
      renderPictographQuiz();
    }
  }

  function switchPictoView(view) {
    pictoActiveView = view;
    document.querySelectorAll(".picto-view-btn").forEach(btn => {
      const active = btn.dataset.pictoView === view;
      btn.classList.toggle("active", active);
      btn.setAttribute("aria-selected", active ? "true" : "false");
    });
    ["gallery", "canvas", "quiz"].forEach(v => {
      const pane = el("picto-view-" + v);
      if (pane) pane.classList.toggle("hidden", v !== view);
    });
    renderPictographsTab();
  }

  function renderPictographGrid() {
    const grid = el("picto-grid");
    if (!grid) return;
    const items = getFilteredPictographs();
    const countEl = el("picto-count");
    if (countEl) countEl.textContent = `${items.length} of ${typeof PICTOGRAPH_DATA !== "undefined" ? PICTOGRAPH_DATA.length : 0} pictographs`;

    if (!items.length) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 48px 16px; color: var(--cream-text);">
        <p style="font-size: 1.2rem; margin-bottom: 8px;">No pictographs match your search.</p>
        <button type="button" class="btn-secondary" id="picto-reset-filters-btn">Reset Filters</button>
      </div>`;
      el("picto-reset-filters-btn")?.addEventListener("click", () => {
        pictoFilterCat = "all";
        pictoSearchQuery = "";
        const searchInput = el("picto-search");
        if (searchInput) searchInput.value = "";
        document.querySelectorAll("#picto-category-chips .chip").forEach(c => c.classList.toggle("active", c.dataset.pictoCat === "all"));
        renderPictographGrid();
      });
      return;
    }

    grid.innerHTML = items.map(item => {
      const status = getStatus(item.c) || "new";
      const statusClass = status === "known" ? "known" : status === "learning" ? "learning" : "new";
      const statusLabel = status === "known" ? "✓ Known" : status === "learning" ? "Learning" : "New";
      const hskLabel = item.h ? `HSK ${item.h}` : "Basic";

      return `
        <article class="picto-card status-${status}" data-picto-char="${escHtml(item.c)}" tabindex="0" role="button" aria-label="${escHtml(item.c)} - ${escHtml(item.m)}">
          <span class="picto-card-status-badge ${statusClass}">${statusLabel}</span>
          <button type="button" class="picto-card-audio-btn" data-speak-char="${escHtml(item.c)}" title="Listen to ${escHtml(item.c)}">🔊</button>
          
          <div class="picto-card-art-box">
            ${item.svg}
            <div class="picto-card-hanzi-overlay">${escHtml(item.c)}</div>
          </div>
          
          <div class="picto-card-info">
            <div class="picto-card-pinyin" ${pictoShowPinyin ? "" : "hidden"}>${escHtml(item.p)}</div>
            <div class="picto-card-meaning" ${pictoShowMeaning ? "" : "hidden"} title="${escHtml(item.m)}">${escHtml(item.m)}</div>
          </div>

          <div class="picto-card-footer">
            <span class="picto-card-cat-label">${escHtml(item.cat)} · ${hskLabel}</span>
            <span class="picto-card-practice-link">Inspect ↗</span>
          </div>
        </article>
      `;
    }).join("");

    // Wire Card Clicks
    grid.querySelectorAll(".picto-card").forEach(card => {
      card.addEventListener("click", e => {
        if (e.target.closest(".picto-card-audio-btn")) {
          e.stopPropagation();
          const speakChar = e.target.closest("[data-speak-char]")?.dataset.speakChar;
          if (speakChar) playChineseAudio(speakChar, { rate: 0.85 });
          return;
        }
        openPictographModal(card.dataset.pictoChar);
      });
      card.addEventListener("keydown", e => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openPictographModal(card.dataset.pictoChar);
        }
      });
    });
  }

  /* ---- Modal Logic ---- */
  function openPictographModal(char) {
    const item = getPictographItem(char);
    if (!item) {
      openDetail(char);
      return;
    }
    pictoActiveChar = char;
    pictoModalActiveLayer = "drawing";

    // Set char & headers
    if (el("picto-modal-char")) el("picto-modal-char").textContent = item.c;
    if (el("picto-modal-pinyin")) el("picto-modal-pinyin").textContent = item.p || "—";
    if (el("picto-modal-meaning")) el("picto-modal-meaning").textContent = item.m || "";
    if (el("picto-modal-hsk")) el("picto-modal-hsk").textContent = item.h ? `HSK ${item.h}` : "Foundational";
    if (el("picto-modal-cat")) el("picto-modal-cat").textContent = item.cat || "Pictograph";
    if (el("picto-modal-story")) el("picto-modal-story").textContent = item.story || "";

    // Memory Cues
    const cuesList = el("picto-modal-cues");
    if (cuesList) {
      cuesList.innerHTML = (item.cues || []).map(c => `<li>${escHtml(c)}</li>`).join("");
    }

    // Derivatives
    const derivBox = el("picto-modal-derivatives");
    const derivSection = el("picto-modal-derivatives-section");
    if (derivBox && derivSection) {
      if (item.derivatives && item.derivatives.length) {
        derivSection.style.display = "";
        derivBox.innerHTML = item.derivatives.map(d => `<span class="picto-derivative-chip">${escHtml(d)}</span>`).join("");
      } else {
        derivSection.style.display = "none";
      }
    }

    // Art Box
    updateModalArtLayer(item, pictoModalActiveLayer);

    // Layer Controls
    document.querySelectorAll(".picto-layer-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.layer === pictoModalActiveLayer);
    });

    // Status buttons
    const status = getStatus(char) || "new";
    ["new", "learning", "known"].forEach(s => {
      el("picto-status-btn-" + s)?.classList.toggle("active", status === s);
    });

    // Open modal
    el("picto-detail-modal")?.classList.add("open");
    el("picto-detail-modal")?.setAttribute("aria-hidden", "false");
  }

  function updateModalArtLayer(item, layer) {
    const artBox = el("picto-modal-art-box");
    if (!artBox || !item) return;

    if (layer === "drawing") {
      artBox.innerHTML = item.svg;
    } else if (layer === "oracle") {
      artBox.innerHTML = `<div class="picto-modal-art-glyph" style="font-family: var(--font-hanzi); color: var(--gold-dark);">${escHtml(item.oracle || item.c)}</div>`;
    } else {
      artBox.innerHTML = `<div class="picto-modal-art-glyph">${escHtml(item.c)}</div>`;
    }
  }

  function closePictographModal() {
    el("picto-detail-modal")?.classList.remove("open");
    el("picto-detail-modal")?.setAttribute("aria-hidden", "true");
  }

  /* ---- Drawing Canvas Studio Logic ---- */
  function initDrawingCanvas() {
    pictoCanvas = el("picto-drawing-canvas");
    if (!pictoCanvas) return;
    pictoCtx = pictoCanvas.getContext("2d", { willReadFrequently: true });

    pictoCanvas.width = 340;
    pictoCanvas.height = 340;

    let lastX = 0;
    let lastY = 0;

    function saveStateToHistory() {
      if (pictoDrawHistory.length > 25) pictoDrawHistory.shift();
      pictoDrawHistory.push(pictoCtx.getImageData(0, 0, pictoCanvas.width, pictoCanvas.height));
    }

    function getCoords(e) {
      const r = pictoCanvas.getBoundingClientRect();
      const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY;
      const scaleX = pictoCanvas.width / r.width;
      const scaleY = pictoCanvas.height / r.height;
      return {
        x: (clientX - r.left) * scaleX,
        y: (clientY - r.top) * scaleY
      };
    }

    function startDraw(e) {
      e.preventDefault();
      saveStateToHistory();
      pictoIsDrawing = true;
      const pos = getCoords(e);
      lastX = pos.x;
      lastY = pos.y;

      pictoCtx.beginPath();
      pictoCtx.arc(lastX, lastY, pictoBrushSize / 2, 0, Math.PI * 2);
      pictoCtx.fillStyle = pictoBrushColor;
      pictoCtx.fill();
    }

    function draw(e) {
      if (!pictoIsDrawing) return;
      e.preventDefault();
      const pos = getCoords(e);

      pictoCtx.beginPath();
      pictoCtx.moveTo(lastX, lastY);
      pictoCtx.lineTo(pos.x, pos.y);
      pictoCtx.strokeStyle = pictoBrushColor;
      pictoCtx.lineWidth = pictoBrushSize;
      pictoCtx.lineCap = "round";
      pictoCtx.lineJoin = "round";
      pictoCtx.stroke();

      lastX = pos.x;
      lastY = pos.y;
    }

    function stopDraw(e) {
      if (pictoIsDrawing) {
        pictoIsDrawing = false;
      }
    }

    pictoCanvas.addEventListener("mousedown", startDraw);
    pictoCanvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", stopDraw);

    pictoCanvas.addEventListener("touchstart", startDraw, { passive: false });
    pictoCanvas.addEventListener("touchmove", draw, { passive: false });
    window.addEventListener("touchend", stopDraw);

    // Wire Palette
    document.querySelectorAll(".picto-color-dot").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".picto-color-dot").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        pictoBrushColor = btn.dataset.color || "#FFD873";
      });
    });

    // Wire Size Slider
    el("canvas-brush-size")?.addEventListener("input", e => {
      pictoBrushSize = Number(e.target.value) || 8;
      if (el("canvas-brush-val")) el("canvas-brush-val").textContent = `${pictoBrushSize}px`;
    });

    // Clear
    el("canvas-clear-btn")?.addEventListener("click", () => {
      if (pictoCtx) {
        saveStateToHistory();
        pictoCtx.clearRect(0, 0, pictoCanvas.width, pictoCanvas.height);
      }
    });

    // Undo
    el("canvas-undo-btn")?.addEventListener("click", () => {
      if (pictoDrawHistory.length > 0 && pictoCtx) {
        const prev = pictoDrawHistory.pop();
        pictoCtx.putImageData(prev, 0, 0);
      }
    });

    // Save Sketch
    el("canvas-save-btn")?.addEventListener("click", () => {
      if (!pictoCanvas) return;
      const dataUrl = pictoCanvas.toDataURL("image/png");
      saveUserSketch(pictoActiveChar, dataUrl);
      showToast(`Sketch of "${pictoActiveChar}" saved! 🎨`);
      renderSavedSketches();
    });

    // Toggle Grid
    el("toggle-grid-overlay")?.addEventListener("click", e => {
      pictoGridOverlayActive = !pictoGridOverlayActive;
      e.target.classList.toggle("active", pictoGridOverlayActive);
      el("picto-grid-overlay")?.classList.toggle("hidden", !pictoGridOverlayActive);
    });

    // Toggle Ghost Hanzi
    el("toggle-ghost-overlay")?.addEventListener("click", e => {
      pictoGhostHanziActive = !pictoGhostHanziActive;
      e.target.classList.toggle("active", pictoGhostHanziActive);
      el("picto-ghost-overlay")?.classList.toggle("hidden", !pictoGhostHanziActive);
    });

    // Toggle Ghost Picture
    el("toggle-ghost-picto")?.addEventListener("click", e => {
      pictoGhostSvgActive = !pictoGhostSvgActive;
      e.target.classList.toggle("active", pictoGhostSvgActive);
      el("picto-ghost-svg-overlay")?.classList.toggle("show", pictoGhostSvgActive);
    });

    // Animate Stroke
    el("btn-animate-picto-stroke")?.addEventListener("click", () => {
      playHanziWriterInCanvas(pictoActiveChar, "animate");
    });

    // Quiz Stroke
    el("btn-quiz-picto-stroke")?.addEventListener("click", () => {
      playHanziWriterInCanvas(pictoActiveChar, "quiz");
    });

    // Speak
    el("btn-speak-picto-char")?.addEventListener("click", () => {
      if (pictoActiveChar) playChineseAudio(pictoActiveChar, { rate: 0.82 });
    });
  }

  function playHanziWriterInCanvas(char, mode) {
    const hwContainer = el("picto-hanziwriter-container");
    if (!hwContainer) return;

    hwContainer.classList.remove("hidden");
    hwContainer.innerHTML = "";

    if (window.HanziWriter) {
      const writer = HanziWriter.create("picto-hanziwriter-container", char, {
        width: 340,
        height: 340,
        padding: 15,
        strokeAnimationSpeed: 1.4,
        delayBetweenStrokes: 60,
        strokeColor: "#C4841C",
        radicalColor: "#2F8F6E",
        showOutline: true,
        outlineColor: "rgba(59, 21, 18, 0.12)"
      });

      if (mode === "animate") {
        writer.animateCharacter();
      } else if (mode === "quiz") {
        writer.quiz({
          onComplete: () => {
            showToast(`Mastered stroke order for "${char}"! +10 XP 🎉`);
            awardXP(10, "Stroke Order Master");
          }
        });
      }
    }
  }

  function loadCharIntoCanvas(char) {
    pictoActiveChar = char;
    const item = getPictographItem(char);

    // Clear HanziWriter overlay
    const hw = el("picto-hanziwriter-container");
    if (hw) {
      hw.classList.add("hidden");
      hw.innerHTML = "";
    }

    if (el("canvas-active-char")) el("canvas-active-char").textContent = char;
    if (el("canvas-active-pinyin")) el("canvas-active-pinyin").textContent = item ? `${item.p} · ${item.m}` : char;
    if (el("picto-ghost-overlay")) el("picto-ghost-overlay").textContent = char;

    // Ghost SVG overlay
    const ghostSvg = el("picto-ghost-svg-overlay");
    if (ghostSvg) {
      ghostSvg.innerHTML = item ? item.svg : "";
    }

    // Sidebar
    const sideDraw = el("picto-sidebar-drawing");
    if (sideDraw) sideDraw.innerHTML = item ? item.svg : "";
    const sideStory = el("picto-sidebar-story");
    if (sideStory) sideStory.textContent = item ? item.story : "";

    // Clear canvas
    if (pictoCtx && pictoCanvas) {
      pictoCtx.clearRect(0, 0, pictoCanvas.width, pictoCanvas.height);
      pictoDrawHistory = [];
    }

    // Highlight in char picker
    document.querySelectorAll(".picto-char-pick-btn").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.char === char);
    });
  }

  function renderCanvasStudio() {
    if (!pictoCanvas) {
      initDrawingCanvas();
    }
    loadCharIntoCanvas(pictoActiveChar || "山");
    renderQuickCharPicker();
    renderSavedSketches();
  }

  function renderQuickCharPicker() {
    const container = el("picto-quick-char-grid");
    if (!container || typeof PICTOGRAPH_DATA === "undefined") return;

    container.innerHTML = PICTOGRAPH_DATA.map(p => `
      <button type="button" class="picto-char-pick-btn ${p.c === pictoActiveChar ? "active" : ""}" data-char="${escHtml(p.c)}" title="${escHtml(p.c)} · ${escHtml(p.p)} (${escHtml(p.m)})">
        ${escHtml(p.c)}
      </button>
    `).join("");

    container.querySelectorAll(".picto-char-pick-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        loadCharIntoCanvas(btn.dataset.char);
      });
    });
  }

  /* ---- Saved User Sketches ---- */
  const SKETCHES_STORAGE_KEY = "hanzi-tracker-user-sketches";

  function getUserSketches() {
    try {
      const raw = localStorage.getItem(SKETCHES_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveUserSketch(char, dataUrl) {
    try {
      const sketches = getUserSketches();
      sketches[char] = { dataUrl, timestamp: Date.now() };
      localStorage.setItem(SKETCHES_STORAGE_KEY, JSON.stringify(sketches));
    } catch (e) {
      console.warn("Could not save sketch", e);
    }
  }

  function renderSavedSketches() {
    const container = el("picto-user-sketches-grid");
    if (!container) return;
    const sketches = getUserSketches();
    const entries = Object.entries(sketches);

    if (!entries.length) {
      container.innerHTML = `<span class="picto-no-sketches">No saved sketches yet. Draw something and click "Save My Sketch"!</span>`;
      return;
    }

    container.innerHTML = entries.map(([char, data]) => `
      <div class="picto-sketch-thumb" data-char="${escHtml(char)}" title="Load sketch for ${escHtml(char)}">
        <img src="${escHtml(data.dataUrl)}" alt="Sketch of ${escHtml(char)}">
      </div>
    `).join("");

    container.querySelectorAll(".picto-sketch-thumb").forEach(thumb => {
      thumb.addEventListener("click", () => {
        const char = thumb.dataset.char;
        loadCharIntoCanvas(char);
        const img = new Image();
        img.onload = () => {
          if (pictoCtx && pictoCanvas) {
            pictoCtx.clearRect(0, 0, pictoCanvas.width, pictoCanvas.height);
            pictoCtx.drawImage(img, 0, 0);
          }
        };
        img.src = sketches[char].dataUrl;
        showToast(`Loaded saved sketch for "${char}" ✍️`);
      });
    });
  }

  /* ============================================================
   *  PICTOGRAPH QUIZ MODULE
   * ============================================================ */

  function renderPictographQuiz() {
    if (!pictoQuizItem) {
      generatePictographQuizQuestion(pictoQuizMode);
    }
  }

  function generatePictographQuizQuestion(mode) {
    pictoQuizAnswered = false;
    el("picto-quiz-feedback")?.classList.add("hidden");
    const promptBox = el("picto-quiz-prompt");
    const optGrid = el("picto-quiz-options-grid");
    if (!promptBox || !optGrid || typeof PICTOGRAPH_DATA === "undefined") return;

    // Pick target
    const targetIdx = Math.floor(Math.random() * PICTOGRAPH_DATA.length);
    const target = PICTOGRAPH_DATA[targetIdx];

    // Pick 3 distractors
    const others = PICTOGRAPH_DATA.filter((_, i) => i !== targetIdx);
    const distractors = shuffle(others).slice(0, 3);
    const choices = shuffle([target, ...distractors]);
    const correctIdx = choices.indexOf(target);

    pictoQuizItem = {
      mode,
      target,
      correctIdx,
      choices
    };

    if (mode === "pic2char") {
      promptBox.innerHTML = `
        <div class="picto-quiz-prompt-art">${target.svg}</div>
        <div class="picto-quiz-prompt-hint">Which Chinese character represents this drawing?</div>
      `;

      optGrid.innerHTML = choices.map((c, i) => `
        <button type="button" class="picto-quiz-opt-card" data-quiz-choice="${i}">
          <span class="picto-quiz-opt-char">${escHtml(c.c)}</span>
          <div class="picto-quiz-opt-info">
            <span class="picto-quiz-opt-pinyin">${escHtml(c.p)}</span>
            <span class="picto-quiz-opt-meaning">${escHtml(c.m)}</span>
          </div>
        </button>
      `).join("");
    } else if (mode === "char2pic") {
      promptBox.innerHTML = `
        <div class="picto-quiz-prompt-char">${escHtml(target.c)}</div>
        <div style="font-size:1.2rem; font-weight:800; color:var(--gold-dark);">${escHtml(target.p)} · ${escHtml(target.m)}</div>
        <div class="picto-quiz-prompt-hint">Choose the visual illustration matching this character:</div>
      `;

      optGrid.innerHTML = choices.map((c, i) => `
        <button type="button" class="picto-quiz-opt-card" data-quiz-choice="${i}" style="justify-content:center; flex-direction:column; padding:12px;">
          <div class="picto-quiz-opt-art">${c.svg}</div>
          <span style="font-size:0.85rem; font-weight:700; color:var(--cream-text); margin-top:6px;">${escHtml(c.m)}</span>
        </button>
      `).join("");
    } else {
      promptBox.innerHTML = `
        <div style="display:flex; align-items:center; gap:16px; margin-bottom:8px;">
          <div class="picto-quiz-prompt-art" style="width:90px; height:90px;">${target.svg}</div>
          <div class="picto-quiz-prompt-char" style="font-size:3.5rem;">${escHtml(target.c)}</div>
        </div>
        <div class="picto-quiz-prompt-hint">${escHtml(target.story)}</div>
      `;

      optGrid.innerHTML = choices.map((c, i) => `
        <button type="button" class="picto-quiz-opt-card" data-quiz-choice="${i}">
          <span class="picto-quiz-opt-char">${escHtml(c.c)}</span>
          <div class="picto-quiz-opt-info">
            <span class="picto-quiz-opt-pinyin">${escHtml(c.p)}</span>
            <span class="picto-quiz-opt-meaning">${escHtml(c.m)}</span>
          </div>
        </button>
      `).join("");
    }

    // Play pronunciation sound
    setTimeout(() => {
      playChineseAudio(target.c, { rate: 0.85 });
    }, 100);
  }

  function checkPictographQuizAnswer(chosenIdx) {
    if (pictoQuizAnswered || !pictoQuizItem) return;
    pictoQuizAnswered = true;
    const isCorrect = chosenIdx === pictoQuizItem.correctIdx;
    const target = pictoQuizItem.target;

    document.querySelectorAll("#picto-quiz-options-grid .picto-quiz-opt-card").forEach((card, i) => {
      if (i === pictoQuizItem.correctIdx) {
        card.classList.add("correct");
      } else if (i === chosenIdx && !isCorrect) {
        card.classList.add("wrong");
      }
    });

    const feedback = el("picto-quiz-feedback");
    const fIcon = el("picto-feedback-icon");
    const fTitle = el("picto-feedback-title");
    const fSub = el("picto-feedback-sub");

    if (isCorrect) {
      pictoQuizScore += 15;
      pictoQuizStreak++;
      pictoQuizBest = Math.max(pictoQuizBest, pictoQuizStreak);
      awardXP(15, "Pictograph Quiz Master");

      if (feedback) {
        feedback.className = "tone-quiz-feedback is-correct";
        if (fIcon) fIcon.textContent = "✓";
        if (fTitle) fTitle.textContent = "Correct! +15 XP";
        if (fSub) fSub.textContent = `${target.c} (${target.p}) · ${target.m} — ${target.story}`;
        feedback.classList.remove("hidden");
      }
      if (pictoQuizStreak > 0 && pictoQuizStreak % 5 === 0) {
        showToast(`🔥 ${pictoQuizStreak} streak on Pictograph Quiz!`);
      }
    } else {
      pictoQuizStreak = 0;
      if (feedback) {
        feedback.className = "tone-quiz-feedback is-wrong";
        if (fIcon) fIcon.textContent = "✗";
        if (fTitle) fTitle.textContent = "Not quite!";
        if (fSub) fSub.textContent = `Correct answer: ${target.c} (${target.p}) · ${target.m} — ${target.story}`;
        feedback.classList.remove("hidden");
      }
    }

    if (el("picto-quiz-score")) el("picto-quiz-score").textContent = pictoQuizScore;
    if (el("picto-quiz-streak")) el("picto-quiz-streak").textContent = pictoQuizStreak;
    if (el("picto-quiz-best")) el("picto-quiz-best").textContent = pictoQuizBest;
  }

  function initPictographs() {
    el("btn-picto-canvas-jump")?.addEventListener("click", () => switchPictoView("canvas"));
    el("btn-picto-quiz-jump")?.addEventListener("click", () => switchPictoView("quiz"));

    document.querySelectorAll(".picto-view-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        switchPictoView(btn.dataset.pictoView || "gallery");
      });
    });

    let searchDebounce;
    el("picto-search")?.addEventListener("input", e => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => {
        pictoSearchQuery = e.target.value;
        renderPictographGrid();
      }, 150);
    });

    el("picto-category-chips")?.addEventListener("click", e => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      document.querySelectorAll("#picto-category-chips .chip").forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      pictoFilterCat = chip.dataset.pictoCat || "all";
      renderPictographGrid();
    });

    el("picto-toggle-pinyin")?.addEventListener("click", e => {
      pictoShowPinyin = !pictoShowPinyin;
      localStorage.setItem("hanziPictoShowPinyin", pictoShowPinyin ? "1" : "0");
      e.target.classList.toggle("active", pictoShowPinyin);
      renderPictographGrid();
    });

    el("picto-toggle-meaning")?.addEventListener("click", e => {
      pictoShowMeaning = !pictoShowMeaning;
      localStorage.setItem("hanziPictoShowMeaning", pictoShowMeaning ? "1" : "0");
      e.target.classList.toggle("active", pictoShowMeaning);
      renderPictographGrid();
    });

    el("picto-modal-close")?.addEventListener("click", closePictographModal);
    el("picto-detail-modal")?.addEventListener("click", e => {
      if (e.target === el("picto-detail-modal")) closePictographModal();
    });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && el("picto-detail-modal")?.classList.contains("open")) {
        closePictographModal();
      }
    });

    el("picto-modal-speak")?.addEventListener("click", () => {
      if (pictoActiveChar) playChineseAudio(pictoActiveChar, { rate: 0.85 });
    });

    document.querySelectorAll(".picto-layer-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".picto-layer-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        pictoModalActiveLayer = btn.dataset.layer || "drawing";
        const item = getPictographItem(pictoActiveChar);
        if (item) updateModalArtLayer(item, pictoModalActiveLayer);
      });
    });

    ["new", "learning", "known"].forEach(s => {
      el("picto-status-btn-" + s)?.addEventListener("click", () => {
        if (!pictoActiveChar) return;
        const wasKnown = getStatus(pictoActiveChar) === "known";
        setStatusManual(pictoActiveChar, s);
        if (s === "known" && !wasKnown) {
          triggerStampFX(el("picto-modal-char"));
          spawnConfetti(el("picto-detail-modal"));
        }
        ["new", "learning", "known"].forEach(st => {
          el("picto-status-btn-" + st)?.classList.toggle("active", st === s);
        });
        syncUI();
      });
    });

    el("picto-open-in-canvas-btn")?.addEventListener("click", () => {
      closePictographModal();
      switchPictoView("canvas");
      loadCharIntoCanvas(pictoActiveChar);
    });

    el("picto-open-detail-drawer-btn")?.addEventListener("click", () => {
      closePictographModal();
      openDetail(pictoActiveChar);
    });

    el("picto-quiz-options-grid")?.addEventListener("click", e => {
      const card = e.target.closest("[data-quiz-choice]");
      if (card) {
        checkPictographQuizAnswer(Number(card.dataset.quizChoice));
      }
    });

    el("picto-quiz-next-btn")?.addEventListener("click", () => {
      generatePictographQuizQuestion(pictoQuizMode);
    });

    document.querySelectorAll(".picto-quiz-modes .tone-quiz-mode-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".picto-quiz-modes .tone-quiz-mode-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        pictoQuizMode = btn.dataset.pictoQuizMode || "pic2char";
        generatePictographQuizQuestion(pictoQuizMode);
      });
    });
  }
  /* ============================================================
   END PICTOGRAPHS MODULE
   ============================================================ */


  /* ============================================================
   THEME ENGINE MODULE — 多主题引擎与实时切换
   ============================================================ */
  const THEMES_META = {
    "cyber-neon": { name: "Midnight Cyber", metaColor: "#080B14" },
    "zen-jade": { name: "Zen Jade & Celadon", metaColor: "#071714" },
    "deep-ocean": { name: "Deep Ocean", metaColor: "#061124" },
    "sakura": { name: "Sakura Twilight", metaColor: "#160824" },
    "light-studio": { name: "Porcelain Light", metaColor: "#F1F5F9" },
    "imperial": { name: "Imperial Lacquer", metaColor: "#5A0E1F" }
  };

  let currentTheme = localStorage.getItem("hanziTheme") || "cyber-neon";

  function applyTheme(themeKey) {
    if (!THEMES_META[themeKey]) themeKey = "cyber-neon";
    currentTheme = themeKey;
    document.documentElement.setAttribute("data-theme", themeKey);
    localStorage.setItem("hanziTheme", themeKey);

    // Update theme-color meta tag
    const metaTag = document.querySelector('meta[name="theme-color"]');
    if (metaTag) metaTag.setAttribute("content", THEMES_META[themeKey].metaColor);

    // Update active state in dropdown
    document.querySelectorAll(".theme-option-btn").forEach(btn => {
      const isActive = btn.dataset.themeId === themeKey;
      btn.classList.toggle("active", isActive);
      btn.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    // Update button label
    const toggleBtn = el("theme-toggle-btn");
    if (toggleBtn) {
      const labelSpan = toggleBtn.querySelector(".theme-btn-label");
      if (labelSpan) labelSpan.textContent = THEMES_META[themeKey].name.split(" ")[0];
    }
  }

  function initThemeEngine() {
    applyTheme(currentTheme);

    const toggleBtn = el("theme-toggle-btn");
    const dropdown = el("theme-dropdown");
    if (!toggleBtn || !dropdown) return;

    toggleBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isHidden = dropdown.classList.contains("hidden");
      dropdown.classList.toggle("hidden", !isHidden);
      toggleBtn.setAttribute("aria-expanded", isHidden ? "true" : "false");
    });

    document.querySelectorAll(".theme-option-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const themeId = btn.dataset.themeId;
        if (themeId) {
          applyTheme(themeId);
          dropdown.classList.add("hidden");
          toggleBtn.setAttribute("aria-expanded", "false");
        }
      });
    });

    // Close dropdown on outside click
    document.addEventListener("click", (e) => {
      if (!dropdown.contains(e.target) && !toggleBtn.contains(e.target)) {
        dropdown.classList.add("hidden");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !dropdown.classList.contains("hidden")) {
        dropdown.classList.add("hidden");
        toggleBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();