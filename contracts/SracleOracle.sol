pragma solidity ^0.4.7;

contract SracleOracle {

function query(string param) 
    payable 
{
    SracleQuery(param);
}

event SracleQuery(string param);

}
