// NEXO Portal — Onboarding interactivo — ENGINE (state machine)
// ─────────────────────────────────────────────────────────
// Zero dependências. Zero chamadas a APIs externas. Vanilla JS.
// Requer: onboarding-steps.js carregado antes (define ONBOARDING_STEPS).
// Entry point público: startOnboarding(config)
//   config = { nome, restaurante, venueSlug, menuUrl, isFirstLogin, clientId? }
// Persistência: localStorage 'nexo_onboarding_[venueSlug]'
//   { currentStep, completedSteps[], skipped, completed, seenWelcome }
(function () {
  'use strict';

  var PAD = 8;               // padding do recorte do spotlight
  var MOBILE_Q = '(max-width: 767px)';
  var SWIPE_THRESHOLD = 50;  // px

  var state = {
    currentStep: 0,
    config: {},
    storageKey: '',
    isRunning: false,
  };

  var steps = [];
  var els = {};              // refs DOM: overlay divs, ring, tooltip, progress…
  var listeners = [];        // listeners do tour (removidos no teardown)
  var rafPending = false;
  var touchStartX = null;

  // ─── helpers ─────────────────────────────
  function isMobile() { return window.matchMedia(MOBILE_Q).matches; }

  function escOb(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function on(target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    listeners.push([target, type, fn, opts]);
  }
  function offAll() {
    listeners.forEach(function (l) { l[0].removeEventListener(l[1], l[2], l[3]); });
    listeners = [];
  }

  function loadState() {
    try { return JSON.parse(localStorage.getItem(state.storageKey)) || {}; }
    catch (_) { return {}; }
  }
  function saveState(patch) {
    try {
      var cur = loadState();
      Object.keys(patch).forEach(function (k) { cur[k] = patch[k]; });
      localStorage.setItem(state.storageKey, JSON.stringify(cur));
    } catch (_) {}
  }

  function tourSteps() { return steps.filter(function (s) { return !s.is_final; }); }
  function totalSteps() { return tourSteps().length; }

  function markCompleted(id) {
    var st = loadState();
    var done = st.completedSteps || [];
    if (done.indexOf(id) === -1) done.push(id);
    saveState({ completedSteps: done });
  }

  // Elemento alvo do step — null se não existir ou estiver invisível
  function stepTargetEl(step) {
    if (!step || !step.elemento_alvo) return null;
    var el = document.querySelector(step.elemento_alvo);
    if (!el) return null;
    var r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return null;
    return el;
  }

  // Resolve uma CSS var para uma cor concreta (para o canvas do confetti)
  function cssColor(varName, fallback) {
    try {
      var probe = document.createElement('span');
      probe.style.color = 'var(' + varName + ', ' + fallback + ')';
      probe.style.position = 'absolute'; probe.style.visibility = 'hidden';
      document.body.appendChild(probe);
      var c = getComputedStyle(probe).color;
      probe.remove();
      return c || fallback;
    } catch (_) { return fallback; }
  }

  // ─── toast próprio (desacoplado do portal) ──
  function obToast(msg) {
    var t = document.createElement('div');
    t.className = 'ob-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    requestAnimationFrame(function () { t.classList.add('ob-visible'); });
    setTimeout(function () {
      t.classList.remove('ob-visible');
      setTimeout(function () { t.remove(); }, 300);
    }, 5000);
  }

  // ─── entry point público ─────────────────
  window.startOnboarding = function (config) {
    if (!config || !config.venueSlug) return;
    if (typeof ONBOARDING_STEPS === 'undefined' || !Array.isArray(ONBOARDING_STEPS)) return;
    if (state.isRunning) return;

    state.config = config;
    steps = ONBOARDING_STEPS;
    state.storageKey = 'nexo_onboarding_' + config.venueSlug;

    ensureTourButton();

    var st = loadState();
    if (st.completed || st.skipped) return;
    if (st.active) { startTour(st.currentStep || 0); return; }
    if (config.isFirstLogin && !st.seenWelcome) showWelcomeModal();
  };

  // ─── welcome modal ───────────────────────
  function showWelcomeModal() {
    if (document.getElementById('nexo-ob-welcome')) return;
    saveState({ seenWelcome: true });

    var cfg = state.config;
    var w = document.createElement('div');
    w.id = 'nexo-ob-welcome';
    w.setAttribute('role', 'dialog');
    w.setAttribute('aria-modal', 'true');
    w.innerHTML =
      '<div class="ob-welcome-inner">' +
        '<div class="ob-logo">' +
          '<svg viewBox="0 0 96 24" width="96" height="24" aria-label="NEXO">' +
            '<text x="0" y="19" font-family="inherit" font-size="20" font-weight="800" letter-spacing="-0.5" fill="currentColor">NEXO.</text>' +
          '</svg>' +
        '</div>' +
        '<h1>Olá, ' + escOb(cfg.nome) + ' 👋</h1>' +
        '<p>O portal do <strong>' + escOb(cfg.restaurante) + '</strong> está pronto.<br>' +
           'Em 5 minutos configura tudo e o seu menu<br>' +
           'fica a funcionar para os seus clientes.</p>' +
        '<div class="ob-welcome-actions">' +
          '<button type="button" class="ob-btn-primary" id="ob-start">▶ Começar configuração</button>' +
          '<button type="button" class="ob-btn-ghost" id="ob-skip">Explorar por minha conta →</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(w);

    // sequência de animação — apenas classes CSS
    setTimeout(function () { w.classList.add('ob-enter'); }, 50);
    setTimeout(function () { w.querySelector('.ob-logo').classList.add('ob-logo-pop'); }, 200);
    setTimeout(function () { w.querySelector('h1').classList.add('ob-text-in'); }, 400);
    setTimeout(function () { w.querySelector('p').classList.add('ob-text-in'); }, 600);
    setTimeout(function () { w.querySelector('.ob-welcome-actions').classList.add('ob-cta-in'); }, 800);

    function closeWelcome(cb) {
      w.classList.add('ob-leave');
      setTimeout(function () { w.remove(); if (cb) cb(); }, 300);
    }
    w.querySelector('#ob-start').addEventListener('click', function () {
      closeWelcome(function () { startTour(0); });
    });
    w.querySelector('#ob-skip').addEventListener('click', function () {
      saveState({ skipped: true, active: false });
      closeWelcome(function () {
        obToast("💡 Podes iniciar o tour a qualquer momento clicando em '? Tour' no menu.");
      });
    });
    setTimeout(function () { try { w.querySelector('#ob-start').focus(); } catch (_) {} }, 900);
  }

  // ─── tour ────────────────────────────────
  function startTour(index) {
    if (state.isRunning) return;
    state.isRunning = true;
    saveState({ active: true, skipped: false });
    ensureTourUI();
    on(document, 'keydown', onKeydown, true);
    on(window, 'resize', requestReposition);
    on(window, 'scroll', requestReposition, true);
    showStep(typeof index === 'number' ? index : 0, 1);
  }

  function ensureTourUI() {
    if (!els.overlay) {
      var ov = document.createElement('div');
      ov.id = 'nexo-ob-overlay';
      ['top', 'right', 'bottom', 'left'].forEach(function (side) {
        var d = document.createElement('div');
        d.className = 'ob-ov ob-ov-' + side;
        ov.appendChild(d);
        els['ov_' + side] = d;
      });
      var ring = document.createElement('div');
      ring.className = 'ob-ring';
      ov.appendChild(ring);
      els.ring = ring;
      document.body.appendChild(ov);
      els.overlay = ov;
    }
    if (!els.tooltip) {
      var t = document.createElement('div');
      t.id = 'nexo-ob-tooltip';
      t.className = 'ob-tooltip';
      t.setAttribute('role', 'dialog');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
      els.tooltip = t;
      // swipe (mobile): esquerda = próximo, direita = anterior
      on(t, 'touchstart', function (e) {
        touchStartX = e.changedTouches[0].clientX;
      }, { passive: true });
      on(t, 'touchend', function (e) {
        if (touchStartX == null) return;
        var dx = e.changedTouches[0].clientX - touchStartX;
        touchStartX = null;
        if (dx <= -SWIPE_THRESHOLD) nextStep();
        else if (dx >= SWIPE_THRESHOLD && state.currentStep > 0) prevStep();
      }, { passive: true });
    }
    if (!els.progress) {
      var p = document.createElement('div');
      p.id = 'nexo-ob-progress-bar';
      p.innerHTML =
        '<div id="nexo-ob-progress-fill"></div>' +
        '<span id="nexo-ob-progress-label"></span>';
      p.setAttribute('role', 'button');
      p.setAttribute('tabindex', '0');
      p.setAttribute('aria-label', 'Progresso do tour — clique para ver todos os passos');
      document.body.appendChild(p);
      els.progress = p;
      els.progressFill = p.querySelector('#nexo-ob-progress-fill');
      els.progressLabel = p.querySelector('#nexo-ob-progress-label');
      on(p, 'click', toggleMinimap);
      on(p, 'keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMinimap(e); }
      });
    }
  }

  function showStep(index, dir) {
    dir = dir < 0 ? -1 : 1;
    if (index < 0) return;
    if (index >= steps.length) { showFinalModal(); return; }

    var step = steps[index];
    if (step.is_final) { state.currentStep = index; showFinalModal(); return; }

    var target = stepTargetEl(step);
    if (!target) {
      // elemento não existe nesta página — salta gracefully
      showStep(index + dir, dir);
      return;
    }

    state.currentStep = index;
    saveState({ currentStep: index, active: true });
    els.target = target;
    els.curStep = step;

    // 1. scroll suave até ao alvo
    try { target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' }); } catch (_) {}

    // tooltip: fadeOut → move → fadeIn
    els.tooltip.classList.add('ob-hide');

    setTimeout(function () {
      if (!state.isRunning) return;
      var rect = target.getBoundingClientRect();
      positionSpotlight(rect);                 // 2+3. spotlight com transição
      renderTooltip(step, index);              // 4. tooltip
      positionTooltip(rect, step.tooltip_posicao);
      els.tooltip.classList.remove('ob-hide');
      els.tooltip.classList.remove('ob-spring');
      void els.tooltip.offsetWidth;            // reinicia a animação spring
      els.tooltip.classList.add('ob-spring');
      updateProgress(step, index);
      try { els.tooltip.querySelector('.ob-btn-next').focus({ preventScroll: true }); } catch (_) {}
    }, 320);
  }

  // spotlight = 4 divs à volta do recorte (compatível com iOS Safari)
  function positionSpotlight(rect) {
    var vw = window.innerWidth, vh = window.innerHeight;
    var x1 = Math.max(rect.left - PAD, 0);
    var y1 = Math.max(rect.top - PAD, 0);
    var x2 = Math.min(rect.right + PAD, vw);
    var y2 = Math.min(rect.bottom + PAD, vh);

    els.ov_top.style.cssText    = 'top:0;left:0;width:100%;height:' + y1 + 'px';
    els.ov_bottom.style.cssText = 'top:' + y2 + 'px;left:0;width:100%;height:' + Math.max(vh - y2, 0) + 'px';
    els.ov_left.style.cssText   = 'top:' + y1 + 'px;left:0;width:' + x1 + 'px;height:' + (y2 - y1) + 'px';
    els.ov_right.style.cssText  = 'top:' + y1 + 'px;left:' + x2 + 'px;width:' + Math.max(vw - x2, 0) + 'px;height:' + (y2 - y1) + 'px';
    els.ring.style.cssText      = 'top:' + y1 + 'px;left:' + x1 + 'px;width:' + (x2 - x1) + 'px;height:' + (y2 - y1) + 'px';
  }

  function renderTooltip(step, index) {
    var tourIdx = tourSteps().indexOf(step);
    var html =
      '<div class="ob-tooltip-arrow"></div>' +
      '<div class="ob-tooltip-header">' +
        '<span class="ob-step-icone">' + escOb(step.icone) + '</span>' +
        '<span class="ob-step-titulo">' + escOb(step.titulo) + '</span>' +
        '<span class="ob-step-counter">' + (tourIdx + 1) + '/' + totalSteps() + '</span>' +
      '</div>' +
      '<div class="ob-tooltip-corpo">' + escOb(step.corpo) + '</div>' +
      (step.detalhe ? '<div class="ob-tooltip-detalhe">' + escOb(step.detalhe) + '</div>' : '') +
      '<div class="ob-tooltip-footer">' +
        '<button type="button" class="ob-btn-pular">Pular tour</button>' +
        '<div class="ob-footer-right">' +
          (index > 0 ? '<button type="button" class="ob-btn-back">← Anterior</button>' : '') +
          (step.cta_label ? '<button type="button" class="ob-btn-cta">' + escOb(step.cta_label) + '</button>' : '') +
          '<button type="button" class="ob-btn-next">Próximo →</button>' +
        '</div>' +
      '</div>';
    els.tooltip.innerHTML = html;

    els.tooltip.querySelector('.ob-btn-pular').addEventListener('click', confirmExit);
    els.tooltip.querySelector('.ob-btn-next').addEventListener('click', nextStep);
    var back = els.tooltip.querySelector('.ob-btn-back');
    if (back) back.addEventListener('click', prevStep);
    var cta = els.tooltip.querySelector('.ob-btn-cta');
    if (cta) cta.addEventListener('click', function () { runCta(step); });
  }

  function runCta(step) {
    markCompleted(step.id);
    if (step.cta_abre_url && state.config.menuUrl) {
      window.open(state.config.menuUrl, '_blank', 'noopener');
      nextStep();
      return;
    }
    if (step.cta_navega) {
      // guarda o próximo passo antes de navegar — o tour retoma na nova página
      saveState({ currentStep: Math.min(state.currentStep + 1, steps.length - 1), active: true });
      window.location.href = step.cta_navega;
    }
  }

  function positionTooltip(rect, pos) {
    var tip = els.tooltip;

    if (isMobile()) {
      // bottom-sheet fixo (acima da barra de navegação inferior do portal)
      tip.classList.add('ob-sheet');
      tip.className = tip.className.replace(/\bob-pos-\w+/g, '').replace(/\s+/g, ' ').trim();
      tip.classList.add('ob-sheet');
      tip.style.left = ''; tip.style.top = '';
      return;
    }
    tip.classList.remove('ob-sheet');

    var tw = tip.offsetWidth, th = tip.offsetHeight;
    var vw = window.innerWidth, vh = window.innerHeight;
    var m = 12, gap = 14;

    var fits = {
      top:    rect.top - th - gap >= m,
      bottom: rect.bottom + th + gap <= vh - m,
      left:   rect.left - tw - gap >= m,
      right:  rect.right + tw + gap <= vw - m,
    };
    var flip = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
    var p = pos || 'bottom';
    if (!fits[p]) {
      p = fits[flip[p]] ? flip[p]
        : (['bottom', 'right', 'top', 'left'].filter(function (k) { return fits[k]; })[0] || p);
    }

    var x = 0, y = 0;
    if (p === 'top')    { x = rect.left + rect.width / 2 - tw / 2; y = rect.top - th - gap; }
    if (p === 'bottom') { x = rect.left + rect.width / 2 - tw / 2; y = rect.bottom + gap; }
    if (p === 'left')   { x = rect.left - tw - gap; y = rect.top + rect.height / 2 - th / 2; }
    if (p === 'right')  { x = rect.right + gap;     y = rect.top + rect.height / 2 - th / 2; }
    x = Math.max(m, Math.min(x, vw - tw - m));
    y = Math.max(m, Math.min(y, vh - th - m));

    tip.style.left = Math.round(x) + 'px';
    tip.style.top = Math.round(y) + 'px';
    tip.className = tip.className.replace(/\bob-pos-\w+/g, '').replace(/\s+/g, ' ').trim();
    tip.classList.add('ob-pos-' + p);
  }

  // reposiciona spotlight + tooltip em scroll/resize (rAF-throttled)
  function requestReposition() {
    if (rafPending || !state.isRunning || !els.target || !els.curStep) return;
    rafPending = true;
    requestAnimationFrame(function () {
      rafPending = false;
      if (!state.isRunning || !els.target) return;
      var rect = els.target.getBoundingClientRect();
      positionSpotlight(rect);
      positionTooltip(rect, els.curStep.tooltip_posicao);
    });
  }

  function nextStep() {
    if (els.curStep) markCompleted(els.curStep.id);
    showStep(state.currentStep + 1, 1);
  }
  function prevStep() {
    if (state.currentStep > 0) showStep(state.currentStep - 1, -1);
  }
  function goToStep(index) {
    closeMinimap();
    showStep(index, 1);
  }

  // ─── progress bar + mini-mapa ────────────
  function updateProgress(step, index) {
    if (!els.progress) return;
    var tourIdx = tourSteps().indexOf(step);
    var total = totalSteps();
    els.progressFill.style.width = (((tourIdx + 1) / total) * 100) + '%';
    els.progressLabel.textContent = 'Passo ' + (tourIdx + 1) + ' de ' + total + ' — ' + (step.titulo || '');
  }

  function toggleMinimap(e) {
    if (e) e.stopPropagation();
    if (els.minimap) { closeMinimap(); return; }
    var st = loadState();
    var done = st.completedSteps || [];
    var mm = document.createElement('div');
    mm.id = 'nexo-ob-minimap';
    mm.innerHTML = tourSteps().map(function (s, i) {
      var icon = (i === tourSteps().indexOf(els.curStep)) ? '▶'
               : (done.indexOf(s.id) !== -1 ? '✅' : '○');
      var cur = (s === els.curStep) ? ' ob-mm-current' : '';
      return '<button type="button" class="ob-mm-item' + cur + '" data-step="' + steps.indexOf(s) + '">' +
             '<span class="ob-mm-state">' + icon + '</span>' +
             '<span class="ob-mm-icone">' + escOb(s.icone) + '</span>' +
             '<span class="ob-mm-title">' + escOb(s.titulo) + '</span>' +
             '</button>';
    }).join('');
    document.body.appendChild(mm);
    els.minimap = mm;
    mm.querySelectorAll('.ob-mm-item').forEach(function (b) {
      b.addEventListener('click', function () { goToStep(parseInt(b.dataset.step, 10)); });
    });
    // fecha ao clicar fora
    setTimeout(function () {
      on(document, 'click', function outside(ev) {
        if (els.minimap && !els.minimap.contains(ev.target)) closeMinimap();
      });
    }, 0);
    requestAnimationFrame(function () { mm.classList.add('ob-visible'); });
  }
  function closeMinimap() {
    if (els.minimap) { els.minimap.remove(); els.minimap = null; }
  }

  // ─── confirmação de saída (ESC / Pular) ──
  function confirmExit() {
    if (document.getElementById('nexo-ob-confirm')) return;
    var c = document.createElement('div');
    c.id = 'nexo-ob-confirm';
    c.setAttribute('role', 'dialog');
    c.setAttribute('aria-modal', 'true');
    c.innerHTML =
      '<div class="ob-confirm-inner">' +
        '<p>Tens a certeza que queres sair do tour?<br>Podes retomá-lo depois.</p>' +
        '<div class="ob-confirm-actions">' +
          '<button type="button" class="ob-btn-primary" id="ob-confirm-stay">Continuar tour</button>' +
          '<button type="button" class="ob-btn-ghost" id="ob-confirm-leave">Sair do tour</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(c);
    requestAnimationFrame(function () { c.classList.add('ob-enter'); });
    c.querySelector('#ob-confirm-stay').addEventListener('click', function () { c.remove(); });
    c.querySelector('#ob-confirm-leave').addEventListener('click', function () {
      c.remove();
      saveState({ skipped: true, active: false });
      teardown();
      obToast("💡 Podes retomar o tour a qualquer momento clicando em '? Tour' no menu.");
    });
    try { c.querySelector('#ob-confirm-stay').focus(); } catch (_) {}
  }

  // ─── modal final + confetti ──────────────
  function showFinalModal() {
    removeTourUI();
    state.isRunning = false;
    if (document.getElementById('nexo-ob-final')) return;

    var cfg = state.config;
    var m = document.createElement('div');
    m.id = 'nexo-ob-final';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML =
      '<canvas id="ob-confetti-canvas"></canvas>' +
      '<div class="ob-final-inner">' +
        '<div class="ob-final-icone">🎉</div>' +
        '<h2>' + escOb(cfg.restaurante) + ' está no ar.</h2>' +
        '<p>O seu menu está acessível a qualquer cliente que chegue à mesa. ' +
           'A partir de agora, cada visita ao menu é uma oportunidade que não se perde.' +
           '<br><br>Bem-vindo à NEXO, ' + escOb(cfg.nome) + '.</p>' +
        '<button type="button" class="ob-btn-primary" id="ob-finalizar">✓ Ir para o meu portal</button>' +
      '</div>';
    document.body.appendChild(m);
    requestAnimationFrame(function () { m.classList.add('ob-enter'); });

    runConfetti(m.querySelector('#ob-confetti-canvas'));

    m.querySelector('#ob-finalizar').addEventListener('click', function () {
      saveState({ completed: true, completed_at: Date.now(), active: false });
      persistCompletionRemote();
      m.classList.add('ob-leave');
      setTimeout(function () { m.remove(); }, 300);
      teardown();
      ensureTourButton();
    });
    try { m.querySelector('#ob-finalizar').focus(); } catch (_) {}
  }

  // best-effort: regista a conclusão no Supabase se o cliente existir.
  // Nunca bloqueia nem rebenta se a tabela/coluna não existir ou falhar.
  function persistCompletionRemote() {
    try {
      if (!window.db || !state.config.venueSlug) return;
      window.db.from('portal_clients')
        .update({ onboarding_completed: true })
        .eq('espaco_slug', state.config.venueSlug)
        .then(function () {}, function () {});
    } catch (_) {}
  }

  // Confetti em canvas puro — 80 partículas, 3 segundos, zero libs.
  function runConfetti(canvas) {
    if (!canvas || !canvas.getContext) return;
    try {
      var ctx = canvas.getContext('2d');
      var dpr = window.devicePixelRatio || 1;
      var W = window.innerWidth, H = window.innerHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.scale(dpr, dpr);

      var colors = [
        cssColor('--ob-primary', '#1A56DB'),
        cssColor('--ob-accent', '#16A34A'),
      ];
      var parts = [];
      for (var i = 0; i < 80; i++) {
        parts.push({
          x: Math.random() * W,
          y: -20 - Math.random() * H * 0.4,
          vx: (Math.random() - 0.5) * 2.4,
          vy: 2 + Math.random() * 3.5,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.25,
          size: 6 + Math.random() * 7,
          color: colors[i % colors.length],
        });
      }

      var start = performance.now();
      var rafId = null;
      function frame(now) {
        ctx.clearRect(0, 0, W, H);
        parts.forEach(function (p) {
          p.x += p.vx; p.y += p.vy; p.rotation += p.rotationSpeed;
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
          ctx.restore();
        });
        if (now - start < 3000) rafId = requestAnimationFrame(frame);
        else { ctx.clearRect(0, 0, W, H); cancelAnimationFrame(rafId); }
      }
      rafId = requestAnimationFrame(frame);
    } catch (_) { /* confetti é decorativo — nunca crashar */ }
  }

  // ─── keyboard / focus trap ───────────────
  function onKeydown(e) {
    var confirmOpen = document.getElementById('nexo-ob-confirm');
    var finalOpen = document.getElementById('nexo-ob-final');
    var welcomeOpen = document.getElementById('nexo-ob-welcome');
    var anyOpen = confirmOpen || finalOpen || welcomeOpen || state.isRunning;
    if (!anyOpen) return;

    if (e.key === 'Tab') { trapFocus(e); return; }

    if (e.key === 'Escape') {
      if (confirmOpen) { confirmOpen.remove(); e.preventDefault(); return; }
      if (state.isRunning && !finalOpen && !welcomeOpen) { e.preventDefault(); confirmExit(); }
      return;
    }
    if (!state.isRunning || confirmOpen || finalOpen || welcomeOpen) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); nextStep(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); if (state.currentStep > 0) prevStep(); }
  }

  function activeContainer() {
    return document.getElementById('nexo-ob-confirm')
        || document.getElementById('nexo-ob-final')
        || document.getElementById('nexo-ob-welcome')
        || (state.isRunning ? els.tooltip : null);
  }

  function trapFocus(e) {
    var c = activeContainer();
    if (!c) return;
    var f = c.querySelectorAll('button, a[href], [tabindex]:not([tabindex="-1"])');
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    else if (!c.contains(document.activeElement)) { e.preventDefault(); first.focus(); }
  }

  // ─── teardown ────────────────────────────
  function removeTourUI() {
    closeMinimap();
    ['overlay', 'tooltip', 'progress'].forEach(function (k) {
      if (els[k]) { els[k].remove(); els[k] = null; }
    });
    els.ov_top = els.ov_right = els.ov_bottom = els.ov_left = els.ring = null;
    els.progressFill = els.progressLabel = null;
    els.target = null; els.curStep = null;
  }

  function teardown() {
    removeTourUI();
    offAll();
    state.isRunning = false;
  }

  // ─── botão persistente "? Tour" ──────────
  function ensureTourButton() {
    if (document.querySelector('[data-onboarding="btn-tour"]')) return;
    var host = document.querySelector('.portal-nav-right') || document.querySelector('.portal-nav');
    if (!host) return;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ob-btn-tour';
    btn.setAttribute('data-onboarding', 'btn-tour');
    btn.setAttribute('aria-label', 'Tour do portal');
    btn.textContent = '? Tour';
    // listener fora do array `listeners` — o botão sobrevive ao teardown do tour
    btn.addEventListener('click', onTourButtonClick);
    host.insertBefore(btn, host.firstChild);
  }

  function onTourButtonClick() {
    if (state.isRunning) return;
    var st = loadState();
    if (st.completed) { showTourMenu(); return; }
    saveState({ skipped: false });
    startTour(st.currentStep || 0);
  }

  // tour já completo → escolher: recomeçar ou ir a uma secção
  function showTourMenu() {
    if (document.getElementById('nexo-ob-tourmenu')) return;
    var m = document.createElement('div');
    m.id = 'nexo-ob-tourmenu';
    m.setAttribute('role', 'dialog');
    m.setAttribute('aria-modal', 'true');
    m.innerHTML =
      '<div class="ob-tourmenu-inner">' +
        '<p class="ob-tourmenu-title">Voltar ao início do tour ou ir a uma secção?</p>' +
        '<button type="button" class="ob-mm-item" data-step="0"><span class="ob-mm-state">▶</span>' +
        '<span class="ob-mm-title"><strong>Recomeçar o tour</strong></span></button>' +
        tourSteps().map(function (s) {
          return '<button type="button" class="ob-mm-item" data-step="' + steps.indexOf(s) + '">' +
                 '<span class="ob-mm-icone">' + escOb(s.icone) + '</span>' +
                 '<span class="ob-mm-title">' + escOb(s.titulo) + '</span></button>';
        }).join('') +
        '<button type="button" class="ob-btn-ghost" id="ob-tourmenu-close">Fechar</button>' +
      '</div>';
    document.body.appendChild(m);
    requestAnimationFrame(function () { m.classList.add('ob-enter'); });

    function close() { m.remove(); }
    m.querySelector('#ob-tourmenu-close').addEventListener('click', close);
    m.addEventListener('click', function (e) { if (e.target === m) close(); });
    m.querySelectorAll('.ob-mm-item').forEach(function (b) {
      b.addEventListener('click', function () {
        close();
        var idx = parseInt(b.dataset.step, 10) || 0;
        saveState({ completed: false, active: true, completedSteps: idx === 0 ? [] : (loadState().completedSteps || []) });
        startTour(idx);
      });
    });
  }

})();
