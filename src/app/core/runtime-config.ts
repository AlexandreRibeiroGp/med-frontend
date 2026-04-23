export interface RuntimeIceServer {
  urls: string | string[];
  username?: string;
  credential?: string;
}

declare global {
  interface Window {
    __MEDCALLON_RUNTIME__?: {
      iceServers?: RuntimeIceServer[] | string;
      clarityProjectId?: string;
    };
  }
}

const DEFAULT_ICE_SERVERS: RuntimeIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }];

function isValidIceServer(value: unknown): value is RuntimeIceServer {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const urls = (value as RuntimeIceServer).urls;
  if (typeof urls === 'string') {
    return urls.trim().length > 0;
  }

  return Array.isArray(urls) && urls.some((entry) => typeof entry === 'string' && entry.trim().length > 0);
}

function normalizeIceServer(server: RuntimeIceServer): RuntimeIceServer {
  return {
    urls: Array.isArray(server.urls) ? server.urls.filter(Boolean) : server.urls,
    username: server.username?.trim() || undefined,
    credential: server.credential?.trim() || undefined
  };
}

function buildTlsTurnVariants(server: RuntimeIceServer): RuntimeIceServer[] {
  const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
  const variants = urls
    .filter((url): url is string => typeof url === 'string' && url.startsWith('turn:'))
    .map((url) => {
      const secureUrl = url
        .replace(/^turn:/, 'turns:')
        .replace(/:3478(?=\/|\?|$)/, ':5349');
      return secureUrl === url ? null : secureUrl;
    })
    .filter((url): url is string => !!url);

  if (!variants.length) {
    return [];
  }

  return [
    {
      urls: variants,
      username: server.username,
      credential: server.credential
    }
  ];
}

export function resolveIceServers(): RuntimeIceServer[] {
  const configured = window.__MEDCALLON_RUNTIME__?.iceServers;
  if (!configured) {
    return DEFAULT_ICE_SERVERS;
  }

  if (Array.isArray(configured)) {
    const servers = configured.filter(isValidIceServer).map(normalizeIceServer);
    const expandedServers = window.location.protocol === 'https:'
      ? [...servers.flatMap((server) => buildTlsTurnVariants(server)), ...servers]
      : servers;
    return expandedServers.length ? expandedServers : DEFAULT_ICE_SERVERS;
  }

  if (typeof configured === 'string') {
    try {
      const parsed = JSON.parse(configured) as unknown;
      if (Array.isArray(parsed)) {
        const servers = parsed.filter(isValidIceServer).map(normalizeIceServer);
        const expandedServers = window.location.protocol === 'https:'
          ? [...servers.flatMap((server) => buildTlsTurnVariants(server)), ...servers]
          : servers;
        return expandedServers.length ? expandedServers : DEFAULT_ICE_SERVERS;
      }
    } catch {
      return DEFAULT_ICE_SERVERS;
    }
  }

  return DEFAULT_ICE_SERVERS;
}

export function resolveClarityProjectId(): string | null {
  const configured = window.__MEDCALLON_RUNTIME__?.clarityProjectId;
  if (!configured || typeof configured !== 'string') {
    return null;
  }

  const normalized = configured.trim();
  return normalized.length ? normalized : null;
}
