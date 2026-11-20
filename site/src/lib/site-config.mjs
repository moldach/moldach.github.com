/** Indexability is explicit; NODE_ENV=production also applies to preview builds. */
export function siteConfig(env = process.env) {
  const deployment = env.DEPLOYMENT_ENV || 'preview';
  if (!['production', 'preview'].includes(deployment)) {
    throw new Error('DEPLOYMENT_ENV must be production or preview.');
  }
  const production =
    deployment === 'production' &&
    (!env.CF_PAGES || env.CF_PAGES_BRANCH === 'master');
  const raw = env.PUBLIC_SITE_URL?.trim();
  let origin;
  if (raw) {
    let url;
    try {
      url = new URL(raw);
    } catch {
      throw new Error('PUBLIC_SITE_URL must be an absolute HTTPS origin.');
    }
    const host = url.hostname.toLowerCase();
    const reserved =
      /(^|\.)(example\.(com|net|org)|localhost|invalid|test|local)$/;
    const provider = /(^|\.)(pages\.dev|github\.io|vercel\.app|netlify\.app)$/;
    const ip = /^[\d.]+$/.test(host) || host.includes(':');
    if (
      url.protocol !== 'https:' ||
      url.username ||
      url.password ||
      url.port ||
      url.search ||
      url.hash ||
      url.pathname !== '/' ||
      !host.includes('.') ||
      reserved.test(host) ||
      provider.test(host) ||
      ip
    ) {
      throw new Error(
        'PUBLIC_SITE_URL must be an owned HTTPS domain, without a path, credentials, port or query; placeholders and preview hosts are forbidden.',
      );
    }
    origin = url.origin;
  }
  if (production && !origin)
    throw new Error(
      'Production requires PUBLIC_SITE_URL: supply Matthew’s approved owned domain.',
    );
  return { production, origin };
}

export function canonicalUrl(origin, route) {
  if (!origin) return undefined;
  if (!route.startsWith('/') || route.startsWith('//') || /[?#]/.test(route)) {
    throw new Error(`Invalid canonical route: ${route}`);
  }
  return new URL(route, origin).href;
}
