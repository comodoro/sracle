var assert = require('assert');

describe('All', function () {
	var web3 = {}
	before(function () {
		//console.log('Loading web3');
		var Web3 = require('web3');
		web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
	});

	describe('Environment', function () {
		describe('correctness', function () {
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
	});

	describe('Sracle', function () {
		var sracle = {};
		before(function() {
			var s = require('../Sracle');
			sracle = new s();
		});
		describe('start', function () {
			it('should deploy without error', function (done) {
				setTimeout(function () {
					sracle.init();
					done();
				}, 1000);
			});
		});
		describe('run', function () {
			it('should run for at least two blocks', function () {

			});
			it('should return nonempty text for some css on google.com', function () {

			});
			it('should return concrete text for concrete query on google.com',
				function () {

			});
		});
	});
});