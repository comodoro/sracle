'use strict';

var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || 'ws://localhost:8546');
var request = require('request');
var cheerio = require('cheerio');
var Log4js = require('log4js');
var fs = require('fs');

function Sracle (customOptions) {
	var self = this;
	this.interfaceAbi = [{"constant":false,"inputs":[{"name":"answer","type":"string"},{"name":"flags","type":"uint256"}],"name":"sracleAnswer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}];
	this.UsingSracle = new web3.eth.Contract(this.interfaceAbi);
	this.fullOracleAbi = [{"constant":false,"inputs":[{"name":"param","type":"string"}],"name":"cssQuery","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"param","type":"string"}],"name":"SracleQuery","type":"event"}];
    //always read default options
	this.getDefaultOptions().then((options) => {
		self._checkOptions(options);
		if (!options.deployment.from) {
			web3.eth.getAccounts().then((accounts) => {
				options.deployment.from = accounts[0];
			});
		}
		self.options = options;
		Object.assign(self.options, customOptions);
		self.SracleContract = new web3.eth.Contract(self.fullOracleAbi, self.options.existingAddress);
		Log4js.configure(self.options.logging);	
		self.logger = Log4js.getLogger();
	});
}

Sracle.prototype._checkOptions = function (options) {
	if (!options.existingAddress) {
		options.existingAddress = undefined;
	}
	if (!options.logging) {
		throw new Error('Logging options not found');
	} 
	if (!options.css) {
		throw new Error('CSS options not found');
	} 
}

Sracle.prototype.getDefaultOptions = async () => {
	var data = fs.readFileSync('sracle.options', 'utf8');
	return JSON.parse(data);
}

Sracle.prototype.compile = async function(contractFile) {
	var data = fs.readFileSync(contractFile, 'utf8');
	var solc = require('solc')
	var output = solc.compile(data, 1)
	for (var contractName in output.contracts) {
		this.logger.trace('Compiled: ' + contractName + ': ' + output.contracts[contractName].bytecode)
		this.logger.trace('ABI: ' + contractName + '; ' + JSON.parse(output.contracts[contractName].interface))
	}
	if (output.errors && (output.errors.length > 0)) {
		var e = new Error('Errors compiling contract ' + contractFile);
		e.errors = output.errors;
		throw e;
	}
	return output.contracts;
}
	
//TODO add requested confirmations parameter
Sracle.prototype.deploy = async function() {
	var self = this;
	self.logger.trace('Deploying');
	var accounts = await web3.eth.getAccounts();
	if (accounts.length < 1) {
		throw new Error("No accounts found");
	}
	var result = await self.compile('./contracts/SracleOracle.sol');
	var compiledSracle = result[':SracleOracle'];
	var contract = new web3.eth.Contract(JSON.parse(compiledSracle.interface));
	var deployOptions = self.options.deployment;
	self.SracleContract = await contract.deploy({
		data: '0x' + compiledSracle.bytecode
	})
	.send(deployOptions)
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
	//TODO online compile from contracts/UsingSracle.sol
	this.SracleContract.events.SracleQuery({
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
			if (text.length > self.options.css.limit) {
				text = text.substring(0, 1024);
			}
			self.logger.info('CSS found: >' + text + '<');
			resolve(text);
		});
	});
}

Sracle.prototype.performQuery = async function (event) {
	this.logger.trace("Sracle.performQuery");
	var param = event.returnValues.param;
	this.logger.debug("Received param " + param);
	var transaction = await web3.eth.getTransaction(event.transactionHash);
	//TODO check value
	var origin = transaction.from;
	this.logger.debug("Origin: " + origin + ", value: " + transaction.value);
	var cssPos = param.indexOf("///");
	if (cssPos < 0) {
		throw new Error('CSS after /// not found in query');
	}
	var url = param.substring(0, cssPos);
	this.logger.debug("URL: " + url);
	var css = param.substring(cssPos+3, param.length);
	var text = await this.cssQuery(url, css);
	var flags = 0;
	var UsingSracleContract = new web3.eth.Contract(this.interfaceAbi, origin);
	this.logger.debug(UsingSracleContract);
	UsingSracleContract.methods.sracleAnswer(text, flags).send(this.options.deployment);
	return;
}

module.exports = Sracle;
