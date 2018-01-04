var assert = require('chai').assert;
var Log4js = require('log4js');
var logger = Log4js.getLogger();
logger.level = Log4js.levels.ALL; 

describe('Module CSS', () => {
    var css = {};
    before(() => {
        var cssModule = require('../css.js');
        css = new cssModule();
    });
    it('should return basic css title on google.com', async () => {
        var text = await css.cssQuery("https://www.google.com", "title");
        assert.equal(text, 'Google');
    });
    it('should resolve more complex CSS on Wikipedia', async () => {
        var text = await css.cssQuery("https://en.wikipedia.org/wiki/Boii", 
        "html > body > div > h1#firstHeading");
        assert.equal(text, 'Boii');
    });
    it('should limit text according to preset limit', async () => {
        var text = await css.cssQuery("https://en.wikipedia.org/wiki/Boii", 
        "html > body > div");
        assert.equal(text.length, 1024);
    });
    it('should reject invalid CSS', () => {
        var result = css.checkCSS("bla ?! 123"); 
        assert.equal(result.messages.length > 0, true);
        assert.equal(result.errorCode > 0, true);
    });
    it('should accept valid CSS', () => {
        var result = css.checkCSS("table > tbody > tr > td"); 
        assert.equal(result.errorCode, 0);
    });
});
