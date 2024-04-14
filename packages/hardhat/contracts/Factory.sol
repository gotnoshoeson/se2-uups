//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "./YourContract.sol";

contract Factory {

	address[] public proxyList;
	address public implementation;

	event NewContract(address contractAddress, address creator);
	

	constructor (address _implementation)  {
		implementation = _implementation;
	}

	function createProxy() public returns(address) {
		ERC1967Proxy proxy = new ERC1967Proxy(implementation,
			abi.encodeWithSelector(YourContract.initialize.selector,msg.sender)
		);
		proxyList.push(address(proxy));
		return address(proxy);
		emit NewContract(address(proxy), msg.sender);
	}

	function readProxyList() public view returns (address[] memory) {
		address[] memory result = new address[](proxyList.length);
		for (uint256 i = 0; i < proxyList.length; i++){
			result[i] = proxyList[i];
		}
		return result;
	}

}
