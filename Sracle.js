'use strict';

var Web3 = require('web3');
var web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');


var request = require('request');
var cheerio = require('cheerio');
  
function Sracle (existingAddress) {

	var self = this;
	this.UsingSracle = {};
	var abi = [{"constant":false,"inputs":[{"name":"param","type":"string"}],"name":"query","outputs":[],"payable":true,"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"param","type":"string"}],"name":"SracleQuery","type":"event"}];
	
	if (existingAddress !== 'undefined') {
		this.SracleContract = new web3.eth.Contract(abi, existingAddress);
	}
}

Sracle.prototype.deploy = function(error, result) {
	var self = this;
	var contract = new web3.eth.Contract(abi);
	contract.deploy({
		data: '0x6060604052341561000c57fe5b5b6101678061001c6000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680637c2619291461003b575bfe5b61008b600480803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190505061008d565b005b7faf809863137f7864a853025a7c4f284400c84f1803830d88ecc050c43e4072448160405180806020018281038252838181518152602001915080519060200190808383600083146100fe575b8051825260208311156100fe576020820191506020810190506020830392506100da565b505050905090810190601f16801561012a5780820380516001836020036101000a031916815260200191505b509250505060405180910390a15b505600a165627a7a723058200909502a39d8a35f0ed9ca68f1c27d9d9cef01942698c1451febe8316ddf3c590029', 
	})
	.send({
		from: web3.eth.accounts.wallet[0],
		gas: 1500000,
		gasPrice: '30000000000000'
	})
	.on('error', function(error) {
		console.log("Oops: " + error.message);
	})
	.on('transactionHash', function(transactionHash){ 
		console.log(transactionHash);
	})
	.on('receipt', function(receipt){
	console.log(receipt.contractAddress) // contains the new contract address
	})
	.on('confirmation', function(confirmationNumber, receipt){ 
		console.log(confirmationNumber);
	})
	.then(function(newContractInstance){
		self.SracleContract = newContractInstance;
		console.log(newContractInstance.options.address) // instance with the new contract address
	});
};	

Sracle.prototype.init = function() {

	var callbackAbi = [{"constant":false,"inputs":[{"name":"answer","type":"string"},{"name":"flags","type":"uint256"}],"name":"sracleAnswer","outputs":[],"payable":false,"type":"function"}];
	this.UsingSracle = new web3.eth.Contract(callbackAbi);

	this.SracleContract.events.SracleQuery({
		fromBlock: web3.eth.getBlockNumber().then(function(result) {
			return result;
		  })
		}, function(event) {
		    this.performQuery(event);
	});
}

Sracle.prototype.performQuery = function (event) {
	console.log("Sracle performQuery");
	console.log(param);
	web3.eth.getTransaction(event.transactionHash)
	.then(function(transaction) {
		var value = web3.utils.fromWei(transaction.value, 'ether');
		var origin = transaction.from;
		console.log("Origin: " + origin + ", value: " + value);
		var cssPos = param.indexOf("///");
		var url = param.substring(0, cssPos);
		console.log("URL: " + url);
		var css = param.substring(cssPos+3, param.length);
		console.log("CSS: " + css);
		request(url, function (error, response, body) {
			console.log(error);
			 if (!error && response.statusCode == 200) {
				var $ = cheerio.load(body);
				var text = $(".r").text();
				var UsingSracleContract = new web3.eth.Contract(origin);
				console.log(UsingSracleContract);
				UsingSracleContract.sracleAnswer(text,  {from: web3.eth.accounts.wallet[0]});
				console.log(text);
			}
		});	
	});
}

module.exports = Sracle;
