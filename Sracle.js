'use strict';

if (typeof web3 !== 'undefined') {
	  var Web3 = require('web3');
	  web3 = new Web3(web3.currentProvider);
} else {
  var Web3 = require('web3');
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var fs = require('fs');
var util = require('util');
var request = require('request');
var cheerio = require('cheerio');
  
function Sracle () {

/*
 * var logFile = fs.createWriteStream('log.txt', { flags: 'a' }); var logStdout =
 * process.stdout;
 * 
 * console.log = function () { logFile.write(util.format.apply(null, arguments) +
 * '\n'); logStdout.write(util.format.apply(null, arguments) + '\n'); }
 * 
 * console.error = console.log;
 */

	this.UsingSracle = {};
	this.QueryEvent = {};
	
	var c = web3.eth.contract([{"constant":false,"inputs":[{"name":"param","type":"string"}],"name":"query","outputs":[],"payable":true,"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"param","type":"string"}],"name":"SracleQuery","type":"event"}]);
	this.SracleContract = c.new(
			{
				from: web3.eth.accounts[0], 
				data: '0x6060604052341561000c57fe5b5b6101678061001c6000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680637c2619291461003b575bfe5b61008b600480803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190505061008d565b005b7faf809863137f7864a853025a7c4f284400c84f1803830d88ecc050c43e4072448160405180806020018281038252838181518152602001915080519060200190808383600083146100fe575b8051825260208311156100fe576020820191506020810190506020830392506100da565b505050905090810190601f16801561012a5780820380516001836020036101000a031916815260200191505b509250505060405180910390a15b505600a165627a7a723058200909502a39d8a35f0ed9ca68f1c27d9d9cef01942698c1451febe8316ddf3c590029', 
				gas: '4700000'
			}, function (e, contract){
				if (e) {
					console.log(e);
				}
				console.log(e, contract);
				if (typeof contract.address !== 'undefined') {
					console.log('Contract mined! address: ' + contract.address + ' transactionHash: ' + contract.transactionHash);
				} else {
					console.log("Oops");
				}
			});
}


Sracle.prototype.init = function() {

	        // e.g. check tx hash on the first call (transaction send)
       if(!this.SracleContract.address) {
           console.log(this.SracleContract.transactionHash) // The hash of the transaction, which deploys the contract
       // check address on the second call (contract deployed)
       } else {
           console.log(this.SracleContract.address) // the contract address
       }

	var callbackAbi = [{"constant":false,"inputs":[{"name":"answer","type":"string"},{"name":"flags","type":"uint256"}],"name":"sracleAnswer","outputs":[],"payable":false,"type":"function"}];
	this.UsingSracle = web3.eth.contract(callbackAbi);

	this.QueryEvent = this.SracleContract.SracleQuery({}, {fromBlock: 'latest' , toBlock: 'latest'});

	this.QueryEvent.watch(function(error, result){
		if (!error){
			console.log("Sracle watch");
			// console.log(result);
			var txhash = result.transactionHash;
			var type = result.type;
			var param = result.args.param;
			if (type == 'mined') {
				this.performQuery(txhash, param);
			}
		}
		else{console.log("Error in watch: "+error);}
	});

	console.log("Sracle init");
}

Sracle.prototype.performQuery = function (txhash, param) {
	console.log("Sracle performQuery");
	console.log(param);
	var tx = web3.eth.getTransaction(txhash);
	var value = web3.fromWei(tx.value, 'ether');
	var origin = tx.from;
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
			// console.log("Body: " + body);
			// console.log("$: " + $);
			var text = $(".r").text();
			var UsingSracleContract = this.UsingSracle.at(origin);
			console.log(UsingSracleContract);
			UsingSracleContract.sracleAnswer(text,  {from: web3.eth.coinbase});
			console.log(text);
		}
	});
}

module.exports = Sracle;
