
/* NEXO. — script.js v6 */

(() => {

  /* ══════════════════════════════════════════
     CURSOR
     ══════════════════════════════════════════ */
  const dot   = document.getElementById('cursorDot');
  const ring  = document.getElementById('cursorRing');
  const label = document.getElementById('cursorLabel');
  let mx = window.innerWidth / 2, my = window.innerHeight / 2;
  let rx = mx, ry = my;
  let seen = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; document.body.classList.add('cursor-ready') }
    if (dot) dot.style.transform = `translate(${mx}px,${my}px) translate(-50%,-50%)`;
  }, { passive:true });

  (function tick() {
    rx += (mx - rx) * 0.14;
    ry += (my - ry) * 0.14;
    if (ring) ring.style.transform = `translate(${rx}px,${ry}px) translate(-50%,-50%)`;
    requestAnimationFrame(tick);
  })();

  document.querySelectorAll('a, button, .bc, .plan').forEach(el => {
    el.addEventListener('mouseenter', () => {
      ring?.classList.add('active');
      if (label) label.textContent = el.getAttribute('data-cursor') === 'arrow' ? '→' : '';
    });
    el.addEventListener('mouseleave', () => {
      ring?.classList.remove('active');
      if (label) label.textContent = '';
    });
  });

  /* ══════════════════════════════════════════
     SCROLL PROGRESS + NAV SCROLLED STATE
     ══════════════════════════════════════════ */
  const nav        = document.getElementById('nav');
  const scrollFill = document.getElementById('scrollFill');

  function onScroll() {
    const y = window.scrollY;
    nav?.classList.toggle('scrolled', y > 80);
    const total = document.body.scrollHeight - window.innerHeight;
    if (scrollFill) scrollFill.style.width = Math.min(y / total * 100, 100) + '%';
  }
  window.addEventListener('scroll', onScroll, { passive:true });
  onScroll();

  /* ══════════════════════════════════════════
     HAMBURGER / MOBILE MENU

     Architecture:
     - #hamburger is inside <nav> (z-index:500)
     - #mob-menu  is a sibling of <nav> (z-index:400)
     - They never share state or DOM hierarchy
     - On desktop (≥1024px) mob-menu is display:none !important via CSS
     ══════════════════════════════════════════ */
  const hamburger = document.getElementById('hamburger');
  const mobMenu   = document.getElementById('mob-menu');

  function menuOpen() {
    mobMenu.classList.add('is-open');
    hamburger.setAttribute('aria-expanded', 'true');
    mobMenu.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function menuClose() {
    mobMenu.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    mobMenu.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function menuToggle() {
    mobMenu.classList.contains('is-open') ? menuClose() : menuOpen();
  }

  // Hamburger click
  hamburger?.addEventListener('click', menuToggle);

  // Any link inside the overlay closes it
  mobMenu?.querySelectorAll('a').forEach(a => a.addEventListener('click', menuClose));

  // Close on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 1024) menuClose();
  });

  /* ══════════════════════════════════════════
     SMOOTH SCROLL + WIPE TRANSITION
     ══════════════════════════════════════════ */
  const wipe = document.getElementById('wipe');

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (!href || href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - 56;
      wipe?.classList.add('active');
      setTimeout(() => {
        window.scrollTo({ top, behavior:'instant' });
        setTimeout(() => wipe?.classList.remove('active'), 80);
      }, 520);
    });
  });

  /* ══════════════════════════════════════════
     REVEAL ON SCROLL
     ══════════════════════════════════════════ */
  const revObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); revObs.unobserve(e.target) }
    });
  }, { threshold:0.07, rootMargin:'0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));

  const bObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const delay = parseInt(e.target.style.getPropertyValue('--bd') || 0);
        setTimeout(() => e.target.classList.add('visible'), delay);
        bObs.unobserve(e.target);
      }
    });
  }, { threshold:0.08, rootMargin:'0px 0px -30px 0px' });
  document.querySelectorAll('.reveal-b').forEach(el => bObs.observe(el));

  /* ══════════════════════════════════════════
     COUNT-UP ANIMATION
     ══════════════════════════════════════════ */
  function countUp(el) {
    const target   = parseInt(el.dataset.count  || 0);
    const prefix   = el.dataset.prefix || '';
    const suffix   = el.dataset.suffix || '';
    const duration = 2000;
    const start    = performance.now();
    function step(now) {
      const p     = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      el.textContent = prefix + Math.round(eased * target).toLocaleString('pt-PT') + suffix;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const countObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('[data-count]').forEach(countUp);
        countObs.unobserve(e.target);
      }
    });
  }, { threshold:0.25 });
  document.querySelectorAll('.hero-stats, .stats').forEach(el => countObs.observe(el));

  /* ══════════════════════════════════════════
     PHONE PARALLAX TILT
     ══════════════════════════════════════════ */
  const phoneStage = document.getElementById('phoneStage');
  const phone      = document.getElementById('phone');

  if (phoneStage && phone && matchMedia('(hover:hover)').matches) {
    phoneStage.addEventListener('mousemove', e => {
      const r  = phoneStage.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width  - 0.5;
      const cy = (e.clientY - r.top)  / r.height - 0.5;
      phone.style.transform = `rotateY(${-6 + cx * 10}deg) rotateX(${3 - cy * 8}deg) translateZ(16px)`;
    }, { passive:true });
    phoneStage.addEventListener('mouseleave', () => { phone.style.transform = '' });
  }

  /* ══════════════════════════════════════════
     STAND HOVER TILT
     ══════════════════════════════════════════ */
  const standWrap = document.getElementById('standWrap');

  if (standWrap && matchMedia('(hover:hover)').matches) {
    standWrap.addEventListener('mousemove', e => {
      const r  = standWrap.getBoundingClientRect();
      const cx = (e.clientX - r.left) / r.width  - 0.5;
      const cy = (e.clientY - r.top)  / r.height - 0.5;
      standWrap.style.transform = `rotateY(${-10 + cx * 14}deg) rotateX(${5 - cy * 10}deg)`;
    }, { passive:true });
    standWrap.addEventListener('mouseleave', () => { standWrap.style.transform = '' });
  }

  /* ══════════════════════════════════════════
     HERO SCROLL PARALLAX (subtle)
     ══════════════════════════════════════════ */
  const heroLeft = document.querySelector('.hero-left');
  if (heroLeft) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) heroLeft.style.transform = `translateY(${y * 0.1}px)`;
    }, { passive:true });
  }

  /* ══════════════════════════════════════════
     BENTO CARD MICRO-TILT
     ══════════════════════════════════════════ */
  if (matchMedia('(hover:hover)').matches) {
    document.querySelectorAll('.bc').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width  - 0.5) * 3;
        const y = ((e.clientY - r.top)  / r.height - 0.5) * 3;
        card.style.transform = `translateY(-3px) rotateX(${-y}deg) rotateY(${x}deg)`;
      });
      card.addEventListener('mouseleave', () => { card.style.transform = '' });
    });
  }

  /* ══════════════════════════════════════════
     MARQUEE PAUSE ON HOVER
     ══════════════════════════════════════════ */
  const marqueeTrack = document.querySelector('.marquee-track');
  document.querySelector('.marquee-wrap')?.addEventListener('mouseenter', () => {
    if (marqueeTrack) marqueeTrack.style.animationPlayState = 'paused';
  });
  document.querySelector('.marquee-wrap')?.addEventListener('mouseleave', () => {
    if (marqueeTrack) marqueeTrack.style.animationPlayState = '';
  });

  /* ══════════════════════════════════════════
     CONTACT FORM
     ══════════════════════════════════════════ */
  const form     = document.getElementById('nexoForm');
  const formMsg  = document.getElementById('formMsg');
  const formStat = document.getElementById('formStatus');

  function encodeForm(data) {
    return new URLSearchParams(data).toString();
  }

  form?.addEventListener('submit', async e => {
    e.preventDefault();
    form.querySelectorAll('.fg').forEach(g => g.classList.remove('error'));
    let ok = true;
    const nome  = form.querySelector('#nome');
    const email = form.querySelector('#email');
    const tipo  = form.querySelector('#tipo');
    if (!nome?.value.trim())  { nome.closest('.fg').classList.add('error');  ok = false }
    if (!email?.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
      email.closest('.fg').classList.add('error'); ok = false;
    }
    if (!tipo?.value) { tipo.closest('.fg').classList.add('error'); ok = false }
    if (!ok) {
      if (formMsg) { formMsg.textContent = 'Verifique os campos marcados.'; formMsg.className = 'form-msg show err' }
      return;
    }

    const submitBtn = form.querySelector('.form-submit');
    submitBtn?.setAttribute('disabled', 'disabled');
    if (formStat) formStat.textContent = 'SENDING';
    if (formMsg) {
      formMsg.textContent = '';
      formMsg.className = 'form-msg';
    }

    try {
      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encodeForm(new FormData(form))
      });

      if (!response.ok) throw new Error(`Netlify submit failed: ${response.status}`);

      if (formStat) formStat.textContent = 'SENT';
      if (formMsg) {
        formMsg.textContent = 'Recebido. Respondemos em menos de 24 horas.';
        formMsg.className = 'form-msg show ok';
      }
      form.reset();
    } catch (error) {
      console.error(error);
      if (formStat) formStat.textContent = 'ERROR';
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

})();


/* ══════════════════════════════
   PRODUCT CONTEXT — reveal + parallax
   ══════════════════════════════ */
(function initProductContext() {
  // Reveal on scroll
  const pcEls = document.querySelectorAll('.pc-intro, .pc-col, .pc-footer');
  if (!pcEls.length) return;

  const pcObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('pc-visible');
        pcObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -60px 0px' });

  pcEls.forEach(el => pcObs.observe(el));

  // Parallax on scroll — desktop only
  if (!matchMedia('(hover: hover)').matches) return;

  const cols = document.querySelectorAll('[data-pc-parallax]');
  if (!cols.length) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      // todas as leituras de getBoundingClientRect aqui dentro
      cols.forEach(col => {
        const speed = parseFloat(col.dataset.pcParallax || 0);
        const rect = col.closest('.pc-stage')?.getBoundingClientRect();
        if (!rect) {
          ticking = false;
          return;
        }
        const offset = (window.innerHeight / 2 - (rect.top + rect.height / 2)) * speed;
        const img = col.querySelector('.pc-img');
        if (img) img.style.transform = `translateY(${offset.toFixed(1)}px)`;
      });
      ticking = false;
    });
  }, { passive: true });
})();