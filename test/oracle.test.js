var assert = require('assert');

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
				console.log('Deployed');
				done();
			}, function(reject){
				throw new Error('Not deployed');
			});
		});
		it('should set up', function () {
			sracle.deploy().then(function(resolve){
				console.log('Deployed');
			}).then(function(resolve){
				sracle.setUp().then(done);
			});
		});
		it('should return nonempty text for some css on google.com', function () {
			throw new Error('Not implemented');
		});
		it('should return concrete text for concrete query on google.com',
			function () {
				throw new Error('Not implemented');
		});
	});
});