//The actual oracle smart contract
//To be instantiated on the blockchain
pragma solidity ^0.4.19;

contract SracleOracle {

    address public callbackAddress;

    constructor(address _callbackAddress) public {
        callbackAddress = _callbackAddress;
    }

    function query(string queryCode, string param) 
        external payable 
    {
        emit SracleQuery(queryCode, param, msg.sender);
    }

    event SracleQuery(string queryCode, string param, address origin);

}
