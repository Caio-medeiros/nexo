/* ═══════════════════════════════════════════════════════════════
   NEXO. — script.js v7 — "Mesa às 21h"
   GSAP 3 + ScrollTrigger choreography · 2D canvas NFC ripples
   Progressive enhancement: all hidden states are set via JS only.
   ═══════════════════════════════════════════════════════════════ */
(() => {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer  = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const hasGSAP      = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const animate      = hasGSAP && !reduceMotion;

  if (hasGSAP) gsap.registerPlugin(ScrollTrigger);

  const track = (name, params) => {
    if (typeof nexoTrack === 'function') nexoTrack(name, params);
  };

  /* ══════════════════════════════════════════
     CUSTOM CURSOR — desktop only
     ══════════════════════════════════════════ */
  if (finePointer) {
    const dot   = document.getElementById('cursorDot');
    const ring  = document.getElementById('cursorRing');
    const label = document.getElementById('cursorLabel');
    let mx = innerWidth / 2, my = innerHeight / 2;
    let rx = mx, ry = my;
    let seen = false;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; document.body.classList.add('cursor-ready'); }
      if (dot) dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
    }, { passive: true });

    (function tick() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      if (ring) ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(tick);
    })();

    const setActive = (active, text = '') => {
      ring?.classList.toggle('active', active);
      if (label) label.textContent = active ? text : '';
    };

    document.querySelectorAll('a, button, .bc, .plan, .faq-q, select, .stat').forEach(el => {
      el.addEventListener('mouseenter', () => setActive(true, el.dataset.cursor || ''));
      el.addEventListener('mouseleave', () => setActive(false));
    });
  }

  /* ══════════════════════════════════════════
     NAV SCROLLED STATE + SCROLL PROGRESS
     ══════════════════════════════════════════ */
  const nav        = document.getElementById('nav');
  const scrollFill = document.getElementById('scrollFill');
  let scrollTick = false;

  function onScroll() {
    if (scrollTick) return;
    scrollTick = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav?.classList.toggle('scrolled', y > 60);
      const total = document.documentElement.scrollHeight - innerHeight;
      if (scrollFill) scrollFill.style.width = Math.min(y / total * 100, 100) + '%';
      scrollTick = false;
    });
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* logo click pulse */
  const logoEl = document.querySelector('.logo');
  logoEl?.addEventListener('click', () => {
    logoEl.classList.remove('logo-pulse');
    void logoEl.offsetWidth;
    logoEl.classList.add('logo-pulse');
    logoEl.addEventListener('animationend', () => logoEl.classList.remove('logo-pulse'), { once: true });
  });

  /* ══════════════════════════════════════════
     HAMBURGER / MOBILE MENU OVERLAY
     ══════════════════════════════════════════ */
  const hamburger = document.getElementById('hamburger');
  const mobMenu   = document.getElementById('mob-menu');

  function menuOpen() {
    mobMenu?.classList.add('is-open');
    hamburger?.classList.add('is-active');
    hamburger?.setAttribute('aria-expanded', 'true');
    mobMenu?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function menuClose() {
    mobMenu?.classList.remove('is-open');
    hamburger?.classList.remove('is-active');
    hamburger?.setAttribute('aria-expanded', 'false');
    mobMenu?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  hamburger?.addEventListener('click', () => {
    mobMenu?.classList.contains('is-open') ? menuClose() : menuOpen();
  });
  mobMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', menuClose));
  addEventListener('resize', () => { if (innerWidth >= 1024) menuClose(); });
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mobMenu?.classList.contains('is-open')) {
      menuClose();
      hamburger?.focus();
    }
  });

  /* ══════════════════════════════════════════
     HERO — NFC RIPPLE CANVAS (2D, lightweight)
     ══════════════════════════════════════════ */
  (function initRipples() {
    const canvas = document.getElementById('rippleCanvas');
    const hero   = document.getElementById('hero');
    if (!canvas || !hero || reduceMotion || innerWidth < 768) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = Math.min(devicePixelRatio || 1, 1.5);
    let W = 0, H = 0, ox = 0, oy = 0;
    let ripples = [];
    let visible = false;
    let rafId = null;
    let spawnTimer = null;

    function resize() {
      W = hero.offsetWidth; H = hero.offsetHeight;
      canvas.width  = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      ox = W * 0.72; oy = H * 0.46; // origin ≈ the phone / "tap" point
    }
    resize();
    addEventListener('resize', resize, { passive: true });

    const MAX_R = () => Math.max(W, H) * 0.55;
    const LIFE  = 4200; // ms

    function spawn() {
      if (ripples.length < 6) ripples.push({ born: performance.now() });
      if (!rafId) rafId = requestAnimationFrame(draw);
    }

    function draw(now) {
      ctx.clearRect(0, 0, W, H);
      ripples = ripples.filter(r => now - r.born < LIFE);
      const maxR = MAX_R();
      for (const r of ripples) {
        const p = (now - r.born) / LIFE;          // 0 → 1
        const radius = 14 + p * maxR;
        const alpha  = 0.34 * (1 - p) * (1 - p);
        ctx.beginPath();
        ctx.arc(ox, oy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      /* origin spark */
      ctx.beginPath();
      ctx.arc(ox, oy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,.5)';
      ctx.fill();

      if (ripples.length && visible) {
        rafId = requestAnimationFrame(draw);
      } else {
        ctx.clearRect(0, 0, W, H);
        rafId = null;
      }
    }

    const io = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible) {
        spawn();
        if (!spawnTimer) spawnTimer = setInterval(spawn, 1600);
      } else {
        clearInterval(spawnTimer);
        spawnTimer = null;
      }
    }, { threshold: 0.05 });
    io.observe(hero);
  })();

  /* ══════════════════════════════════════════
     GSAP — ENTRANCE CHOREOGRAPHY
     (hidden states set here, never in CSS)
     ══════════════════════════════════════════ */
  if (animate) {

    /* — hero intro — */
    const heroLines = gsap.utils.toArray('[data-hero-line]');
    gsap.set(heroLines, { yPercent: 112 });
    gsap.set('[data-hero="tag"], [data-hero="sub"], [data-hero="ctas"], [data-hero="stats"], [data-hero="foot"]', { autoAlpha: 0, y: 26 });
    gsap.set('[data-hero="visual"]', { autoAlpha: 0, y: 44, scale: 0.965 });
    gsap.set('.float-chip', { autoAlpha: 0, scale: 0.6 });

    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to('[data-hero="tag"]',    { autoAlpha: 1, y: 0, duration: 0.7 }, 0.15)
      .to(heroLines,              { yPercent: 0, duration: 1.15, stagger: 0.13, ease: 'power4.out' }, 0.25)
      .to('[data-hero="sub"]',    { autoAlpha: 1, y: 0, duration: 0.8 }, 0.75)
      .to('[data-hero="ctas"]',   { autoAlpha: 1, y: 0, duration: 0.8 }, 0.9)
      .to('[data-hero="stats"]',  { autoAlpha: 1, y: 0, duration: 0.8 }, 1.05)
      .to('[data-hero="visual"]', { autoAlpha: 1, y: 0, scale: 1, duration: 1.3 }, 0.55)
      .to('.float-chip',          { autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.14, ease: 'back.out(1.8)' }, 1.2)
      .to('[data-hero="foot"]',   { autoAlpha: 1, y: 0, duration: 0.8 }, 1.35);

    /* chips idle float */
    gsap.utils.toArray('.float-chip').forEach((chip, i) => {
      gsap.to(chip, {
        y: i % 2 ? 9 : -9,
        duration: 2.4 + i * 0.5,
        delay: 2,
        repeat: -1, yoyo: true,
        ease: 'sine.inOut'
      });
    });

    /* — generic scroll reveals — */
    const revealEls = gsap.utils.toArray('[data-reveal]');
    gsap.set(revealEls, { autoAlpha: 0, y: 32 });
    ScrollTrigger.batch(revealEls, {
      start: 'top 88%',
      once: true,
      onEnter: batch => gsap.to(batch, {
        autoAlpha: 1, y: 0,
        duration: 0.95,
        stagger: 0.09,
        ease: 'power3.out',
        overwrite: true
      })
    });

    /* — ghost numerals slow drift — */
    gsap.utils.toArray('.ghost-n').forEach(g => {
      gsap.fromTo(g, { y: 90 }, {
        y: -90, ease: 'none',
        scrollTrigger: {
          trigger: g.parentElement,
          start: 'top bottom', end: 'bottom top',
          scrub: 0.8
        }
      });
    });

    /* — "como funciona" progress line — */
    const howFill = document.getElementById('howLineFill');
    if (howFill) {
      gsap.fromTo(howFill, { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: {
          trigger: '#howSteps',
          start: 'top 70%', end: 'bottom 65%',
          scrub: 0.5
        }
      });
    }

    /* — produto: column parallax + image settle (desktop only) — */
    const mm = gsap.matchMedia();
    mm.add('(min-width: 1024px)', () => {
      gsap.utils.toArray('[data-pc-speed]').forEach(col => {
        const s = parseFloat(col.dataset.pcSpeed) || 0;
        gsap.fromTo(col, { y: -s }, {
          y: s, ease: 'none',
          scrollTrigger: {
            trigger: '.pc-stage',
            start: 'top bottom', end: 'bottom top',
            scrub: 0.6
          }
        });
      });
    });
    gsap.utils.toArray('.pc-img').forEach(img => {
      gsap.fromTo(img, { scale: 1.15 }, {
        scale: 1, ease: 'none',
        scrollTrigger: {
          trigger: img.closest('.pc-img-wrap'),
          start: 'top bottom', end: 'center 40%',
          scrub: 0.5
        }
      });
    });

    /* — analytics / data bars grow in — */
    gsap.utils.toArray('.ana-fill, .ana-lang-fill, .ana-f-fill').forEach(bar => {
      gsap.from(bar, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: bar, start: 'top 92%', once: true }
      });
    });

    /* — impact receipt: line-by-line + count to €1.800 — */
    const receiptLines = gsap.utils.toArray('#impactReceipt [data-receipt-line]');
    const impactCount  = document.getElementById('impactCount');
    if (receiptLines.length) {
      gsap.set(receiptLines, { autoAlpha: 0, y: 16 });
      if (impactCount) impactCount.textContent = '0';
      ScrollTrigger.create({
        trigger: '#impactBlock',
        start: 'top 72%',
        once: true,
        onEnter: () => {
          const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
          tl.to(receiptLines, { autoAlpha: 1, y: 0, duration: 0.55, stagger: 0.16 });
          if (impactCount) {
            const target = parseFloat(impactCount.dataset.impact) || 1800;
            const o = { v: 0 };
            tl.to(o, {
              v: target, duration: 1.5, ease: 'power2.out',
              onUpdate: () => { impactCount.textContent = Math.round(o.v).toLocaleString('pt-PT'); }
            }, 0.16 * 6);
          }
        }
      });
    }

    /* — counters (stats + hero) — */
    document.querySelectorAll('[data-count]').forEach(el => {
      const target = parseFloat(el.dataset.count) || 0;
      el.textContent = '0';
      ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: () => {
          const o = { v: 0 };
          gsap.to(o, {
            v: target, duration: 1.8, ease: 'power3.out',
            onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('pt-PT'); }
          });
        }
      });
    });
  }
  /* no GSAP / reduced motion → nothing was hidden; page fully visible */

  /* ══════════════════════════════════════════
     HOVER TILTS — desktop only
     ══════════════════════════════════════════ */
  if (finePointer && !reduceMotion) {
    const phoneStage = document.getElementById('phoneStage');
    const phone      = document.getElementById('phone');
    if (phoneStage && phone) {
      phoneStage.addEventListener('mousemove', e => {
        const r  = phoneStage.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width  - 0.5;
        const cy = (e.clientY - r.top)  / r.height - 0.5;
        phone.style.transform = `rotateY(${-5 + cx * 10}deg) rotateX(${3 - cy * 8}deg) translateZ(14px)`;
      }, { passive: true });
      phoneStage.addEventListener('mouseleave', () => { phone.style.transform = ''; });
    }

    const standWrap = document.getElementById('standWrap');
    if (standWrap) {
      standWrap.addEventListener('mousemove', e => {
        const r  = standWrap.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width  - 0.5;
        const cy = (e.clientY - r.top)  / r.height - 0.5;
        standWrap.style.transform = `rotateY(${cx * 12}deg) rotateX(${-cy * 10}deg)`;
      }, { passive: true });
      standWrap.addEventListener('mouseleave', () => { standWrap.style.transform = ''; });
    }

    /* bento micro-tilt */
    document.querySelectorAll('.bc').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  - 0.5) * 2.4;
        const y = ((e.clientY - r.top)  / r.height - 0.5) * 2.4;
        card.style.transform = `translateY(-3px) rotateX(${-y}deg) rotateY(${x}deg)`;
      }, { passive: true });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ══════════════════════════════════════════
     FAQ ACCORDION (+ tracking)
     ══════════════════════════════════════════ */
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item.open').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        const n = btn.querySelector('.faq-n');
        track('faq_item_opened', { faq_index: n ? parseInt(n.textContent, 10) : 0 });
      }
    });
  });

  /* ══════════════════════════════════════════
     CONTACT FORM — Netlify AJAX
     ══════════════════════════════════════════ */
  const form    = document.getElementById('nexoForm');
  const formMsg = document.getElementById('formMsg');

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    form.querySelectorAll('.fg').forEach(g => g.classList.remove('error'));

    let ok = true;
    const nome        = form.querySelector('#nome');
    const restaurante = form.querySelector('#restaurante');
    const email       = form.querySelector('#email');
    const tipo        = form.querySelector('#tipo');

    if (!nome?.value.trim())        { nome?.closest('.fg')?.classList.add('error'); ok = false; }
    if (!restaurante?.value.trim()) { restaurante?.closest('.fg')?.classList.add('error'); ok = false; }
    if (!email?.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email?.closest('.fg')?.classList.add('error'); ok = false;
    }
    if (!tipo?.value) { tipo?.closest('.fg')?.classList.add('error'); ok = false; }

    if (!ok) {
      if (formMsg) {
        formMsg.textContent = 'Verifique os campos marcados.';
        formMsg.className = 'form-msg show err';
      }
      return;
    }

    const submitBtn = form.querySelector('.form-submit');
    submitBtn?.setAttribute('disabled', 'disabled');
    if (formMsg) { formMsg.textContent = ''; formMsg.className = 'form-msg'; }

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(new FormData(form)).toString()
      });
      if (!response.ok) throw new Error(`Netlify submit failed: ${response.status}`);

      if (formMsg) {
        formMsg.textContent = 'Recebido. Respondemos em menos de 24 horas.';
        formMsg.className = 'form-msg show ok';
      }
      const tipoValue = tipo?.value || 'unknown';
      form.reset();
      track('contact_form_submitted', { espaco_tipo: tipoValue });
    } catch (error) {
      console.error(error);
      if (formMsg) {
        formMsg.textContent = 'Não foi possível enviar agora. Tente novamente daqui a pouco.';
        formMsg.className = 'form-msg show err';
      }
    } finally {
      submitBtn?.removeAttribute('disabled');
    }
  });

  form?.querySelectorAll('input,select,textarea').forEach(f => {
    f.addEventListener('input', () => f.closest('.fg')?.classList.remove('error'));
  });

  /* ══════════════════════════════════════════
     NEXO ANALYTICS — section visibility
     ══════════════════════════════════════════ */
  [
    ['#planos',        'pricing_section_viewed'],
    ['#como-funciona', 'how_it_works_viewed']
  ].forEach(([sel, evt]) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          track(evt);
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });
    obs.observe(el);
  });

})();
