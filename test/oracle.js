if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  var Web3 = require('web3');
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}
var sracle = require('../Sracle');
describe('Sracle', function() {
  describe('start', function() {
    it('should deploy without error', function(done) {
      var s = new sracle();

setTimeout(function () {
	s.init();
}, 1000);
      done();
    });
  });
});