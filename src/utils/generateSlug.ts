export function generateSlug(slug: string) {
  return slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/[\s+\g]/g, "-")
}