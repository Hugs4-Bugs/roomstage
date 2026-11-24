const PHOTO_KINDS = ['before', 'after', 'listing', 'plan'];

function isHttpsUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

function validatePhotoInput({ url, kind }) {
  if (!url || !isHttpsUrl(url)) {
    return 'url must be a valid https URL';
  }
  if (!kind || !PHOTO_KINDS.includes(kind)) {
    return `kind must be one of: ${PHOTO_KINDS.join(', ')}`;
  }
  return null;
}

module.exports = { PHOTO_KINDS, isHttpsUrl, validatePhotoInput };
