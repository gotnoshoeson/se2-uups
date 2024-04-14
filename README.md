# 🏗 Scaffold-ETH 2 - UUPS Pattern

#### TL;DR - Universal Upgradeable Proxy Standard

Why do this? Why should you care? Short answer is upgradeable smart contracts. "But smart contracts are supposed to be immutable, isn't that the whole point?" Have no fear, all of the proxy patterns that have been published by OpenZeppelin keep the immutable storage in tact and allow an admin (owner) to add additional functionality without changing the contract address that the users interact with. For example, you have a smart contract that has a function that increments a value (++1), but later you want the contract to also have a decrement function (--1). An upgradeable contract pattern will allow you to do that and keep the smart contract's address and storage data in tact. So depending on the smart contract use, this could be an acceptable set of terms for the users. When you're done upgrading, there is a mechanism to provably prevent future upgrades.

[Check out the Scaffold-Eth 2 docs and quickstart](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/README.md)

With that out of the way, onto the build!

## The build

** NOTE: This build is using OpenZeppelin v5.0 contracts. **

So why do this?

Contract upgradeability and proxy contracts. If you want to be able to deploy multiple instances of a smart contract and you want to reduce the cost of deployment. One main difference from the Transparent Upgradeable Proxy Standard is that proxy deployments are cheaper because the code to upgrade a proxy resides in the implementation contract, which is only deployed once. Also the Transparent Upgradeable Proxy Standard does NOT have a way to turn off upgradeability. 

We will start out with two smart contracts in this build:
  -1: YourContract.sol
  -2: Factory.sol

