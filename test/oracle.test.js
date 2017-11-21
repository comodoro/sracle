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
		before(function() {
			var s = require('../Sracle');
			sracle = new s();
		});
		it('should deploy without error', async () => {
			await sracle.deploy();
		});
		it('should set up', async () => {
			await sracle.deploy();
			await sracle.setUp();
		});
		it('should return basic css title on google.com', () => {
			sracle.cssQuery("https://www.google.com", "title").then(text => assert.equal(text, 'Google'));
		});
		it('should resolve more complex CSS on Wikipedia', () => {
			sracle.cssQuery("https://en.wikipedia.org/wiki/Boii", "html > body > div > h1#firstHeading")
				.then(text => assert.equal(text, 'Boii'));
		});
		it('should check hash of transaction', function (done) {
			throw new Error('Not finished');
			sracle.deploy().then(function(resolve){
				sracle.setUp().then(function(resolve){
					var mockEvent = {
						"returnValues": {
							"param": "https://google.com///h3.r[1]",
							"value": "1000000000000"
						}
					};
					sracle.performQuery(mockEvent).then(
						function(resolve) {
							done();
						},
						function(reject) {
							return done(reject);
					});
				},function(reject){
					done(reject);
				});
			},function(reject){
				throw new Error(reject);
				return done(reject);
			});
		});
	});
});