'use strict';

var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');
var request = require('request');
var cheerio = require('cheerio');
var log4js = require('log4js');

function Sracle (existingAddress, logging) {

	var self = this;
	this.UsingSracle = {};
	//TODO online compile from conracts/
	this.abi = [{"constant":false,"inputs":[{"name":"param","type":"string"}],"name":"query","outputs":[],"payable":true,"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"param","type":"string"}],"name":"SracleQuery","type":"event"}];
	if (existingAddress !== 'undefined') {
		this.SracleContract = new web3.eth.Contract(this.abi, existingAddress);
	}
	if (logging) {
		log4js.configure({
			appenders: { app: { type: 'file', filename: 'sracle.log' } },
			categories: { default: { appenders: ['app'], level:logging.level } }
		  });
	}
	this.logger = log4js.getLogger();
}

//TODO add requested confirmations parameter
Sracle.prototype.deploy = function() {
	var self = this;
	var contract = new web3.eth.Contract(this.abi);
	return new Promise(function(resolve, reject) {
		web3.eth.getAccounts().then(function(accounts) {
			if (accounts.length < 1) {
				return reject(new Error("No accounts found"));
			}
			contract.deploy({
				//TODO online compile from conracts/
				data: '0x6060604052341561000c57fe5b5b6101678061001c6000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680637c2619291461003b575bfe5b61008b600480803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190505061008d565b005b7faf809863137f7864a853025a7c4f284400c84f1803830d88ecc050c43e4072448160405180806020018281038252838181518152602001915080519060200190808383600083146100fe575b8051825260208311156100fe576020820191506020810190506020830392506100da565b505050905090810190601f16801561012a5780820380516001836020036101000a031916815260200191505b509250505060405180910390a15b505600a165627a7a723058200909502a39d8a35f0ed9ca68f1c27d9d9cef01942698c1451febe8316ddf3c590029', 
			})
			.send({
				//TODO choosable options
				from: accounts[0],
				gas: 1500000,
				gasPrice: '20000000'
			})
			.on('error', function(error) {
				self.logger.error("Oops: " + error.message);
				return reject(error);
			})
			.on('transactionHash', function(transactionHash){ 
				self.logger.debug("Txhash: " + transactionHash);
			})
			.on('receipt', function(receipt){
				self.logger.info(receipt.contractAddress) // contains the new contract address
			})
			.on('confirmation', function(confirmationNumber, receipt){ 
				self.logger.debug(confirmationNumber);
			})
			.then(function(newContractInstance){
				self.SracleContract = newContractInstance;
				self.logger.info("Deployed at " + newContractInstance.options.address) // instance with the new contract address
				return resolve(self.SracleContract);
			});
		});
	});
}	

Sracle.prototype.setUp = function() {
	var self = this;
	//TODO online compile from conracts/
	this.callbackAbi = [{"constant":false,"inputs":[{"name":"answer","type":"string"},{"name":"flags","type":"uint256"}],"name":"sracleAnswer","outputs":[],"payable":false,"type":"function"}];
	this.UsingSracle = new web3.eth.Contract(this.callbackAbi);
	return new Promise(function(resolve, reject) {
		self.SracleContract.events.SracleQuery({
			fromBlock: web3.eth.getBlockNumber().then(function(result) {
				return result;
			})
			}, function(error, event) {
				if (!error) {
					return resolve(self.performQuery(event));
				} else {
					return reject(error);
				}
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
			this.logger.debug("CSS: " + css);
			request(url, function (error, response, body) {
				if (error) {
					self.logger.error(error);
					reject(error);
				}
				//TODO support probably all 2xx and most redirects
				if (response.statusCode != 200) reject('HTTP status code of response is not 200');
				var $ = cheerio.load(body);
				//TODO input checking
				var text = $(css).text();
				self.logger.info('CSS found: >' + text + '<');
				var UsingSracleContract = new web3.eth.Contract(origin);
				this.logger.debug(UsingSracleContract);
				UsingSracleContract.sracleAnswer(text,  {from: web3.eth.accounts.wallet[0]});
				return resolve(self);
			});	
		});
	});
}

module.exports = Sracle;
