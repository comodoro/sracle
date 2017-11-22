var assert = require('assert');
var Log4js = require('log4js');
var logger = Log4js.getLogger();
logger.level = Log4js.levels.ALL; 

describe('All', function () {
	var web3 = {}
	before(function () {
		//console.log('Loading web3');
		var Web3 = require('web3');
		web3 = new Web3(Web3.givenProvider || 'ws://localhost:8546');
	});

	describe('Environment', function () {
		it('web3 should be connected', async () => {
			var listening = await web3.eth.net.isListening();
			assert.equal(listening, true);
		});
		it('web3 utility functions should work', function () {
			var amount = web3.utils.toWei(1, "ether")
			assert.equal(web3.utils.fromWei(amount), 1);
		});
	});

	describe('oracle', function () {
		var sracle = {};
		before(() => {
			var s = require('../Sracle');
			sracle = new s();
		});
		describe('deployment', () => {
			before(async () => {
				await sracle.deploy();
				assert.equal(sracle.SracleContract._address.length, 42);
			});
			it('should set up', async () => {
				await sracle.setUp();
				assert.equal(sracle.UsingSracle._address, null);
			});	
		});
		describe('CSS', () => {
			it('should return basic css title on google.com', async () => {
				var text = await sracle.cssQuery("https://www.google.com", "title");
				assert.equal(text, 'Google');
			});
			it('should resolve more complex CSS on Wikipedia', async () => {
				var text = await sracle.cssQuery("https://en.wikipedia.org/wiki/Boii", 
				"html > body > div > h1#firstHeading");
				assert.equal(text, 'Boii');
			});
		});
	});
});