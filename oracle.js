var Web3 = require('web3');
web3 = new Web3(Web3.givenProvider || 'http://localhost:8545');

var sracle = (new require('./Sracle'));

function tick() {

}

sracle.deploy()
.then(function(result, error){
  return result.setUp();
})
.then(function(result, error){
  setInterval(tick, 1000);
});
