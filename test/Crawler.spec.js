var proxyquire = require('proxyquire'),
    sinon = require("sinon"),
    expect = require("chai").expect,
    makeUrl = require("./utils/makeUrl"),
    Promise = require("bluebird"),
    FifoUrlListMock;

FifoUrlListMock = function () {
  this.callCount = 0;
  this.delayTime = 1;
};

FifoUrlListMock.prototype.getNextUrl = function () {
  this.callCount++;

  if (this.callCount >= 20) {
    return Promise.reject(new RangeError("rangeerror"));
  }

  // We are forcing a delay here, because there is a problem using Promises
  // with sinon fake timers. Probably because Promise.resolve is not using a
  // setTimeout anywhere. I think it is related to this issue:
  // https://github.com/sinonjs/sinon/issues/738
  return Promise.delay(this.delayTime).then(function () {
    return makeUrl("https://example.com/index" + this.callCount + ".html");
  });
};

describe("Crawler", function () {
  var Crawler,
      requestSpy;

  beforeEach(function () {
    requestSpy = sinon.spy(function (opts, cb) {
      setTimeout(function () {
        cb(null, {
          body: ["User-agent: *",
            "Allow: /",
            "Disallow: /index17.html"
          ].join("\n")
        });
      }, 1);
    });

    Crawler = proxyquire("../lib/Crawler", {
      "./FifoUrlList": FifoUrlListMock,
      "request": requestSpy
    });
  });

  var numRobotsCalls = function () {
    var numRobotsCalls = 0;
    var n = 0;
    var call;

    while (requestSpy.getCall(n)) {
      call = requestSpy.getCall(n);

      if (call.calledWith(sinon.match({
        url: "https://example.com/robots.txt",
        forever: true
      }))) {
        numRobotsCalls++;
      }

      n++;
    }

    return numRobotsCalls;
  };

  it("returns an instance when called as a function", function () {
    expect(Crawler()).to.be.an.instanceOf(Crawler);
  });

  describe("#getUrlList", function () {
    it("if no urlList is specified, defaults to a FifoUrlList", function () {
      var crawler = new Crawler();

      expect(crawler.getUrlList()).to.be.an.instanceOf(FifoUrlListMock);
    });

    it("can use a specified UrlList instance", function () {
      var urlList = new FifoUrlListMock();
      var crawler = new Crawler({
        urlList: urlList
      });

      expect(crawler.getUrlList()).to.equal(urlList);
    });
  });

  describe("#getInterval", function () {
    it("uses a default interval of 1000ms", function () {
      expect(new Crawler().getInterval()).to.equal(1000);
    });

    it("will use a specified interval", function () {
      expect(new Crawler({
        interval: 5000
      }).getInterval()).to.equal(5000);
    });
  });

  describe("#getConcurrentRequestsLimit", function () {
    it("uses a default setting of 5", function () {
      expect(new Crawler().getConcurrentRequestsLimit()).to.equal(5);
    });

    it("will use a specified limit", function () {
      expect(new Crawler({
        concurrentRequestsLimit: 99
      }).getConcurrentRequestsLimit()).to.equal(99);
    });
  });

  describe("#start", function () {
    var clock;

    before(function () {
      clock = sinon.useFakeTimers();
    });

    after(function () {
      clock.restore();
    });
    
    it("returns false if crawl is already running", function () {
      var crawler;

      crawler = new Crawler();
      crawler.start();

      expect(crawler.start()).to.equal(false);
    });

    it("returns true if crawl is not already started", function () {
      var crawler;

      crawler = new Crawler();

      expect(crawler.start()).to.equal(true);
    });

    it("throttles requests according to the interval", function (done) {
      var crawler = new Crawler({
        interval: 100
      });
      var fifoUrlList = crawler.getUrlList();

      crawler.start();
      clock.tick(250);

      // call at 0ms, 100ms, 200ms
      expect(fifoUrlList.callCount).to.equal(3);
      done();
    });

    it("obeys the concurrency limit", function (done) {
      var crawler = new Crawler({
        interval: 10,
        concurrentRequestsLimit: 1
      });
      var fifoUrlList = crawler.getUrlList();

      // simulate each request taking 15ms
      fifoUrlList.delayTime = 15;

      crawler.start();
      clock.tick(58);

      // call at 0ms finished at 15ms
      // call at 15ms finishes at 30ms
      // call at 30ms finishes at 45ms
      // call at 45ms finsihes at 60ms
      expect(fifoUrlList.callCount).to.equal(4);
      done();
    });

    it("caches robots.txt for a default of 60 minutes", function (done) {
      var crawler = new Crawler({
        interval: 1000 * 60 * 5, // get page every 5 minutes
        concurrentRequestsLimit: 1
      });

      crawler.start();
      clock.tick(1000 * 60 * 80); // run for 80 minutes

      expect(numRobotsCalls()).to.equal(2);
      done();
    });

    it("caches robots.txt for a specified amount of time", function (done) {
      var crawler = new Crawler({
        interval: 1000 * 60 * 5, // get page every 5 minutes
        concurrentRequestsLimit: 1,
        robotsCacheTime: 1000 * 60 * 30 // 30 minutes
      });

      crawler.start();
      clock.tick(1000 * 60 * 80); // run for 80 minutes

      expect(numRobotsCalls()).to.equal(3);
      done();
    });
  });
});
