var SracleOracle = artifacts.require("Sracle.sol");
var SracleTest = artifacts.require("SracleTest.sol");

module.exports = function(deployer) {
  deployer.deploy(SracleOracle);
  deployer.deploy(SracleTest);
};
