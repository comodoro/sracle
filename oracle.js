
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  var Web3 = require('web3');
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var path = require('path');
var sracle = require(path.join(__dirname, 'oracle.js')).Sracle;

var SracleTest = require('./build/contracts/SracleTest.sol.js');
SracleTest.setProvider(web3.currentProvider);
var SracleTestContract = SracleTest.deployed();


var i = 1;
var amount = web3.toWei(0.01, "ether")


function tick() {
	console.log("tick " + i);
//	console.log(SracleContract);
	//SracleTestContract.test({from: web3.eth.coinbase, value: amount});
	i++;
}

setInterval(tick, 1000);
