var getApexDomain = require('../lib/getApexDomain'),
    expect = require("chai").expect

describe('getApexDomain', function() {
  it('does nothing to hostnames without subdomains', function() {
    expect(getApexDomain('example.com')).to.equal('example.com')
  })

  it('does nothing to hostnames without dots', function() {
    expect(getApexDomain('localhost')).to.equal('localhost')
  })

  it('removes subdomains', function() {
    expect(getApexDomain('foo.bar.example.com')).to.equal('example.com')
  })
})
