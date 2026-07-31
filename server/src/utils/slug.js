import slugify from 'slugify';

/**
 * Generate a URL-friendly, collision-free slug for a model.
 * Appends `-2`, `-3`, … if the base slug is already taken.
 *
 * @param {import('mongoose').Model} Model  model with a unique `slug` field
 * @param {string} source  text to slugify (e.g. a village or category name)
 * @param {string} [excludeId]  id of the document being updated (ignored in the check)
 * @returns {Promise<string>}
 */
export async function generateUniqueSlug(Model, source, excludeId) {
  const base = slugify(source, { lower: true, strict: true });
  let slug = base;
  let n = 2;
  // eslint-disable-next-line no-await-in-loop -- rare, bounded collision handling
  while (await Model.exists({ slug, ...(excludeId ? { _id: { $ne: excludeId } } : {}) })) {
    slug = `${base}-${n++}`;
  }
  return slug;
}
