// NEXO Analytics — v1.0
// Single GA4 property tracks landing page + all menu apps
// Filter by espaco_slug in GA4 to see per-client data

const NEXO_GA4_ID = 'G-CWLYKCFP3K';

// Core tracker — wraps gtag with safety check
function nexoTrack(eventName, params) {
  if (typeof gtag === 'undefined') return;
  gtag('event', eventName, {
    ...(params || {}),
    nexo_version: '1.0',
  });
}

// Expose globally
window.nexoTrack = nexoTrack;
window.NEXO_GA4_ID = NEXO_GA4_ID;
