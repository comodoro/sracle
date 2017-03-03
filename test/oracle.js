if (typeof web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else {
  var Web3 = require('web3');
  // set the provider you want from Web3.providers
  web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}
describe('Sracle', function() {
  describe('start', function() {
    it('should deploy without error', function(done) {
      var sracleoracle_sol_sracleoracleContract = web3.eth.contract([{"constant":false,"inputs":[{"name":"param","type":"string"}],"name":"query","outputs":[],"payable":true,"type":"function"},{"anonymous":false,"inputs":[{"indexed":false,"name":"param","type":"string"}],"name":"SracleQuery","type":"event"}]);
var sracleoracle_sol_sracleoracle = sracleoracle_sol_sracleoracleContract.new(
   {
     from: web3.eth.accounts[0], 
     data: '0x6060604052341561000c57fe5b5b6101678061001c6000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff1680637c2619291461003b575bfe5b61008b600480803590602001908201803590602001908080601f0160208091040260200160405190810160405280939291908181526020018383808284378201915050505050509190505061008d565b005b7faf809863137f7864a853025a7c4f284400c84f1803830d88ecc050c43e4072448160405180806020018281038252838181518152602001915080519060200190808383600083146100fe575b8051825260208311156100fe576020820191506020810190506020830392506100da565b505050905090810190601f16801561012a5780820380516001836020036101000a031916815260200191505b509250505060405180910390a15b505600a165627a7a72305820894a08e92f883583eaecf497c0c85d4eabfec0fa0eb991af860975d215951a2b0029', 
     gas: '4700000'
   }, function (e, contract){
    console.log(e, contract);
    if (typeof contract.address !== 'undefined') {
         done();
    } else {
         done(e);
    }
 });
    });
  });
});