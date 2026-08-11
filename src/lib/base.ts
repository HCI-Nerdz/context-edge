/** Join a site-relative path to Astro `BASE_URL` (with or without trailing slash). */
export function hrefWithBase(path: string): string {
  const raw = import.meta.env.BASE_URL || '/';
  const base = raw.endsWith('/') ? raw : `${raw}/`;
  return `${base}${path.replace(/^\//, '')}`;
}
