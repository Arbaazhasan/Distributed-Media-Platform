const trimSlash = (url) => (url ? url.replace(/\/+$/, '') : '');

const rawApiBase = import.meta.env.VITE_API_BASE_URL;
const rawSignaling = import.meta.env.VITE_SIGNALING_URL;
const rawServerHost = import.meta.env.VITE_SERVER_HOST;

// Derive base host if only API base is provided
const derivedServerHost = rawServerHost 
  ? trimSlash(rawServerHost)
  : (rawApiBase ? trimSlash(rawApiBase).replace(/\/api$/, '') : 'http://localhost:3000');

export const API_BASE_URL = rawApiBase ? trimSlash(rawApiBase) : `${derivedServerHost}/api`;
export const SIGNALING_URL = rawSignaling ? trimSlash(rawSignaling) : (rawApiBase ? derivedServerHost : 'http://localhost:4000');
export const SERVER_HOST = derivedServerHost;
