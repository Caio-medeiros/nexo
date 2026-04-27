document.addEventListener('DOMContentLoaded', () => {
  const nav = document.querySelector('nav');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navActions = document.querySelector('.nav-actions');
  const stickyCTA = document.querySelector('.sticky-cta');
  const hero = document.querySelector('.hero');
  const ctaSection = document.querySelector('.final-cta-section');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 20);

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

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
      if (mobileToggle.classList.contains('active')) closeMobile();
    });
  });

  function closeMobile() {
    mobileToggle.classList.remove('active');
    navLinks.classList.remove('open');
    navActions.classList.remove('open');
    nav.classList.remove('menu-open');
  }

  mobileToggle.addEventListener('click', () => {
    if (mobileToggle.classList.contains('active')) {
      closeMobile();
      return;
    }
    mobileToggle.classList.add('active');
    navLinks.classList.add('open');
    navActions.classList.add('open');
    nav.classList.add('menu-open');
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 960) closeMobile();
  });

  // Assign stagger delays to demo cards (each has its own reveal class)
  document.querySelectorAll('.demo-grid').forEach((grid) => {
    grid.querySelectorAll('.reveal').forEach((item, i) => {
      item.dataset.staggerDelay = i * 70;
    });
  });

  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = parseInt(entry.target.dataset.staggerDelay || 0);
          if (delay > 0) {
            setTimeout(() => entry.target.classList.add('visible'), delay);
          } else {
            entry.target.classList.add('visible');
          }
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    reveals.forEach((el) => obs.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('visible'));
  }

  const form = document.getElementById('nexo-form');
  const msg = document.getElementById('success-msg');

  function setMessage(text, isError = false) {
    if (!msg) return;
    msg.textContent = text;
    msg.classList.add('visible');
    msg.classList.toggle('error', isError);
  }

  function clearMessage() {
    if (!msg) return;
    msg.classList.remove('visible', 'error');
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      form.querySelectorAll('.form-group').forEach((group) => group.classList.remove('error'));
      clearMessage();

      let ok = true;
      const nome = form.querySelector('#nome');
      const email = form.querySelector('#email');
      const tipo = form.querySelector('#tipo');

      if (!nome.value.trim()) {
        nome.closest('.form-group').classList.add('error');
        ok = false;
      }
      if (!email.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        email.closest('.form-group').classList.add('error');
        ok = false;
      }
      if (!tipo.value) {
        tipo.closest('.form-group').classList.add('error');
        ok = false;
      }

      if (!ok) {
        const firstError = form.querySelector('.form-group.error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const btn = form.querySelector('.btn-submit');
      const originalText = btn.textContent;
      btn.textContent = 'A enviar...';
      btn.disabled = true;

      try {
        const formData = new FormData(form);
        const encoded = new URLSearchParams(formData).toString();

        const response = await fetch('/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: encoded,
        });

        if (!response.ok) throw new Error('netlify-submit-failed');

        form.reset();
        setMessage('Recebido. Falamos consigo em menos de 24 horas.');
      } catch (error) {
        setMessage('Não foi possível enviar agora. Tente novamente ou use o WhatsApp.', true);
      } finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });

    form.querySelectorAll('input,select,textarea').forEach((field) => {
      field.addEventListener('input', () => {
        const group = field.closest('.form-group');
        if (group) group.classList.remove('error');
      });
      field.addEventListener('change', () => {
        const group = field.closest('.form-group');
        if (group) group.classList.remove('error');
      });
    });
  }
});
