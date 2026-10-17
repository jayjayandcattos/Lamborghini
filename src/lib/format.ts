export const pad2 = (n: number) => String(n).padStart(2, '0');

export const formatInt = (n: number) => n.toLocaleString('en-US');

/** `data-aos` props, or nothing at all when motion is reduced. */
export function aos(name: string, delay = 0, enabled = true): Record<string, string> {
  return enabled ? { 'data-aos': name, 'data-aos-delay': String(delay) } : {};
}
