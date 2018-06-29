'use strict';

var request = require('request');
var cheerio = require('cheerio');
var Log4js = require('log4js');
var fs = require('fs');
//May not be the best tool for the job

class Sracle {

	constructor(web3, customOptions) {
		if (web3 === undefined) {
			var Web3 = require('web3');
			web3 = new Web3('ws://localhost:8546');
		}
		this.web3 = web3;
		this.queryListener = null;
		//TODO async init method, recompile contracts
		this.interfaceAbi = [
			{
				"constant": false,
				"inputs": [
					{
						"name": "answer",
						"type": "string"
					},
					{
						"name": "flags",
						"type": "uint256"
					}
				],
				"name": "sracleAnswer",
				"outputs": [],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "function"
			}
		];
		this.UsingSracleContract = new this.web3.eth.Contract(this.interfaceAbi, '0x00a329c0648769a73afac7f9381e08fb43dbea72');
		this.fullOracleAbi = [
			{
				"constant": true,
				"inputs": [],
				"name": "callbackAddress",
				"outputs": [
					{
						"name": "",
						"type": "address"
					}
				],
				"payable": false,
				"stateMutability": "view",
				"type": "function"
			},
			{
				"constant": false,
				"inputs": [
					{
						"name": "param",
						"type": "string"
					}
				],
				"name": "cssQuery",
				"outputs": [],
				"payable": true,
				"stateMutability": "payable",
				"type": "function"
			},
			{
				"inputs": [
					{
						"name": "_callbackAddress",
						"type": "address"
					}
				],
				"payable": false,
				"stateMutability": "nonpayable",
				"type": "constructor"
			},
			{
				"anonymous": false,
				"inputs": [
					{
						"indexed": false,
						"name": "param",
						"type": "string"
					},
					{
						"indexed": false,
						"name": "origin",
						"type": "address"
					}
				],
				"name": "SracleQuery",
				"type": "event"
			}
		];
		//always read default options
		var options = this.getDefaultOptions();
		this._checkOptions(options);
		this.options = options;
		Object.assign(this.options, customOptions);
		this.SracleContract = new web3.eth.Contract(this.fullOracleAbi, this.options.existingAddress);
		Log4js.configure(this.options.logging);	
		this.logger = Log4js.getLogger();
		//at least somehow handle unhandled rejections and exceptions
		process.on('unhandledRejection', (reason, p) => {
			throw reason;
		});
		process.on('uncaughtException', (error) => {
			this.logger.error(error);
		});	
		this._initModules();
	}

	_initModules() {
		for (module in this.options.modules) {
			module =  this.options.modules[module];
			if (module.active) {
				try {
					module.value = new (require('./' + module.filename));
				} catch (err) {
					module.active = false;
					this.logger.error(err);
				}	
			}
		}
	}

    _checkOptions (options) {
		if (!options.deployment.existingDeployment) {
			options.deployment.existingDeployment = {};
		}
		if (!options.deployment.newDeployment) {
			throw new Error('New deployment options not found');
		}
		if (!options.logging) {
			throw new Error('Logging options not found');
		} 
		if (!options.modules) {
			throw new Error('Modules options not found');
		}
		
	}

	getDefaultOptions () {
		var data = fs.readFileSync('sracle.options', 'utf8');
		return JSON.parse(data);
	}

