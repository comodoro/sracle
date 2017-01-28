if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  var Web3 = require('web3');
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

var SracleOracle = require('../build/contracts/SracleOracle.sol.js');
SracleOracle.setProvider(web3.currentProvider);

describe('SracleOracle', function(accounts) {
  it("should fail without value", function(done) {
    var oracle = SracleOracle.deployed();
	var events = oracle.allEvents();
    oracle.query("something", {from: web3.eth.coinbase, value: web3.toWei(0, 'ether')}).then(new Promise(
      function(resolve, reject){
        events.watch(function(error, log){ resolve(log, done); });
    })).then(done);
  });
});
