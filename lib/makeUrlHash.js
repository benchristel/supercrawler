var crypto = require('crypto'),
    modUrl = require('url')

/**
 * Generate a unique digest for a URL string.
 * Query parameters are ignored; two URLs with different
 * params will have the same hash.
 */
function makeUrlHash(url) {
  var parsed = modUrl.parse(url)
  parsed.search = ''

  return crypto.createHash('sha1')
    .update(modUrl.format(parsed))
    .digest("hex");
}

module.exports = makeUrlHash