	async compile (contractFile) {
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
	async deploy () {
		var self = this;
		self.logger.trace('Deploying');
		var accounts = await this.web3.eth.getAccounts();
		if (accounts.length < 1) {
			throw new Error("No accounts found");
		}
		var deployOptions = self.options.deployment;
		if (!deployOptions.newDeployment.from) {
			self.options.deployment.newDeployment.from = accounts[0];
		}
		
		var sracleCompileResult = await self.compile('./contracts/SracleOracle.sol');
		var compiledSracle =  sracleCompileResult[':SracleOracle'];
		var contract = new this.web3.eth.Contract(JSON.parse(compiledSracle.interface));
		self.SracleContract = await contract.deploy({
			data: '0x' + compiledSracle.bytecode,
			arguments: [self.options.deployment.newDeployment.from]
		})
		.send(deployOptions.newDeployment)
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
		self.logger.info("Deployed at " + self.SracleContract.address);
		//TODO current web3 1.0 beta hack
		self.SracleContract.setProvider(self.web3.eth.currentProvider);
		self.options.deployment.existingDeployment.address = self.SracleContract.options.address;
		var resolverContract;
		//compile all the time or store the ABI
		var resolverCompileResult = await self.compile('./contracts/SracleResolver.sol');
		var compiledResolver =  resolverCompileResult[':SracleResolver'];
		if (!self.options.deployment.existingDeployment.resolver) {
			resolverContract = new this.web3.eth.Contract(JSON.parse(compiledResolver.interface));
			var sracleResolver = await resolverContract.deploy({
				data: '0x' + compiledResolver.bytecode,
				arguments: [self.options.deployment.newDeployment.from]
			})
			.send(deployOptions.newDeployment)
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
			self.options.deployment.existingDeployment.resolver = sracleResolver.options.address;
		}
		
		self.options.deployment.existingDeployment.version = self.options.deployment.existingDeployment.version || 0 + 1;
		var resolver = new this.web3.eth.Contract(
			JSON.parse(compiledResolver.interface),
			self.options.deployment.existingDeployment.resolver
		);
		//resolver.setProvíder(this.web3.currentProvider);
		await resolver.methods.addVersion(
			self.options.deployment.existingDeployment.version, 
			self.SracleContract.options.address
		)
		.send(self.options.deployment.newDeployment
		)
		.on('error', function(error) {
			throw error;
		})
		.on('transactionHash', function(transactionHash){
			self.logger.debug("Txhash: " + transactionHash);
		})
		.on('confirmation', function(confirmationNumber, receipt){ 
			self.logger.debug(confirmationNumber);
		});
	}	

	getClient () {
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

	calculateGasPrice (pricingType) {
		var self = this;
		return new Promise(function(resolve, reject) {
			if (self.options.pricing[pricingType].type == 'ethgasstation') {
				self.getGasPriceFromEthgasstation().then(gasPrice => {
					resolve(self.web3.utils.toWei(gasPrice, "gwei"));
				});
			} else if (self.options.pricing[pricingType].type == 'fixed') {
				resolve(self.options.pricing[pricingType].value);
			}
		});
	}

	getGasPriceFromEthgasstation () {
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
				if ((!self.options.pricing.query) || (self.options.pricing.query.options == 'standard')) {
					css = 'div.right_col > div.row.tile_count > div.col-md-2.col-sm-4.col-xs-6.tile_stats_count:nth-child(2) > div.count';
				} else if (self.options.pricing.query.options == 'low') {
					css = 'div.right_col > div.row.tile_count > div.col-md-2.col-sm-4.col-xs-6.tile_stats_count:nth-child(4) > div.count';
				} else {
					reject(new Error('Bad pricing option: ' + self.options.pricing));
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

	stopListening () {
		if (this.queryListener) {
			this.queryListener.unsubscribe();
		}
	}

	async startListening () {
		var self = this;
		if (!this.options.deployment.newDeployment.from) {
			var accounts = await this.web3.eth.getAccounts();
			this.web3.eth.defaultAccount = accounts[0];
			this.options.deployment.newDeployment.from = accounts[0];
		}
		//if (this.queryListener) this.queryListener.subscribe();
		this.queryListener = this.SracleContract.events.SracleQuery({
			fromBlock: await self.web3.eth.getBlockNumber()
		}, function(error, event) {
			if (!error) {
				self.processQuery(event);
			} else {
				self.logger.error(error);
			}
		})
		.on('data', function(event){
			self.logger.debug(`Received event ${event}`); // same results as the optional callback above
		})
		.on('changed', function(event){
			self.logger.debug('Contract events removed from blockchain');
			self.stopListening();
		});
	}

	isListening () {
		return Boolean(this.queryListener._events.data);
	}


	async processQuery (event) {
		this.logger.trace("Sracle.performQuery");
		if (!this.isListening()) return;
		var queryCode = event.returnValues.queryCode;
		if (this.options.modules[queryCode]) {
			if (!this.options.modules[queryCode].active) {
				logger.error(`Query to inactive module ${queryCode} received`);
				return;
			}
		} else {
			logger.error(`Query to nonexisting module ${queryCode} received`);
			return;
		}
		var param = event.returnValues.param;
		var origin = event.returnValues.origin;
		this.logger.debug("Received param " + param);
		var transaction = await this.web3.eth.getTransaction(event.transactionHash);
		var pricingType = 'query';
		var requiredGas = await this.calculateGasPrice(pricingType) * await this.UsingSracleContract.methods.sracleAnswer('', 0).estimateGas();
		if (transaction.value < requiredGas) {
			this.logger.warn(`No action because transaction value received (${transaction.value}) is below the required value (${requiredGas})`);
			return;
		}
		var sender = transaction.from;
		this.logger.debug("Initial sender: " + sender + ", value: " + transaction.value);
		var UsingSracleContract = new this.web3.eth.Contract(this.interfaceAbi, origin);
		var wholeAnswer = await this.options.modules[queryCode].value.handleQuery(param);
		UsingSracleContract.methods.sracleAnswer(wholeAnswer.answer, wholeAnswer.flags).send(this.options.deployment.newDeployment);
		this.logger.debug(`Sent answer ${wholeAnswer.answer} to ${origin}`);

	}
}
module.exports = Sracle;
