//Tests the oracle incuding functional tests

var assert = require('chai').assert;
var Log4js = require('log4js');
var logger = Log4js.getLogger();
logger.level = Log4js.levels.ALL; 

deployTestContract = async (testContract, testContractData, from) => {
	var deployedContract = await testContract.deploy({
		data: '0x' + testContractData.bytecode,
		arguments: [sracle.options.deployment.existingDeployment.address,from]
	})
	.send({
		from: from,
		gas: 1500000,
		gasPrice: '20000000'
	})
	.on('error', function(error) {
		throw error;
	});
	deployedContract.setProvider(testContract.currentProvider);
	return deployedContract;
}

var web3 = {}
var sracle = {};

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


before(() => {
	var s = require('../Sracle');
	sracle = new s();
});
describe('Deployment', () => {
	it('should deploy', async () => {
		await sracle.deploy();
		assert.equal(sracle.SracleContract.options.address.length, 42);
	}).timeout(30000);
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
describe('Running', () => {
	it('should start listening', async () => {
		await sracle.startListening();
		assert.equal(sracle.queryListener.subscriptionMethod, 'logs');
	});
	it('should stop listening', async () => {
		await sracle.stopListening();
		assert.isFalse(sracle.isListening());
	});
	it('should retrieve gas from EthGasStation', async () => {
		sracle.options.pricing.query =  {
			"type": "ethgasstation",
			"options": "low",
			"value": "1.5"			
		};
		var low = await sracle.getGasPriceFromEthgasstation();
		assert.isAbove(low.length, 0);
		sracle.options.pricing.query =  {
			"type": "ethgasstation",
			"options": "standard",
			"value": "1.5"			
		};
		var standard = await sracle.getGasPriceFromEthgasstation();
		assert.isAbove(standard.length, 0);
		//a bit suspicious that these can actually be equal
		assert.equal(Number(standard) >= Number(low), true);
	});
});
describe('Contract interaction', () => {
	var deployedContract = {};
	var deployedContract1 = {};
	var deployedContract2 = {};
	var deployedContract3 = {};
	var accounts = {};
	var testContractData;
	var testContract;
before(async function () {
		this.timeout(10000);
		accounts = await web3.eth.getAccounts();
		await sracle.startListening();
		var compiledTest = await sracle.compile('contracts/SracleTest.sol');
		testContractData = compiledTest[':SracleTest'];
		testContract = new web3.eth.Contract(JSON.parse(testContractData.interface));
		//deployedContract0 = await deployTestContract(testContract, testContractData, accounts[0]);			
		deployedContract1 = await deployTestContract(testContract, testContractData, accounts[0]);			
		deployedContract2 = await deployTestContract(testContract, testContractData, accounts[0]);			
		deployedContract3 = await deployTestContract(testContract, testContractData, accounts[0]);	
	});
	beforeEach(async function() {
		deployedContract = await deployTestContract(testContract, testContractData, accounts[0]);			
	});
	it('should answer a valid query', (done) => {
		deployedContract.events.TestEvent({
			fromBlock: 0
		}, function(error, event) {
			done(error);
		});
		deployedContract.methods.testValidCSS().send({
			from: accounts[0],
			gas: 1500000,
			gasPrice: '20000000',
			value: '1000000000000000000'
		});
	}).timeout(30000);
	it('should correctly return error on invalid CSS', (done) => {
		deployedContract.events.TestEvent({
			fromBlock: 0
		}, function(error, event) {
			done(new Error('TestEvent returned on invalid CSS'));
		});
		deployedContract.events.ErrorEvent({
			fromBlock: 0
		}, function(error, event) {
			done(error);
		});				
		deployedContract.methods.testInvalidCSS().send({
			from: accounts[0],
			gas: 1500000,
			gasPrice: '20000000',
			value: '1000000000000000000'
		});
	}).timeout(30000);
	//TODO concurrency, separate describe?
	// it('should corrwctly react to startListening and stopListening', (done) => {
	// 	var listening;
	// 	deployedContract0.events.TestEvent({
	// 		fromBlock: 0
	// 	}, function(error, event) {
	// 		var err = error || sracle.isListening() ? null : new Error('Callback received when not listening');
	// 		if (err) throw err;
	// 		else done();
	// 	});
	// 	deployedContract0.events.ErrorEvent({
	// 		fromBlock: 0
	// 	}, function(error, event) {
	// 		done(new Error('Unexpected ErrorEvent'));
	// 	});	
	// 	sracle.stopListening().then(() => {
	// 		deployedContract0.methods.testValidCSS().send({
	// 			from: accounts[0],
	// 			gas: 1500000,
	// 			gasPrice: '20000000',
	// 			value: '1000000000000000000'
	// 		});
	// 	});
	// 	setTimeout(async () => {
	// 		sracle.startListening().then(() => {
	// 			deployedContract0.methods.testValidCSS().send({
	// 				from: accounts[0],
	// 				gas: 1500000,
	// 				gasPrice: '20000000',
	// 				value: '1000000000000000000'
	// 			});
	// 		});

	// 	}, 10000);
	// });
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
		sracle.options.pricing.query = sracle.options.pricing._alternative_query;
		deployedContract3.methods.testValidCSS().send({
			from: accounts[0],
			gas: 1500000,
			gasPrice: '20000000',
			//1 wei
			value: '1'
		});
		setTimeout(done, 10000);
	}).timeout(12000);
});		