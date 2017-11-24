//Test contract
//A very simple test
pragma solidity ^0.4.11;

contract UsingSracle {

    function sracleAnswer (string answer, uint flags) external;

}

contract Sracle {

    function cssQuery(string param) external payable;

}

contract SracleTest is UsingSracle {

	function test(address sracleAddress) external payable {
		Sracle(sracleAddress).cssQuery.value(msg.value)("https://en.wikipedia.org/wiki/Boii///#mw-content-text > p[1]"); 
	}

	function sracleAnswer(string answer, uint flags) external {
		if (flags != 0) {
			ErrorEvent(answer);
		} else {
			TestEvent(answer);
		}
	}

	event TestEvent(string param);
	event ErrorEvent(string param);
}
