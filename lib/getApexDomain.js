function getApexDomain(hostname) {
  return hostname.slice(indexOfPenultimate('.', hostname) + 1)
}

function indexOfPenultimate(needle, haystack) {
  var found = haystack.lastIndexOf(needle)
  return haystack.lastIndexOf(needle, found - 1)
}

module.exports = getApexDomain
