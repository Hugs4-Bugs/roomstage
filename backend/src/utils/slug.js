const crypto = require('crypto');

function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function uniqueSlug(baseName) {
  const base = slugify(baseName) || 'unit';
  const suffix = crypto.randomBytes(3).toString('hex');
  return `${base}-${suffix}`;
}

module.exports = { slugify, uniqueSlug };
