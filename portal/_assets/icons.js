// NEXO Portal — Inline SVG icon system
// getIcon(name, size?) → SVG string, 16×16 viewBox, currentColor stroke
// ─────────────────────────────────────────────────────────

const NEXO_ICONS = {
  'grid': '<rect x="1.5" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="9" y="1.5" width="5.5" height="5.5" rx="1"/><rect x="1.5" y="9" width="5.5" height="5.5" rx="1"/><rect x="9" y="9" width="5.5" height="5.5" rx="1"/>',
  'monitor': '<rect x="1.5" y="2.5" width="13" height="9" rx="1.5"/><path d="M5.5 14h5M8 11.5V14"/>',
  'toggle': '<rect x="1.5" y="4.5" width="13" height="7" rx="3.5"/><circle cx="11" cy="8" r="2"/>',
  'edit': '<path d="M11.3 2.2a1.6 1.6 0 0 1 2.3 2.3L5.5 12.6l-3 .8.8-3 8-8.2z"/>',
  'gift': '<rect x="2" y="7" width="12" height="7.5" rx="1"/><path d="M2 7h12M8 7v7.5M8 7s-3.5.2-4.5-1.2C2.7 4.6 4 3 5.3 3.6 6.8 4.3 8 7 8 7zm0 0s3.5.2 4.5-1.2C13.3 4.6 12 3 10.7 3.6 9.2 4.3 8 7 8 7z"/>',
  'check': '<path d="M2.5 8.5l3.5 3.5 7.5-8"/>',
  'x': '<path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>',
  'copy': '<rect x="5.5" y="5.5" width="9" height="9" rx="1.5"/><path d="M10.5 5.5V3a1.5 1.5 0 0 0-1.5-1.5H3A1.5 1.5 0 0 0 1.5 3v6A1.5 1.5 0 0 0 3 10.5h2.5"/>',
  'eye': '<path d="M1.5 8s2.4-4.5 6.5-4.5S14.5 8 14.5 8s-2.4 4.5-6.5 4.5S1.5 8 1.5 8z"/><circle cx="8" cy="8" r="2"/>',
  'eye-off': '<path d="M2 2l12 12M6.6 6.7a2 2 0 0 0 2.8 2.8M4.4 4.6C2.5 5.9 1.5 8 1.5 8s2.4 4.5 6.5 4.5c1.2 0 2.3-.4 3.2-.9M7 3.6c.3 0 .7-.1 1-.1 4.1 0 6.5 4.5 6.5 4.5s-.6 1.1-1.7 2.2"/>',
  'refresh': '<path d="M13.5 8a5.5 5.5 0 1 1-1.6-3.9M13.5 1.5v3h-3"/>',
  'alert-triangle': '<path d="M8 2L1.5 13.5h13L8 2zM8 6.5V9.5M8 11.8v.2"/>',
  'clock': '<circle cx="8" cy="8" r="6.5"/><path d="M8 4.5V8l2.5 1.5"/>',
  'arrow-right': '<path d="M2.5 8h11M9.5 4l4 4-4 4"/>',
  'plus': '<path d="M8 2.5v11M2.5 8h11"/>',
  'minus': '<path d="M2.5 8h11"/>',
  'phone': '<path d="M3.2 1.8h2.6l1.2 3.1-1.6 1.2a9.5 9.5 0 0 0 4.5 4.5l1.2-1.6 3.1 1.2v2.6c0 .7-.6 1.4-1.4 1.3C7 13.6 2.4 9 1.9 3.2c-.1-.8.6-1.4 1.3-1.4z"/>',
  'mail': '<rect x="1.5" y="3" width="13" height="10" rx="1.5"/><path d="M1.5 4.5L8 9l6.5-4.5"/>',
  'external-link': '<path d="M6.5 3H3.5A1.5 1.5 0 0 0 2 4.5v8A1.5 1.5 0 0 0 3.5 14h8a1.5 1.5 0 0 0 1.5-1.5V9.5M9.5 2H14v4.5M14 2L7.5 8.5"/>',
  'expand': '<path d="M9.5 2H14v4.5M6.5 14H2V9.5M14 2L9.5 6.5M2 14l4.5-4.5"/>',
  'paperclip': '<path d="M13 7.5l-5 5a3.2 3.2 0 0 1-4.5-4.5l5.4-5.4a2.1 2.1 0 0 1 3 3l-5.4 5.4a1 1 0 0 1-1.5-1.5l5-5"/>',
  'users': '<circle cx="6" cy="5.5" r="2.5"/><path d="M1.5 14c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4M11 3.2a2.5 2.5 0 0 1 0 4.6M12.5 10.3c1.2.5 2 1.5 2 3.7"/>',
  'qr': '<rect x="1.5" y="1.5" width="5" height="5" rx="1"/><rect x="9.5" y="1.5" width="5" height="5" rx="1"/><rect x="1.5" y="9.5" width="5" height="5" rx="1"/><path d="M9.5 9.5h2v2h-2zM12.5 12.5h2v2h-2zM12.5 9.5h2M9.5 13.5v1"/>',
  'activity': '<path d="M1.5 8h3l2-5 3 10 2-5h3"/>',
  'bar-chart': '<path d="M2 14V7M6 14V3M10 14V9M14 14V5"/>',
  'calendar': '<rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/><path d="M1.5 6h13M5 1.5v2M11 1.5v2"/>',
  'bell': '<path d="M8 1.5a4 4 0 0 0-4 4c0 4-1.5 5-1.5 5h11s-1.5-1-1.5-5a4 4 0 0 0-4-4zM6.5 13a1.5 1.5 0 0 0 3 0"/>',
  'star': '<path d="M8 1.5l1.9 4 4.4.5-3.2 3 .9 4.3L8 11.2 4 13.3l.9-4.3-3.2-3 4.4-.5z"/>',
  'message': '<path d="M14.5 7.5a5.5 5.5 0 0 1-7.7 5L2 14l1.5-4.3A5.5 5.5 0 1 1 14.5 7.5z"/>',
  'help': '<circle cx="8" cy="8" r="6.5"/><path d="M6.1 6.2a2 2 0 0 1 3.8.6c0 1.3-1.9 1.7-1.9 3M8 11.6v.2"/>',
  'sun': '<circle cx="8" cy="8" r="3.2"/><path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.05 1.05M11.55 11.55l1.05 1.05M12.6 3.4l-1.05 1.05M4.45 11.55l-1.05 1.05"/>',
  'moon': '<path d="M13.5 9.3A5.6 5.6 0 1 1 6.7 2.5a4.35 4.35 0 0 0 6.8 6.8z"/>',
  'chef': '<path d="M4.8 10.5a2.8 2.8 0 0 1-.6-5.5A3 3 0 0 1 8 2.5a3 3 0 0 1 3.8 2.5 2.8 2.8 0 0 1-.6 5.5z"/><path d="M4.8 10.5V14h6.4v-3.5M6.6 10.8V14M9.4 10.8V14"/>',
  'cashier': '<rect x="2" y="6.5" width="12" height="7.5" rx="1"/><path d="M4 6.5V4.2a1 1 0 0 1 1-1h4.5L11 6.5"/><path d="M4.5 9.5h3M4.5 11.5h5"/><rect x="10.5" y="9.5" width="2.5" height="2.5" rx="0.5"/>',
  'settings': '<circle cx="8" cy="8" r="2.2"/><path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.6 3.6l1.4 1.4M11 11l1.4 1.4M12.4 3.6 11 5M5 11l-1.4 1.4"/>',
};

function getIcon(name, size = 16) {
  const path = NEXO_ICONS[name];
  if (!path) return '';
  return `<svg width="${size}" height="${size}" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}
