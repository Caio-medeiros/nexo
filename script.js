document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('nav');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navActions = document.querySelector('.nav-actions');
  const stickyCTA = document.querySelector('.sticky-cta');
  const hero = document.querySelector('.hero');
  const ctaSection = document.querySelector('.final-cta-section');

  // ── NAV SCROLL ──
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 20);

    // Sticky mobile CTA
    if (stickyCTA && window.innerWidth < 960) {
      const heroBottom = hero ? hero.offsetTop + hero.offsetHeight : 0;
      const ctaTop = ctaSection ? ctaSection.offsetTop - window.innerHeight * 0.5 : Infinity;
      if (y > heroBottom && y < ctaTop) {
        stickyCTA.classList.add('visible');
      } else {
        stickyCTA.classList.remove('visible');
      }
    }
  });

  // ── SMOOTH SCROLL ──
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const href = a.getAttribute('href');
      if (href === '#') return;
      const t = document.querySelector(href);
      if (!t) return;
      e.preventDefault();
      const top = t.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
      if (mobileToggle.classList.contains('active')) closeMobile();
    });
  });

  // ── MOBILE MENU ──
  function closeMobile() {
    mobileToggle.classList.remove('active');
    navLinks.classList.remove('open');
    navActions.classList.remove('open');
    nav.classList.remove('menu-open');
  }
  mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.contains('active') ? closeMobile() : (
      mobileToggle.classList.add('active'),
      navLinks.classList.add('open'),
      navActions.classList.add('open'),
      nav.classList.add('menu-open')
    );
  });
  window.addEventListener('resize', () => { if (window.innerWidth >= 960) closeMobile(); });

  // ── SCROLL REVEAL ──
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(el => obs.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('visible'));
  }

  // ── FORM VALIDATION ──
  const form = document.getElementById('nexo-form');
  const msg = document.getElementById('success-msg');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      form.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));
      msg.classList.remove('visible');
      let ok = true;
      const nome = form.querySelector('#nome');
      if (!nome.value.trim()) { nome.closest('.form-group').classList.add('error'); ok = false; }
      const email = form.querySelector('#email');
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) { email.closest('.form-group').classList.add('error'); ok = false; }
      const tipo = form.querySelector('#tipo');
      if (!tipo.value) { tipo.closest('.form-group').classList.add('error'); ok = false; }
      if (!ok) { const f = form.querySelector('.form-group.error'); if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
      const btn = form.querySelector('.btn-submit');
      const orig = btn.textContent;
      btn.textContent = 'A enviar...'; btn.disabled = true;
      setTimeout(() => { btn.textContent = orig; btn.disabled = false; form.reset(); msg.classList.add('visible'); setTimeout(() => msg.classList.remove('visible'), 5000); }, 1500);
    });
    form.querySelectorAll('input,select,textarea').forEach(f => {
      f.addEventListener('input', () => f.closest('.form-group').classList.remove('error'));
      f.addEventListener('change', () => f.closest('.form-group').classList.remove('error'));
    });
  }
});