
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  var Web3 = require('web3');
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var path = require('path');
var contract = require("truffle-contract");
var sracle = require(path.join(__dirname, 'Sracle.js')).Sracle;

var SracleTestJSON = require('./build/contracts/SracleTest.json');
var SracleTest = contract(SracleTestJSON);
SracleTest.setProvider(web3.currentProvider);
var SracleTestContract = SracleTest.deployed();


var i = 1;
var amount = web3.toWei(0.01, "ether")


function tick() {
	console.log("tick " + i);
	SracleTestContract.test({from: web3.eth.coinbase, value: amount});
	i++;
}

setInterval(tick, 1000);
