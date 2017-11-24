//The oracle callback
//To be inherited and implemented in the calling contract
pragma solidity ^0.4.11;

contract UsingSracle {

    function sracleAnswer (string answer, uint flags) external;

}

