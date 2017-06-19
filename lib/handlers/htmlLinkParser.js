var cheerio = require("cheerio"),
    urlMod = require("url"),
    getApexDomain = require('../getApexDomain')

module.exports = function (opts) {
  if (!opts) {
    opts = {};
  }

  return function (context) {
    var $;

    $ = context.$ || cheerio.load(context.body);
    context.$ = $;

    return $("a[href], link[href][rel=alternate]").map(function () {
      var $this,
          targetHref,
          absoluteTargetUrl,
          urlObj,
          protocol,
          hostname,
          apexDomain;

      $this = $(this);
      targetHref = $this.attr("href");
      absoluteTargetUrl = urlMod.resolve(context.url, targetHref);
      urlObj = urlMod.parse(absoluteTargetUrl);
      protocol = urlObj.protocol;
      hostname = urlObj.hostname;

      if (protocol !== "http:" && protocol !== "https:") {
        return null;
      }

      // Restrict links to a particular group of hostnames.

      apexDomain = getApexDomain(hostname)
      if (typeof opts.hostnames !== "undefined") {
        if (!contains(opts.hostnames, apexDomain) &&
            !contains(opts.hostnames, hostname)) {
          return null;
        }
      }

      if (typeof opts.excludedHostnames !== "undefined") {
        if (contains(opts.excludedHostnames, apexDomain) ||
            contains(opts.excludedHostnames, hostname)) {
          return null;
        }
      }

      return urlMod.format({
        protocol: urlObj.protocol,
        auth: urlObj.auth,
        host: urlObj.host,
        pathname: urlObj.pathname,
        search: urlObj.search
      });
    }).get();
  };
};

function contains(list, item) {
  return list.indexOf(item) !== -1
}
