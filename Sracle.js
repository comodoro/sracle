(function (global) {
  'use strict';
  global.Sracle = (function () {

if (typeof web3 !== 'undefined') {
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
/*var logFile = fs.createWriteStream('log.txt', { flags: 'a' });
var logStdout = process.stdout;

console.log = function () {
  logFile.write(util.format.apply(null, arguments) + '\n');
  logStdout.write(util.format.apply(null, arguments) + '\n');
}

console.error = console.log;
*/
var SracleOracle = require('./build/contracts/SracleOracle.sol.js');
SracleOracle.setProvider(web3.currentProvider);
var UsingSracle = require('./build/contracts/UsingSracle.sol.js');
UsingSracle.setProvider(web3.currentProvider);
var SracleContract = SracleOracle.deployed();
/*
var abi = [
      {
        "constant": false,
        "inputs": [
          {
            "name": "param",
            "type": "string"
          }
        ],
        "name": "query",
        "outputs": [],
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {
            "indexed": false,
            "name": "param",
            "type": "string"
          }
        ],
        "name": "SracleQuery",
        "type": "event"
      }
    ];

var SracleContract = web3.eth.contract(abi).at("0xf4866601f983988af8fc6edbc69447a2e4e244cb");
*/
var QueryEvent = SracleContract.SracleQuery({}, {fromBlock: 'latest' , toBlock: 'latest'});	/// replace with an anchor block for stability later


function performQuery(txhash,param) {
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
			//console.log("Body: " + body);
			//console.log("$: " +  $);
			var text = $(".r").text();
			var UsingSracleContract = UsingSracle.at(origin);
			console.log(UsingSracleContract);
			UsingSracleContract.sracleAnswer(text,  {from: web3.eth.coinbase});
			console.log(text);
		}
	});
}

QueryEvent.watch(function(error, result){
	if (!error){
		console.log("Sracle watch");
		//console.log(result);
		var txhash = result.transactionHash;
		var type = result.type;
		var param = result.args.param;
		if (type == 'mined') {
			performQuery(txhash, param);
		}
	}
	else{console.log("Error in watch: "+error);}
});



})();
})(this);
