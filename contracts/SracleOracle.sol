//The actual oracle smart contract
//To be instantiated on the blockchain
pragma solidity ^0.4.19;

contract SracleOracle {

    address public callbackAddress;

    function SracleOracle(address _callbackAddress) public {
        callbackAddress = _callbackAddress;
    }

    function cssQuery(string param) 
        external payable 
    {
        SracleQuery(param, msg.sender);
    }

    event SracleQuery(string param, address origin);

}
