var assert = require('chai').assert;
var Log4js = require('log4js');
var logger = Log4js.getLogger();
logger.level = Log4js.levels.ALL; 

describe('Module time', () => {
    var Time = {};
    before(() => {
        var timeModule = require('../time.js');
        Time = new timeModule();
    });
    it('should handle time request', async () => {
        var now = Date.now();
        var time = await Time.handleQuery();
        var after = Date.now();
        assert.isAtLeast(time.answer, now);
        assert.isAtLeast(after, time.answer);
    });
});
