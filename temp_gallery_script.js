<script>
  const BASE = '/';
  const API_BASE = 'https://jamestyle-analytics.jimsbond007.workers.dev';
  let galleryData = [];
  let currentIndex = 0;
  let isInsightOpen = false;
  let autoFlipTimeout = null;
  const todayInsightCache = new Map();
  let reactionCounts = {};
  let userReactions = JSON.parse(localStorage.getItem('gallery_user_reactions') || '{}');

  function getSessionId() {
    let id = localStorage.getItem('gallery_session_id');
    if (!id) {
      id = 'gs_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('gallery_session_id', id);
    }
    return id;
  }
  const sessionId = getSessionId();

  const REACTION_TYPES = [
    { key: 'like', emoji: '??', label: '霈末' },
    { key: 'love', emoji: '?歹?', label: '?迭' },
    { key: 'laugh', emoji: '??', label: '憟賜?' },
    { key: 'wow', emoji: '?', label: '撽?' },
    { key: 'sad', emoji: '?', label: '??' }
  ];

  // ================= Mode Detection =================
  const urlParams = new URLSearchParams(window.location.search);
  const singleCode = urlParams.get('code');
  const isSingleMode = !!singleCode;

  if (isSingleMode) {
    document.body.classList.add('single-mode');
  }

  // ================= Frame Styles =================
  const FRAME_STYLES = [
    { name: 'Classic Walnut', class: 'frame-style-0' },
    { name: 'Gold Slim', class: 'frame-style-1' },
    { name: 'Matte Black', class: 'frame-style-2' },
    { name: 'Aged Copper', class: 'frame-style-3' },
    { name: 'Gallery White', class: 'frame-style-4' },
    { name: 'Leather Brown', class: 'frame-style-5' },
    { name: 'Polished Silver', class: 'frame-style-6' },
    { name: 'Ivory Carved', class: 'frame-style-7' },
    { name: 'Industrial Iron', class: 'frame-style-8' },
    { name: 'Floating Minimal', class: 'frame-style-9' }
  ];

  function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  function getFrameClass(code) {
    const idx = hashCode(code) % FRAME_STYLES.length;
    return FRAME_STYLES[idx].class;
  }

  // ================= Music =================
  const audio = new Audio('/music/gallery.mp3');
  audio.loop = true;
  audio.volume = 0.25;
  audio.playbackRate = 0.85;
  let isPlaying = false;

  const musicBtn = document.getElementById('musicBtn');
  const musicWaves = document.getElementById('musicWaves');

  function toggleMusic() {
    if (isPlaying) {
      audio.pause();
      musicBtn.innerHTML = '&#9654;';
      musicWaves.classList.add('paused');
    } else {
      audio.play().catch(() => {});
      musicBtn.innerHTML = '&#10074;&#10074;';
      musicWaves.classList.remove('paused');
    }
    isPlaying = !isPlaying;
  }

  musicBtn.addEventListener('click', toggleMusic);

  // Auto-play music on first user interaction
  const musicInit = () => {
    if (!isPlaying && !isSingleMode) toggleMusic();
    ['click', 'touchstart', 'keydown'].forEach(e => document.removeEventListener(e, musicInit));
  };
  ['click', 'touchstart', 'keydown'].forEach(e => document.addEventListener(e, musicInit, { once: true, passive: true }));

  // ================= Password =================
  const passwordOverlay = document.getElementById('passwordOverlay');
  const passwordCard = document.getElementById('passwordCard');
  const passwordInput = document.getElementById('passwordInput');
  const passwordSubmit = document.getElementById('passwordSubmit');
  const passwordError = document.getElementById('passwordError');

  function showPasswordError() {
    passwordError.classList.add('show');
    passwordCard.classList.remove('shake');
    void passwordCard.offsetWidth; // reflow
    passwordCard.classList.add('shake');
    passwordInput.value = '';
    passwordInput.focus();
  }

  function unlockGallery() {
    passwordOverlay.classList.add('hidden');
    sessionStorage.setItem('gallery_unlocked', '1');
  }

  function checkPassword() {
    const val = passwordInput.value.trim();
    if (val === '4453') {
      unlockGallery();
    } else {
      showPasswordError();
    }
  }

  passwordSubmit.addEventListener('click', checkPassword);
  passwordInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') checkPassword();
    passwordError.classList.remove('show');
  });

  // ================= API Helpers =================
  async function fetchTodayInsight(code) {
    if (todayInsightCache.has(code)) return todayInsightCache.get(code);
    try {
      const res = await fetch(`${API_BASE}/api/public/quote/${encodeURIComponent(code)}/today`);
      if (!res.ok) throw new Error('fail');
      const data = await res.json();
      const insight = data?.todayInsight || null;
      todayInsightCache.set(code, insight);
      return insight;
    } catch (e) {
      return null;
    }
  }

  async function fetchReactions(code) {
    try {
      const res = await fetch(`${API_BASE}/api/public/quote/${encodeURIComponent(code)}/reactions`);
      if (!res.ok) throw new Error('fail');
      const data = await res.json();
      if (data && data.counts) {
        reactionCounts[code] = data.counts;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  async function postReaction(code, type) {
    try {
      await fetch(`${API_BASE}/api/public/quote/${encodeURIComponent(code)}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reactionType: type, sessionId })
      });
    } catch (e) {}
  }

  async function requestSubscribe(code) {
    try {
      const res = await fetch(`${API_BASE}/api/public/subscribe/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, sessionId })
      });
      if (!res.ok) throw new Error('fail');
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  function renderReactionButtons(code) {
    const counts = reactionCounts[code] || {};
    const user = userReactions[code] || {};
    return REACTION_TYPES.map(t => {
      const count = counts[t.key] || 0;
      const active = user[t.key];
      return `<button class="btn btn-reaction ${active ? 'active' : ''}" data-type="${t.key}" title="${t.label}">
        ${t.emoji} <span class="count">${count}</span>
      </button>`;
    }).join('');
  }

  function bindReactionButtons(code, container) {
    container.querySelectorAll('.btn-reaction[data-type]').forEach(btn => {
      btn.addEventListener('click', () => toggleReaction(code, btn.dataset.type));
    });
  }

  async function toggleReaction(code, type) {
    if (!userReactions[code]) userReactions[code] = {};
    if (!reactionCounts[code]) reactionCounts[code] = {};
    const active = !!userReactions[code][type];
    if (active) {
      reactionCounts[code][type] = Math.max(0, (reactionCounts[code][type] || 0) - 1);
      delete userReactions[code][type];
    } else {
      reactionCounts[code][type] = (reactionCounts[code][type] || 0) + 1;
      userReactions[code][type] = true;
    }
    localStorage.setItem('gallery_user_reactions', JSON.stringify(userReactions));
    postReaction(code, type);
    updateReactionCountsInUI(code);
  }

  function updateReactionCountsInUI(code) {
    const counts = reactionCounts[code] || {};
    const user = userReactions[code] || {};
    document.querySelectorAll('.btn-reaction[data-type]').forEach(btn => {
      const type = btn.dataset.type;
      const countEl = btn.querySelector('.count');
      if (countEl) countEl.textContent = counts[type] || 0;
      btn.classList.toggle('active', !!user[type]);
    });
  }

  async function handleSubscribe(code) {
    const data = await requestSubscribe(code);
    if (data && data.deepLink) {
      window.open(data.deepLink, '_blank');
      showToast('撌脩?冽??末閮閮嚗?);
    } else {
      showToast('?急??⊥???嚗?蝔??岫');
    }
  }

  // ================= Load Data =================
  async function loadGallery() {
    try {
      const res = await fetch(BASE + 'gallery-data.json');
      const data = await res.json();
      galleryData = data.gallery || [];
      document.getElementById('countBadge').textContent = galleryData.length + ' ????;

      if (isSingleMode) {
        const item = galleryData.find(i => i.code === singleCode);
        if (item) {
          openSingleView(item);
        } else {
          document.getElementById('singleView').innerHTML = '<div style="text-align:center;color:var(--ink-light);padding:4rem 1rem;">?曆??唳迨隤?</div>';
          document.getElementById('singleView').classList.add('active');
        }
      } else {
        // Gallery mode: check if already unlocked this session
        if (sessionStorage.getItem('gallery_unlocked') === '1') {
          unlockGallery();
        }
        renderGallery(galleryData);
      }
    } catch (e) {
      if (isSingleMode) {
        document.getElementById('singleView').innerHTML = '<div style="text-align:center;color:var(--ink-light);padding:4rem 1rem;">頛憭望?</div>';
        document.getElementById('singleView').classList.add('active');
      } else {
        document.getElementById('gallery').innerHTML = '<div class="no-results">頛憭望?嚗?蝔??岫</div>';
      }
    }
  }

  function getImageUrl(code) {
    return BASE + 'gallery-images/' + code + '.jpeg';
  }
  function getWebpUrl(code) {
    return BASE + 'gallery-images-webp/' + code + '.webp';
  }
  function renderPicture(code, title, lazy) {
    return `<picture>
      <source srcset="${getWebpUrl(code)}" type="image/webp">
      <img src="${getImageUrl(code)}" alt="${title}"${lazy ? ' loading="lazy"' : ''}>
    </picture>`;
  }

  function renderGallery(items) {
    const container = document.getElementById('gallery');
    if (items.length === 0) {
      container.innerHTML = '<div class="no-results">?曆??啁????/div>';
      return;
    }
    container.innerHTML = items.map((item, i) => `
      <article class="card fade-in" style="animation-delay:${Math.min(i*0.03,0.6)}s" data-index="${i}" data-code="${item.code}">
        <div class="card-frame">
          <div class="card-img-wrap">
            ${renderPicture(item.code, item.title, true)}
          </div>
        </div>
        <div class="card-info">
          <div class="card-num">NO. ${String(item.id).padStart(2,'0')}</div>
          <div class="card-title">${escapeHtml(item.title)}</div>
          <div class="card-caption">${escapeHtml(item.caption)}</div>
        </div>
      </article>
    `).join('');

    container.querySelectorAll('.card').forEach(card => {
      card.addEventListener('click', () => {
        const idx = parseInt(card.dataset.index);
        openModal(idx);
      });
    });
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ================= Modal (Gallery Mode) =================
  function openModal(index) {
    currentIndex = index;
    isInsightOpen = false;
    const item = galleryData[index];
    const body = document.getElementById('modalBody');

    body.innerHTML = `
      <div class="modal-img-side">
        ${renderPicture(item.code, item.title, false)}
      </div>
      <div class="modal-text-side">
        <div class="modal-num">NO. ${String(item.id).padStart(2,'0')} / ${galleryData.length}</div>
        <h2 class="modal-title">${escapeHtml(item.title)}</h2>
        <blockquote class="modal-caption">${escapeHtml(item.caption)}</blockquote>
        <div class="insight-reveal">
          <button class="btn-insight" id="btnInsight">
            <span>&#10024;</span> 閫? <span class="arrow" id="insightArrow">&#9660;</span>
          </button>
          <div class="insight-content" id="insightContent">
            <div class="modal-insight-label" id="modalInsightLabel">?踹??冽? 繚 閫?</div>
            <div id="modalInsightLoading" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0;color:var(--ink-light);font-size:0.9rem;">
              <span class="spinner-inline"></span> 甇??脣?隞閫?...
            </div>
            <p class="modal-insight" id="modalInsightText" style="display:none;"></p>
          </div>
        </div>
        <div class="modal-actions" id="modalActions">
          ${renderReactionButtons(item.code)}
          <button class="btn btn-hermes" id="btnSubscribe">&#127873; ?脣?撽?</button>
          <a class="btn btn-whatsapp" href="https://wa.me/?text=${encodeURIComponent(item.caption + '\n\n???踹??冽??? + item.title + '?nhttps://jamestyle.com/?code=' + item.code)}" target="_blank">&#128172; WhatsApp</a>
        </div>
      </div>
    `;

    document.getElementById('modal').classList.add('active');
    document.body.style.overflow = 'hidden';
    history.pushState({gallery: true, code: item.code}, '', '/gallery/?code=' + item.code);

    // Bind actions
    document.getElementById('btnInsight').addEventListener('click', toggleInsight);
    bindReactionButtons(item.code, document.getElementById('modalActions'));
    document.getElementById('btnSubscribe').addEventListener('click', () => handleSubscribe(item.code));

    // Fetch today insight
    fetchTodayInsight(item.code).then(todayInsight => {
      const loading = document.getElementById('modalInsightLoading');
      const text = document.getElementById('modalInsightText');
      const label = document.getElementById('modalInsightLabel');
      if (loading) loading.style.display = 'none';
      if (text) {
        text.style.display = '';
        text.textContent = todayInsight || item.insight;
      }
      if (label) {
        label.textContent = todayInsight ? '隞閫?' : '?踹??冽? 繚 閫?';
      }
    });

    // Fetch reactions
    fetchReactions(item.code).then(() => updateReactionCountsInUI(item.code));
  }

  function toggleInsight() {
    const btn = document.getElementById('btnInsight');
    const content = document.getElementById('insightContent');
    isInsightOpen = !isInsightOpen;
    btn.classList.toggle('open', isInsightOpen);
    content.classList.toggle('open', isInsightOpen);
  }

  function closeModal() {
    document.getElementById('modal').classList.remove('active');
    document.body.style.overflow = '';
    if (history.state && history.state.gallery) {
      history.pushState({}, '', '/gallery/');
    }
  }

  function copyLink(code) {
    const url = 'https://jamestyle.com/?code=' + code;
    navigator.clipboard.writeText(url).then(() => showToast('???撌脰?鋆?));
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2000);
  }

  // ================= Single View (3D Flip Card) =================
  function openSingleView(item) {
    document.body.classList.add('single-mode');
    const container = document.getElementById('singleView');
    const flipCard = document.getElementById('flipCard');
    const front = document.getElementById('flipCardFront');
    const back = document.getElementById('flipCardBack');
    const staticContent = document.getElementById('singleStaticContent');
    const frameClass = getFrameClass(item.code);

    // Update meta for single view
    document.title = `?踹??冽?隤? | ${item.title}`;
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.content = item.caption;

    // Reset flip state
    flipCard.classList.remove('flipped');
    if (autoFlipTimeout) {
      clearTimeout(autoFlipTimeout);
      autoFlipTimeout = null;
    }

    // Front side - only the artwork
    front.innerHTML = `
      <div class="frame-wrap ${frameClass}">
        <div class="frame-matting">
          ${renderPicture(item.code, item.title, false).replace('<img', '<img class="single-frame-img"')}
        </div>
      </div>
    `;

    // Back side - insight text only
    back.innerHTML = `
      <div class="single-back-label" id="singleInsightLabel">?踹??冽? 繚 閫?</div>
      <div id="singleInsightLoading" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0;color:var(--ink-light);font-size:0.95rem;">
        <span class="spinner-inline"></span> 甇??脣?隞閫?...
      </div>
      <p class="single-insight" id="singleInsightText" style="display:none;"></p>
    `;

    // Static content - title, caption, buttons (always visible)
    staticContent.innerHTML = `
      <h2 class="single-title">${escapeHtml(item.title)}</h2>
      <blockquote class="single-caption">${escapeHtml(item.caption)}</blockquote>
      <div class="single-actions-center">
        <button class="btn btn-hermes" id="btnFlipToggle">&#10024; 閫?</button>
      </div>
      <div class="single-actions" id="singleActions">
        ${renderReactionButtons(item.code)}
        <button class="btn btn-hermes" id="btnSubscribe">&#127873; ?脣?撽?</button>
        <a class="btn btn-whatsapp" href="https://wa.me/?text=${encodeURIComponent(item.caption + '\n\n???踹??冽??? + item.title + '?nhttps://jamestyle.com/?code=' + item.code)}" target="_blank">&#128172; WhatsApp</a>
      </div>
    `;

    container.classList.add('active');

    // Bind flip events
    const btnFlip = document.getElementById('btnFlipToggle');
    btnFlip.addEventListener('click', () => {
      if (flipCard.classList.contains('flipped')) {
        // Currently showing back, flip to front
        flipCard.classList.remove('flipped');
        btnFlip.innerHTML = '&#10024; 閫?';
        if (autoFlipTimeout) {
          clearTimeout(autoFlipTimeout);
          autoFlipTimeout = null;
        }
      } else {
        // Currently showing front, flip to back
        flipCard.classList.add('flipped');
        btnFlip.innerHTML = '&#10094; 餈?';
        if (autoFlipTimeout) clearTimeout(autoFlipTimeout);
        autoFlipTimeout = setTimeout(() => {
          flipCard.classList.remove('flipped');
          btnFlip.innerHTML = '&#10024; 閫?';
        }, 5000);
      }
    });

    bindReactionButtons(item.code, document.getElementById('singleActions'));
    document.getElementById('btnSubscribe').addEventListener('click', () => handleSubscribe(item.code));

    // Fetch today insight
    fetchTodayInsight(item.code).then(todayInsight => {
      const loading = document.getElementById('singleInsightLoading');
      const text = document.getElementById('singleInsightText');
      const label = document.getElementById('singleInsightLabel');
      if (loading) loading.style.display = 'none';
      if (text) {
        text.style.display = '';
        text.textContent = todayInsight || item.insight;
      }
      if (label) {
        label.textContent = todayInsight ? '隞閫?' : '?踹??冽? 繚 閫?';
      }
    });

    // Fetch reactions
    fetchReactions(item.code).then(() => updateReactionCountsInUI(item.code));
  }

  // ================= Search =================
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase().trim();
    if (!q) {
      renderGallery(galleryData);
      return;
    }
    const filtered = galleryData.filter(item =>
      item.title.toLowerCase().includes(q) ||
      item.caption.toLowerCase().includes(q) ||
      item.insight.toLowerCase().includes(q)
    );
    renderGallery(filtered);
  });

  // ================= Modal controls =================
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.getElementById('modal').addEventListener('click', (e) => {
    if (e.target.id === 'modal') closeModal();
  });
  document.getElementById('modalPrev').addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
    openModal(currentIndex);
  });
  document.getElementById('modalNext').addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % galleryData.length;
    openModal(currentIndex);
  });

  // ================= Keyboard =================
  document.addEventListener('keydown', (e) => {
    if (isSingleMode) return;
    if (!document.getElementById('modal').classList.contains('active')) return;
    if (e.key === 'Escape') closeModal();
    if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + galleryData.length) % galleryData.length;
      openModal(currentIndex);
    }
    if (e.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % galleryData.length;
      openModal(currentIndex);
    }
  });

  // ================= Init =================
  loadGallery();
</script>
