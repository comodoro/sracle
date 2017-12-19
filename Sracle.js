'use strict';

var request = require('request');
var cheerio = require('cheerio');
var Log4js = require('log4js');
var fs = require('fs');
//May not be the best tool for the job
var cssLint = require('csslint')

function Sracle(web3, customOptions) {
	if (web3 === undefined) {
		var Web3 = require('web3');
		web3 = new Web3('ws://localhost:8546');
	}
	this.web3 = web3;
	this.interfaceAbi = [{"constant":false,"inputs":[{"name":"answer","type":"string"},{"name":"flags","type":"uint256"}],"name":"sracleAnswer","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"}];
	this.UsingSracleContract = new this.web3.eth.Contract(this.interfaceAbi, '0x00a329c0648769a73afac7f9381e08fb43dbea72');
	this.fullOracleAbi = [{"constant":false,"inputs":[{"name":"param","type":"string"}],"name":"cssQuery","outputs":[],"payable":true,"stateMutability":"payable","type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"param","type":"string"}],"name":"SracleQuery","type":"event"}];
    //always read default options
	var options = this.getDefaultOptions();
	this._checkOptions(options);
	this.options = options;
	Object.assign(this.options, customOptions);
	this.SracleContract = new web3.eth.Contract(this.fullOracleAbi, this.options.existingAddress);
	Log4js.configure(this.options.logging);	
	this.logger = Log4js.getLogger();
	// if (!options.deployment.from) {
	// 	web3.eth.getAccounts().then((accounts) => {
	// 		//runs async
	// 		web3.eth.defaultAccount = accounts[0];
	// 	});
	// }
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

Sracle.prototype.getDefaultOptions = () => {
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
	var accounts = await this.web3.eth.getAccounts();
	if (accounts.length < 1) {
		throw new Error("No accounts found");
	}
	var result = await self.compile('./contracts/SracleOracle.sol');
	var compiledSracle = result[':SracleOracle'];
	var contract = new this.web3.eth.Contract(JSON.parse(compiledSracle.interface));
	var deployOptions = self.options.deployment;
	if (!deployOptions.from) {
		self.options.deployment.from = accounts[0];
	}
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

Sracle.prototype.getClient = function() {
	var self = this;
	return new Promise(resolve => {
		self.web3.currentProvider.send({
			method: "web3_clientVersion",
			params: [],
			jsonrpc: "2.0",
			id: "1"
		}, (err, result) => {
			if (result.result.includes('Parity')) {
				resolve('parity');
			} else if ((result.result.includes('Mist')) || (result.result.includes('Geth'))) {
				resolve('geth');
			} else resolve(result.result);
		});
	});
}

Sracle.prototype.calculateGasPrice = function() {
	var self = this;
	return new Promise(function(resolve, reject) {
		if (self.options.pricing.type == 'ethgasstation') {
			self.getGasPriceFromEthgasstation().then(gasPrice => {
				resolve(self.web3.utils.toWei(gasPrice, "gwei"));
			});
		} else if (self.options.pricing.type == 'fixed') {
			resolve(self.options.pricing.value);
		}
	});
}

Sracle.prototype.getGasPriceFromEthgasstation = function() {
	var self = this;
	return new Promise(function(resolve, reject) {
		request('https://ethgasstation.info/', function (error, response, body) {
			if (error) {
				self.logger.error(error);
				throw error;
			}
			if ((response.statusCode < 200) || (response.statusCode >= 300)) {
				reject('HTTP status code of EthGasStation response is not 200');
			}
			//TODO This is too fragile
			var css = '';
			if ((!self.options.pricing.options) || (self.options.pricing.options == 'standard')) {
				css = 'div.right_col > div.row.tile_count > div.col-md-2.col-sm-4.col-xs-6.tile_stats_count:nth-child(2) > div.count';
			} else if (self.options.pricing.options == 'low') {
				css = 'div.right_col > div.row.tile_count > div.col-md-2.col-sm-4.col-xs-6.tile_stats_count:nth-child(4) > div.count';
			} else {
				reject(new Error('Bad pricing option: ' + self.options.pricing.options));
			}
			var $ = cheerio.load(body);
			var text = "";
			try {
				text = $(css).text();
			} catch(e) {
				reject(e);
			}
			if (!text.match('^[0-9]+\.?[0-9]*$')) {
				reject(new Error('Did not get a number from EthGasStation'));
			}
			resolve(text);
		});
	});
}

Sracle.prototype.getOrigin = function(client, transactionHash) {
	var self = this;
	if (client === 'parity') {
		return new Promise(resolve => {
			self.web3.currentProvider.send({
				method: "trace_replayTransaction",
				params: [transactionHash, ['trace']],
				jsonrpc: "2.0",
				id: "2"
			}, function (err, result) {
				self.logger.trace('Transaction trace: ' + result);
				if (err) throw err;
				if ((!result.result.trace) || (result.result.trace.length < 1) || (!result.result.trace[0].action)) {
					throw new Error('Cannot get last contract from trace');
				}
				resolve(result.result.trace[result.result.trace.length - 1].action.from);
			});	
		});
	} else if (client === 'geth')  {
		self.web3.currentProvider.send({
			method: "debug_traceTransaction",
			params: [transactionHash, {}],
			jsonrpc: "2.0",
			id: "5"
		}, function (err, result) {
			console.log(result);
		});
	} else {
		throw new Error('Unsupported client: ' + client);
	}
}

Sracle.prototype.setUp = async function() {
	var self = this;
	//TODO online compile from contracts/UsingSracle.sol
	this.SracleContract.events.SracleQuery({
		fromBlock: await self.web3.eth.getBlockNumber()
	}, function(error, event) {
		if (!error) {
			self.performQuery(event);
		} else {
			self.logger.error(error);
		}
	});
}

Sracle.prototype.checkCSS = function(css) {
	var result = cssLint.CSSLint.verify(css + '{}');
	var errorCode = 0;
	for (let i = 0;i < result.messages.length;i++) {
		if (result.messages[i].type == 'error') {
			errorCode += 1;
		}
	};
	return {
		'errorCode' : errorCode,
		'messages': result.messages
	};
}

Sracle.prototype.cssQuery = function (url, css) {
	var self = this;
	this.logger.debug("CSS: " + css);
	return new Promise(function(resolve, reject) {
		request(url, function (error, response, body) {
			if (error) {
				self.logger.error(error);
			}
			//TODO support probably most redirects
			if ((response.statusCode < 200) || (response.statusCode >= 300)) {
				reject('HTTP status code of response is not 200');
			}
			var $ = cheerio.load(body);
			//TODO input checking
			var text = "";
			try {
				text = $(css).text();
			} catch(e) {
				reject(e);
			}
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
	var origin = event.returnValues.origin;
	this.logger.debug("Received param " + param);
	var transaction = await this.web3.eth.getTransaction(event.transactionHash);
	var requiredGas = await this.calculateGasPrice() * await this.UsingSracleContract.methods.sracleAnswer('', 0).estimateGas();
	if (transaction.value < requiredGas) {
		this.logger.warn('No action because transaction value received (' + transaction.value + ') is below the required value (' + requiredGas + ')');
		return;
	}
	var sender = transaction.from;
	this.logger.debug("Initial sender: " + sender + ", value: " + transaction.value);
	var cssPos = param.indexOf("///");
	if (cssPos < 0) {
		throw new Error('CSS after /// not found in query');
	}
	var url = param.substring(0, cssPos);
	this.logger.debug("URL: " + url);
	var css = param.substring(cssPos+3, param.length);
	var flags = 0;
	var text = "";
	try {
		text = await this.cssQuery(url, css);
	} catch(e) {
		flags = 1;
	}
	var client = await this.getClient();
	//var origin = await this.getOrigin(client, transaction.hash);
	var UsingSracleContract = new this.web3.eth.Contract(this.interfaceAbi, origin);
	UsingSracleContract.methods.sracleAnswer(text, flags).send(this.options.deployment);
	this.logger.debug(UsingSracleContract);
}

module.exports = Sracle;
