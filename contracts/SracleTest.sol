//Test contract
//A very simple test
pragma solidity ^0.4.7;

import "./Sracle.sol";
import "./UsingSracle.sol";

contract SracleTest is UsingSracle {

	function test(address sracleAddress) payable {
		Sracle(sracleAddress).query.value(msg.value)("https://en.wikipedia.org/wiki/Boii///#mw-content-text/p[1]"); 
	}

	function sracleAnswer(string answer, uint flags) {
		TestEvent(answer);
	}

	event TestEvent(string param);
}
