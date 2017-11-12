var assert = require('assert');
var logger = require('log4js').getLogger();
logger.level = 'error';

describe('All', function () {
	var web3 = {}
	before(function () {
		//console.log('Loading web3');
		var Web3 = require('web3');
		web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
	});

	describe('Environment', function () {
		it('web3 should be connected', function (done) {
			web3.eth.net.isListening().then(function (done) {
				assert.equal(done, true);
			}).then(done);
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
		it('should deploy without error', function (done) {
			sracle.deploy().then(function(resolve){
				done();
			}, function(reject){
				done(reject);
			});
		});
		it('should set up', function (done) {
			sracle.deploy().then(function(resolve){
				sracle.setUp().then(function(resolve){
					done();
				},function(reject){
					done(reject);
				});
			});
		});
		it('should return nonempty text for some css on google.com', function (done) {
			sracle.deploy().then(function(resolve){
				sracle.setUp().then(function(resolve){
					sracle.performQuery("https://google.com///h3.r[1]").then(
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
		it('should return concrete text for concrete query on google.com',
			function () {
				throw new Error('Not implemented');
		});
	});
});