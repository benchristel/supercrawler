var Url = require("../lib/Url"),
    expect = require("chai").expect,
    makeUrlHash = require('../lib/makeUrlHash')

describe('makeUrlHash', function() {
  it('hashes two URLs to different values', function() {
    expect(makeUrlHash('https://foo.example.com')).to.equal('bcf2400f879e5612114840c50a9d97268808ed83')
    expect(makeUrlHash('https://bar.example.com')).to.equal('dc732a3ad771d2c65b26ac465b8212af846b418d')
  })

  it('hashes URLs that differ only by query params to the same value', function() {
    expect(makeUrlHash('https://example.com?a=1'))
        .to.equal(makeUrlHash('https://example.com?a=0'))
  })
})
