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

	string answer;

	function test(address sracleAddress) external payable {
		Sracle(sracleAddress).cssQuery.value(msg.value)("https://en.wikipedia.org/wiki/Boii///title"); 
	}

	function sracleAnswer(string _answer, uint _flags) external {
		answer = _answer;
		if (_flags != 0) {
			ErrorEvent(answer);
		} else {
			TestEvent(answer);
		}
	}

	event TestEvent(string param);
	event ErrorEvent(string param);
}
