// A resolver (upgrading facility) generally violates a desirable
// property of Ethereum contracts: immutability. However, an oracle
// itself is mutable, at least as of now, so it does not matter.

pragma solidity ^0.4.19;

contract SracleResolver {
    address owner;
    mapping(uint => address) allOracles;
    uint public lastVersion;

    function  SracleResolver(address _owner) public {
        owner = _owner;
    }

    function addVersion(uint version, address oracle) public {
        require(msg.sender == owner);
        allOracles[version] = oracle;
    }

    function setLastVersion(uint _lastVersion) public {
        require(msg.sender == owner);
        lastVersion = _lastVersion;
    }

    function getOracle(uint version) public view returns (address) {
        return allOracles[version];
    }

    function getLastOracle() public view returns (address) {
        return allOracles[lastVersion];
    }
}