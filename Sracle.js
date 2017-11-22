'use strict';

var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || 'ws://localhost:8546');
var request = require('request');
var cheerio = require('cheerio');
var Log4js = require('log4js');
var fs = require('fs');
function Sracle (existingAddress, logging) {

	var self = this;
	this.UsingSracle = {};
	//TODO online compile from conracts/
	this.abi = [{"constant":false,"inputs":[{"name":"param","type":"string"}],"name":"query","outputs":[],"payable":true,"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"param","type":"string"}],"name":"SracleQuery","type":"event"}];
	if (existingAddress !== undefined) {
		this.SracleContract = new web3.eth.Contract(this.abi, existingAddress);
	}
	if (logging) {
		Log4js.configure({
			appenders: { app: { type: 'file', filename: 'sracle.log' } },
			categories: { default: { appenders: ['app'], level:logging.level } }
		  });
		  this.logger = Log4js.getLogger();
	} else {
		this.logger = Log4js.getLogger();
		this.logger.level = Log4js.levels.ALL; 
	}
}

Sracle.prototype.compile = async function(contractCode) {
	var data = fs.readFileSync(contractCode, 'utf8');
	var solc = require('solc')
	var output = solc.compile(data, 1)
	for (var contractName in output.contracts) {
		this.logger.debug(contractName + ': ' + output.contracts[contractName].bytecode)
		this.logger.debug(contractName + '; ' + JSON.parse(output.contracts[contractName].interface))
	}
	return output.contracts[':SracleOracle'].bytecode;
}
	
//TODO add requested confirmations parameter
Sracle.prototype.deploy = async function() {
	var self = this;
	self.logger.trace('Deploying');
	var contract = new web3.eth.Contract(this.abi);
	var accounts = await web3.eth.getAccounts();
	if (accounts.length < 1) {
		throw new Error("No accounts found");
	}
	var code = await self.compile('./contracts/SracleOracle.sol');
	self.SracleContract = await contract.deploy({
		data: '0x' + code
	})
	.send({
		//TODO choosable options
		from: "0x00a329c0648769a73afac7f9381e08fb43dbea72",
		gas: 1500000,
		gasPrice: '20000000'
	})
	.on('error', function(error) {
		throw error;
	})
	.on('transactionHash', function(transactionHash){
		self.logger.debug("Txhash: " + transactionHash);
	})
	.on('receipt', function(receipt){
		self.logger.info(receipt.contractAddress) // contains the new contract address
	})
	.on('confirmation', function(confirmationNumber, receipt){ 
		self.logger.debug(confirmationNumber);
	});
	self.logger.info("Deployed at " + self.SracleContract.address) 
	return self.SracleContract;
}	

Sracle.prototype.setUp = async function() {
	var self = this;
	//TODO online compile from contracts/
	this.callbackAbi = [{"constant":false,"inputs":[{"name":"answer","type":"string"},{"name":"flags","type":"uint256"}],"name":"sracleAnswer","outputs":[],"payable":false,"type":"function"}];
	this.UsingSracle = new web3.eth.Contract(this.callbackAbi);
	self.SracleContract.events.SracleQuery({
		fromBlock: await web3.eth.getBlockNumber()
	}, function(error, event) {
		if (!error) {
			self.performQuery(event);
		} else {
			self.logger.error(error);
		}
	});
}

Sracle.prototype.cssQuery = function (url, css) {
	var self = this;
	this.logger.debug("CSS: " + css);
	return new Promise(function(resolve, reject) {
		request(url, function (error, response, body) {
			if (error) {
				self.logger.error(error);
			}
			//TODO support probably all 2xx and most redirects
			if (response.statusCode != 200) reject('HTTP status code of response is not 200');
			var $ = cheerio.load(body);
			//TODO input checking
			var text = $(css).text();
			self.logger.info('CSS found: >' + text + '<');
			resolve(text);
		});
	});
}

Sracle.prototype.performQuery = function (event) {
	var self = this;
	self.logger.trace("Sracle.performQuery");
	var param = event.returnValues.param;
	self.logger.debug("Received param " + param);
	return new Promise(function(resolve, reject) {
		web3.eth.getTransaction(event.transactionHash)
		.then(function(transaction) {
			//TODO check value
			var value = web3.utils.fromWei(transaction.value, 'ether');
			var origin = transaction.from;
			this.logger.debug("Origin: " + origin + ", value: " + value);
			var cssPos = param.indexOf("///");
			var url = param.substring(0, cssPos);
			this.logger.debug("URL: " + url);
			var css = param.substring(cssPos+3, param.length);
			var text = self.cssQuery(css);
			var UsingSracleContract = new web3.eth.Contract(origin);
			this.logger.debug(UsingSracleContract);
			UsingSracleContract.sracleAnswer(text,  {from: web3.eth.accounts.wallet[0]});
			return resolve(self);
			});	
		});
}

module.exports = Sracle;
