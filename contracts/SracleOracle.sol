//The actual oracle smart contract
//To be instantiated on the blockchain
pragma solidity ^0.4.11;

contract SracleOracle {

    function cssQuery(string param) 
        external payable 
    {
        SracleQuery(param, msg.sender);
    }

    event SracleQuery(string param, address origin);

}
