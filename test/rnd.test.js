var assert = require('chai').assert;
var Log4js = require('log4js');
var logger = Log4js.getLogger();
logger.level = Log4js.levels.ALL; 

describe('Module Random', () => {
    var rnd = {};
    before(() => {
        var randomModule = require('../random.js');
        rnd = new randomModule();
    });
    it('should return one 0-1 number on empty string', async () => {
        var text = await rnd.handleQuery("");
        var nanswer = Number(text.answer);
        assert.isAtLeast(nanswer,0);
        assert.isBelow(nanswer,2);
    });
    it('should return nonzero flags on arbitrary string', async () => {
        var text = await rnd.handleQuery("gggwww85ege6f4was4w");
        assert.isNumber(text.flags);
        assert.isAtLeast(text.flags,1);
    });
    it('should return a sequence where at least some numbers differ', async () => {
        var text = await rnd.handleQuery("100///100");
        var allEqual = true;
        var numbers = text.answer.split(',');
        for (let i = 1;i < numbers.length;i++) {
            if (numbers[i] != numbers[i-1]) {
                allEqual = false;
                break;
            }
        }
        assert.equal(false, allEqual);
    });
    it('should limit size of returned array', async () => {
        var text = await rnd.handleQuery("100///1000000");
        var allEqual = true;
        var numbers = text.answer.split(',');
        assert.lengthOf(numbers, rnd.MAX_HOW_MANY);
    });
    it('should limit range of returned numbers', async () => {
        var text = await rnd.handleQuery("1000000///10000");
        var allEqual = true;
        var numbers = text.answer.split(',');
        var max = numbers.reduce(function(a, b) {
            return Math.max(a, b);
        });
        assert.isBelow(max, rnd.MAX_RANGE);
    });
});
