var assert = require('assert');
var Log4js = require('log4js');
var logger = Log4js.getLogger();
logger.level = Log4js.levels.ALL; 

describe('All', function () {
	var web3 = {}
	before(function () {
		var Web3 = require('web3');
		web3 = new Web3(Web3.givenProvider || 'ws://localhost:8546');
    });

	describe('Environment', function () {
		it('web3 should be connected', async () => {
			var listening = await web3.eth.net.isListening();
			assert.equal(listening, true);
		});
		it('dev account should exist', async () => {
			var accounts = await web3.eth.getAccounts();
			var exists = accounts.includes('0x00a329c0648769A73afAc7F9381E08FB43dBEA72');
			assert.equal(exists, true);
		});
		// it('dev account should be possible to unlock', async () => {
		// 	try {
		// 		var unlocked = await web3.eth.personal.unlockAccount('0x00a329c0648769A73afAc7F9381E08FB43dBEA72', '', 100);				
		// 	} catch(e) {
		// 		throw e;
		// 	}
		// 	assert.equal(unlocked, true);
		// });
		it('web3 utility functions should work', function () {
			var amount = web3.utils.toWei("1", "ether")
			assert.equal(web3.utils.fromWei(amount.toString()), 1);
		});
	});

	describe('Oracle', function () {
		var sracle = {};
		before(() => {
			var s = require('../Sracle');
			sracle = new s();
		});
		describe('Deployment', () => {
			it('should deploy', async () => {
				await sracle.deploy();
				assert.equal(sracle.SracleContract._address.length, 42);
			}).timeout(30000);
			it('should set up', async () => {
				await sracle.deploy();
				await sracle.setUp();
			}).timeout(60000);	
			it('should load default options', async () => {
				var options = await sracle.getDefaultOptions();
				assert.notEqual(options.logging, undefined);
				assert.notEqual(options.deployment, undefined);
				assert.notEqual(options.css, undefined);
				assert.notEqual(options.pricing, undefined);
				assert.equal(options.nonExistingOption, undefined);
			});	
			it('should correctly detect Parity', async () => {
				var client = await sracle.getClient();
				assert.equal(client, 'parity');
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
			it('should limit text according to preset limit', async () => {
				var text = await sracle.cssQuery("https://en.wikipedia.org/wiki/Boii", 
				"html > body > div");
				assert.equal(text.length, 1024);
			});
		});
		describe('Running', () => {
			var deployedContract0 = {};
			var deployedContract1 = {};
			var deployedContract2 = {};
			var deployedContract3 = {};
			before(async () => {
				var compiledTest = await sracle.compile('contracts/SracleTest.sol');
				var testContractData = compiledTest[':SracleTest'];
				var testContract = new web3.eth.Contract(JSON.parse(testContractData.interface));
				deployedContract0 = await testContract.deploy({
					data: '0x' + testContractData.bytecode
				})
				.send({
					from: "0x00a329c0648769a73afac7f9381e08fb43dbea72",
					gas: 1500000,
					gasPrice: '20000000'
				})
				.on('error', function(error) {
					throw error;
				});
				deployedContract1 = await testContract.deploy({
					data: '0x' + testContractData.bytecode
				})
				.send({
					from: "0x00a329c0648769a73afac7f9381e08fb43dbea72",
					gas: 1500000,
					gasPrice: '20000000'
				})
				.on('error', function(error) {
					throw error;
				});				
				deployedContract2 = await testContract.deploy({
					data: '0x' + testContractData.bytecode
				})
				.send({
					from: "0x00a329c0648769a73afac7f9381e08fb43dbea72",
					gas: 1500000,
					gasPrice: '20000000'
				})
				.on('error', function(error) {
					throw error;
				});
				deployedContract3 = await testContract.deploy({
					data: '0x' + testContractData.bytecode
				})
				.send({
					from: "0x00a329c0648769a73afac7f9381e08fb43dbea72",
					gas: 1500000,
					gasPrice: '20000000'
				})
				.on('error', function(error) {
					throw error;
				});			
			});
			it('should retrieve gas from EthGasStation', async () => {
				sracle.options.pricing =  {
					"type": "ethgasstation",
					"options": "low",
					"value": "1.5"			
				};
				var low = await sracle.getGasPriceFromEthgasstation();
				assert.equal(low.length > 0, true);
				sracle.options.pricing =  {
					"type": "ethgasstation",
					"options": "standard",
					"value": "1.5"			
				};
				var standard = await sracle.getGasPriceFromEthgasstation();
				assert.equal(standard.length > 0, true);
				assert.equal(standard > low, true);
			});
			it('should detect calling contract address', (done) => {
					deployedContract0.methods.test(sracle.SracleContract.options.address).send({
					from: "0x00a329c0648769a73afac7f9381e08fb43dbea72",
					gas: 1500000,
					gasPrice: '20000000',
					value: '1000000000000000000'
				}).then(function(receipt){
					sracle.getOrigin('parity', receipt.transactionHash).then((origin) => {
						assert.equal(origin.toLowerCase(), deployedContract0.options.address.toLowerCase());
					}).then(done);
				});
			}).timeout(10000);
			it('should answer a transaction', (done) => {
				deployedContract1.events.TestEvent({
					fromBlock: 0
				}, function(error, event) {
					done(error);
				});
				deployedContract1.methods.test(sracle.SracleContract._address).send({
					from: "0x00a329c0648769a73afac7f9381e08fb43dbea72",
					gas: 1500000,
					gasPrice: '20000000',
					value: '1000000000000000000'
				});
			}).timeout(60000);
			it('should correctly return error on invalid CSS', (done) => {
				deployedContract2.events.TestEvent({
					fromBlock: 0
				}, function(error, event) {
					done(new Error('TestEvent returned on invalid CSS'));
				});
				deployedContract2.events.ErrorEvent({
					fromBlock: 0
				}, function(error, event) {
					done(error);
				});				
				deployedContract2.methods.testInvalidCSS(sracle.SracleContract._address).send({
					from: "0x00a329c0648769a73afac7f9381e08fb43dbea72",
					gas: 1500000,
					gasPrice: '20000000',
					value: '1000000000000000000'
				});
			}).timeout(60000);
			it('should not return anything (time out) on too low a transaction value', (done) => {
				deployedContract3.events.TestEvent({
					fromBlock: 0
				}, function(error, event) {
					done(new Error('TestEvent returned on too low transaction value'));
				});
				deployedContract3.events.ErrorEvent({
					fromBlock: 0
				}, function(error, event) {
					done(new Error('ErrorEvent returned on too low transaction value'));
				});	
				sracle.options.pricing = sracle.options._alternative_pricing;
				deployedContract3.methods.test(sracle.SracleContract._address).send({
					from: "0x00a329c0648769a73afac7f9381e08fb43dbea72",
					gas: 1500000,
					gasPrice: '20000000',
					//1 wei
					value: '1'
				});
				setTimeout(done, 10000);
			}).timeout(11000);
		});		
	});
});