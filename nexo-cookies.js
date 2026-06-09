// NEXO Cookie Consent — RGPD Compliant v1.0
(function() {
  const STORAGE_KEY = 'nexo_cookie_consent';
  const CONSENT_VERSION = '1.0';

  const stored = localStorage.getItem(STORAGE_KEY);
  let consent = null;
  try {
    consent = stored ? JSON.parse(stored) : null;
  } catch(e) {
    consent = null;
  }

  if (consent && consent.version === CONSENT_VERSION) {
    if (consent.analytics) loadGA4();
    addManageButton();
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {};

  document.addEventListener('DOMContentLoaded', showBanner);

  function showBanner() {
    const banner = document.createElement('div');
    banner.id = 'nexo-cookie-banner';
    banner.innerHTML = `
      <div class="ncb-inner">
        <div class="ncb-text">
          <strong>Utilizamos cookies</strong>
          <p>Usamos cookies analíticos (Google Analytics) para
          melhorar o nosso website. Pode aceitar ou recusar.
          <a href="/privacidade/" class="ncb-link">Saber mais</a></p>
        </div>
        <div class="ncb-actions">
          <button id="ncb-reject" class="ncb-btn ncb-secondary">Recusar</button>
          <button id="ncb-accept" class="ncb-btn ncb-primary">Aceitar</button>
        </div>
      </div>
    `;

    const style = document.createElement('style');
    style.textContent = `
      #nexo-cookie-banner {
        position: fixed;
        bottom: 0; left: 0; right: 0;
        z-index: 99999;
        background: #1C1C1C;
        border-top: 1px solid rgba(255,255,255,0.1);
        padding: 16px 20px;
        font-family: inherit;
        transform: translateY(100%);
        transition: transform 400ms cubic-bezier(0.32,0.72,0,1);
      }
      #nexo-cookie-banner.visible {
        transform: translateY(0);
      }
      .ncb-inner {
        max-width: 900px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        flex-wrap: wrap;
      }
      .ncb-text strong {
        color: #F5F5F5;
        font-size: 14px;
        display: block;
        margin-bottom: 4px;
      }
      .ncb-text p {
        color: rgba(255,255,255,0.55);
        font-size: 13px;
        margin: 0;
        line-height: 1.5;
      }
      .ncb-link {
        color: rgba(255,255,255,0.7);
        text-decoration: underline;
      }
      .ncb-actions {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
      }
      .ncb-btn {
        height: 38px;
        padding: 0 20px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        transition: opacity 150ms ease;
      }
      .ncb-btn:hover { opacity: 0.85; }
      .ncb-primary {
        background: #F5F5F5;
        color: #0D0D0D;
      }
      .ncb-secondary {
        background: transparent;
        color: rgba(255,255,255,0.55);
        border: 1px solid rgba(255,255,255,0.15) !important;
      }
      #nexo-manage-cookies {
        background: none;
        border: none;
        color: rgba(255,255,255,0.3);
        font-size: 11px;
        cursor: pointer;
        text-decoration: underline;
        padding: 0;
      }
    `;

    document.head.appendChild(style);
    document.body.appendChild(banner);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => banner.classList.add('visible'));
    });

    document.getElementById('ncb-accept').addEventListener('click', () => {
      saveConsent(true);
      hideBanner(banner);
      loadGA4();
      addManageButton();
    });

    document.getElementById('ncb-reject').addEventListener('click', () => {
      saveConsent(false);
      hideBanner(banner);
      addManageButton();
    });
  }

  function hideBanner(banner) {
    banner.style.transform = 'translateY(100%)';
    setTimeout(() => banner.remove(), 400);
  }

  function saveConsent(analytics) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: CONSENT_VERSION,
      analytics,
      date: new Date().toISOString()
    }));
  }

  function loadGA4() {
    const GA4_ID = 'G-CWLYKCFP3K';
    if (!GA4_ID || GA4_ID.includes('{{')) return;

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    document.head.appendChild(script);

    script.onload = function() {
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() { dataLayer.push(arguments); };
      gtag('js', new Date());
      gtag('config', GA4_ID, {
        page_location: window.location.href,
        page_title: document.title,
      });
    };
  }

  function addManageButton() {
    const footer = document.querySelector('footer') || document.querySelector('.footer');
    if (!footer || document.getElementById('nexo-manage-cookies')) return;

    const btn = document.createElement('button');
    btn.id = 'nexo-manage-cookies';
    btn.textContent = 'Gerir Cookies';
    btn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });
    footer.appendChild(btn);
  }

})();
