// ========================================
// NEXO. — JavaScript
// ========================================

document.addEventListener('DOMContentLoaded', () => {

  const nav = document.querySelector('nav');
  const announceBar = document.querySelector('.announce-bar');
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navLinks = document.querySelector('.nav-links');
  const navActions = document.querySelector('.nav-actions');
  const stickyCTA = document.querySelector('.sticky-mobile-cta');
  const heroSection = document.querySelector('.hero');
  const ctaSection = document.querySelector('.cta-section');
  const footerEl = document.querySelector('footer');

  // ---- NAV SCROLL ----
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 20);

    // Hide announce bar after scrolling
    if (y > 80) {
      nav.classList.add('announce-hidden');
      if (announceBar) announceBar.style.transform = 'translateY(-100%)';
    } else {
      nav.classList.remove('announce-hidden');
      if (announceBar) announceBar.style.transform = 'translateY(0)';
    }

    // Sticky mobile CTA — show after hero, hide near contact/footer
    if (stickyCTA && window.innerWidth < 960) {
      const heroBottom = heroSection ? heroSection.offsetTop + heroSection.offsetHeight : 0;
      const ctaTop = ctaSection ? ctaSection.offsetTop : Infinity;
      const footerTop = footerEl ? footerEl.offsetTop : Infinity;
      const viewportBottom = y + window.innerHeight;

      if (y > heroBottom && viewportBottom < ctaTop) {
        stickyCTA.classList.add('visible');
      } else {
        stickyCTA.classList.remove('visible');
      }
    }

    lastScroll = y;
  });

  if (announceBar) announceBar.style.transition = 'transform 0.3s ease';

  // ---- SMOOTH SCROLL ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      const navHeight = nav.offsetHeight;
      const announceHeight = announceBar && !nav.classList.contains('announce-hidden') ? announceBar.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - announceHeight - 8;
      window.scrollTo({ top, behavior: 'smooth' });
      if (mobileToggle.classList.contains('active')) closeMobileMenu();
    });
  });

  // ---- MOBILE MENU ----
  function closeMobileMenu() {
    mobileToggle.classList.remove('active');
    navLinks.classList.remove('open');
    navActions.classList.remove('open');
    nav.classList.remove('menu-open');
  }

  mobileToggle.addEventListener('click', () => {
    if (mobileToggle.classList.contains('active')) {
      closeMobileMenu();
    } else {
      mobileToggle.classList.add('active');
      navLinks.classList.add('open');
      navActions.classList.add('open');
      nav.classList.add('menu-open');
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth >= 960) closeMobileMenu();
  });

  // ---- SCROLL REVEAL (IntersectionObserver) ----
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach(el => revealObserver.observe(el));
  } else {
    // Fallback — just show everything
    reveals.forEach(el => el.classList.add('visible'));
  }

  // ---- FAQ — only one open at a time ----
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach(item => {
    item.addEventListener('toggle', () => {
      if (item.open) {
        faqItems.forEach(other => {
          if (other !== item && other.open) other.open = false;
        });
      }
    });
  });

  // ---- FORM VALIDATION ----
  const form = document.getElementById('nexo-form');
  const successMsg = document.getElementById('success-msg');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      form.querySelectorAll('.form-group').forEach(g => g.classList.remove('error'));
      successMsg.classList.remove('visible');

      let isValid = true;

      const nome = form.querySelector('#nome');
      if (!nome.value.trim()) {
        nome.closest('.form-group').classList.add('error');
        isValid = false;
      }

      const email = form.querySelector('#email');
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.value.trim() || !emailRegex.test(email.value)) {
        email.closest('.form-group').classList.add('error');
        isValid = false;
      }

      const tipo = form.querySelector('#tipo');
      if (!tipo.value) {
        tipo.closest('.form-group').classList.add('error');
        isValid = false;
      }

      if (!isValid) {
        const firstError = form.querySelector('.form-group.error');
        if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }

      const submitBtn = form.querySelector('.btn-submit');
      const originalText = submitBtn.textContent;
      submitBtn.textContent = 'A enviar...';
      submitBtn.disabled = true;

      setTimeout(() => {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        form.reset();
        successMsg.classList.add('visible');
        setTimeout(() => successMsg.classList.remove('visible'), 5000);
      }, 1500);
    });

    form.querySelectorAll('input, select, textarea').forEach(field => {
      field.addEventListener('input', () => field.closest('.form-group').classList.remove('error'));
      field.addEventListener('change', () => field.closest('.form-group').classList.remove('error'));
    });
  }

});