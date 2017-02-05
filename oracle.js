
if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  var Web3 = require('web3');
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var path = require('path');
var sracle = require('./Sracle');
console.log(sracle);


s = new sracle();
//needs to be delayed even for testrpc, more on blockchain
setTimeout(function () {
	s.init();
}, 1000);

var i = 1;
var amount = web3.toWei(0.01, "ether")


function tick() {
	console.log("tick " + i);
	i++;
}

setInterval(tick, 1000);