YourContract will be used as the implementation contract and Factory will be used as an on-chain way to deploy proxies of the implementation contract. All calls to the proxy contracts will be forwarded [delegatecall](https://solidity-by-example.org/delegatecall/) to the implementation contract that contains the contract logic. The storage will be maintained in the proxy contract.

1. If you followed the steps from the quick start, you can interact with YourContract and Factory on the typical Scaffold-Eth Debug page. When using a proxy standard, we can't use a constructor in the implementation contract and instead need to use an initialize() function and initializer modifier from the Initializer contract. This ensures that this constructor alternative is only called once. It's best practice to call this function in the deployment script but it's been left for you to implement and to highlight this difference from typical smart contracts. For now, you can call the initialize function from the Debug page by pasting a wallet address into the field and clicking 'Send'. Next, go ahead and choose the Factory contract and make a transaction with the 'createProxy' method. This will deploy a proxy contract on chain, the initialize function is being abi.encoded and called with the msg.sender so whoever creates a proxy is set as the owner on creation.

Create a few more proxy contracts so we can test them in our new page, Debug Proxies! (We need a separate page because the Debug interface is created from the ABI that is exported from hardhat when we run the 'yarn deploy' command, when we deploy contracts on chain, we don't get this functionality)

2. On the Debug Proxies page, select the contract you want to interact with by clicking on the 'Select Proxy Contract' dropdown menu. You should be seeing one or more error messages, this is okay.

![Screen Shot 2024-01-29 at 8 35 56 AM](https://github.com/scaffold-eth/scaffold-eth-2/assets/22818990/dc5b81ba-b212-4ef7-bb75-07cebfa0cca1)

![Screen Shot 2024-04-13 at 5 34 41 PM](https://github.com/scaffold-eth/scaffold-eth-2/assets/22818990/29b59334-fbae-4516-8af8-aa6998cbc86b)

TLDR on the 'proxiableUUID' error: The UUPSUpgradeable contract ensures that the proxy contract is not proxiable. From the comments in the parent contract,

"IMPORTANT: A proxy pointing at a proxiable contract should not be considered proxiable itself, because this risks bricking a proxy that upgrades to it, by delegating to itself until out of gas. Thus it is critical that this function revert if invoked through a proxy. This is guaranteed by the `notDelegated` modifier."

Set a new greeting and bam, Bob's your uncle! The proxy contract that was deployed via the Factory contract is able to use the function of the implementation contract. Onto upgradeability.


## The contract upgrade

Upgradeable smart contracts may sound sacrilegious to you, afterall, smart contracts are supposed to be immutable and that's where a large part of their security is derived right?  There may be situations where you want to expand the functionality of your smart contract after you've already deployed it. Maybe you want to have a window of time to debug without having to start over with new smart contracts. In this case, the goal is to 'upgrade' the contract by adding new functionality but also retaining the data immutability; and this is exactly what all of the OpenZeppelin Proxy patterns are designed to do. For a deeper dive, check out this article from OpenZeppelin --> [Proxy Patterns: How they work, lower level](https://blog.openzeppelin.com/proxy-patterns?utm_source=zos&utm_medium=blog&utm_campaign=transparent-proxy-pattern)


3. Let's deploy an upgraded version of YourContract with some new functionality. In packages/hardhat/upgrade/contract, copy YourContract2.sol to the packages/hardhat/contracts directory. In packages/hardhat/upgrade/deploy_script, copy 01_deploy_your_contract_upgrade.ts to the pacakges/hardhat/deploy directory. Hardhat will run the scripts found in this directory in the order of the numerical prefixes in the file names.

#### Now, in the terminal, run:

```
yarn deploy
```

We didn't make any changes to YourContract or Factory so hardhat won't re-deploy these contracts. The ABI for YourContract2 will be added to nextjs/contracts/deployedContracts so that we can interact with new functions on the frontend. On the Debug Contracts page you should now see UI for all three contracts.

4. Let's get all of the read and write methods for [TransparentUpgradeableProxy](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.8/contracts/proxy/transparent/TransparentUpgradeableProxy.sol) so that we can upgrade a proxy. Let's also use the ABI for YourContract2. To do so, we need to uncomment a few lines in proxiesDebug.tsx file.

### nextjs/pages/proxiesDebug.tsx modifications

You can search 'step3' to find all instances to uncomment

```
// Uncomment the line below after step3

const yourContractUpgrade = deployedContracts[chain.id].YourContract2;
```

And lastly, we need to modify one line in an existing useEffect:

```
const data = Object.create(yourContract); // Change "yourContract" to "yourContractUpgrade" after step3.
```

You should get a load of error notifications.

![fallback-errors](https://github.com/scaffold-eth/scaffold-eth-2/assets/22818990/894da216-5719-4d55-aebe-cad1e5a9069b)


We're now using the ABI for YourContract2 but we haven't upgraded the contract yet so these functions don't exist. Once we do the upgrade, we won't get these errors for this contract anymore. Keep in mind we'll need to upgrade each proxy individually. If you want a pattern where all proxies are upgraded from one upgrade call, check out the [Beacon Proxy pattern](https://blog.openzeppelin.com/the-state-of-smart-contract-upgrades#beacons).

5. Time to upgrade. Make sure you're using the owner account of the proxy contract that you're trying to upgrade. Copy the address of YourContract2 on the Debug page. Call 'upgradeToAndCall' and provide the new implementation address and '0x' for data. Now calls to the proxy will fallback to YourContract2.

6. Now try to make a call to our new function 'setFarewell'. Keep in mind, we're sending the call to the same address that existed before. Can you call 'setFarewell' on a different proxy that hasn't been upgraded?

7. When you're ready to terminate the upgradeable functionality of your smart contract, deploy an implementation contract and initialize it with '0x0000000000000000000000000000000000000000' (the Zero Address). Now everyone will know that your smart contract is no longer upgradeable.

## Subgraphs

Now let's deploy a subgraph so that we can efficiently read data from the blockchain. "But I'll have to deploy a subgraph for each time I deploy a proxy, right?" Wrong. Thanks to templating with The Graph, we can deploy one subgraph that will index events from our Factory contract AND events emitted by all of the proxies that our Factory contract deploys on chain. Amazing!

This portion coming soon...

If you're looking for a proxy pattern that upgrades all the proxy contracts with one transaction, check out the [Upgradeable Beacon Proxy pattern](https://blog.openzeppelin.com/blog/the-state-of-smart-contract-upgrades#beacons). A similar build will be coming soon for the Beacon Proxy pattern.

Want finer grain control? Stay tuned for a Diamond Standard build coming soon...

Thanks for journeying with me. Keep Buidling!


<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Documentation</a> |
  <a href="https://scaffoldeth.io">Website</a> |
  <a href="https://eips.ethereum.org/EIPS/eip-1822">Ethereum EIP-1882 - UUPS</a>
</h4>


