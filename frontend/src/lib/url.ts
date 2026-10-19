export function absoluteUrl(path: string): string {
  return typeof window === 'undefined' ? path : `${window.location.origin}${path}`;
}
