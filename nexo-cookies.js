// NEXO Cookie Consent — RGPD Compliant v1.0
(function() {
  const STORAGE_KEY = 'nexo_cookie_consent';
  const CONSENT_VERSION = '1.1';

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
  window.gtag = function() { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    functionality_storage: 'granted',
    personalization_storage: 'denied',
    security_storage: 'granted',
  });

  document.addEventListener('DOMContentLoaded', showBanner);

  function showBanner() {
    const banner = document.createElement('div');
    banner.id = 'nexo-cookie-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Consentimento de cookies');
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
        left: 50%;
        bottom: 16px;
        width: min(1120px, calc(100vw - 24px));
        z-index: 99999;
        background: rgba(28, 28, 28, 0.96);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 18px;
        box-shadow: 0 18px 60px rgba(0,0,0,0.35);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        padding: 18px 20px;
        font-family: inherit;
        transform: translate3d(-50%, 120%, 0);
        opacity: 0;
        pointer-events: auto;
        transition: transform 400ms cubic-bezier(0.32,0.72,0,1), opacity 220ms ease;
      }
      #nexo-cookie-banner.visible {
        transform: translate3d(-50%, 0, 0);
        opacity: 1;
      }
      .ncb-inner {
        width: 100%;
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
        max-width: 70ch;
      }
      .ncb-link {
        color: rgba(255,255,255,0.7);
        text-decoration: underline;
        text-underline-offset: 2px;
      }
      .ncb-actions {
        display: flex;
        gap: 10px;
        flex-shrink: 0;
        flex-wrap: wrap;
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
      .ncb-btn:focus-visible {
        outline: 2px solid rgba(255,255,255,0.75);
        outline-offset: 2px;
      }
      .ncb-primary {
        background: #F5F5F5;
        color: #0D0D0D;
      }
      .ncb-secondary {
        background: transparent;
        color: rgba(255,255,255,0.55);
        border: 1px solid rgba(255,255,255,0.15) !important;
      }
      .nexo-manage-cookies-wrap {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        justify-content: flex-end;
        margin-top: 12px;
      }
      #nexo-manage-cookies {
        background: none;
        border: none;
        color: rgba(255,255,255,0.38);
        font-size: 11px;
        cursor: pointer;
        text-decoration: underline;
        text-underline-offset: 2px;
        padding: 0;
      }
      #nexo-manage-cookies:hover {
        color: rgba(255,255,255,0.75);
      }
      #nexo-manage-cookies:focus-visible {
        outline: 2px solid rgba(255,255,255,0.65);
        outline-offset: 3px;
        border-radius: 2px;
      }
      @media (max-width: 640px) {
        #nexo-cookie-banner {
          bottom: 12px;
          width: calc(100vw - 16px);
          padding: 16px;
        }
        .ncb-inner {
          align-items: flex-start;
        }
        .ncb-actions {
          width: 100%;
        }
        .ncb-btn {
          flex: 1 1 140px;
        }
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
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
      addManageButton();
    });

    document.getElementById('ncb-reject').addEventListener('click', () => {
      saveConsent(false);
      hideBanner(banner);
      window.gtag('consent', 'update', { analytics_storage: 'denied' });
      addManageButton();
    });
  }

  function hideBanner(banner) {
    banner.style.transform = 'translate3d(-50%, 120%, 0)';
    banner.style.opacity = '0';
    setTimeout(() => banner.remove(), 420);
  }

  function saveConsent(analytics) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: CONSENT_VERSION,
      analytics,
      date: new Date().toISOString(),
      necessary: true
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
    const legalCol = footer.querySelector('.foot-col:last-child ul');
    if (!legalCol) return;

    const wrap = document.createElement('li');
    wrap.className = 'nexo-manage-cookies-wrap';

    const btn = document.createElement('button');
    btn.id = 'nexo-manage-cookies';
    btn.type = 'button';
    btn.textContent = 'Gerir cookies';
    btn.addEventListener('click', () => {
      localStorage.removeItem(STORAGE_KEY);
      location.reload();
    });
    wrap.appendChild(btn);
    legalCol.appendChild(wrap);
  }

})();
