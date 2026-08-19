/* ---------- CARD LAYOUT STATE ---------- */
const CARD_LAYOUT_KEY = "hanziTrackerCardLayout";
const DEFAULT_CARD_LAYOUT = {cols:8,size:"medium"};

function getCardLayout(){
  try{
    const saved = JSON.parse(localStorage.getItem(CARD_LAYOUT_KEY) || "null");
    if(saved && [4,5,6,8,10].includes(Number(saved.cols)) &&
       ["large","medium","small"].includes(saved.size)){
      return {cols:Number(saved.cols),size:saved.size};
    }
  }catch(e){ console.warn("[HanziTracker]", e); }
  return {...DEFAULT_CARD_LAYOUT};
}

function applyCardLayout(){
  const layout = getCardLayout();
  ["tile-grid", "radical-grid", "word-grid"].forEach(id => {
    const grid = document.getElementById(id);
    if(grid) {
      grid.classList.remove(
        "card-cols-4","card-cols-5","card-cols-6","card-cols-8","card-cols-10",
        "card-size-large","card-size-medium","card-size-small"
      );
      grid.classList.add("card-cols-" + layout.cols, "card-size-" + layout.size);
    }
  });

  document.querySelectorAll(".card-layout-btn[data-card-cols]").forEach(btn=>{
    btn.classList.toggle("active", Number(btn.dataset.cardCols) === layout.cols);
  });
  document.querySelectorAll(".card-layout-btn[data-card-size]").forEach(btn=>{
    btn.classList.toggle("active", btn.dataset.cardSize === layout.size);
  });
}

function saveCardLayout(next){
  const current = getCardLayout();
  const layout = {...current,...next};
  localStorage.setItem(CARD_LAYOUT_KEY, JSON.stringify(layout));
  applyCardLayout();
}

document.addEventListener("DOMContentLoaded", ()=>{
  document.querySelectorAll("[data-side-status]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const target=btn.dataset.sideStatus;
      const select=document.getElementById("browse-status-select");
      if(select){
        select.value=target;
        select.dispatchEvent(new Event("change",{bubbles:true}));
      }
      document.getElementById("tab-browse")?.scrollIntoView({behavior:"smooth",block:"start"});
    });
  });
  document.querySelectorAll("[data-side-sort]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const select=document.getElementById("browse-sort");
      if(select){
        select.value=btn.dataset.sideSort;
        select.dispatchEvent(new Event("change",{bubbles:true}));
      }
    });
  });
  document.querySelectorAll("[data-side-reset]").forEach(btn=>{
    btn.addEventListener("click",()=>{
      const status=document.getElementById("browse-status-select");
      if(status){status.value="all";status.dispatchEvent(new Event("change",{bubbles:true}));}
      const level=document.getElementById("browse-level-select");
      if(level){level.value="all";level.dispatchEvent(new Event("change",{bubbles:true}));}
      const srs=document.getElementById("browse-srs-select");
      if(srs){srs.value="all";srs.dispatchEvent(new Event("change",{bubbles:true}));}
      const sort=document.getElementById("browse-sort");
      if(sort){sort.value="default";sort.dispatchEvent(new Event("change",{bubbles:true}));}
      const search=document.getElementById("search-input");
      if(search){search.value="";search.dispatchEvent(new Event("input",{bubbles:true}));}
    });
  });

  document.querySelectorAll(".card-layout-btn[data-card-cols]").forEach(btn=>{
    btn.addEventListener("click",()=>saveCardLayout({cols:Number(btn.dataset.cardCols)}));
  });
  document.querySelectorAll(".card-layout-btn[data-card-size]").forEach(btn=>{
    btn.addEventListener("click",()=>saveCardLayout({size:btn.dataset.cardSize}));
  });
  applyCardLayout();
});


