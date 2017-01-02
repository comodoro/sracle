if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  var Web3 = require('web3');
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var fs = require('fs');
var util = require('util');
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
	var tx = web3.eth.getTransaction(txhash);
	var value = web3.fromWei(tx.value, 'ether');
	var origin = tx.from;
	console.log("Origin: " + origin + ", value: " + value);
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


var amount = web3.toWei(0.01, "ether")

var i = 1;

function tick() {
	console.log("tick " + i);
//	console.log(SracleContract);
	SracleContract.query("Query " + i, {from: web3.eth.coinbase, value: amount});
	i++;
}

setInterval(tick, 10000);
