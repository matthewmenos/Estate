export function slugifyArea(area: string) {
  return area.trim().toLowerCase().replace(/\s+/g, "-");
}

export function deslugifyArea(slug: string) {
  return slug.replace(/-/g, " ");
}