(function(){
  "use strict";

  const STORAGE_KEY = "hanzi-tracker-state-v1";
  let state = { progress:{}, sentenceProgress:{}, streak:{count:0,last:null}, activity:{} };
  let saveTimeout = null;
  let HANZI_BY_CHAR = {};

  function el(id){ return document.getElementById(id); }
  function escHtml(s){
    return String(s==null?"":s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  }

  /* ---------- persistence ---------- */
  const FALLBACK_STORAGE_KEY = "hanzi-tracker-state-v1";
  let usingLocalStorageFallback = false;

  async function loadState(){
    const defaults = {progress:{}, sentenceProgress:{}, wordProgress:{}, streak:{count:0,last:null}};

    // ChatGPT/host storage when available.
    try{
      if (window.storage && typeof window.storage.get === "function"){
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res && res.value){
          const parsed = JSON.parse(res.value);
          state = Object.assign(defaults, parsed);
          if (!state.progress) state.progress = {};
          if (!state.sentenceProgress) state.sentenceProgress = {};
          if (!state.wordProgress) state.wordProgress = {};
          if (!state.streak) state.streak = {count:0,last:null};
          return;
        }
      }
    }catch(e){ console.warn("[HanziTracker]", e); }

    // Standalone browser fallback.
    try{
      const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY);
      if (raw){
        const parsed = JSON.parse(raw);
        state = Object.assign(defaults, parsed);
        if (!state.progress) state.progress = {};
        if (!state.sentenceProgress) state.sentenceProgress = {};
        if (!state.wordProgress) state.wordProgress = {};
        if (!state.streak) state.streak = {count:0,last:null};
      }
      usingLocalStorageFallback = true;
    }catch(e){
      state = defaults;
      usingLocalStorageFallback = true;
    }
  }

  function ensureActivityState(){ if (!state.activity || typeof state.activity !== "object") state.activity = {}; }
  function recordActivity(kind){
    ensureActivityState();
    const key=new Date().toISOString().slice(0,10);
    if(!state.activity[key]) state.activity[key]={reviews:0,characters:0,sentences:0,words:0};
    state.activity[key].reviews=Number(state.activity[key].reviews||0)+1;
    if(kind==="character") state.activity[key].characters=Number(state.activity[key].characters||0)+1;
    if(kind==="sentence") state.activity[key].sentences=Number(state.activity[key].sentences||0)+1;
    if(kind==="word") state.activity[key].words=Number(state.activity[key].words||0)+1;
  }

  function saveState(){
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(async ()=>{
      const payload = JSON.stringify(state);

      try{
        if (window.storage && typeof window.storage.set === "function"){
          await window.storage.set(STORAGE_KEY, payload, false);
          return;
        }
      }catch(e){ console.warn("[HanziTracker]", e); }

      try{
        window.localStorage.setItem(FALLBACK_STORAGE_KEY, payload);
        usingLocalStorageFallback = true;
      }catch(e){
        showToast("Couldn't save progress just now.", true);
      }
      if (typeof debouncedSync === "function") debouncedSync();
    }, 100);
  }

  /* ---------- toast ---------- */
  function showToast(msg, isError){
    const t = document.createElement("div");
    t.className = "toast" + (isError ? " toast-error" : "");
    t.textContent = msg;
    el("toast-container").appendChild(t);
    requestAnimationFrame(()=>t.classList.add("show"));
    setTimeout(()=>{ t.classList.remove("show"); setTimeout(()=>t.remove(), 300); }, 2400);
  }

  function triggerStampFX(target){
    const node = target || el("app");
    node.classList.add("stamp-fx");
    setTimeout(()=>node.classList.remove("stamp-fx"), 480);
  }

  function spawnConfetti(target){
    const node = target || el("app");
    const rect = node.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const colors = ["#FFD873", "#F5B942", "#FF7A54", "#2F8F6E", "#FFF6E0"];
    for (let i = 0; i < 16; i++){
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
      setTimeout(()=>p.remove(), 850);
    }
  }

  /* ==========================================================================
   *  NATIVE MANDARIN AUDIO ENGINE (Youdao Neural HD + Baidu TTS Stream)
   * ========================================================================== */

  let currentActiveAudio = null;
  let activeAudioSequence = [];

  function playChineseAudio(text, options = {}){
    if (!text || typeof text !== "string") return;
    const cleanText = text.replace(/[\uFFFD\u0000-\u001F]/g, "").trim();
    if (!cleanText) return;

    const rate = options.rate || 0.88;
    const onStart = options.onStart;
    const onEnd = options.onEnd;

    if (currentActiveAudio){
      try {
        currentActiveAudio.pause();
      } catch(e){}
      currentActiveAudio = null;
    }

    // Stop any previously playing sequence
    activeAudioSequence = [];

    if (onStart) onStart();

    if (typeof Audio !== "undefined") {
      let chunks = [];
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
         const segmenter = new Intl.Segmenter('zh-CN', { granularity: 'word' });
         const segments = Array.from(segmenter.segment(cleanText));
         chunks = segments.filter(s => s.isWordLike).map(s => s.segment);
      } else {
         const chars = Array.from(cleanText).filter(ch => !/[，。！？；：“”《》、,.!?\s]/.test(ch));
         for (let i = 0; i < chars.length; i += 2) {
            chunks.push(chars.slice(i, i+2).join(''));
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
        } catch(e) {
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
        } catch(e) {
          setTimeout(playNextChunk, 50);
        }
      };

      playNextChunk();
    }
  }

  /* ---------- indexes ---------- */
  function buildIndexes(){
    HANZI_BY_CHAR = {};
    for (const item of HANZI_DATA) HANZI_BY_CHAR[item.c] = item;
  }

  function levelMatches(item, level){
    if (level === "all") return true;
    if (level === "adv") return item.h >= 7 && item.h <= 9;
    if (level === "0") return item.h === 0;
    return item.h === Number(level);
  }

  function itemLevelKey(item){
    if (item.h === 0) return "0";
    if (item.h >= 7) return "adv";
    return String(item.h);
  }

  function levelSetMatches(item, selectedSet){
    if (!selectedSet || selectedSet.size === 0) return true;
    return selectedSet.has(itemLevelKey(item));
  }

  function levelLabel(h){
    if (h === 0) return "Beyond HSK";
    if (h >= 7) return "HSK " + h + " · Advanced";
    return "HSK " + h;
  }

  const MS_PER_DAY = 86400000;

  /* ---------- status / progress core ---------- */
  function getEntry(char){ return state.progress[char] || null; }
  function getStatus(char){ const e = getEntry(char); return e ? e.status : "new"; }

  function getWordEntry(word){ return state.wordProgress[word] || null; }
  function getWordStatus(word){ const e = getWordEntry(word); return e ? e.status : "new"; }

  function writeWordEntry(word, opts){
    const now = Date.now();
    const prev = state.wordProgress[word] || { status:"new", interval:0, reviews:0, due:now, stampedAt:null };
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

  function setWordStatusManual(word, status){
    const prev = state.wordProgress[word] || { interval:0 };
    let interval = prev.interval || 0;
    if (status === "known") interval = Math.max(interval, 30);
    if (status === "new") interval = 0;
    return writeWordEntry(word, { status, interval, incrementReviews:false });
  }

  function computeWordCounts(){
    let known = 0, learning = 0;
    for (const w in state.wordProgress){
      const s = state.wordProgress[w].status;
      if (s === "known") known++; else if (s === "learning") learning++;
    }
    const total = WORD_DATA ? WORD_DATA.length : 0;
    return { known, learning, neu: Math.max(0, total - known - learning), total };
  }

  function updateWordSidebars(){
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

  function bumpStreak(){
    const today = new Date().toDateString();
    if (state.streak.last === today) return;
    if (state.streak.last){
      const diffDays = Math.round((new Date(today) - new Date(new Date(state.streak.last).toDateString())) / MS_PER_DAY);
      state.streak.count = diffDays === 1 ? (state.streak.count || 0) + 1 : 1;
    } else {
      state.streak.count = 1;
    }
    state.streak.last = today;
  }

  function writeEntry(char, opts){
    const now = Date.now();
    const prev = state.progress[char] || { status:"new", interval:0, reviews:0, due:now, stampedAt:null };
    let stampedAt = prev.stampedAt || null;
    if (opts.status === "known" && !stampedAt) stampedAt = now;
    if (opts.status !== "known") stampedAt = null;
    const due = now + (opts.interval || 0) * MS_PER_DAY;
    state.progress[char] = {
      status: opts.status,
      interval: opts.interval || 0,
      reviews: (prev.reviews || 0) + (opts.incrementReviews ? 1 : 0),
      due, stampedAt
    };
    bumpStreak();
    if (opts.incrementReviews) recordActivity("character");
    saveState();
    return state.progress[char];
  }

  function calculateRating(prev, rating){
    let interval = prev.interval || 0;
    let status = prev.status === "new" ? "learning" : prev.status;
    if (rating === "again" || rating === "new"){ interval = 0; status = "learning"; }
    else if (rating === "hard" || rating === "learning"){ interval = Math.min(3, interval ? Math.max(.5, interval * 1.2) : .5); status = "learning"; }
    else if (rating === "good"){ interval = Math.min(90, interval ? interval * 2 : 2); status = interval >= 21 ? "known" : "learning"; }
    else if (rating === "easy" || rating === "known"){ interval = Math.min(180, Math.max(30, interval ? interval * 3 : 30)); status = "known"; }
    return {status, interval};
  }

  function rateCard(char, rating){
    const prev = state.progress[char] || { status:"new", interval:0 };
    const next = calculateRating(prev, rating);
    return writeEntry(char, { status:next.status, interval:next.interval, incrementReviews:true });
  }

  function writeSentenceEntry(id, opts){
    const now = Date.now();
    const key = String(id);
    const prev = state.sentenceProgress[key] || { status:"new", interval:0, reviews:0, due:now };
    const due = now + (opts.interval || 0) * MS_PER_DAY;
    state.sentenceProgress[key] = {
      status: opts.status, interval: opts.interval || 0,
      reviews:(prev.reviews||0)+(opts.incrementReviews?1:0), due
    };
    bumpStreak();
    if (opts.incrementReviews) recordActivity("sentence");
    saveState();
    return state.sentenceProgress[key];
  }

  function getSentenceEntry(id){ return state.sentenceProgress[String(id)] || null; }
  function getSentenceStatus(id){ const e=getSentenceEntry(id); return e ? e.status : "new"; }

  // Words use the same SRS model as character/sentence cards so Word Review
  // does not become a dead-end mode with no persisted scheduling.
  if (!state.wordProgress || typeof state.wordProgress !== "object") state.wordProgress = {};
  function getWordKey(word){ return String(word || ""); }
  function getWordEntry(word){ return state.wordProgress[getWordKey(word)] || null; }
  function getWordStatus(word){ const e=getWordEntry(word); return e ? e.status : "new"; }
  function writeWordEntry(word, opts){
    const now=Date.now(); const key=getWordKey(word);
    const prev=state.wordProgress[key] || {status:"new",interval:0,reviews:0,due:now};
    const due=now + (opts.interval || 0) * MS_PER_DAY;
    state.wordProgress[key]={status:opts.status,interval:opts.interval||0,reviews:(prev.reviews||0)+(opts.incrementReviews?1:0),due};
    bumpStreak(); if(opts.incrementReviews) recordActivity("word"); saveState();
    return state.wordProgress[key];
  }
  function rateWord(word, rating){
    const prev=getWordEntry(word)||{status:"new",interval:0};
    const next=calculateRating(prev,rating);
    return writeWordEntry(word,{status:next.status,interval:next.interval,incrementReviews:true});
  }

  function getWordDueCount(){
    const now=Date.now();
    return buildWordData().filter(w=>{const e=getWordEntry(w.word);return e && e.status!=="new" && Number(e.due||0)<=now;}).length;
  }

  function rateSentence(id, rating){
    const prev = getSentenceEntry(id) || {status:"new",interval:0};
    const next = calculateRating(prev, rating);
    return writeSentenceEntry(id, {status:next.status, interval:next.interval, incrementReviews:true});
  }

  function setSentenceStatus(id, status){
    const prev = getSentenceEntry(id) || { interval:0 };
    let interval = prev.interval || 0;
    if (status === "known") interval = Math.max(interval, 30);
    if (status === "new") interval = 0;
    return writeSentenceEntry(id, { status, interval, incrementReviews:false });
  }

  function setStatusManual(char, status){
    const prev = state.progress[char] || { interval:0 };
    let interval = prev.interval || 0;
    if (status === "known") interval = Math.max(interval, 30);
    if (status === "new") interval = 0;
    return writeEntry(char, { status, interval, incrementReviews:false });
  }

  function computeCounts(){
    let known = 0, learning = 0;
    for (const c in state.progress){
      const s = state.progress[c].status;
      if (s === "known") known++; else if (s === "learning") learning++;
    }
    const total = HANZI_DATA.length;
    return { known, learning, neu: total - known - learning, total };
  }

  function getDueCount(){
    const now = Date.now();
    return getScopeData(reviewFilters.levels).filter(item=>{
      const e = getEntry(item.c);
      return e && e.status !== "new" && Number(e.due || 0) <= now;
    }).length;
  }

  /* ---------- sync ---------- */
  function updateHeaderProgress(){
    const { known, total } = computeCounts();
    const pct = total ? (known / total * 100) : 0;
    el("progress-ring").style.setProperty("--pct", pct.toFixed(2));
    el("progress-ring-label").textContent = pct.toFixed(0) + "%";
    el("header-count").textContent = known.toLocaleString() + " / " + total.toLocaleString();
  }

  function refreshDueCount(){
    const due = reviewMode === "sentences" ? getSentenceDueCount() : reviewMode === "words" ? getWordDueCount() : reviewMode === "mixed" ? (getDueCount()+getSentenceDueCount()) : getDueCount();
    el("due-count").textContent = due.toLocaleString();
  }

  function updateBrowseSidebars(){
    const counts = computeCounts();
    const visible = getFilteredData ? getFilteredData().length : counts.total;
    const set = (id,val)=>{ const n=el(id); if(n) n.textContent=Number(val).toLocaleString(); };

    set("side-visible-count", visible);
    set("side-known", counts.known);
    set("side-learning", counts.learning);
    set("side-new", counts.neu);
    set("side-progress-known", counts.known);
    set("side-progress-total", counts.total);

    const pct = counts.total ? (counts.known / counts.total * 100) : 0;
    const ring=el("side-progress-ring");
    if(ring) ring.style.setProperty("--side-pct", pct.toFixed(2));
    const pctNode=el("side-progress-pct");
    if(pctNode) pctNode.textContent=pct.toFixed(0)+"%";
  }

  function syncUI(){
    updateHeaderProgress();
    refreshDueCount();
    renderBrowse();
    updateBrowseSidebars();
    if (el("tab-progress").classList.contains("active")) renderProgress();
    if (el("tab-sentences").classList.contains("active")) renderSentences();
    if (el("tab-words") && el("tab-words").classList.contains("active")) renderWords();
    if (el("tab-radicals").classList.contains("active")) renderRadicals();
  }

  /* ---------- BROWSE ---------- */
  let browseFilters = { levels: new Set(), statuses: new Set(), srsStage:"all", query:"", sort:"default" };
  let browsePage = 0;
  const PAGE_SIZE = 96;

  function getSrsStage(char){
    const entry = getEntry(char);
    if (!entry || !entry.reviews) return "new";
    const interval = Number(entry.interval) || 0;
    if (interval >= 90) return "mastered";
    if (interval >= 21) return "mature";
    return "learning";
  }

  function getFilteredData(){
    const q = browseFilters.query.trim().toLowerCase();
    const data = HANZI_DATA.filter(item=>{
      if (!levelSetMatches(item, browseFilters.levels)) return false;
      if (browseFilters.statuses.size && !browseFilters.statuses.has(getStatus(item.c))) return false;
      if (browseFilters.srsStage !== "all" && getSrsStage(item.c) !== browseFilters.srsStage) return false;
      if (q && !(item.c.includes(q) || item.p.toLowerCase().includes(q) || item.m.toLowerCase().includes(q))) return false;
      return true;
    });

    if (browseFilters.sort === "frequency-asc"){
      return data.slice().sort((a,b)=>(Number(a.f)||999999)-(Number(b.f)||999999));
    }
    if (browseFilters.sort === "frequency-desc"){
      return data.slice().sort((a,b)=>(Number(b.f)||999999)-(Number(a.f)||999999));
    }
    return data;
  }

  let browseSelectionMode = "off";
  const selectedBrowseChars = new Set();

  function updateBrowseSelectionUI(){
    const bar = el("browse-selection-bar");
    if (!bar) return;
    bar.querySelectorAll("[data-selection-mode]").forEach(btn=>{
      btn.classList.toggle("active", btn.dataset.selectionMode === browseSelectionMode);
    });
    el("selection-count").textContent = selectedBrowseChars.size + " selected";
    const hasSelection = selectedBrowseChars.size > 0;
    bar.querySelectorAll("[data-bulk-status], #clear-selection").forEach(btn=>{
      btn.disabled = !hasSelection;
      btn.style.opacity = hasSelection ? "1" : ".45";
      btn.style.cursor = hasSelection ? "pointer" : "default";
    });
  }

  function setBrowseSelectionMode(mode){
    browseSelectionMode = mode;
    if (mode === "off") selectedBrowseChars.clear();
    if (mode === "single" && selectedBrowseChars.size > 1){
      const first = selectedBrowseChars.values().next().value;
      selectedBrowseChars.clear();
      if (first) selectedBrowseChars.add(first);
    }
    updateBrowseSelectionUI();
    renderBrowse();
  }

  function toggleBrowseSelection(char){
    if (browseSelectionMode === "off") return;
    if (browseSelectionMode === "single"){
      if (selectedBrowseChars.has(char)) selectedBrowseChars.clear();
      else { selectedBrowseChars.clear(); selectedBrowseChars.add(char); }
    } else {
      if (selectedBrowseChars.has(char)) selectedBrowseChars.delete(char);
      else selectedBrowseChars.add(char);
    }
    updateBrowseSelectionUI();
    renderBrowse();
  }

  function applyBulkBrowseStatus(status){
    const chars = Array.from(selectedBrowseChars);
    if (!chars.length) return;
    const newlyKnown = status === "known" ? chars.filter(c=>getStatus(c) !== "known").length : 0;
    chars.forEach(char=>setStatusManual(char, status));
    selectedBrowseChars.clear();
    syncUI();
    if (newlyKnown){
      const tileEls = chars.map(c=>document.querySelector('.tile[data-char="' + CSS.escape(c) + '"]')).filter(Boolean);
      if (tileEls.length){
        tileEls.forEach(el=>triggerStampFX(el));
        if (tileEls.length <= 24) tileEls.forEach(el=>spawnConfetti(el));
      }
    }
    showToast(chars.length + " card" + (chars.length === 1 ? "" : "s") + " marked " + (status === "learning" ? "Learning" : "Already known") + ".");
  }

  let browseShowPinyin = true;
  let browseShowEnglish = false;
  const flippedBrowseChars = new Set();
  let sentenceShowPinyin = false;
  let sentenceShowEnglish = false;

  function tileHTML(item){
    const status = getStatus(item.c);
    const selected = selectedBrowseChars.has(item.c);
    const flipped = flippedBrowseChars.has(item.c);
    let mark = "";
    if (status === "known") mark = '';
    else if (status === "learning") mark = '<span class="ink-dot" aria-hidden="true"></span>';
    const meaning = formatDefinition(item.m || 'No English meaning recorded.');
    return '<div class="tile selectable status-' + status + (selected ? ' selected' : '') + (flipped ? ' flipped' : '') + '" data-char="' + escHtml(item.c) + '" aria-pressed="' + (selected ? 'true' : 'false') + '" tabindex="0" role="button" aria-label="' + escHtml(item.c + ' card') + '">' +
      '<div class="tile-inner">' +
        '<div class="tile-face front">' +
          '<button type="button" class="tone-audio-btn-sm" data-speak-char="' + escHtml(item.c) + '" title="Listen" style="position:absolute; top:4px; right:4px; z-index:2;">🔊</button>' +
          '<span class="tile-hanzi">' + escHtml(item.c) + '</span>' +
          '<span class="tile-pinyin" ' + (browseShowPinyin ? '' : 'hidden') + '>' + escHtml(item.p) + '</span>' +
          '<span class="tile-english" ' + (browseShowEnglish ? '' : 'hidden') + '>' + escHtml(meaning) + '</span>' +
          mark +
        '</div>' +
        '<div class="tile-face back">' +
          '<div class="tile-back-meaning">' + escHtml(meaning) + '</div>' +
          '<div class="tile-back-pinyin">' + escHtml(item.p || '—') + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function renderBrowse(){
    const data = getFilteredData();
    const totalPages = Math.max(1, Math.ceil(data.length / PAGE_SIZE));
    if (browsePage >= totalPages) browsePage = totalPages - 1;
    if (browsePage < 0) browsePage = 0;
    const pageItems = data.slice(browsePage * PAGE_SIZE, browsePage * PAGE_SIZE + PAGE_SIZE);
    el("result-count").textContent = data.length.toLocaleString() + " character" + (data.length===1?"":"s");
    el("page-indicator").textContent = (browsePage + 1) + " / " + totalPages;
    el("prev-page").disabled = browsePage === 0;
    el("next-page").disabled = browsePage >= totalPages - 1;
    el("tile-grid").innerHTML = pageItems.map(tileHTML).join("");
    updateBrowseSelectionUI();
  }

  // Format dictionary definitions for clean display: replace slash-separated
  // alternatives with comma-separated definitions while preserving the source data.
  function formatDefinition(value){
    return String(value == null ? "" : value).replace(/\s*\/\s*/g, ", ");
  }

  /* ---------- DRAWER ---------- */
  let currentDetailChar = null;
  let currentRadicalChar = null;

  /* Sentence-first details: synonym/antonym enrichment intentionally removed. */

  function openDetail(char){
    try {
      const __c = char;
      const __item = HANZI_BY_CHAR[__c];
      const q=id=>document.getElementById(id);
      if(q("drawer-stat-char")) q("drawer-stat-char").textContent=__c||"—";
      if(q("drawer-stat-unicode") && __c) q("drawer-stat-unicode").textContent="U+"+__c.codePointAt(0).toString(16).toUpperCase().padStart(4,"0");
      if(q("drawer-stat-frequency")) q("drawer-stat-frequency").textContent=__item?.f!=null ? "#"+Number(__item.f).toLocaleString() : "—";
      if(q("drawer-stat-status")) q("drawer-stat-status").textContent=__item?.status || __item?.s || "—";
      if(q("drawer-meaning-expanded")) q("drawer-meaning-expanded").textContent=formatDefinition(__item?.m || "No recorded meaning.");
    } catch(__e) { console.warn("[HanziTracker]", __e); }

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
    el("drawer-meaning").textContent = formatDefinition(item.m || "No recorded meaning for this character.");
    el("drawer-freq").textContent = item.f < 99999 ? ("Frequency rank #" + item.f.toLocaleString()) : "Frequency rank unavailable";
    renderDetailSentences(char);
    el("drawer-examples").innerHTML = item.e.length
      ? item.e.map(w=>'<span class="example-chip">' + escHtml(w) + '</span>').join("")
      : '<span class="example-empty">No example words recorded</span>';
    ["new","learning","known"].forEach(s=> el("status-btn-" + s).classList.toggle("active", status === s));
    el("detail-drawer").classList.add("open");
    el("drawer-backdrop").classList.add("open");
  }

  function closeDetail(){
    el("detail-drawer").classList.remove("open");
    el("drawer-backdrop").classList.remove("open");
    currentDetailChar = null;
    if (typeof window.hanziWriterInstance !== "undefined" && window.hanziWriterInstance) {
      window.hanziWriterInstance.cancelQuiz();
    }
  }

  /* ---------- SENTENCES ---------- */
  let sentenceFilters = {query:"", hsk:"all", srs:"all", difficulty:"all", sort:"order"};
  let sentencePage = 0;
  let sentencePageSize = Number(localStorage.getItem("hanziSentencePageSize")) || 24;
  let sentenceLayoutCols = localStorage.getItem("hanziSentenceLayoutCols") || "3";
  let sentenceLayoutSize = localStorage.getItem("hanziSentenceLayoutSize") || "medium";
  let sentenceIndexByChar = null;

  function applySentenceLayout(){
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

  function sentencePinyin(input){
    if (!input) return "";
    if (typeof input === "object" && input.p) return input.p;
    const zh = typeof input === "string" ? input : (input.z || "");
    if (!zh) return "";
    try{
      const pinyinFn = window.pinyinPro && typeof window.pinyinPro.pinyin === "function"
        ? window.pinyinPro.pinyin
        : null;
      if (pinyinFn){
        const out = pinyinFn(zh, { toneType:"symbol", type:"string", v: true });
        if (out && typeof out === "string") return out.replace(/\s+([，。！？、；：,.!?])/g,"$1").replace(/\s+([”’）》】〉])/g,"$1");
      }
    }catch(e){ console.warn("[HanziTracker]", e); }
    const chars = Array.from(zh), out=[]; let pendingSpace=false;
    for (const ch of chars){
      const item=HANZI_BY_CHAR[ch];
      if(item && item.p){ if(pendingSpace && out.length) out.push(" "); out.push(item.p); pendingSpace=true; }
      else { if(pendingSpace && out.length && /[A-Za-z0-9]/.test(ch)) out.push(" "); out.push(ch); pendingSpace=/[\u3400-\u9FFF\uF900-\uFAFF]/.test(ch); }
    }
    return out.join("").replace(/\s+([，。！？、；：,.!?])/g,"$1");
  }

  function buildSentenceIndex(){
    if(sentenceIndexByChar) return;
    sentenceIndexByChar={};
    for(const sentence of SENTENCE_DATA){
      for(const ch of Array.from(sentence.z)){
        if(!HANZI_BY_CHAR[ch]) continue;
        if(!sentenceIndexByChar[ch]) sentenceIndexByChar[ch]=[];
        if(sentenceIndexByChar[ch].length<3) sentenceIndexByChar[ch].push(sentence);
      }
    }
  }
  function getSentencesForChar(char){ buildSentenceIndex(); return sentenceIndexByChar[char] || []; }

  function sentenceHskLevel(item){
    let max=0;
    for(const ch of Array.from(item.z||"")){ const h=HANZI_BY_CHAR[ch]?.h; if(Number.isFinite(Number(h)) && Number(h)>max) max=Number(h); }
    return max || 0;
  }
  function sentenceHskLabel(item){ const h=sentenceHskLevel(item); return h<=6 && h>0 ? "HSK "+h : "HSK 7–9+"; }
  function sentenceDifficulty(item){
    const len=Array.from(item.z||"").filter(ch=>/[\u3400-\u9FFF\uF900-\uFAFF]/.test(ch)).length;
    const h=sentenceHskLevel(item);
    if(len<=7 && h<=2) return "easy";
    if(len<=14 && h<=4) return "medium";
    return "hard";
  }
  function sentenceDifficultyLabel(item){ const d=sentenceDifficulty(item); return d==="easy"?"Beginner":d==="medium"?"Intermediate":"Advanced"; }

  function renderDetailSentences(char){
    const node=el("drawer-sentences"); if(!node) return;
    const sentences=getSentencesForChar(char);
    node.innerHTML=sentences.length ? sentences.map(sentence=>
      '<article class="drawer-sentence">'+
        '<div class="drawer-sentence-zh">'+escHtml(sentence.z)+'</div>'+
        '<div class="drawer-sentence-pinyin">'+escHtml(sentencePinyin(sentence))+'</div>'+
        '<div class="drawer-sentence-en">'+escHtml(sentence.t)+'</div>'+
      '</article>'
    ).join("") : '<div class="drawer-sentence-empty">No sentence examples recorded for this character.</div>';
  }

  function sentenceStatusLabel(item){
    const e=getSentenceEntry(item.i), now=Date.now();
    if(!e || e.status==="new") return "New";
    if(e.status==="known") return "Mastered";
    return e.due && e.due<=now ? "Due" : "Learning";
  }
  function sentenceStatusClass(item){
    const status = getSentenceStatus(item.i);
    if (status === "known") return "known";
    if (status === "learning") return "learning";
    return "new";
  }

  function getFilteredSentences(){
    const q=sentenceFilters.query.trim().toLowerCase();
    let data=SENTENCE_DATA.filter(x=>{
      if(q && !(x.z.toLowerCase().includes(q)||x.t.toLowerCase().includes(q))) return false;
      if(/[a-zA-Z]/.test(x.z)) return false;
      const h=sentenceHskLevel(x);
      if(sentenceFilters.hsk!=="all"){
        if(sentenceFilters.hsk==="adv" ? (h>0 && h<7) : h!==Number(sentenceFilters.hsk)) return false;
      }
      const d=sentenceDifficulty(x); if(sentenceFilters.difficulty!=="all" && d!==sentenceFilters.difficulty) return false;
      if(sentenceFilters.srs!=="all"){
        const st=sentenceStatusLabel(x).toLowerCase();
        if(sentenceFilters.srs==="known"){
          if(st!=="mastered" && st!=="known") return false;
        } else if(st!==sentenceFilters.srs){
          return false;
        }
      }
      return true;
    });
    if(sentenceFilters.sort==="due") data.sort((a,b)=>(getSentenceEntry(a.i)?.due||Infinity)-(getSentenceEntry(b.i)?.due||Infinity));
    else if(sentenceFilters.sort==="new") data.sort((a,b)=>Number(b.i)-Number(a.i));
    else if(sentenceFilters.sort==="length") data.sort((a,b)=>Array.from(a.z).length-Array.from(b.z).length);
    return data;
  }

  function sentenceCharsHTML(zh){
    return Array.from(zh).map(ch=> HANZI_BY_CHAR[ch]
      ? '<span class="sentence-char" data-sentence-char="'+escHtml(ch)+'" title="Open '+escHtml(ch)+' details">'+escHtml(ch)+'</span>'
      : escHtml(ch)).join("");
  }

  function sentenceCardHTML(item){
    const status = sentenceStatusLabel(item);
    const statusClass = sentenceStatusClass(item);
    const statusIcon = statusClass === "known" ? "✓" : statusClass === "learning" ? "📖" : "🆕";
    const due = getSentenceEntry(item.i)?.due;
    const wordListHTML = Array.from(new Set(Array.from(item.z).filter(ch=>HANZI_BY_CHAR[ch]))).map(ch=>'<button type="button" class="sentence-word-chip" data-sentence-char="'+escHtml(ch)+'">'+escHtml(ch)+' '+escHtml(HANZI_BY_CHAR[ch].p||"")+'</button>').join("");
    return '<article class="sentence-card status-'+escHtml(statusClass)+'" data-sentence-id="'+escHtml(item.i)+'">'+
      '<div class="sentence-card-inner">'+
        '<div class="sentence-card-face front">'+
          '<div class="sentence-card-top"><div class="sentence-badges">'+
            '<span class="sentence-badge">'+escHtml(sentenceHskLabel(item))+'</span>'+ 
            '<span class="sentence-badge">'+escHtml(sentenceDifficultyLabel(item))+'</span>'+ 
            '<span class="sentence-badge sentence-badge-status '+(status==="Due"?'due':'')+'"><span class="sentence-status-icon">'+escHtml(statusIcon)+'</span> '+escHtml(status)+'</span>'+ 
          '</div><button type="button" class="sentence-audio" data-speak-sentence="'+escHtml(item.i)+'" title="Listen">🔊</button></div>'+ 
          '<div class="sentence-zh">'+sentenceCharsHTML(item.z)+'</div>'+ 
          (sentenceShowPinyin ? '<div class="sentence-pinyin" style="margin-top: 8px;">'+escHtml(sentencePinyin(item))+'</div>' : '') +
          (sentenceShowEnglish ? '<div class="sentence-en" style="margin-top: 8px;">'+escHtml(item.t)+'</div>' : '') +
          '<div class="sentence-meta"><span>'+escHtml(due && status==="Learning" ? "Next review: "+new Date(due).toLocaleDateString() : "Click to reveal")+'</span></div>'+
        '</div>'+
        '<div class="sentence-card-face back">'+
          '<div class="sentence-hidden-detail open" data-pinyin-panel="'+escHtml(item.i)+'"><div class="sentence-pinyin">'+escHtml(sentencePinyin(item))+'</div></div>'+ 
          '<div class="sentence-hidden-detail open" data-english-panel="'+escHtml(item.i)+'"><div class="sentence-en">'+escHtml(item.t)+'</div></div>'+ 
          '<div class="sentence-word-list" style="margin-top: 12px; display: flex; flex-wrap: wrap; gap: 6px; justify-content: center;">'+wordListHTML+'</div>'+
          '<div class="sentence-meta" style="margin-top: auto;">'+
            '<div class="sentence-meta-actions"><button type="button" class="sentence-review-btn" data-review-sentence="'+escHtml(item.i)+'">Study</button></div>'+ 
          '</div>'+
        '</div>'+
      '</div>'+
    '</article>';
  }

  function renderSentenceDashboard(){
    const now=Date.now();
    const due=SENTENCE_DATA.filter(x=>{const e=getSentenceEntry(x.i);return e&&e.status!=="new"&&e.status!=="known"&&e.due<=now;}).length;
    const fresh=SENTENCE_DATA.filter(x=>getSentenceStatus(x.i)==="new").length;
    const known=SENTENCE_DATA.filter(x=>getSentenceStatus(x.i)==="known").length;
    el("sentence-stat-due").textContent=due.toLocaleString();
    el("sentence-stat-new").textContent=fresh.toLocaleString();
    el("sentence-stat-known").textContent=known.toLocaleString();
    el("sentence-stat-streak").textContent=state.streak.count||0;
  }

  function renderSentences(){
    renderSentenceDashboard();
    applySentenceLayout();
    const data=getFilteredSentences();
    const totalPages=Math.max(1,Math.ceil(data.length/sentencePageSize));
    if(sentencePage>=totalPages) sentencePage=totalPages-1; if(sentencePage<0) sentencePage=0;
    const pageItems=data.slice(sentencePage*sentencePageSize,sentencePage*sentencePageSize+sentencePageSize);
    el("sentence-count").textContent=data.length.toLocaleString()+" sentences";
    el("sentence-page-indicator").textContent=(sentencePage+1)+" / "+totalPages;
    el("sentence-prev-page").disabled=sentencePage===0; el("sentence-next-page").disabled=sentencePage>=totalPages-1;
    el("sentence-grid").innerHTML=pageItems.length?pageItems.map(sentenceCardHTML).join(""):'<div class="sentence-empty">No sentences match your filters.</div>';
  }

  function speakSentence(item){
    if(!item) return;
    const text = typeof item === "string" ? item : (item.z || "");
    playChineseAudio(text, { rate: 0.9 });
  }

  function openSentenceDetails(id){
    const item=SENTENCE_DATA.find(x=>String(x.i)===String(id)); if(!item) return;
    el("sentence-detail-zh").textContent=item.z;
    el("sentence-detail-pinyin").textContent=sentencePinyin(item);
    el("sentence-detail-en").textContent=item.t;
    el("sentence-word-list").innerHTML=Array.from(new Set(Array.from(item.z).filter(ch=>HANZI_BY_CHAR[ch]))).map(ch=>'<button type="button" class="sentence-word-chip" data-sentence-char="'+escHtml(ch)+'">'+escHtml(ch)+' '+escHtml(HANZI_BY_CHAR[ch].p||"")+'</button>').join("");
    el("sentence-detail-review").dataset.reviewSentence=id;
    updateSentenceDetailStatusUI(id);
    el("sentence-detail-modal").classList.add("open");
    el("sentence-detail-modal").setAttribute("aria-hidden","false");
  }
  function updateSentenceDetailStatusUI(id){
    const status = getSentenceStatus(id);
    const label = status === "known" ? "Mastered" : status === "learning" ? "Learning" : "New";
    el("sentence-detail-status").textContent = label;
    ["new","learning","known"].forEach(s=>{
      const btn = el("sentence-status-btn-" + s);
      if (btn) btn.classList.toggle("active", status === s);
    });
  }
  function closeSentenceDetails(){ el("sentence-detail-modal").classList.remove("open"); el("sentence-detail-modal").setAttribute("aria-hidden","true"); }

  function openSentenceReview(id){
    const tab=document.querySelector('.tab-btn[data-tab="review"]'); if(tab) tab.click();
    reviewMode="sentences"; setReviewModeUI();
    reviewQueue=SENTENCE_DATA.filter(x=>String(x.i)===String(id)).map(x=>({...x,__reviewType:"sentence"})); reviewIndex=0; sessionStats={reviewed:0,known:0,correct:0,streak:0,bestStreak:0,characters:0,sentences:0,mistakes:[],skipped:0,flagged:0}; reviewStartedAt=Date.now();
    if(!reviewQueue.length){showToast("Sentence not found.",true);return;}
    el("review-setup").classList.add("hidden"); el("review-summary").classList.add("hidden"); el("review-session").classList.remove("hidden"); showCard();
  }

  /* ---------- REVIEW ---------- */
  let reviewFilters = { levels: new Set() };
  let reviewMode = "characters";

  let reviewQueue = [];
  let reviewIndex = 0;
  let reviewRevealed = false;
  let sessionStats = { reviewed:0, known:0, correct:0, streak:0, bestStreak:0, characters:0, sentences:0, mistakes:[], skipped:0, flagged:0 };
  let reviewDifficulty = "all";
  let reviewFocusWeak = false;
  let reviewFocusMode = false;
  let reviewStartedAt = null;
  // Sentence reveal preferences persist across cards and sessions.
  let reviewShowPinyin = localStorage.getItem("hanziReviewShowPinyin") !== "false";
  let reviewShowEnglish = localStorage.getItem("hanziReviewShowEnglish") !== "false";

  function getScopeData(levelSet){
    return HANZI_DATA.filter(item=> levelSetMatches(item, levelSet));
  }

  function getSentenceDueCount(){
    const now = Date.now();
    return SENTENCE_DATA.filter(item=>{ const e=getSentenceEntry(item.i); return e && e.status !== "new" && e.status !== "known" && Number(e.due||0) <= now; }).length;
  }

  function shuffle(arr){
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function setReviewModeUI(){
    document.querySelectorAll("[data-review-mode]").forEach(btn=>btn.classList.toggle("active",btn.dataset.reviewMode===reviewMode));
    const chars = reviewMode === "characters";
    const sentences = reviewMode === "sentences";
    const mixed = reviewMode === "mixed";
    el("review-level-chips").style.display = (chars||mixed) ? "flex" : "none";
    el("review-scope-hint").textContent = chars ? "Tap multiple chips to combine levels" : sentences ? "Sentence review uses the sentence collection." : mixed ? "Smart Review will mix your highest-priority characters and sentences." : "Word review uses your generated word collection.";
    el("new-pool-label").textContent = chars ? "characters" : sentences ? "sentences" : mixed ? "items" : "words";
    document.querySelectorAll('input[name="pool"]').forEach(r=>{ r.checked = r.value === "smart"; });
    refreshDueCount(); updateReviewEstimate();
  }

  function reviewDifficultyMatch(item, mode){
    if(reviewDifficulty==="all") return true;
    if(mode==="sentences") return sentenceDifficulty(item)===reviewDifficulty;
    if(mode==="characters"){
      const h=Number(item.h||0); return reviewDifficulty==="easy" ? h<=2 : reviewDifficulty==="medium" ? h<=4 : h>=5;
    }
    return true;
  }

  function smartScore(item, mode){
    const e=mode==="sentences"?getSentenceEntry(item.i):getEntry(item.c); if(!e) return 100;
    const due=e.due&&e.due<=Date.now()?100000:0;
    const reviews=Number(e.reviews||0); const interval=Number(e.interval||0);
    return due + (reviewFocusWeak?(reviews*5000 + (interval<=1?3000:0)):reviews*100) - interval;
  }

  function buildPool(poolType){
    const now=Date.now();
    const buildChars=()=>{
      const scope=getScopeData(reviewFilters.levels);
      let data=scope.filter(item=>reviewDifficultyMatch(item,"characters"));
      if(poolType==="due") return data.filter(item=>{const e=getEntry(item.c);return e&&e.status!=="new"&&Number(e.due||0)<=now;});
      if(poolType==="new") return data.filter(item=>getStatus(item.c)==="new");
      if(poolType==="all") return data.filter(item=>getStatus(item.c)!=="known");
      return data.filter(item=>{
        const e=getEntry(item.c);
        return getStatus(item.c)!=="known" || (e && Number(e.due||0)<=now);
      }).sort((a,b)=>smartScore(b,"characters")-smartScore(a,"characters"));
    };
    const buildSentences=()=>{
      let data=SENTENCE_DATA.filter(item=>reviewDifficultyMatch(item,"sentences"));
      if(poolType==="due") return data.filter(item=>{const e=getSentenceEntry(item.i);return e&&e.status!=="new"&&e.status!=="known"&&Number(e.due||0)<=now;});
      if(poolType==="new") return data.filter(item=>getSentenceStatus(item.i)==="new");
      if(poolType==="all") return data.filter(item=>getSentenceStatus(item.i)!=="known");
      return data.filter(item=>{
        const e=getSentenceEntry(item.i);
        return getSentenceStatus(item.i)!=="known" || (e && Number(e.due||0)<=now);
      }).sort((a,b)=>smartScore(b,"sentences")-smartScore(a,"sentences"));
    };
    if(reviewMode==="characters") return buildChars();
    if(reviewMode==="sentences") return buildSentences();
    if(reviewMode==="mixed"){
      const c=buildChars().map(x=>({...x,__reviewType:"character"})); const se=buildSentences().map(x=>({...x,__reviewType:"sentence"}));
      return shuffle([...c,...se]).sort((a,b)=>smartScore(b,a.__reviewType+"s".replace("character","characters").replace("sentence","sentences"))-smartScore(a,a.__reviewType+"s".replace("character","characters").replace("sentence","sentences")));
    }
    let words=buildWordData().filter(w=>w.word&&w.corpusCount>0);
    if(poolType==="due") words=words.filter(w=>{const e=getWordEntry(w.word);return e&&e.status!=="new"&&Number(e.due||0)<=now;});
    else if(poolType==="new") words=words.filter(w=>getWordStatus(w.word)==="new");
    else if(poolType==="all") words=words.filter(w=>getWordStatus(w.word)!=="known");
    else words=words.filter(w=>{
      const e=getWordEntry(w.word);
      return getWordStatus(w.word)!=="known" || (e && Number(e.due||0)<=now);
    }).sort((a,b)=>{
      const ea=getWordEntry(a.word), eb=getWordEntry(b.word);
      const score=e=>{if(!e) return 100; const due=e.due&&e.due<=now?100000:0; return due+(Number(e.reviews||0)*100)-Number(e.interval||0);};
      return score(eb)-score(ea)||(b.corpusCount-a.corpusCount);
    });
    return words.slice(0,500).map(w=>({...w,__reviewType:"word"}));
  }

  function updateReviewEstimate(){
    if(!el("review-ready-count")) return;
    const poolType=document.querySelector('input[name="pool"]:checked')?.value||"smart";
    const pool=buildPool(poolType); const size=Number(el("session-size")?.value||20); const ready=Math.min(size,pool.length);
    const smartPool=buildPool("smart");
    const newPool=buildPool("new");
    const allPool=buildPool("all");
    el("review-ready-count").textContent=pool.length.toLocaleString();
    el("smart-count").textContent=smartPool.length.toLocaleString();
    if(el("new-count")) el("new-count").textContent=newPool.length.toLocaleString();
    if(el("all-count")) el("all-count").textContent=allPool.length.toLocaleString();
    el("review-estimated-min").textContent=(Math.max(1,Math.ceil(ready*.35))+"–"+(Math.max(2,Math.ceil(ready*.65)))+" min");
    const total=pool.reduce((n,x)=>{
      let e=null;
      if(x.__reviewType==="sentence" || reviewMode==="sentences") e=getSentenceEntry(x.i);
      else if(x.__reviewType==="word" || reviewMode==="words") e=getWordEntry(x.word);
      else e=getEntry(x.c);
      return n+Number(e?.reviews||0);
    },0);
    el("review-estimated-accuracy").textContent=total?Math.round(Math.min(98,55+total*2))+"%":"—";
  }

  function startReview(){
    reviewShowPinyin = el("review-show-pinyin").checked; reviewShowEnglish = el("review-show-english").checked;
    localStorage.setItem("hanziReviewShowPinyin", String(reviewShowPinyin)); localStorage.setItem("hanziReviewShowEnglish", String(reviewShowEnglish));
    const poolType=document.querySelector('input[name="pool"]:checked').value; const size=Number(el("session-size").value);
    let pool=buildPool(poolType); if(!pool.length){showToast("No items match this review setup.");return;}
    if(poolType!=="smart") pool=shuffle(pool); reviewQueue=pool.slice(0,size); reviewIndex=0;
    sessionStats={reviewed:0,known:0,correct:0,streak:0,bestStreak:0,characters:0,sentences:0,mistakes:[],skipped:0,flagged:0};
    reviewStartedAt=Date.now(); window.__reviewRatingBusy=false; reviewFocusMode=false; el("review-session").classList.remove("focus-mode");
    el("review-setup").classList.add("hidden"); el("review-summary").classList.add("hidden"); el("review-session").classList.remove("hidden"); showCard();
  }

  function fitSentenceLine(el){
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

  function showCard(){
    if(!reviewQueue.length || reviewIndex < 0 || reviewIndex >= reviewQueue.length) return;
    reviewRevealed=false;
    const item=reviewQueue[reviewIndex];
    if(!item) return;
    const type=item.__reviewType || (reviewMode==="sentences"?"sentence":reviewMode==="words"?"word":"character");
    const sentenceMode=type==="sentence";
    const wordMode=type==="word";
    el("flashcard").classList.toggle("sentence-flashcard",sentenceMode);
    el("review-session").classList.toggle("sentence-review-active",sentenceMode);
    el("flashcard").classList.remove("revealed");
    el("fc-hanzi").hidden=sentenceMode||wordMode;
    el("fc-sentence-front").hidden=!sentenceMode;
    el("fc-hanzi-small").hidden=sentenceMode;
    el("fc-pinyin").hidden=sentenceMode;
    el("fc-meaning").hidden=sentenceMode;
    el("fc-examples").hidden=sentenceMode;
    el("fc-sentence-back").hidden=!sentenceMode;
    el("fc-sentence-pinyin").hidden=true;
    el("fc-sentence-en").hidden=true;
    el("fc-related").hidden=true;
    if(el("review-example-toggle")) el("review-example-toggle").style.display = sentenceMode ? "none" : "";

    if(sentenceMode){
      el("fc-sentence-front").textContent=item.z || "";
      el("fc-sentence-back").textContent=item.z || "";
      el("fc-sentence-pinyin").textContent=sentencePinyin(item) || "";
      el("fc-sentence-en").textContent=item.t || "";
      fitSentenceLine(el("fc-sentence-front"));
      fitSentenceLine(el("fc-sentence-back"));
      el("review-card-reason").textContent=getSentenceEntry(item.i)?.due<=Date.now()?"🔴 Due for review":"🟡 Learning sentence";
    } else if(wordMode){
      el("fc-hanzi").hidden=false;
      el("fc-hanzi").textContent=item.word;
      el("fc-hanzi-small").hidden=true;
      el("fc-pinyin").hidden=false;
      el("fc-pinyin").textContent=item.pinyin||"—";
      el("fc-meaning").hidden=false;
      el("fc-meaning").textContent=item.english||"No English translation in the current sentence data.";
      el("fc-examples").hidden=false;
      el("fc-examples").innerHTML=(item.exampleTranslations||[]).slice(0,3).map(x=>'<span class="example-chip">'+escHtml(x)+"</span>").join("");
      el("review-card-reason").textContent="🧩 Word · "+Number(item.corpusCount||0).toLocaleString()+" corpus uses";
    } else {
      el("fc-hanzi").textContent=item.c;
      el("fc-hanzi-small").textContent=item.c;
      el("fc-pinyin").hidden=false;
      el("fc-pinyin").textContent=item.p||"—";
      el("fc-meaning").textContent=formatDefinition(item.m||"No recorded meaning.");
      el("fc-examples").innerHTML=item.e?.length?item.e.map(w=>'<span class="example-chip">'+escHtml(w)+"</span>").join(""):"";
      const e=getEntry(item.c);
      el("review-card-reason").textContent=e?.due&&e.due<=Date.now()?"🔴 Due for review":(e?.reviews>=2?"🟡 Previously missed / weak":"🆕 New item");
      const related=[...(item.e||[])].slice(0,3);
      try{const wordRelated=buildWordData().filter(w=>w.word.includes(item.c)).slice(0,3).map(w=>w.word+" · "+(w.pinyin||""));related.push(...wordRelated);}catch(e){ console.warn("[HanziTracker]", e); }
      if(related.length){el("fc-related").hidden=false;el("fc-related-list").innerHTML=related.slice(0,6).map(w=>'<span class="fc-related-chip">'+escHtml(w)+"</span>").join("");}
    }

    el("review-pinyin-toggle").classList.toggle("active",reviewShowPinyin);
    el("review-english-toggle").classList.toggle("active",reviewShowEnglish);
    el("review-example-toggle").classList.remove("active");
    el("review-pinyin-toggle").textContent=reviewShowPinyin?"Hide pinyin":"Show pinyin";
    el("review-english-toggle").textContent=reviewShowEnglish?"Hide English":"Show English";
    el("fc-pinyin").hidden=!reviewShowPinyin || sentenceMode;
    if(sentenceMode){el("fc-sentence-pinyin").hidden=!reviewShowPinyin;el("fc-sentence-en").hidden=!reviewShowEnglish;}
    el("reveal-btn").classList.remove("hidden");
    el("rate-buttons").classList.add("hidden");
    el("review-progress-fill").style.width=((reviewIndex/reviewQueue.length)*100)+"%";
    el("review-counter").textContent=(reviewIndex+1)+" / "+reviewQueue.length;
    updateLiveReviewStats();
  }

  function revealCard(){
    if(reviewRevealed || !reviewQueue.length || reviewIndex >= reviewQueue.length) return;
    reviewRevealed=true;
    el("flashcard").classList.add("revealed");
    el("reveal-btn").classList.add("hidden");
    el("rate-buttons").classList.remove("hidden");
    const item=reviewQueue[reviewIndex];
    const type=item.__reviewType||(reviewMode==="sentences"?"sentence":reviewMode==="words"?"word":"character");
    if(type==="sentence"){
      el("fc-sentence-pinyin").hidden=!reviewShowPinyin;
      el("fc-sentence-en").hidden=!reviewShowEnglish;
    }else{
      el("fc-pinyin").hidden=!reviewShowPinyin;
      el("fc-meaning").hidden=false;
    }
  }

  function updateLiveReviewStats(){
    const total=sessionStats.reviewed;
    el("live-reviewed").textContent=total;
    el("live-accuracy").textContent=total?Math.round(sessionStats.correct/total*100)+"%":"—";
    el("live-streak").textContent=sessionStats.streak||0;
    el("live-streak").classList.toggle("hot-streak", sessionStats.streak > 5);
  }

  function rateCurrent(rating){
    if(!reviewRevealed || !reviewQueue.length || reviewIndex < 0 || reviewIndex >= reviewQueue.length) return;
    if(window.__reviewRatingBusy) return;
    window.__reviewRatingBusy=true;

    const currentIndex=reviewIndex;
    const item=reviewQueue[currentIndex];
    let rated=false;

    try{
      if(!item) throw new Error("Review item unavailable");
      const type=item.__reviewType || (reviewMode==="sentences"?"sentence":reviewMode==="words"?"word":"character");
      let entry=null, prevStatus="new";

      if(type==="word"){
        prevStatus=getWordStatus(item.word);
        entry = rateWord(item.word, rating);
        sessionStats.reviewed++;
        if(rating==="known"){
          sessionStats.correct++;
          sessionStats.streak++;
          sessionStats.bestStreak=Math.max(sessionStats.bestStreak,sessionStats.streak);
        }else{
          sessionStats.mistakes.push(item);
          sessionStats.streak=0;
        }
        if(entry?.status==="known" && prevStatus!=="known"){
          sessionStats.known++;
          triggerStampFX(el("flashcard"));
          spawnConfetti(el("flashcard"));
        }
      }else{
        prevStatus=type==="sentence"?getSentenceStatus(item.i):getStatus(item.c);
        entry=type==="sentence"?rateSentence(item.i,rating):rateCard(item.c,rating);
        sessionStats.reviewed++;
        if(type==="sentence") sessionStats.sentences++; else sessionStats.characters++;
        if(rating==="known"){
          sessionStats.correct++;
          sessionStats.streak++;
          sessionStats.bestStreak=Math.max(sessionStats.bestStreak,sessionStats.streak);
        }else{
          sessionStats.mistakes.push(item);
          sessionStats.streak=0;
        }
        if(entry?.status==="known" && prevStatus!=="known"){
          sessionStats.known++;
          triggerStampFX(el("flashcard"));
          spawnConfetti(el("flashcard"));
        }
      }
      rated=true;
    }catch(err){
      console.error("Review rating failed",err);
      // Rating/state changes may already have been persisted before a UI operation failed.
      // Never leave the review session locked on the same card.
    }

    if(!rated){
      window.__reviewRatingBusy=false;
      showToast("Could not save this rating. Please try again.");
      return;
    }

    reviewRevealed=false;
    reviewIndex=currentIndex+1;

    try{
      updateLiveReviewStats();
    }catch(e){ console.warn("Review stats update failed",e); }

    if(reviewIndex>=reviewQueue.length){
      window.__reviewRatingBusy=false;
      finishReview();
      return;
    }

    // The rating is already saved. Advance the queue independently of UI redraws.
    try{
      showCard();
    }catch(err){
      console.error("Review card render failed",err);
      const next=reviewQueue[reviewIndex];
      // Full fallback render: never leave the previous card's meaning/pinyin/examples behind.
      try{
        const type=next?.__reviewType || (reviewMode==="sentences"?"sentence":reviewMode==="words"?"word":"character");
        const sentenceMode=type==="sentence";
        const wordMode=type==="word";
        const face=el("flashcard");
        face.classList.remove("revealed","sentence-flashcard");
        el("review-session").classList.remove("sentence-review-active");
        el("fc-sentence-front").hidden=!sentenceMode;
        el("fc-sentence-back").hidden=!sentenceMode;
        el("fc-hanzi").hidden=sentenceMode;
        el("fc-hanzi-small").hidden=sentenceMode||wordMode;
        el("fc-pinyin").hidden=sentenceMode;
        el("fc-meaning").hidden=sentenceMode;
        el("fc-examples").hidden=sentenceMode;
        el("fc-related").hidden=true;
        el("fc-sentence-pinyin").hidden=true;
        el("fc-sentence-en").hidden=true;
        if(sentenceMode){
          el("fc-sentence-front").textContent=next?.z||"";
          el("fc-sentence-back").textContent=next?.z||"";
          el("fc-sentence-pinyin").textContent=sentencePinyin(next)||"";
          el("fc-sentence-en").textContent=next?.t||"";
        }else if(wordMode){
          const wordMeaning=next?.meaning || next?.english || "No English translation available.";
          el("fc-hanzi").textContent=next?.word||"";
          el("fc-pinyin").textContent=next?.pinyin||"—";
          el("fc-meaning").textContent=wordMeaning;
          el("fc-examples").innerHTML=(next?.exampleTranslations||[]).slice(0,3).map(x=>'<span class="example-chip">'+escHtml(x)+"</span>").join("");
        }else{
          const meaning=formatDefinition(next?.m||"No recorded meaning.");
          el("fc-hanzi").textContent=next?.c||"";
          el("fc-hanzi-small").textContent=next?.c||"";
          el("fc-pinyin").textContent=next?.p||"—";
          el("fc-meaning").textContent=meaning;
          el("fc-examples").innerHTML=(next?.e||[]).map(w=>'<span class="example-chip">'+escHtml(w)+"</span>").join("");
        }
        el("reveal-btn").classList.remove("hidden");
        el("rate-buttons").classList.add("hidden");
        el("review-progress-fill").style.width=((reviewIndex/reviewQueue.length)*100)+"%";
        el("review-counter").textContent=(reviewIndex+1)+" / "+reviewQueue.length;
        updateLiveReviewStats();
      }catch(fallbackErr){
        console.error("Review fallback render failed",fallbackErr);
      }
    }
    window.__reviewRatingBusy=false;
  }

  function skipCurrent(){ if(!reviewQueue.length)return; sessionStats.skipped++; reviewIndex++; if(reviewIndex>=reviewQueue.length)finishReview(); else showCard(); }
  function flagCurrent(){ sessionStats.flagged++; showToast("Flagged for later review."); }
  function updateReviewReveal(which){
    if(which==="pinyin") reviewShowPinyin=!reviewShowPinyin;
    if(which==="english") reviewShowEnglish=!reviewShowEnglish;
    localStorage.setItem("hanziReviewShowPinyin",String(reviewShowPinyin));localStorage.setItem("hanziReviewShowEnglish",String(reviewShowEnglish));
    const item=reviewQueue[reviewIndex]; const type=item?.__reviewType||(reviewMode==="sentences"?"sentence":"character");
    el("review-pinyin-toggle").classList.toggle("active",reviewShowPinyin);el("review-english-toggle").classList.toggle("active",reviewShowEnglish);el("review-pinyin-toggle").textContent=reviewShowPinyin?"Hide pinyin":"Show pinyin";el("review-english-toggle").textContent=reviewShowEnglish?"Hide English":"Show English";
    if(type==="sentence"){el("fc-sentence-pinyin").hidden=!reviewShowPinyin;el("fc-sentence-en").hidden=!reviewShowEnglish;}else{el("fc-pinyin").hidden=!reviewShowPinyin;el("fc-meaning").hidden=!reviewShowEnglish;}
  }

  function stopReview(){
    if (reviewStartedAt){ const mins=Math.max(1,Math.round((Date.now()-reviewStartedAt)/60000)); ensureActivityState(); const key=new Date().toISOString().slice(0,10); if(!state.activity[key]) state.activity[key]={reviews:0,characters:0,sentences:0,words:0,minutes:0}; state.activity[key].minutes=Number(state.activity[key].minutes||0)+mins; saveState(); reviewStartedAt=null; }
    // Leave the current card unanswered and return to the review setup.
    // Ratings already given during the session remain saved.
    el("review-session").classList.add("hidden");
    el("review-summary").classList.add("hidden");
    el("review-setup").classList.remove("hidden");
    reviewQueue = [];
    reviewIndex = 0;
    reviewRevealed = false;
    window.__reviewRatingBusy=false;
    refreshDueCount();
  }

  function finishReview(){
    let mins=0; if(reviewStartedAt){mins=Math.max(1,Math.round((Date.now()-reviewStartedAt)/60000));ensureActivityState();const key=new Date().toISOString().slice(0,10);if(!state.activity[key])state.activity[key]={reviews:0,characters:0,sentences:0,words:0,minutes:0};state.activity[key].minutes=Number(state.activity[key].minutes||0)+mins;saveState();reviewStartedAt=null;}
    const accuracy=sessionStats.reviewed?Math.round(sessionStats.correct/sessionStats.reviewed*100):0;
    setTimeout(()=>{
      el("review-session").classList.add("hidden");el("review-summary").classList.remove("hidden");
      el("summary-reviewed").textContent=sessionStats.reviewed;el("summary-known").textContent=sessionStats.known;el("summary-accuracy").textContent=accuracy+"%";el("summary-minutes").textContent=mins;
      el("summary-breakdown-text").innerHTML="Characters · "+sessionStats.characters+"<br>Sentences · "+sessionStats.sentences+"<br>Skipped · "+sessionStats.skipped+"<br>Best streak · "+sessionStats.bestStreak;
      el("summary-next-text").textContent=sessionStats.mistakes.length?sessionStats.mistakes.length+" item(s) need another look. Review your mistakes while they are fresh.":"Great recall. You can reinforce the session or return to Progress.";
      el("review-mistakes-btn").disabled=!sessionStats.mistakes.length;
      window._lastReviewMistakes=sessionStats.mistakes.slice(); window._lastReviewMinutes=mins;
    },260);
  }

  /* ---------- PROGRESS ---------- */
  

  function renderProgress(){
    ensureActivityState();
    const {known,learning,neu,total}=computeCounts(); const dueChars=getDueCount(); const dueSentences=getSentenceDueCount(); const due=dueChars+dueSentences;
    const todayKey=new Date().toISOString().slice(0,10); const today=state.activity[todayKey]||{reviews:0,characters:0,sentences:0,words:0,minutes:0};
    el("progress-today-reviews").textContent=Number(today.reviews||0).toLocaleString(); el("progress-today-minutes").textContent=Number(today.minutes||0).toLocaleString(); el("progress-today-characters").textContent=Number(today.characters||0).toLocaleString(); el("progress-today-sentences").textContent=Number(today.sentences||0).toLocaleString(); el("progress-today-streak").textContent=state.streak.count||0;
    el("smart-due").textContent=due.toLocaleString(); el("smart-learning").textContent=(learning+SENTENCE_DATA.filter(x=>getSentenceStatus(x.i)==="learning").length).toLocaleString();
    const weakChars=HANZI_DATA.filter(item=>{const e=getEntry(item.c);return e&&e.status==="learning"&&(Number(e.reviews||0)>=2||Number(e.interval||0)<=1)}).sort((a,b)=>(Number(getEntry(b.c)?.reviews||0)-Number(getEntry(a.c)?.reviews||0))).slice(0,5);
    const weakSentences=SENTENCE_DATA.filter(item=>{const e=getSentenceEntry(item.i);return e&&e.status==="learning"&&Number(e.reviews||0)>=2}).sort((a,b)=>(Number(getSentenceEntry(b.i)?.reviews||0)-Number(getSentenceEntry(a.i)?.reviews||0))).slice(0,3);
    el("smart-weak").textContent=(weakChars.length+weakSentences.length).toLocaleString();
    el("progress-weak-list").innerHTML=(weakChars.map(item=>{const e=getEntry(item.c);return '<div class="weak-item"><div class="weak-item-main"><span class="weak-glyph">'+escHtml(item.c)+'</span><div class="weak-copy"><strong>'+escHtml(item.p||"")+'</strong><span>'+Number(e.reviews||0)+' reviews · still learning</span></div></div><button type="button" data-progress-char="'+escHtml(item.c)+'">Open</button></div>'}).join("")+weakSentences.map(item=>{const e=getSentenceEntry(item.i);return '<div class="weak-item"><div class="weak-item-main"><span class="weak-glyph">句</span><div class="weak-copy"><strong>'+escHtml(item.z.slice(0,18))+(item.z.length>18?'…':'')+'</strong><span>'+Number(e.reviews||0)+' reviews · sentence</span></div></div><button type="button" data-progress-sentence="'+escHtml(item.i)+'">Open</button></div>'}).join(""))||'<p class="progress-sub">No weak areas yet. Keep reviewing to build a useful history.</p>';
    const totalBase=total||1, kp=known/totalBase*100,lp=learning/totalBase*100,np=neu/totalBase*100,dp=Math.min(100,due/totalBase*100);
    el("srs-known-fill").style.width=kp+"%";el("srs-learning-fill").style.width=lp+"%";el("srs-new-fill").style.width=np+"%";el("srs-due-fill").style.width=dp+"%";
    el("srs-known-count").textContent=known.toLocaleString();el("srs-learning-count").textContent=learning.toLocaleString();el("srs-new-count").textContent=neu.toLocaleString();el("srs-due-count").textContent=due.toLocaleString();
    const days=[];for(let i=13;i>=0;i--){const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-i);const key=d.toISOString().slice(0,10);days.push({key,label:d.toLocaleDateString(undefined,{month:"numeric",day:"numeric"}),...(state.activity[key]||{reviews:0,characters:0,sentences:0,words:0,minutes:0})})} const maxA=Math.max(1,...days.map(d=>Number(d.reviews||0)));
    el("progress-activity-chart").innerHTML=days.map(d=>'<div class="progress-bar-day" style="height:'+Math.max(3,Number(d.reviews||0)/maxA*100)+'%" title="'+d.label+': '+Number(d.reviews||0)+' reviews"><span>'+d.label+'</span></div>').join("");
    el("level-bars").innerHTML=LEVEL_GROUPS.map(g=>{const items=HANZI_DATA.filter(item=>levelMatches(item,g.key));let k=0,l=0;items.forEach(item=>{const st=getStatus(item.c);if(st==="known")k++;else if(st==="learning")l++});const pk=items.length?k/items.length*100:0,pl=items.length?l/items.length*100:0;return '<div class="level-bar-row"><span class="level-bar-label">'+g.label+'</span><div class="level-bar-track"><div class="level-bar-fill known" style="width:'+pk+'%"></div><div class="level-bar-fill learning" style="width:'+pl+'%"></div></div><span class="level-bar-count">'+k.toLocaleString()+' known · '+l.toLocaleString()+' learning</span></div>'}).join("");
    const acts=Object.entries(state.activity).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,7);el("progress-activity-list").innerHTML=acts.length?acts.map(([date,a])=>'<div class="activity-item"><span class="activity-icon">📚</span><div class="activity-copy"><strong>'+escHtml(date)+'</strong><span>'+Number(a.reviews||0)+' reviews · '+Number(a.characters||0)+' characters · '+Number(a.sentences||0)+' sentences</span></div></div>').join(""):'<p class="progress-sub">Your study activity will appear here after your first review.</p>';
    const knownEntries=Object.entries(state.progress).filter(([c,e])=>e.status==="known"&&e.stampedAt).sort((a,b)=>b[1].stampedAt-a[1].stampedAt).slice(0,48);el("seal-album-grid").innerHTML=knownEntries.length?knownEntries.map(([c])=>'<span class="seal-chip" data-char="'+escHtml(c)+'" title="'+escHtml(c)+'">'+escHtml(c)+'</span>').join(""):'<p class="empty-note">Stamp your first character to start your collection.</p>';
    renderSentenceProgress();
  }

  function renderSentenceProgress(){
    const total = SENTENCE_DATA.length;
    const known = SENTENCE_DATA.filter(item=> getSentenceStatus(item.i) === "known").length;
    const fresh = SENTENCE_DATA.filter(item=> getSentenceStatus(item.i) === "new").length;
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

  /* ---------- WORDS ---------- */
  let wordFilters = {query:"", sort:"common", length:"all", usage:"all", srs:"all", status:"all"};
  let wordPage = 0;
  let wordPageSize = 96;
  let WORD_DATA = null;
  let wordsShowPinyin = true;
  let wordsShowEnglish = false;
  let wordSelectionMode = "off";
  let selectedWords = new Set();

  function isHanWord(value){
    return /^[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]{2,4}$/.test(String(value||""));
  }

  function buildWordData(){
    if (WORD_DATA) return WORD_DATA;
    const candidates = new Map();
    let sourceExamples = 0;

    // Build the candidate word list first from the dictionary examples.
    for (const item of HANZI_DATA){
      for (const raw of (item.e || [])){
        const word = String(raw||"").trim();
        if (!isHanWord(word)) continue;
        sourceExamples++;
        if (!candidates.has(word)) candidates.set(word,{word,sourceCount:0,corpusCount:0,english:"",exampleTranslations:[],exampleSentences:[]});
        candidates.get(word).sourceCount++;
      }
    }

    // Scan the sentence corpus once. Keep the shortest examples so the Words
    // cards teach the word in a simpler context instead of showing an arbitrary
    // long sentence that happened to occur first in the corpus.
    const candidateSet = new Set(candidates.keys());
    for (const sentence of SENTENCE_DATA){
      const runs = String(sentence.z||"").match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]+/gu) || [];
      for (const run of runs){
        const chars = Array.from(run);
        for (let i=0;i<chars.length;i++){
          for (let len=2;len<=4 && i+len<=chars.length;len++){
            const word = chars.slice(i,i+len).join("");
            if (!candidateSet.has(word)) continue;
            const item = candidates.get(word);
            item.corpusCount++;
            const zh = String(sentence.z||"").trim();
            const translation = String(sentence.t||"").trim();
            if (!zh || !translation) continue;
            
            // Optimization: if we already have 3 short examples and this one is longer than the longest we kept, skip it.
            if (item.exampleSentences.length === 3 && zh.length >= item.exampleSentences[2].zh.length) continue;
            
            if (!item.exampleSentences.some(x=>x.en===translation)){
              item.exampleSentences.push({zh,en:translation});
              item.exampleSentences.sort((a,b)=>a.zh.length - b.zh.length);
              if (item.exampleSentences.length>3) item.exampleSentences.length=3;
            }
          }
        }
      }
    }

    WORD_DATA = Array.from(candidates.values()).map(item=>{
      const charItems = Array.from(item.word).map(ch=>HANZI_BY_CHAR[ch]).filter(Boolean);
      const freqRanks = charItems.map(x=>Number(x.f)).filter(x=>Number.isFinite(x) && x<99999);
      const avgRank = freqRanks.length ? freqRanks.reduce((a,b)=>a+b,0)/freqRanks.length : 99999;
      let pinyin = "";
      try{
        if (window.pinyinPro && typeof window.pinyinPro.pinyin === "function"){
          pinyin = window.pinyinPro.pinyin(item.word,{toneType:"symbol",type:"string",v:true});
        }
      }catch(e){ console.warn("[HanziTracker]", e); }
      if (item.exampleSentences.length) item.english = item.exampleSentences[0].en;
      return {...item,avgRank,pinyin,charItems};
    });
    WORD_DATA._sourceExamples = sourceExamples;
    return WORD_DATA;
  }

  const WORD_MEANING_CACHE_KEY = "hanzi-tracker-word-meanings-v1";
  let wordMeaningCache = {};
  try{ wordMeaningCache = JSON.parse(localStorage.getItem(WORD_MEANING_CACHE_KEY) || "{}"); }catch(e){ wordMeaningCache = {}; }

  function saveWordMeaning(word, meaning){
    if (!meaning) return;
    wordMeaningCache[word] = meaning;
    try{ localStorage.setItem(WORD_MEANING_CACHE_KEY, JSON.stringify(wordMeaningCache)); }catch(e){ console.warn("[HanziTracker]", e); }
  }

  async function fetchCombinedWordMeaning(word){
    if (wordMeaningCache[word]) return wordMeaningCache[word];
    try{
      const url = "https://api.mymemory.translated.net/get?langpair=zh-CN%7Cen&mt=1&q=" + encodeURIComponent(word);
      const response = await fetch(url);
      if (!response.ok) throw new Error("translation request failed");
      const data = await response.json();
      const translated = String(data?.responseData?.translatedText || "").trim();
      if (!translated || translated.toLowerCase() === word.toLowerCase()) throw new Error("no useful translation");
      saveWordMeaning(word, translated);
      return translated;
    }catch(e){ return "Meaning unavailable"; }
  }

  function hydrateWordMeanings(){
    document.querySelectorAll("[data-word-meaning]").forEach(node=>{
      const word = node.getAttribute("data-word-meaning");
      if (!word) return;
      if (wordMeaningCache[word]){ node.textContent = wordMeaningCache[word]; return; }
      node.textContent = "Loading meaning…";
      fetchCombinedWordMeaning(word).then(meaning=>{
        if (node.isConnected) node.textContent = meaning;
      });
    });
  }

  function getWordSrsStage(word){
    const entry = getWordEntry(word);
    if (!entry || !entry.reviews) return "new";
    const interval = Number(entry.interval) || 0;
    if (interval >= 90) return "mastered";
    if (interval >= 21) return "mature";
    return "learning";
  }

  function renderWords(){
    const data=buildWordData();
    const q=wordFilters.query.trim().toLowerCase();
    let items=data.filter(item=>{
      if(wordFilters.length!=="all" && Array.from(item.word).length!==Number(wordFilters.length)) return false;
      if(wordFilters.usage==="used" && item.corpusCount<1) return false;
      if(wordFilters.usage==="very-common" && item.corpusCount<2) return false;
      if(wordFilters.status!=="all" && getWordStatus(item.word)!==wordFilters.status) return false;
      if(wordFilters.srs!=="all" && getWordSrsStage(item.word)!==wordFilters.srs) return false;
      if(q && !item.word.toLowerCase().includes(q) && !(item.pinyin||"").toLowerCase().includes(q) && !(item.english||"").toLowerCase().includes(q)) return false;
      return true;
    });

    items.sort((a,b)=>{
      if(wordFilters.sort==="common") return (b.corpusCount-a.corpusCount)||(a.avgRank-b.avgRank)||(a.word.localeCompare(b.word));
      if(wordFilters.sort==="rare") return (a.corpusCount-b.corpusCount)||(b.avgRank-a.avgRank)||(a.word.localeCompare(b.word));
      if(wordFilters.sort==="charfreq") return (a.avgRank-b.avgRank)||(b.corpusCount-a.corpusCount);
      if(wordFilters.sort==="length") return (Array.from(b.word).length-Array.from(a.word).length)||(b.corpusCount-a.corpusCount);
      return a.word.localeCompare(b.word,"zh-Hans");
    });

    const totalPages=Math.max(1,Math.ceil(items.length/wordPageSize));
    if(wordPage>=totalPages) wordPage=totalPages-1;
    if(wordPage<0) wordPage=0;
    const pageItems=items.slice(wordPage*wordPageSize,wordPage*wordPageSize+wordPageSize);
    el("word-count").textContent=items.length.toLocaleString()+" words";
    el("word-page-indicator").textContent=(wordPage+1)+" / "+totalPages;
    if (el("word-page-indicator-top")) el("word-page-indicator-top").textContent=(wordPage+1)+" / "+totalPages;
    el("word-prev-page").disabled=wordPage===0;
    el("word-next-page").disabled=wordPage>=totalPages-1;

    el("word-grid").innerHTML=pageItems.length ? pageItems.map(word=>{
      const parts=Array.from(word.word).map(ch=>'<button type="button" class="word-part" data-word-char="'+escHtml(ch)+'" title="Open '+escHtml(ch)+' details">'+escHtml(ch)+'</button>').join("");
      const example=word.exampleSentences&&word.exampleSentences.length ? word.exampleSentences[0] : null;
      const meaningText=word.meaning || "Meaning not available";
      const status = getWordStatus(word.word);
      const isSelected = selectedWords.has(word.word);
      let classes = "word-card status-" + status;
      if (isSelected) classes += " selected";

      return '<article class="'+classes+'" data-word="'+escHtml(word.word)+'" tabindex="0" role="button" aria-label="Flip '+escHtml(word.word)+' card to reveal meaning">'+
        '<div class="word-card-inner">'+
          '<div class="word-card-face front">'+
            '<button type="button" class="tone-audio-btn-sm" data-speak-word="'+escHtml(word.word)+'" title="Listen to '+escHtml(word.word)+'" style="position:absolute; top:12px; right:12px; z-index:2;">🔊</button>'+
            '<div class="word-zh">'+escHtml(word.word)+'</div>'+
            '<div class="word-pinyin" '+(wordsShowPinyin?'':'hidden')+'>'+escHtml(word.pinyin||"—")+'</div>'+
          '</div>'+
          '<div class="word-card-face back">'+
            '<div class="word-card-back-meaning" data-word-meaning="'+escHtml(word.word)+'">'+escHtml(meaningText)+'</div>'+
            '<div class="word-example" '+(wordsShowEnglish?'':'hidden')+'>'+
              '<div class="word-example-label">Simple example</div>'+
              (example ? '<div class="word-example-zh">'+escHtml(example.zh)+'</div>'+(window.pinyinPro&&typeof window.pinyinPro.pinyin==="function"?'<div class="word-example-py" '+(wordsShowPinyin?'':'hidden')+'>'+escHtml(window.pinyinPro.pinyin(example.zh,{toneType:"symbol",type:"string",v:true}))+'</div>':'')+'<div class="word-example-en">'+escHtml(example.en)+'</div>' : '<div class="word-example-empty">No example sentence in the current corpus.</div>')+
            '</div>'+
            '<div class="word-parts">'+parts+'</div>'+
            '<div class="word-card-status-buttons">'+
              '<button type="button" class="word-status-btn'+(status==='new'?' active':'')+'" data-word-set-status="new">New</button>'+
              '<button type="button" class="word-status-btn'+(status==='learning'?' active':'')+'" data-word-set-status="learning">Learning</button>'+
              '<button type="button" class="word-status-btn'+(status==='known'?' active':'')+'" data-word-set-status="known">Known</button>'+
            '</div>'+
          '</div>'+
        '</div>'+
      '</article>';
    }).join("") : '<div class="word-empty">No words match these filters.</div>';
    
    hydrateWordMeanings();
    updateWordSidebars();
    updateWordSelectionBar();
  }

  function wireWords(){
    const search=el("word-search");
    if(search){let wordSearchTimeout;search.addEventListener("input",()=>{clearTimeout(wordSearchTimeout);const val=search.value;wordSearchTimeout=setTimeout(()=>{wordFilters.query=val;wordPage=0;renderWords();},150);});}
    ["word-sort","word-length","word-common-only"].forEach(id=>{
      const node=el(id); if(!node) return;
      node.addEventListener("change",()=>{wordFilters[id==="word-sort"?"sort":id==="word-length"?"length":"usage"]=node.value;wordPage=0;renderWords();});
    });
    el("word-prev-page")?.addEventListener("click",()=>{wordPage--;renderWords();});
    el("word-next-page")?.addEventListener("click",()=>{wordPage++;renderWords();});
    const showPinyin=el("words-show-pinyin");
    const showEnglish=el("words-show-english");
    showPinyin?.addEventListener("click",()=>{
      wordsShowPinyin=!wordsShowPinyin;
      showPinyin.classList.toggle("active",wordsShowPinyin);
      renderWords();
    });
    showEnglish?.addEventListener("click",()=>{
      wordsShowEnglish=!wordsShowEnglish;
      showEnglish.classList.toggle("active",wordsShowEnglish);
      renderWords();
    });
    
    const srsSelect = el("word-srs-select");
    if (srsSelect) srsSelect.addEventListener("change", (e)=>{ wordFilters.srs = e.target.value; wordPage = 0; renderWords(); });
    const statusSelect = el("word-status-select");
    if (statusSelect) statusSelect.addEventListener("change", (e)=>{ wordFilters.status = e.target.value; wordPage = 0; renderWords(); });

    el("word-selection-bar")?.querySelectorAll("[data-word-selection-mode]").forEach(btn=>{
      btn.addEventListener("click", ()=>setWordSelectionMode(btn.dataset.wordSelectionMode));
    });
    el("word-selection-bar")?.querySelectorAll("[data-word-bulk-status]").forEach(btn=>{
      btn.addEventListener("click", ()=>applyBulkWordStatus(btn.dataset.wordBulkStatus));
    });
    el("word-clear-selection")?.addEventListener("click", ()=>{
      selectedWords.clear(); updateWordSelectionBar(); renderWords();
    });

    el("word-grid")?.addEventListener("click",e=>{
      const speakBtn = e.target.closest("[data-speak-word]");
      if (speakBtn){
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
      const part=e.target.closest("[data-word-char]");
      if(part){ e.stopPropagation(); openDetail(part.dataset.wordChar); return; }
      const card=e.target.closest(".word-card");
      if(!card) return;
      const word = card.dataset.word;
      if (wordSelectionMode === "single"){
        selectedWords.clear(); selectedWords.add(word); updateWordSelectionBar(); renderWords();
      } else if (wordSelectionMode === "multi"){
        if (selectedWords.has(word)) selectedWords.delete(word); else selectedWords.add(word);
        updateWordSelectionBar(); renderWords();
      } else {
        card.classList.toggle("flipped");
      }
    });

    el("word-grid")?.addEventListener("keydown",e=>{
      if(e.key!=="Enter" && e.key!==" ") return;
      const card=e.target.closest(".word-card");
      if(!card || e.target.closest("[data-word-char]")) return;
      e.preventDefault();
      const word = card.dataset.word;
      if (wordSelectionMode === "single"){
        selectedWords.clear(); selectedWords.add(word); updateWordSelectionBar(); renderWords();
      } else if (wordSelectionMode === "multi"){
        if (selectedWords.has(word)) selectedWords.delete(word); else selectedWords.add(word);
        updateWordSelectionBar(); renderWords();
      } else {
        card.classList.toggle("flipped");
      }
    });

    document.querySelectorAll("[data-word-side-status]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        wordFilters.status = btn.dataset.wordSideStatus;
        if(statusSelect) statusSelect.value = wordFilters.status;
        wordPage = 0; renderWords();
      });
    });
    document.querySelectorAll("[data-word-side-sort]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        wordFilters.sort = btn.dataset.wordSideSort;
        const sel = el("word-sort"); if(sel) sel.value = wordFilters.sort;
        wordPage = 0; renderWords();
      });
    });
    document.querySelectorAll("[data-word-side-reset]").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        wordFilters = {query:"", sort:"common", length:"all", usage:"all", srs:"all", status:"all"};
        if(statusSelect) statusSelect.value = "all";
        if(srsSelect) srsSelect.value = "all";
        const lenSel = el("word-length"); if(lenSel) lenSel.value = "all";
        const sortSel = el("word-sort"); if(sortSel) sortSel.value = "common";
        const search = el("word-search"); if(search) search.value = "";
        wordPage = 0; renderWords();
      });
    });
  }

  function setWordSelectionMode(mode){
    wordSelectionMode = mode;
    if (mode === "off") selectedWords.clear();
    updateWordSelectionBar();
    renderWords();
  }

  function updateWordSelectionBar(){
    const bar = el("word-selection-bar");
    if (!bar) return;
    bar.querySelectorAll("[data-word-selection-mode]").forEach(btn=>{
      btn.classList.toggle("active", btn.dataset.wordSelectionMode === wordSelectionMode);
    });
    el("word-selection-count").textContent = selectedWords.size + " selected";
    const saveState = el("word-selection-save-state");
    saveState.textContent = "Saved automatically";
    saveState.classList.remove("saving", "saved");
    const actions = bar.querySelector(".selection-actions");
    if (selectedWords.size > 0 && wordSelectionMode !== "off"){
      bar.classList.add("active");
      actions.style.display = "flex";
    } else {
      bar.classList.remove("active");
      actions.style.display = "none";
    }
  }

  function applyBulkWordStatus(status){
    if (selectedWords.size === 0) return;
    const saveState = el("word-selection-save-state");
    saveState.textContent = "Saving…";
    saveState.classList.add("saving");
    saveState.classList.remove("saved");
    selectedWords.forEach(word => {
      setWordStatusManual(word, status);
    });
    setTimeout(()=>{
      saveState.textContent = "Saved!";
      saveState.classList.remove("saving");
      saveState.classList.add("saved");
      setTimeout(()=>{
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
  function openSmartReview(){ const tab=document.querySelector('.tab-btn[data-tab="review"]'); if(tab) tab.click(); const r=document.querySelector('input[name="pool"][value="due"]'); if(r) r.checked=true; const b=el("start-review"); if(b) setTimeout(()=>b.click(),80); }

  function wireTabs(){
    document.querySelectorAll(".tab-btn").forEach(btn=>{
      btn.addEventListener("click", ()=>{
        document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach(p=>p.classList.remove("active"));
        btn.classList.add("active");
        el("tab-" + btn.dataset.tab).classList.add("active");
        if (btn.dataset.tab === "progress") renderProgress();
        if (btn.dataset.tab === "sentences") renderSentences();
        if (btn.dataset.tab === "words") renderWords();
        if (btn.dataset.tab === "tones") renderTonesTab();
        if (btn.dataset.tab === "review") refreshDueCount();
      });
    });
  }

  function toggleMultiChip(chip, container, dataAttr, targetSet, afterChange){
    const value = chip.dataset[dataAttr];
    if (value === "all"){
      targetSet.clear();
    } else {
      if (targetSet.has(value)) targetSet.delete(value);
      else targetSet.add(value);
    }
    container.querySelectorAll(".chip").forEach(c=>{
      const v = c.dataset[dataAttr];
      const active = v === "all" ? targetSet.size === 0 : targetSet.has(v);
      c.classList.toggle("active", active);
    });
    afterChange();
  }

  function wireBrowse(){
    const levelSelect = el("browse-level-select");
    if (levelSelect) levelSelect.addEventListener("change", (e)=>{
      browseFilters.levels = e.target.value === "all" ? new Set() : new Set([e.target.value]);
      browsePage = 0;
      renderBrowse();
    });

    const srsSelect = el("browse-srs-select");
    if (srsSelect) srsSelect.addEventListener("change", (e)=>{
      browseFilters.srsStage = e.target.value;
      browsePage = 0;
      renderBrowse();
    });

    const statusSelect = el("browse-status-select");
    if (statusSelect) statusSelect.addEventListener("change", (e)=>{
      browseFilters.statuses = e.target.value === "all" ? new Set() : new Set([e.target.value]);
      browsePage = 0;
      renderBrowse();
    });

    el("browse-sort").addEventListener("change", (e)=>{
      browseFilters.sort = e.target.value;
      browsePage = 0;
      renderBrowse();
    });

    let searchTimeout;
    el("search-input").addEventListener("input", (e)=>{
      clearTimeout(searchTimeout);
      const val = e.target.value;
      searchTimeout = setTimeout(()=>{ browseFilters.query = val; browsePage = 0; renderBrowse(); }, 150);
    });
    el("prev-page").addEventListener("click", ()=>{ if (browsePage > 0){ browsePage--; renderBrowse(); } });
    el("next-page").addEventListener("click", ()=>{ browsePage++; renderBrowse(); });
    const browsePinyin=el("browse-show-pinyin");
    const browseEnglish=el("browse-show-english");
    browsePinyin?.addEventListener("click",()=>{browseShowPinyin=!browseShowPinyin;browsePinyin.classList.toggle("active",browseShowPinyin);renderBrowse();});
    browseEnglish?.addEventListener("click",()=>{browseShowEnglish=!browseShowEnglish;browseEnglish.classList.toggle("active",browseShowEnglish);renderBrowse();});
    el("tile-grid").addEventListener("click", (e)=>{
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
      if (browseSelectionMode !== "off"){
        toggleBrowseSelection(char);
        return;
      }

      const isFlipped = tile.classList.toggle("flipped");
      if (isFlipped) flippedBrowseChars.add(char);
      else flippedBrowseChars.delete(char);
    });
    el("tile-grid").addEventListener("keydown", (e)=>{
      const tile = e.target.closest(".tile");
      if (!tile) return;
      if (e.key === "Enter" || e.key === " "){
        e.preventDefault();
        if (browseSelectionMode !== "off"){
          toggleBrowseSelection(tile.dataset.char);
          return;
        }
        const isFlipped = tile.classList.toggle("flipped");
        const char = tile.dataset.char;
        if (isFlipped) flippedBrowseChars.add(char);
        else flippedBrowseChars.delete(char);
      }
    });
    el("browse-selection-bar").querySelectorAll("[data-selection-mode]").forEach(btn=>{
      btn.addEventListener("click", ()=>setBrowseSelectionMode(btn.dataset.selectionMode));
    });
    el("browse-selection-bar").querySelectorAll("[data-bulk-status]").forEach(btn=>{
      btn.addEventListener("click", ()=>applyBulkBrowseStatus(btn.dataset.bulkStatus));
    });
    el("clear-selection").addEventListener("click", ()=>{
      selectedBrowseChars.clear(); updateBrowseSelectionUI(); renderBrowse();
    });
    document.addEventListener("keydown", (e)=>{
      if (e.key === "Escape" && browseSelectionMode !== "off"){
        selectedBrowseChars.clear(); updateBrowseSelectionUI(); renderBrowse();
      }
    });
  }

  function wireDrawer(){
    el("drawer-close").addEventListener("click", closeDetail);
    el("drawer-backdrop").addEventListener("click", closeDetail);
    ["new","learning","known"].forEach(s=>{
      el("status-btn-" + s).addEventListener("click", ()=>{
        if (!currentDetailChar) return;
        const wasKnown = getStatus(currentDetailChar) === "known";
        setStatusManual(currentDetailChar, s);
        if (s === "known" && !wasKnown){ triggerStampFX(el("drawer-hanzi")); spawnConfetti(el("detail-drawer")); }
        openDetail(currentDetailChar);
        syncUI();
      });
    });
    document.addEventListener("keydown", (e)=>{
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
  }

  function wireReview(){
    const reviewLevelContainer=el("review-level-chips");reviewLevelContainer.querySelectorAll(".chip").forEach(chip=>chip.addEventListener("click",()=>{toggleMultiChip(chip,reviewLevelContainer,"level",reviewFilters.levels,()=>{refreshDueCount();updateReviewEstimate();});}));
    document.querySelectorAll("[data-review-mode]").forEach(btn=>btn.addEventListener("click",()=>{reviewMode=btn.dataset.reviewMode;setReviewModeUI();}));
    el("review-difficulty")?.addEventListener("change",e=>{reviewDifficulty=e.target.value;updateReviewEstimate();});
    el("review-focus-weak")?.addEventListener("change",e=>{reviewFocusWeak=e.target.checked;updateReviewEstimate();});
    document.querySelectorAll('input[name="pool"]').forEach(r=>r.addEventListener("change",updateReviewEstimate));
    el("session-size").addEventListener("input",e=>{el("session-size-label").textContent=e.target.value;updateReviewEstimate();});
    el("review-show-pinyin").checked=reviewShowPinyin;el("review-show-english").checked=reviewShowEnglish;
    el("review-show-pinyin").addEventListener("change",()=>{reviewShowPinyin=el("review-show-pinyin").checked;localStorage.setItem("hanziReviewShowPinyin",String(reviewShowPinyin));});
    el("review-show-english").addEventListener("change",()=>{reviewShowEnglish=el("review-show-english").checked;localStorage.setItem("hanziReviewShowEnglish",String(reviewShowEnglish));});
    el("review-pinyin-toggle").addEventListener("click",()=>updateReviewReveal("pinyin"));el("review-english-toggle").addEventListener("click",()=>updateReviewReveal("english"));
    el("review-example-toggle").addEventListener("click",()=>{const box=el("fc-examples");const show=box.hidden;box.hidden=!show;el("review-example-toggle").classList.toggle("active",show);el("review-example-toggle").textContent=show?"Hide examples":"Show examples";});
    el("review-audio-btn").addEventListener("click",()=>{
      const item=reviewQueue[reviewIndex];
      if(!item) return;
      const type=item.__reviewType||(reviewMode==="sentences"?"sentence":reviewMode==="words"?"word":"character");
      const text = type==="sentence" ? item.z : (type==="word" ? item.word : item.c);
      playChineseAudio(text, { rate: 0.88 });
    });
    el("start-review").addEventListener("click",startReview);el("stop-review").addEventListener("click",stopReview);el("reveal-btn").addEventListener("click",revealCard);el("review-skip-btn").addEventListener("click",skipCurrent);el("review-flag-btn").addEventListener("click",flagCurrent);
    el("radical-grid")?.addEventListener("click",e=>{
      if(e.target.closest("button") && !e.target.closest(".radical-card")) return;
      const btn=e.target.closest(".radical-card");
      if(btn){
        btn.classList.toggle("flipped");
      }
    });
    
    // Add right click context menu for radical grid so they can still see details or mark known via right click
    el("radical-grid")?.addEventListener("contextmenu",e=>{
      const btn=e.target.closest(".radical-card");
      if(btn){
        e.preventDefault();
        openRadicalDrawer(btn.dataset.radical);
      }
    });
    el("flashcard").addEventListener("click",e=>{
      if(e.target.closest("button,a")) return;
      if(!reviewRevealed) revealCard();
    });
    el("flashcard").setAttribute("tabindex","0"); el("flashcard").setAttribute("role","button");
    el("flashcard").addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&!reviewRevealed){e.preventDefault();revealCard();}});
    el("review-focus-toggle").addEventListener("click",()=>{reviewFocusMode=!reviewFocusMode;el("review-session").classList.toggle("focus-mode",reviewFocusMode);document.body.classList.toggle("review-focus-active",reviewFocusMode);el("review-focus-toggle").classList.toggle("active",reviewFocusMode);el("review-focus-toggle").textContent=reviewFocusMode?"⛶ Exit Focus":"⛶ Focus";});
    document.querySelectorAll("#rate-buttons .status-btn").forEach(btn=>btn.addEventListener("click",()=>rateCurrent(btn.dataset.rate)));
    el("back-to-setup").addEventListener("click",()=>{reviewFocusMode=false;document.body.classList.remove("review-focus-active");el("review-summary").classList.add("hidden");el("review-session").classList.add("hidden");el("review-setup").classList.remove("hidden");refreshDueCount();updateReviewEstimate();});
    el("review-again-btn").addEventListener("click",()=>{if(window._lastReviewMistakes?.length){reviewQueue=shuffle(window._lastReviewMistakes).slice();reviewIndex=0;sessionStats={reviewed:0,known:0,correct:0,streak:0,bestStreak:0,characters:0,sentences:0,mistakes:[],skipped:0,flagged:0};reviewStartedAt=Date.now();el("review-summary").classList.add("hidden");el("review-session").classList.remove("hidden");showCard();}else{el("review-summary").classList.add("hidden");el("review-setup").classList.remove("hidden");}});
    el("review-mistakes-btn").addEventListener("click",()=>{if(!window._lastReviewMistakes?.length)return;reviewQueue=shuffle(window._lastReviewMistakes).slice();reviewIndex=0;sessionStats={reviewed:0,known:0,correct:0,streak:0,bestStreak:0,characters:0,sentences:0,mistakes:[],skipped:0,flagged:0};reviewStartedAt=Date.now();el("review-summary").classList.add("hidden");el("review-session").classList.remove("hidden");showCard();});
    document.addEventListener("keydown",e=>{if(!el("tab-review").classList.contains("active")||el("review-session").classList.contains("hidden"))return;if(e.code==="Space"){e.preventDefault();if(!reviewRevealed)revealCard();}else if(reviewRevealed){if(e.key==="1")rateCurrent("new");if(e.key==="2")rateCurrent("learning");if(e.key==="3")rateCurrent("known");}else if(e.key.toLowerCase()==="s"){skipCurrent();}});
    setReviewModeUI();
  }

  function wireSentences(){
    let timeout;
    el("sentence-search").addEventListener("input",e=>{clearTimeout(timeout);sentencePage=0;timeout=setTimeout(()=>{sentenceFilters.query=e.target.value;renderSentences();},120);});
    ["sentence-hsk-filter","sentence-srs-filter","sentence-difficulty-filter","sentence-sort"].forEach(id=>el(id).addEventListener("change",e=>{sentenceFilters[id.replace("sentence-","").replace("-filter","")]=e.target.value;sentencePage=0;renderSentences();}));
    el("sentence-prev-page").addEventListener("click",()=>{if(sentencePage>0){sentencePage--;renderSentences();}});
    el("sentence-next-page").addEventListener("click",()=>{sentencePage++;renderSentences();});
    const sentencePinyinBtn=el("sentence-show-pinyin");
    const sentenceEnglishBtn=el("sentence-show-english");
    sentencePinyinBtn?.addEventListener("click",()=>{sentenceShowPinyin=!sentenceShowPinyin;sentencePinyinBtn.classList.toggle("active",sentenceShowPinyin);renderSentences();});
    sentenceEnglishBtn?.addEventListener("click",()=>{sentenceShowEnglish=!sentenceShowEnglish;sentenceEnglishBtn.classList.toggle("active",sentenceShowEnglish);renderSentences();});

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

    el("sentence-grid")?.addEventListener("click",e=>{
      const char=e.target.closest("[data-sentence-char]");
      if(char){
        e.stopPropagation();
        openDetail(char.dataset.sentenceChar);
        return;
      }
      const speak=e.target.closest("[data-speak-sentence]");
      if(speak){
        e.stopPropagation();
        const item=SENTENCE_DATA.find(x=>String(x.i)===String(speak.dataset.speakSentence));
        speakSentence(item);
        return;
      }
      const detail=e.target.closest("[data-detail-sentence]");
      if(detail){
        e.stopPropagation();
        openSentenceDetails(detail.dataset.detailSentence);
        return;
      }
      const review=e.target.closest("[data-review-sentence]");
      if(review){
        e.stopPropagation();
        openSentenceReview(review.dataset.reviewSentence);
        return;
      }
      const card=e.target.closest(".sentence-card");
      if(card && !e.target.closest("button,a,input,select")){
        card.classList.toggle("flipped");
      }
    });
    el("sentence-study-due").addEventListener("click",()=>startSentencePool("due"));
    el("sentence-study-new").addEventListener("click",()=>startSentencePool("new"));
    el("sentence-detail-close").addEventListener("click",closeSentenceDetails);
    el("sentence-detail-modal").addEventListener("click",e=>{if(e.target===el("sentence-detail-modal"))closeSentenceDetails();const ch=e.target.closest("[data-sentence-char]");if(ch){closeSentenceDetails();openDetail(ch.dataset.sentenceChar);}});
    el("sentence-detail-review").addEventListener("click",()=>{const id=el("sentence-detail-review").dataset.reviewSentence;closeSentenceDetails();openSentenceReview(id);});
    ["new","learning","known"].forEach(status=>{
      const btn = el("sentence-status-btn-" + status);
      if (!btn) return;
      btn.addEventListener("click",()=>{
        const id = el("sentence-detail-review").dataset.reviewSentence;
        if (!id) return;
        const wasKnown = getSentenceStatus(id) === "known";
        setSentenceStatus(id, status);
        if (status === "known" && !wasKnown){ triggerStampFX(btn); spawnConfetti(btn); }
        updateSentenceDetailStatusUI(id);
        syncUI();
      });
    });
  }

  function startSentencePool(poolType){
    const tab=document.querySelector('.tab-btn[data-tab="review"]'); if(tab) tab.click();
    reviewMode="sentences"; setReviewModeUI();
    const pool=buildPool(poolType); if(!pool.length){showToast(poolType==="due"?"No sentence reviews are due right now.":"No new sentences are available right now.");return;}
    reviewQueue=shuffle(pool).slice(0,Number(el("session-size").value)||10); reviewIndex=0; sessionStats={reviewed:0,known:0,correct:0,streak:0,bestStreak:0,characters:0,sentences:0,mistakes:[],skipped:0,flagged:0}; reviewStartedAt=Date.now();
    el("review-setup").classList.add("hidden");el("review-summary").classList.add("hidden");el("review-session").classList.remove("hidden");showCard();
  }

  /* ---------- DATA IMPORT / EXPORT ---------- */
  function buildExportPayload(){
    return {
      app: "hanzi-tracker",
      formatVersion: 1,
      exportedAt: new Date().toISOString(),
      state: state
    };
  }

  function downloadJson(filename, payload){
    const blob = new Blob([JSON.stringify(payload, null, 2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }

  function exportData(){
    const date = new Date().toISOString().slice(0,10);
    downloadJson("hanzi-tracker-backup-" + date + ".json", buildExportPayload());
    showToast("Progress exported.");
  }

  function normalizeImportedState(raw){
    const candidate = raw && raw.state && typeof raw.state === "object" ? raw.state : raw;
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)){
      throw new Error("Invalid data file.");
    }

    const progress = candidate.progress;
    const sentenceProgress = candidate.sentenceProgress;
    const streak = candidate.streak;
    if (!progress || typeof progress !== "object" || Array.isArray(progress)){
      throw new Error("The file does not contain valid progress data.");
    }
    if (streak != null && (typeof streak !== "object" || Array.isArray(streak))){
      throw new Error("The file contains invalid streak data.");
    }

    const cleanProgress = {};
    Object.keys(progress).forEach(char=>{
      if (!HANZI_BY_CHAR[char]) return;
      const entry = progress[char];
      if (!entry || typeof entry !== "object") return;
      const status = ["new","learning","known"].includes(entry.status) ? entry.status : "new";
      cleanProgress[char] = {
        status,
        interval: Number.isFinite(Number(entry.interval)) ? Number(entry.interval) : 0,
        reviews: Number.isFinite(Number(entry.reviews)) ? Number(entry.reviews) : 0,
        due: Number.isFinite(Number(entry.due)) ? Number(entry.due) : Date.now()
      };
    });

    const cleanSentenceProgress = {};
    if (sentenceProgress && typeof sentenceProgress === "object" && !Array.isArray(sentenceProgress)) {
      Object.keys(sentenceProgress).forEach(id=>{
        const entry = sentenceProgress[id];
        if (!entry || typeof entry !== "object") return;
        const status = ["new","learning","known"].includes(entry.status) ? entry.status : "new";
        cleanSentenceProgress[String(id)] = {
          status,
          interval:Number.isFinite(Number(entry.interval)) ? Number(entry.interval) : 0,
          reviews:Number.isFinite(Number(entry.reviews)) ? Number(entry.reviews) : 0,
          due:Number.isFinite(Number(entry.due)) ? Number(entry.due) : Date.now()
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

  async function importData(file){
    if (!file) return;
    try{
      const raw = JSON.parse(await file.text());
      const importedState = normalizeImportedState(raw);
      const importedCount = Object.keys(importedState.progress).length;

      if (!confirm(
        "Import " + importedCount.toLocaleString() +
        " saved characters and replace your current progress? This cannot be undone."
      )) return;

      state = importedState;
      const payload = JSON.stringify(state);

      try{
        if (window.storage && typeof window.storage.set === "function"){
          await window.storage.set(STORAGE_KEY, payload, false);
        }
      }catch(e){ console.warn("[HanziTracker]", e); }
      try{
        window.localStorage.setItem(FALLBACK_STORAGE_KEY, payload);
        usingLocalStorageFallback = true;
      }catch(e){ console.warn("[HanziTracker]", e); }

      syncUI();
      renderProgress();
      refreshDueCount();
      showToast("Progress imported.");
    }catch(e){
      showToast("Couldn't import that file. Choose a valid Hanzi Tracker JSON backup.", true);
    }
  }

  function wireDataManagement(){
    el("export-data").addEventListener("click", exportData);
    el("import-data").addEventListener("click", ()=>el("import-file").click());
    el("import-file").addEventListener("change", async (e)=>{
      const file = e.target.files && e.target.files[0];
      await importData(file);
      e.target.value = "";
    });
  }

  function wireProgress(){
    el("reset-progress").addEventListener("click", async ()=>{
      if (!confirm("Reset all progress? This clears every status, streak, and stamp. This cannot be undone.")) return;
      state = { progress:{}, sentenceProgress:{}, streak:{count:0,last:null}, activity:{} };
      try{
        if (window.storage && typeof window.storage.set === "function"){
          await window.storage.set(STORAGE_KEY, JSON.stringify(state), false);
        }
      }catch(e){ console.warn("[HanziTracker]", e); }
      try{ window.localStorage.removeItem(FALLBACK_STORAGE_KEY); }catch(e){ console.warn("[HanziTracker]", e); }
      syncUI();
      renderProgress();
      showToast("Progress reset.");
    });
  }

  /* ---------- CONTEXT MENU ---------- */
  let contextMenuChar = null;
  let contextMenuTarget = null;
  let contextMenuType = "char";
  
  function openContextMenu(x, y, type, id, target){
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

  function closeContextMenu(){
    el("context-menu").classList.add("hidden");
    contextMenuChar = null;
    contextMenuTarget = null;
    contextMenuType = "char";
  }

  function wireContextMenu(){
    el("tile-grid").addEventListener("contextmenu", (e)=>{
      const tile = e.target.closest(".tile");
      if (!tile) return;
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, "char", tile.dataset.char, tile);
    });
    el("seal-album-grid").addEventListener("contextmenu", (e)=>{
      const chip = e.target.closest(".seal-chip");
      if (!chip) return;
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, "char", chip.dataset.char, chip);
    });
    el("sentence-grid").addEventListener("contextmenu", (e)=>{
      const card = e.target.closest(".sentence-card");
      if (!card) return;
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, "sentence", card.dataset.sentenceId, card);
    });
    el("radical-grid").addEventListener("contextmenu", (e)=>{
      const card = e.target.closest(".radical-card");
      if (!card) return;
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, "radical", card.dataset.radical || card.getAttribute("data-radical"), card);
    });
    el("word-grid")?.addEventListener("contextmenu", (e)=>{
      const card = e.target.closest(".word-card");
      if (!card) return;
      e.preventDefault();
      openContextMenu(e.clientX, e.clientY, "word", card.dataset.word, card);
    });
    el("context-menu").addEventListener("click", (e)=>{
      const btn = e.target.closest(".context-menu-item");
      if (!btn || !contextMenuChar) return;
      const action = btn.dataset.action;
      const id = contextMenuChar;
      if (action === "details"){
        const type = contextMenuType;
        closeContextMenu();
        if (type === "sentence") openSentenceDetails(id);
        else if (type === "radical") openRadicalDetail(Number(id));
        else if (type === "word") { /* no detail drawer for words yet */ }
        else openDetail(id);
        return;
      }
      if (contextMenuType === "word"){
        const wasKnown = getWordStatus(id) === "known";
        setWordStatusManual(id, action);
        if (action === "known" && !wasKnown){
          triggerStampFX(contextMenuTarget || el("app"));
          spawnConfetti(contextMenuTarget || el("app"));
        }
        closeContextMenu();
        renderWords();
        return;
      } else if (contextMenuType === "sentence"){
        const wasKnown = getSentenceStatus(id) === "known";
        setSentenceStatus(id, action);
        if (action === "known" && !wasKnown){
          triggerStampFX(contextMenuTarget || el("app"));
          spawnConfetti(contextMenuTarget || el("app"));
        }
      } else {
        const statusChar = contextMenuType === "radical"
          ? (contextMenuTarget?.dataset.char || contextMenuTarget?.getAttribute("data-char") || id)
          : id;
        const wasKnown = getStatus(statusChar) === "known";
        setStatusManual(statusChar, action);
        if (action === "known" && !wasKnown){
          const tileEl = document.querySelector('.tile[data-char="' + CSS.escape(statusChar) + '"]');
          triggerStampFX(tileEl || contextMenuTarget || el("app"));
          spawnConfetti(tileEl || contextMenuTarget || el("app"));
        }
      }
      closeContextMenu();
      syncUI();
      if (el("tab-progress").classList.contains("active")) renderProgress();
    });
    document.addEventListener("click", (e)=>{
      if (!el("context-menu").classList.contains("hidden") && !e.target.closest("#context-menu")) closeContextMenu();
    });
    document.addEventListener("contextmenu", (e)=>{
      if (!e.target.closest(".tile") && !e.target.closest(".seal-chip") && !e.target.closest(".sentence-card") && !e.target.closest(".radical-card") && !e.target.closest(".word-card")) closeContextMenu();
    });
    document.addEventListener("keydown", (e)=>{ if (e.key === "Escape") closeContextMenu(); });
    window.addEventListener("scroll", closeContextMenu, true);
    window.addEventListener("resize", closeContextMenu);
  }

  /* ---------- RADICALS ---------- */
  

  // Correct a few stroke-count / metadata entries while keeping the standard Kangxi order.
  const RADICALS = RADICAL_DETAILS.map((r, i)=>({
    number:i+1, char:r[0], meaning:r[1], pinyin:r[2],
    strokes:Number(r[3]), base:r[4], variants:r[5],
    position:r[6], examples:r[7].split("、")
  }));

  function radicalCodePoint(char){
    return "U+" + char.codePointAt(0).toString(16).toUpperCase().padStart(4,"0");
  }

  let radicalsShowPinyin = false;
  let radicalsShowEnglish = false;
  let radicalSort = "order";

  function radicalUsageScore(r){
    const index = radicalCharacterIndex;
    if (!index) return 0;
    const chars = index[r.number] || [];
    const trackerMap = new Map(HANZI_DATA.map(item=>[item.c, item]));
    let score = 0;
    for (const ch of chars){
      const item = trackerMap.get(ch);
      if (!item) continue;
      const f = Number(item.f);
      if (Number.isFinite(f) && f > 0) score += 1 / f;
    }
    return score;
  }

  function renderRadicals(){
    const searchEl = el("radical-search");
    const query = searchEl ? (searchEl.value || "").trim().toLowerCase() : "";
    let filtered = RADICALS.filter(r =>
      !query ||
      String(r.number).includes(query) ||
      r.char.includes(query) ||
      r.meaning.toLowerCase().includes(query) ||
      r.pinyin.toLowerCase().includes(query)
    );

    if (radicalSort === "most" && radicalCharacterIndex){
      filtered = filtered.slice().sort((a,b)=>radicalUsageScore(b)-radicalUsageScore(a) || a.number-b.number);
    } else if (radicalSort === "least" && radicalCharacterIndex){
      filtered = filtered.slice().sort((a,b)=>radicalUsageScore(a)-radicalUsageScore(b) || a.number-b.number);
    }

    el("radical-count").textContent = filtered.length + " of 214 radicals";
    el("radical-grid").innerHTML = filtered.map(r=>{
      const char = r.base && r.base !== "—" ? r.base : r.char;
      return `
      <button type="button" class="radical-card" data-radical="${r.number}" data-char="${escHtml(char)}" aria-label="Open details for radical ${r.number}: ${escHtml(r.meaning)}">
        <div class="radical-card-inner">
          <div class="radical-card-face front">
            <span class="radical-number">#${r.number}</span>
            <span class="radical-char">${r.char}</span>
            <span class="radical-name" ${radicalsShowEnglish?"":"hidden"}>${escHtml(r.meaning)}</span>
            <span class="radical-pinyin" ${radicalsShowPinyin?"":"hidden"}>${escHtml(r.pinyin)}</span>
          </div>
          <div class="radical-card-face back">
            <span class="radical-name">${escHtml(r.meaning)}</span>
            <span class="radical-pinyin">${escHtml(r.pinyin)}</span>
          </div>
        </div>
      </button>
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

  function parseUnihanRadicalStroke(raw){
    const byRadical = Array.from({length:215}, ()=>[]);
    const seen = Array.from({length:215}, ()=>new Set());

    for (const line of raw.split(/\r?\n/)){
      if (!line || line[0] === "#") continue;
      const parts = line.split(/\t+/);
      if (parts.length < 3 || parts[1] !== "kRSUnicode") continue;

      const cp = parts[0].match(/^U\+([0-9A-Fa-f]{4,6})$/);
      if (!cp) continue;

      const char = String.fromCodePoint(parseInt(cp[1],16));
      // kRSUnicode may contain multiple assignments, e.g. "1.2 1.3".
      for (const assignment of parts[2].split(/\s+/)){
        const m = assignment.match(/^(\d{1,3})\./);
        if (!m) continue;
        const radical = Number(m[1]);
        if (radical < 1 || radical > 214) continue;
        if (!seen[radical].has(char)){
          seen[radical].add(char);
          byRadical[radical].push(char);
        }
      }
    }
    return byRadical;
  }

  function parseRadicalStrokeIndex(raw){
    const byRadical = Array.from({length:215}, ()=>[]);
    const seen = Array.from({length:215}, ()=>new Set());

    for (const line of raw.split(/\r?\n/)){
      if (!line || line[0] === "#") continue;
      const parts = line.split(/\t/);
      if (parts.length < 2) continue;

      const match = parts[0].match(/^(\d{1,3})\./);
      if (!match) continue;
      const radical = Number(match[1]);
      if (radical < 1 || radical > 214) continue;

      const cps = parts[1].match(/U\+[0-9A-Fa-f]{4,6}/g) || [];
      for (const cp of cps){
        const value = parseInt(cp.slice(2),16);
        if (Number.isNaN(value)) continue;
        const char = String.fromCodePoint(value);
        if (!seen[radical].has(char)){
          seen[radical].add(char);
          byRadical[radical].push(char);
        }
      }
    }
    return byRadical;
  }

  function mergeRadicalIndexes(a,b){
    const merged = Array.from({length:215}, ()=>[]);
    for (let r=1;r<=214;r++){
      const seen = new Set();
      for (const c of [...(a[r]||[]), ...(b[r]||[])]){
        if (!seen.has(c)){ seen.add(c); merged[r].push(c); }
      }
    }
    return merged;
  }

  async function fetchText(url){
    const res = await fetch(url, {
      cache:"force-cache",
      mode:"cors",
      headers:{"Accept":"text/plain"}
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return await res.text();
  }

  async function loadRadicalCharacterIndex(){
    if (radicalCharacterIndex) return radicalCharacterIndex;
    if (radicalIndexPromise) return radicalIndexPromise;

    radicalIndexPromise = (async ()=>{
      const errors = [];
      let unihan = null;
      let rsindex = null;

      // Try the direct official files first.
      for (const url of RADICAL_DATA_URLS){
        try{
          const raw = await fetchText(url);
          const parsed = parseUnihanRadicalStroke(raw);
          if (parsed.some(list=>list.length)){
            unihan = parsed;
            break;
          }
        }catch(e){ errors.push("Unihan: " + e); }
      }

      for (const url of RADICAL_RSINDEX_URLS){
        try{
          const raw = await fetchText(url);
          const parsed = parseRadicalStrokeIndex(raw);
          if (parsed.some(list=>list.length)){
            rsindex = parsed;
            break;
          }
        }catch(e){ errors.push("RSIndex: " + e); }
      }

      if (unihan || rsindex){
        radicalCharacterIndex = unihan && rsindex
          ? mergeRadicalIndexes(unihan, rsindex)
          : (unihan || rsindex);

        // Keep the complete parsed data in localStorage as JSON so the app
        // remains useful when reopened offline.
        try{
          localStorage.setItem(
            "hanzi-tracker-radical-index-v17-json",
            JSON.stringify(radicalCharacterIndex)
          );
        }catch(e){ console.warn("[HanziTracker]", e); }
        return radicalCharacterIndex;
      }

      // Offline fallback from a previous successful load.
      try{
        const cached = localStorage.getItem("hanzi-tracker-radical-index-v17-json");
        if (cached){
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length === 215){
            radicalCharacterIndex = parsed;
            return parsed;
          }
        }
      }catch(e){ console.warn("[HanziTracker]", e); }

      throw new Error(errors.join("; ") || "Unable to load Unicode radical data.");
    })();

    try{
      return await radicalIndexPromise;
    }finally{
      radicalIndexPromise = null;
    }
  }

  async function renderRadicalCharacters(number){
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

    try{
      const index = await loadRadicalCharacterIndex();
      const chars = index[number] || [];
      const trackerMap = new Map(HANZI_DATA.map(item=>[item.c, item]));

      // "Most used" is based on the frequency rank already stored in the
      // Hanzi Tracker dataset (lower f = more frequent). Characters absent
      // from that dataset are placed after all ranked characters.
      const ranked = chars.slice().sort((a,b)=>{
        const af = trackerMap.has(a) ? Number(trackerMap.get(a).f) : Infinity;
        const bf = trackerMap.has(b) ? Number(trackerMap.get(b).f) : Infinity;
        if (af !== bf) return af - bf;
        return a.codePointAt(0) - b.codePointAt(0);
      });

      const limit = Math.max(1, Number(limitEl && limitEl.value) || 50);
      const visible = mostUsedOnly && mostUsedOnly.checked
        ? ranked.slice(0, Math.min(limit, ranked.length))
        : chars;

      const rankedInTracker = ranked.filter(c=>trackerMap.has(c));

      summary.textContent = mostUsedOnly && mostUsedOnly.checked
        ? "Showing the " + visible.length.toLocaleString() + " most-used characters for Radical " + number + "."
        : "Showing all " + chars.length.toLocaleString() + " characters assigned to Radical " + number + ".";

      list.innerHTML = visible.map((c,i) => {
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
    }catch(e){
      summary.textContent = "The character list could not be loaded.";
      status.className = "radical-data-status error";
      status.textContent = "Connect to the internet once and try again.";
    }
  }


  function openRadicalDetail(number){
    const r = RADICALS[number - 1];
    const panel = el("radical-detail");
    const backdrop = el("radical-detail-backdrop");
    if (!r || !panel || !backdrop) return;

    el("detail-radical-char").textContent = r.char;
    el("detail-radical-name").textContent = r.meaning;
    el("detail-radical-pinyin").textContent = r.pinyin;
    el("detail-radical-number").textContent = "#" + r.number;
    el("detail-radical-strokes").textContent = r.strokes;
    const radicalCode = "U+" + (0x2F00 + r.number - 1).toString(16).toUpperCase().padStart(4,"0");
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
    ["new","learning","known"].forEach(s => {
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

  function closeRadicalDetail(){
    const panel = el("radical-detail");
    const backdrop = el("radical-detail-backdrop");
    if (panel) panel.classList.remove("open");
    if (backdrop) backdrop.classList.remove("open");
    document.body.classList.remove("radical-modal-open");
    currentRadicalChar = null;
  }




  function wireRadicals(){
    const search = el("radical-search");
    const grid = el("radical-grid");
    const closeBtn = el("radical-detail-close");
    const backdrop = el("radical-detail-backdrop");

    if (search) search.addEventListener("input", renderRadicals);

    const sort = el("radical-sort");
    if (sort) sort.addEventListener("change", async ()=>{
      radicalSort = sort.value;
      if (radicalSort !== "order" && !radicalCharacterIndex){
        try{ await loadRadicalCharacterIndex(); }catch(e){ console.warn("[HanziTracker]", e); }
      }
      renderRadicals();
    });

    el("radical-show-pinyin").addEventListener("click", (e)=>{
      radicalsShowPinyin = !radicalsShowPinyin;
      e.target.classList.toggle("active", radicalsShowPinyin);
      document.querySelectorAll(".front .radical-pinyin").forEach(n=>n.hidden=!radicalsShowPinyin);
    });
    el("radical-show-english").addEventListener("click", (e)=>{
      radicalsShowEnglish = !radicalsShowEnglish;
      e.target.classList.toggle("active", radicalsShowEnglish);
      document.querySelectorAll(".front .radical-name").forEach(n=>n.hidden=!radicalsShowEnglish);
    });

    // The old grid.addEventListener("click") for openRadicalDetail was removed so cards just flip.

    ["new","learning","known"].forEach(s => {
      const btn = el("detail-radical-status-btn-" + s);
      if (!btn) return;
      btn.addEventListener("click", function(){
        if (!currentRadicalChar) return;
        const wasKnown = getStatus(currentRadicalChar) === "known";
        setStatusManual(currentRadicalChar, s);
        if (s === "known" && !wasKnown){
          triggerStampFX(el("detail-radical-char"));
          spawnConfetti(el("radical-detail"));
        }
        const n = Number(el("detail-radical-number").textContent.replace("#",""));
        if (n) openRadicalDetail(n);
        syncUI();
      });
    });

    const mostUsedOnly = el("radical-most-used-only");
    const limitEl = el("radical-character-limit");
    if (mostUsedOnly) mostUsedOnly.addEventListener("change", ()=>{
      const n = Number(el("detail-radical-number").textContent.replace("#",""));
      if (n) renderRadicalCharacters(n);
    });
    if (limitEl) limitEl.addEventListener("change", ()=>{
      const n = Number(el("detail-radical-number").textContent.replace("#",""));
      if (n) renderRadicalCharacters(n);
    });

    const characterList = el("detail-radical-character-list");
    if (characterList){
      characterList.addEventListener("click", function(e){
        const btn = e.target.closest(".radical-character");
        if (!btn) return;
        const ch = btn.getAttribute("data-char");
        if (HANZI_BY_CHAR[ch]){
          closeRadicalDetail();
          openDetail(ch);
        }
      });
    }

    if (closeBtn) closeBtn.addEventListener("click", function(e){
      e.preventDefault();
      closeRadicalDetail();
    });

    if (backdrop) backdrop.addEventListener("click", closeRadicalDetail);

    document.addEventListener("keydown", function(e){
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
    { base: "1", pair: "1-1", title: "1st + 1st", pitch: "55-55 ── ──", desc: "Steady high plateau", items: [
      { zh: "今天", py: "jīntiān", en: "Today" },
      { zh: "飞机", py: "fēijī", en: "Airplane" },
      { zh: "医生", py: "yīshēng", en: "Doctor" }
    ]},
    { base: "1", pair: "1-2", title: "1st + 2nd", pitch: "55-35 ── ↗", desc: "High plateau then rises", items: [
      { zh: "中国", py: "zhōngguó", en: "China" },
      { zh: "新年", py: "xīnnián", en: "New Year" },
      { zh: "帮忙", py: "bāngmáng", en: "Help" }
    ]},
    { base: "1", pair: "1-3", title: "1st + 3rd", pitch: "55-214 ── ↘↗", desc: "High plateau drops to low", items: [
      { zh: "机场", py: "jīchǎng", en: "Airport" },
      { zh: "经理", py: "jīnglǐ", en: "Manager" },
      { zh: "身体", py: "shēntǐ", en: "Body/Health" }
    ]},
    { base: "1", pair: "1-4", title: "1st + 4th", pitch: "55-51 ── ↘", desc: "High plateau then drops sharply", items: [
      { zh: "帮助", py: "bāngzhù", en: "Help" },
      { zh: "音乐", py: "yīnyuè", en: "Music" },
      { zh: "方便", py: "fāngbiàn", en: "Convenient" }
    ]},
    { base: "1", pair: "1-0", title: "1st + Neutral", pitch: "55-· ── ·", desc: "High plateau then soft drop", items: [
      { zh: "妈妈", py: "māma", en: "Mother" },
      { zh: "东西", py: "dōngxi", en: "Things" },
      { zh: "清楚", py: "qīngchu", en: "Clear" }
    ]},
    { base: "2", pair: "2-1", title: "2nd + 1st", pitch: "35-55 ↗ ──", desc: "Rises up to high plateau", items: [
      { zh: "国家", py: "guójiā", en: "Country" },
      { zh: "时间", py: "shíjiān", en: "Time" },
      { zh: "银行", py: "yínháng", en: "Bank" }
    ]},
    { base: "2", pair: "2-2", title: "2nd + 2nd", pitch: "35-35 ↗ ↗", desc: "Double rising wave", items: [
      { zh: "学习", py: "xuéxí", en: "Study" },
      { zh: "常常", py: "chángcháng", en: "Often" },
      { zh: "留学", py: "liúxué", en: "Study abroad" }
    ]},
    { base: "2", pair: "2-3", title: "2nd + 3rd", pitch: "35-214 ↗ ↘↗", desc: "Rises then dips down", items: [
      { zh: "苹果", py: "píngguǒ", en: "Apple" },
      { zh: "游泳", py: "yóuyǒng", en: "Swim" },
      { zh: "传统", py: "chuántǒng", en: "Tradition" }
    ]},
    { base: "2", pair: "2-4", title: "2nd + 4th", pitch: "35-51 ↗ ↘", desc: "Rises then plunges down", items: [
      { zh: "决定", py: "juédìng", en: "Decide" },
      { zh: "习惯", py: "xíguàn", en: "Habit" },
      { zh: "难过", py: "nánguò", en: "Sad" }
    ]},
    { base: "2", pair: "2-0", title: "2nd + Neutral", pitch: "35-· ↗ ·", desc: "Rises then soft landing", items: [
      { zh: "学生", py: "xuésheng", en: "Student" },
      { zh: "朋友", py: "péngyou", en: "Friend" },
      { zh: "便宜", py: "piányi", en: "Cheap" }
    ]},
    { base: "3", pair: "3-1", title: "3rd + 1st", pitch: "21-55 ↘ ──", desc: "Low dip jumps to high", items: [
      { zh: "北京", py: "běijīng", en: "Beijing" },
      { zh: "手机", py: "shǒujī", en: "Mobile phone" },
      { zh: "老师", py: "lǎoshī", en: "Teacher" }
    ]},
    { base: "3", pair: "3-2", title: "3rd + 2nd", pitch: "21-35 ↘ ↗", desc: "Low dip rises upward", items: [
      { zh: "语言", py: "yǔyán", en: "Language" },
      { zh: "旅行", py: "lǚxíng", en: "Travel" },
      { zh: "每年", py: "měinián", en: "Every year" }
    ]},
    { base: "3", pair: "3-3", title: "3rd + 3rd (Sandhi)", pitch: "35-214 ↗ ↘↗", desc: "Changes to 2nd + 3rd!", items: [
      { zh: "你好", py: "nǐhǎo (ní hǎo)", en: "Hello" },
      { zh: "可以", py: "kěyǐ (ké yǐ)", en: "Can / May" },
      { zh: "了解", py: "liǎojiě (liáo jiě)", en: "Understand" }
    ]},
    { base: "3", pair: "3-4", title: "3rd + 4th", pitch: "21-51 ↘ ↘", desc: "Low dip followed by sharp drop", items: [
      { zh: "比赛", py: "bǐsài", en: "Match/Game" },
      { zh: "努力", py: "nǔlì", en: "Hard-working" },
      { zh: "准备", py: "zhǔnbèi", en: "Prepare" }
    ]},
    { base: "3", pair: "3-0", title: "3rd + Neutral", pitch: "21-· ↘ ·", desc: "Low dip then light high neutral", items: [
      { zh: "喜欢", py: "xǐhuan", en: "Like" },
      { zh: "姐姐", py: "jiějie", en: "Older sister" },
      { zh: "怎么", py: "zěnme", en: "How" }
    ]},
    { base: "4", pair: "4-1", title: "4th + 1st", pitch: "51-55 ↘ ──", desc: "Sharp drop leaps to high", items: [
      { zh: "面包", py: "miànbāo", en: "Bread" },
      { zh: "认真", py: "rènzhēn", en: "Earnest" },
      { zh: "汽车", py: "qìchē", en: "Automobile" }
    ]},
    { base: "4", pair: "4-2", title: "4th + 2nd", pitch: "51-35 ↘ ↗", desc: "Sharp drop then rises", items: [
      { zh: "练习", py: "liànxí", en: "Practice" },
      { zh: "热情", py: "rèqíng", en: "Enthusiastic" },
      { zh: "特别", py: "tèbié", en: "Special" }
    ]},
    { base: "4", pair: "4-3", title: "4th + 3rd", pitch: "51-214 ↘ ↘↗", desc: "Sharp drop into dipping", items: [
      { zh: "电影", py: "diànyǐng", en: "Movie" },
      { zh: "电脑", py: "diànnǎo", en: "Computer" },
      { zh: "办法", py: "bànfǎ", en: "Method" }
    ]},
    { base: "4", pair: "4-4", title: "4th + 4th", pitch: "51-51 ↘ ↘", desc: "Double sharp falls", items: [
      { zh: "汉字", py: "hànzì", en: "Chinese character" },
      { zh: "再见", py: "zàijiàn", en: "Goodbye" },
      { zh: "变化", py: "biànhuà", en: "Change" }
    ]},
    { base: "4", pair: "4-0", title: "4th + Neutral", pitch: "51-· ↘ ·", desc: "Sharp drop then low neutral", items: [
      { zh: "谢谢", py: "xièxie", en: "Thank you" },
      { zh: "爸爸", py: "bàba", en: "Father" },
      { zh: "漂亮", py: "piàoliang", en: "Pretty" }
    ]}
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

  function speakToneText(text, onEnd){
    playChineseAudio(text, { rate: 0.84, onEnd });
  }

  function renderToneCards(){
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

  function renderTonePairs(baseTone = "all"){
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

  function renderTrickySounds(){
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

  function generateQuizQuestion(mode){
    toneQuizAnswered = false;
    el("tone-quiz-feedback")?.classList.add("hidden");
    const optContainer = el("tone-quiz-options");
    if (!optContainer) return;

    if (mode === "single"){
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
    } else if (mode === "pairs"){
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

  function checkToneQuizAnswer(chosenIdx){
    if (toneQuizAnswered || !currentQuizItem) return;
    toneQuizAnswered = true;
    const isCorrect = chosenIdx === currentQuizItem.correctIndex;

    const optButtons = document.querySelectorAll(".tone-quiz-opt-btn");
    optButtons.forEach((btn, idx) => {
      if (idx === currentQuizItem.correctIndex){
        btn.classList.add("correct");
      } else if (idx === chosenIdx && !isCorrect){
        btn.classList.add("wrong");
      }
    });

    const feedback = el("tone-quiz-feedback");
    const fIcon = el("tone-feedback-icon");
    const fTitle = el("tone-feedback-title");
    const fSub = el("tone-feedback-sub");

    if (isCorrect){
      toneQuizScore += 10;
      toneQuizStreak++;
      toneQuizBest = Math.max(toneQuizBest, toneQuizStreak);
      awardXP(10, "Tone Listening Quiz");

      if (feedback){
        feedback.className = "tone-quiz-feedback is-correct";
        if (fIcon) fIcon.textContent = "✓";
        if (fTitle) fTitle.textContent = "Correct! +10 XP";
        if (fSub) fSub.textContent = `${currentQuizItem.spokenText} · ${currentQuizItem.pinyin} · ${currentQuizItem.toneName} (${currentQuizItem.meaning})`;
        feedback.classList.remove("hidden");
      }
      if (toneQuizStreak > 0 && toneQuizStreak % 5 === 0){
        showToast(`🔥 ${toneQuizStreak} in a row on Tone Quiz!`);
      }
    } else {
      toneQuizStreak = 0;
      if (feedback){
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

  function wireToneLab(){
    const chipContainer = el("tone-pair-filter-chips");
    if (chipContainer){
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
      if (speakBtn){
        speakToneText(speakBtn.dataset.speakText);
        return;
      }
      const optBtn = e.target.closest("[data-quiz-opt]");
      if (optBtn){
        checkToneQuizAnswer(Number(optBtn.dataset.quizOpt));
        return;
      }
    });

    el("tone-quiz-play-btn")?.addEventListener("click", () => {
      if (currentQuizItem){
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

  function renderTonesTab(){
    renderToneCards();
    renderTonePairs(tonePairFilterBase);
    renderTrickySounds();
    if (!currentQuizItem){
      generateQuizQuestion(currentQuizMode);
    }
  }

  function enhanceThemeDropdowns(){
    const selects=[...document.querySelectorAll('.filter-select,.sentence-filter')];
    if(!selects.length) return;
    selects.forEach(select=>{
      if(select.dataset.goldEnhanced==='1') return;
      select.dataset.goldEnhanced='1';
      const wrap=document.createElement('div');
      wrap.className='gold-select-wrap';
      select.parentNode.insertBefore(wrap,select);
      wrap.appendChild(select);
      select.classList.add('gold-select-native');

      const trigger=document.createElement('button');
      trigger.type='button';
      trigger.className='gold-select-trigger';
      trigger.setAttribute('aria-haspopup','listbox');
      trigger.setAttribute('aria-expanded','false');
      trigger.setAttribute('aria-label',select.getAttribute('aria-label') || select.id);
      trigger.innerHTML='<span class="gold-select-value"></span><span class="gold-select-chevron" aria-hidden="true"></span>';
      wrap.appendChild(trigger);

      const menu=document.createElement('div');
      menu.className='gold-select-menu';
      menu.setAttribute('role','listbox');
      wrap.appendChild(menu);

      const valueEl=trigger.querySelector('.gold-select-value');
      const close=()=>{
        menu.classList.remove('open');
        trigger.classList.remove('open');
        trigger.setAttribute('aria-expanded','false');
      };
      const sync=()=>{
        const current=select.options[select.selectedIndex];
        valueEl.textContent=current ? current.textContent : '';
        menu.querySelectorAll('.gold-select-option').forEach(btn=>{
          const active=btn.dataset.value===select.value;
          btn.classList.toggle('selected',active);
          btn.setAttribute('aria-selected',active?'true':'false');
        });
      };
      select.addEventListener('change',sync);

      [...select.options].forEach(option=>{
        const btn=document.createElement('button');
        btn.type='button';
        btn.className='gold-select-option';
        btn.dataset.value=option.value;
        btn.setAttribute('role','option');
        btn.textContent=option.textContent;
        btn.addEventListener('click',()=>{
          if(select.value!==option.value){
            select.value=option.value;
            select.dispatchEvent(new Event('change',{bubbles:true}));
          }else sync();
          close();
          trigger.focus();
        });
        menu.appendChild(btn);
      });

      trigger.addEventListener('click',e=>{
        e.stopPropagation();
        const open=!menu.classList.contains('open');
        document.querySelectorAll('.gold-select-menu.open').forEach(m=>{
          m.classList.remove('open');
          m.previousElementSibling?.classList.remove('open');
          m.previousElementSibling?.setAttribute('aria-expanded','false');
        });
        menu.classList.toggle('open',open);
        trigger.classList.toggle('open',open);
        trigger.setAttribute('aria-expanded',open?'true':'false');
        sync();
      });
      trigger.addEventListener('keydown',e=>{
        if(e.key==='Escape'){close();return;}
        if(e.key==='Enter'||e.key===' '){e.preventDefault();trigger.click();return;}
        if(e.key==='ArrowDown'||e.key==='ArrowUp'){
          e.preventDefault();
          if(!menu.classList.contains('open')) trigger.click();
          const opts=[...menu.querySelectorAll('.gold-select-option')];
          let idx=opts.findIndex(x=>x.dataset.value===select.value);
          idx=e.key==='ArrowDown'?Math.min(opts.length-1,idx+1):Math.max(0,idx-1);
          opts[idx]?.focus();
        }
      });
      menu.addEventListener('keydown',e=>{
        const opts=[...menu.querySelectorAll('.gold-select-option')];
        const idx=opts.indexOf(document.activeElement);
        if(e.key==='Escape'){e.preventDefault();close();trigger.focus();}
        else if(e.key==='ArrowDown'){e.preventDefault();opts[Math.min(opts.length-1,idx+1)]?.focus();}
        else if(e.key==='ArrowUp'){e.preventDefault();opts[Math.max(0,idx-1)]?.focus();}
      });
      sync();
    });
    document.addEventListener('click',()=>document.querySelectorAll('.gold-select-menu.open').forEach(m=>{
      m.classList.remove('open');
      const t=m.previousElementSibling;
      t?.classList.remove('open');
      t?.setAttribute('aria-expanded','false');
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
    } catch(e) { console.warn("[HanziTracker]", e); }
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
    try { localStorage.setItem(XP_STORAGE_KEY, JSON.stringify(state)); } catch(e) { console.warn("[HanziTracker]", e); }
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
      try { const d = JSON.parse(localStorage.getItem(key) || "{}"); return d.status === "known"; } catch(e) { return false; }
    }).length;

    const checks = {
      "first-flame":    state.streakDays >= 3,
      "week-warrior":   state.streakDays >= 7,
      "month-master":   state.streakDays >= 30,
      "century-club":   state.streakDays >= 100,
      "first-steps":    learningCount >= 1 || knownCount >= 1,
      "first-stamp":    knownCount >= 1,
      "centurion":      knownCount >= 100,
      "half-way":       knownCount >= 500,
      "thousand-club":  knownCount >= 1000,
      "dragon-scholar": knownCount >= 3000,
      "rising-star":    state.level >= 3,
      "bright-star":    state.level >= 5,
      "supernova":      state.level >= 8,
      "grand-master":   state.level >= 10,
      "sentence-sage":  knownSentences >= 50,
      "daily-devotee":  (state.uniqueDays || []).length >= 7,
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
   *  SUPABASE AUTH & CLOUD SYNC
   * ========================================================= */

  const SUPABASE_URL = "https://gyafdvspybhyspasbifo.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_wgx0UQzbw3X7POQeeUT6MQ_YBF-fvHX";
  
  let supabaseClient = null;
  let currentUser = null;
  let syncDebounceTimer = null;

  function initSupabase() {
    if (SUPABASE_URL === "YOUR_PROJECT_URL") {
      console.log("[Sync] Supabase not configured — running in local-only mode");
      return;
    }
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      console.warn("[Sync] Supabase client library not loaded — running in local mode");
      return;
    }
    
    try {
      supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
      
      supabaseClient.auth.onAuthStateChange((event, session) => {
        currentUser = session?.user || null;
        updateAuthUI(currentUser);
        if (currentUser && event === 'SIGNED_IN') {
          loadFromCloud();
        }
      });
      
      // Initial check
      supabaseClient.auth.getSession().then(({ data: { session } }) => {
        currentUser = session?.user || null;
        updateAuthUI(currentUser);
        if (currentUser) {
          loadFromCloud();
        }
      }).catch(e => console.warn("[Sync] getSession failed:", e));
    } catch(err) {
      console.warn("[Sync] Failed to initialize Supabase:", err);
    }
  }

  function updateAuthUI(user) {
    const signInBtn = el("auth-sign-in-btn");
    const userSection = el("auth-user");
    const avatar = el("auth-avatar");
    const nameEl = el("auth-name");

    if (user) {
      if (signInBtn) signInBtn.classList.add("hidden");
      if (userSection) userSection.classList.remove("hidden");
      if (avatar) avatar.src = "icons/icon-192.png";
      if (nameEl) nameEl.textContent = user.email?.split("@")[0] || "User";
    } else {
      if (signInBtn) signInBtn.classList.remove("hidden");
      if (userSection) userSection.classList.add("hidden");
    }
  }

  async function signInWithGithub() {
    if (!supabaseClient) { showToast("Supabase not configured"); return; }
    const { error } = await supabaseClient.auth.signInWithOAuth({ provider: "github", options: { redirectTo: window.location.origin + window.location.pathname } });
    if (error) showToast("Sign-in failed: " + error.message);
  }

  async function signInWithEmail() {
    if (!supabaseClient) { showToast("Supabase not configured"); return; }
    const email = el("auth-email")?.value;
    const password = el("auth-password")?.value;
    if (!email || !password) { showToast("Enter email and password"); return; }
    
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    if (error) {
      showToast("Sign-in failed: " + error.message);
    } else {
      closeAuthModal();
      showToast("Signed in!");
    }
  }

  async function signUpWithEmail() {
    if (!supabaseClient) { showToast("Supabase not configured"); return; }
    const email = el("auth-email")?.value;
    const password = el("auth-password")?.value;
    if (!email || !password) { showToast("Enter email and password"); return; }
    
    const { error } = await supabaseClient.auth.signUp({ email, password });
    if (error) {
      showToast("Sign-up failed: " + error.message);
    } else {
      closeAuthModal();
      showToast("Account created! Check your email to confirm if required.");
    }
  }

  async function signOutUser() {
    if (!supabaseClient) return;
    const { error } = await supabaseClient.auth.signOut();
    if (!error) {
      currentUser = null;
      updateAuthUI(null);
      showToast("Signed out");
    }
  }

  function openAuthModal() {
    el("auth-modal")?.classList.remove("hidden");
  }

  function closeAuthModal() {
    el("auth-modal")?.classList.add("hidden");
  }

  let isSignUpMode = false;
  function toggleSignUpMode() {
    isSignUpMode = !isSignUpMode;
    const btn = el("auth-email-btn");
    const toggle = el("auth-signup-toggle");
    if (btn) btn.textContent = isSignUpMode ? "Create account" : "Sign in";
    if (toggle) toggle.textContent = isSignUpMode ? "Already have an account? Sign in" : "Don't have an account? Sign up";
  }

  async function syncToCloud() {
    if (!currentUser || !supabaseClient) return;
    const indicator = el("sync-indicator");
    if (indicator) indicator.classList.add("syncing");

    try {
      // Collect all character statuses to upsert
      const progressData = [];
      HANZI_DATA.forEach(h => {
        const status = getStatus(h.c);
        if (status !== "new") {
          // For simplicity, we just save the status here
          progressData.push({
            user_id: currentUser.id,
            character: h.c,
            status: status,
            attempts: 0,
            correct: 0,
            last_practiced: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
      
      // Batch upsert to Supabase
      if (progressData.length > 0) {
        const { error } = await supabaseClient
          .from("hanzi_progress")
          .upsert(progressData, { onConflict: "user_id,character" });
          
        if (error) {
           console.error("Supabase upsert error:", error);
        }
      }
    } catch(e) {
      console.warn("[Sync] Cloud save failed:", e);
    } finally {
      if (indicator) indicator.classList.remove("syncing");
    }
  }

  function debouncedSync() {
    clearTimeout(syncDebounceTimer);
    syncDebounceTimer = setTimeout(syncToCloud, 2000);
  }

  async function loadFromCloud() {
    if (!currentUser || !supabaseClient) return;
    try {
      const { data, error } = await supabaseClient
        .from("hanzi_progress")
        .select("*")
        .eq("user_id", currentUser.id);
        
      if (error) throw error;
      if (!data || data.length === 0) return;
      
      data.forEach(row => {
         const current = getStatus(row.character);
         if (row.status && row.status !== current) {
           setStatusRaw(row.character, row.status);
         }
      });

      showToast("☁️ Data synced from cloud");
      saveState();
      renderBrowse();
      renderProgress();
      updateHeaderProgress();
      updateXPDisplay();
    } catch(e) {
      console.warn("[Sync] Cloud load failed:", e);
    }
  }

  // Helper: set status without triggering full re-render (for bulk import)
  function setStatusRaw(char, status) {
    if (!state.progress[char]) {
      state.progress[char] = { status: status, interval: 0, reviews: 0, due: Date.now(), stampedAt: null };
    } else {
      state.progress[char].status = status;
    }
  }

  function wireAuth() {
    el("auth-sign-in-btn")?.addEventListener("click", openAuthModal);
    el("auth-modal-close")?.addEventListener("click", closeAuthModal);
    el("auth-close-link")?.addEventListener("click", e => { e.preventDefault(); closeAuthModal(); });
    el("auth-github-btn")?.addEventListener("click", signInWithGithub);
    el("auth-email-btn")?.addEventListener("click", () => isSignUpMode ? signUpWithEmail() : signInWithEmail());
    el("auth-signup-toggle")?.addEventListener("click", e => { e.preventDefault(); toggleSignUpMode(); });

    // Sign out on avatar click
    el("auth-avatar")?.addEventListener("click", () => {
      if (confirm("Sign out of cloud sync?")) signOutUser();
    });
  }

  // showToast is already defined earlier with full animation and error support

  /* ---------- init ---------- */
  async function init(){
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
      buildIndexes();
      await loadState();
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
      buildSentenceIndex();
      renderBrowse();
      renderSentences();
      renderProgress();
      renderTonesTab();
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
    } catch(err) {
      console.error("[HanziTracker] App init error:", err);
    } finally {
      clearTimeout(failsafe);
      dismissLoading();
    }
  }

  init();
})();