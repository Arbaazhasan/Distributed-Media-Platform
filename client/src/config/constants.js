const trimSlash = (url) => (url ? url.replace(/\/+$/, '') : '');

const rawApiBase = import.meta.env.VITE_API_BASE_URL;
const rawSignaling = import.meta.env.VITE_SIGNALING_URL;
const rawServerHost = import.meta.env.VITE_SERVER_HOST;

// Derive base host URL (without /api)
const derivedServerHost = (() => {
  if (rawServerHost) return trimSlash(rawServerHost).replace(/\/api$/, '');
  if (rawApiBase) return trimSlash(rawApiBase).replace(/\/api$/, '');
  return 'http://localhost:3000';
})();

// Ensure API_BASE_URL always ends with /api
export const API_BASE_URL = (() => {
  if (rawApiBase) {
    const trimmed = trimSlash(rawApiBase);
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  return `${derivedServerHost}/api`;
})();

export const SIGNALING_URL = rawSignaling 
  ? trimSlash(rawSignaling) 
  : (rawApiBase ? derivedServerHost : 'http://localhost:4000');

export const SERVER_HOST = derivedServerHost;
