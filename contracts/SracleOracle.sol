//The actual oracle smart contract
//To be instantiated on the blockchain
pragma solidity ^0.4.11;

contract SracleOracle {

    function cssQuery(string param) 
        external payable 
    {
        SracleQuery(param);
    }

    event SracleQuery(string param);

}
