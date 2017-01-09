//Test contract
//A very simple test
pragma solidity ^0.4.7;

import "./Sracle.sol";
import "./UsingSracle.sol";

contract SracleTest is UsingSracle {

	function test(address sracleAddress) {
		Sracle sracle = Sracle(sracleAddress);
		sracle.query("http://www.google.com/search?q=dungbeetle///.rc[1]"); 
	}

	function SracleAnswer(string answer) {
		TestEvent(answer);
	}

	event TestEvent(string param);
}
