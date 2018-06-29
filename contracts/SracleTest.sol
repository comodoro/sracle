//Test contract
//A very simple test
pragma solidity ^0.4.19;

contract UsingSracle {

    function sracleAnswer (string answer, uint flags) external;

}

contract Sracle {

    function query(string queryCode, string param) external payable;

}

contract SracleTest is UsingSracle {

	address sracleAddress;
	address sracleCallbackAddress;

	constructor(address _sracleAddress, address _sracleCallbackAddress) public {
		sracleAddress = _sracleAddress;
		sracleCallbackAddress = _sracleCallbackAddress;
	}

	modifier onlySracle() {
		require(msg.sender == sracleCallbackAddress);
		_;
	}

	string answer;

	function testValidCSS() external payable {
		Sracle(sracleAddress).query.value(msg.value)("css", "https://en.wikipedia.org/wiki/Boii///title"); 
	}

	function testInvalidCSS() external payable {
		Sracle(sracleAddress).query.value(msg.value)("css", "https://en.wikipedia.org/wiki/Boii///mandra _ gora ."); 
	}

	function testInvalidProtocolCSS() external payable {
		Sracle(sracleAddress).query.value(msg.value)("css", "bitcoin://en.wikipedia.org/wiki/Boii///mandra _ gora ."); 
	}

	function testInvalidSeparatorCSS() external payable {
		Sracle(sracleAddress).query.value(msg.value)("css", "https://en.wikipedia.org/wiki/Boii//mandra _ gora ."); 
	}

	function sracleAnswer(string _answer, uint _flags) external onlySracle {
		answer = _answer;
		if (_flags != 0) {
			emit ErrorEvent(answer);
		} else {
			emit TestEvent(answer);
		}
	}

	event TestEvent(string param);
	event ErrorEvent(string param);
}
