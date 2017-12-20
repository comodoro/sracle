var assert = require('assert');
var Log4js = require('log4js');
var logger = Log4js.getLogger();
logger.level = Log4js.levels.ALL; 

describe('All', function () {
	var web3 = {}
	describe('Environment', function () {
		it('web3 should connect to WS or IPC', () => {
			var Web3 = require('web3');
			web3 = new Web3(Web3.givenProvider || 'ws://localhost:8546');
			//TODO allow command line options to pass node address
			// var net = require('net');	
			// if (process.platform === 'win32') {	
			// 	web3 = new Web3(new Web3.providers.IpcProvider('\\\\.\\pipe\\geth.ipc', net));
			// } else {
			// 	web3 = new Web3(Web3.givenProvider || 'ws://localhost:8546');
			// }
		});
		it('web3 should be listening', async () => {
			var listening = await web3.eth.net.isListening();
			assert.equal(listening, true);
		});
		it('dev account should exist and be unlocked', async () => {
			var accounts = await web3.eth.getAccounts();
			assert.equal(accounts.length > 0, true);
		});
		
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
			}).timeout(31000);	
			it('should load default options', async () => {
				var options = await sracle.getDefaultOptions();
				assert.notEqual(options.logging, undefined);
				assert.notEqual(options.deployment, undefined);
				assert.notEqual(options.css, undefined);
				assert.notEqual(options.pricing, undefined);
				assert.equal(options.nonExistingOption, undefined);
			});	
			it('should correctly detect Geth or Parity', async () => {
				var client = await sracle.getClient();
				assert.equal((client == 'parity') || (client == 'geth'), true);
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
			it('should reject invalid CSS', () => {
				var result = sracle.checkCSS("bla ?! 123"); 
				assert.equal(result.messages.length > 0, true);
				assert.equal(result.errorCode > 0, true);
			});
			it('should accept valid CSS', () => {
				var result = sracle.checkCSS("table > tbody > tr > td"); 
				assert.equal(result.errorCode, 0);
			});
		});
		describe('Running', () => {
			var deployedContract0 = {};
			var deployedContract1 = {};
			var deployedContract2 = {};
			var deployedContract3 = {};
			var accounts = {};
			before(async function () {
				this.timeout(5000);
			    accounts = await web3.eth.getAccounts();
				var compiledTest = await sracle.compile('contracts/SracleTest.sol');
				var testContractData = compiledTest[':SracleTest'];
				var testContract = new web3.eth.Contract(JSON.parse(testContractData.interface));
				deployedContract0 = await testContract.deploy({
					data: '0x' + testContractData.bytecode
				})
				.send({
					from: accounts[0],//"0x00a329c0648769a73afac7f9381e08fb43dbea72",
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
					from: accounts[0],
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
					from: accounts[0],
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
					from: accounts[0],
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
				//a bit suspicious that these can actually be equal
				assert.equal(Number(standard) >= Number(low), true);
			});
			// it('should detect calling contract address', (done) => {
			// 		deployedContract0.methods.test(sracle.SracleContract.options.address).send({
			// 		from: accounts[0],
			// 		gas: 1500000,
			// 		gasPrice: '20000000',
			// 		value: '1000000000000000000'
			// 	}).then(function(receipt){
			// 		sracle.getClient().then((client) => {
			// 			sracle.getOrigin(client, receipt.transactionHash).then((origin) => {
			// 				assert.equal(origin.toLowerCase(), deployedContract0.options.address.toLowerCase());
			// 			}).then(done);
			// 		});
			// 	});
			// }).timeout(10000);
			it('should answer a transaction', (done) => {
				deployedContract1.events.TestEvent({
					fromBlock: 0
				}, function(error, event) {
					done(error);
				});
				deployedContract1.methods.test(sracle.SracleContract._address).send({
					from: accounts[0],
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
					from: accounts[0],
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
					from: accounts[0],
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