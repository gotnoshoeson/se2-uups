# 🏗 Scaffold-ETH 2 - UUPS Pattern

#### TL;DR - Universal Upgradeable Proxy Standard

Why do this? Why should you care? Short answer is upgradeable smart contracts. "But smart contracts are supposed to be immutable, isn't that the whole point?" Have no fear, all of the proxy patterns that have been published by OpenZeppelin keep the immutable storage in tact and allow an admin (owner) to add additional functionality without changing the contract address that the users interact with. For example, you have a smart contract that has a function that increments a value (++1), but later you want the contract to also have a decrement function (--1). An upgradeable contract pattern will allow you to do that and keep the smart contract's address and storage data in tact. So depending on the smart contract use, this could be an acceptable set of terms for the users. When you're done upgrading, there is a mechanism to provably prevent future upgrades.

[Check out the Scaffold-Eth 2 docs and quickstart](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/README.md)

With that out of the way, onto the build!

## The build

** NOTE: This build is using OpenZeppelin contracts version 4.8.1. Let me know if you'd like to see a build with the latest OZ v5.0 TransparentUpgradeableProxy pattern. **

So why do this?

Contract upgradeability. Also, If you want to be able to deploy multiple instances of a smart contract and you want to reduce the cost of deployment. One main difference from the Transparent Upgradeable Proxy Standard is that proxy deployments are cheaper because the code to upgrade a proxy resides in the implementation contract, which is only deployed once. Also the Transparent Upgradeable Proxy Standard does NOT have a way to turn off upgradeability.

We will start out with two smart contracts in this build:
  -1: YourContract.sol
  -2: Factory.sol

YourContract will be used as the implementation contract and Factory will be used as an on-chain way to deploy proxies of the implementation contract. All calls to the proxy contracts will be forwarded [delegatecall](https://solidity-by-example.org/delegatecall/) to the implementation contract that contains the contract logic. The storage will be maintained in the proxy contract.

1. If you followed the steps from the quick start, you can interact with YourContract and ProxyFactory on the typical Scaffold-Eth Debug page. Go ahead and choose the Factory contract and make a transaction with the 'createProxy' method.

Create a few more proxy contracts so we can test them in our new page, Debug Proxies!

2. On the Debug Proxies page, select the contract you want to interact with by clicking on the 'Select Proxy Contract' dropdown menu.

![Screen Shot 2024-01-29 at 8 35 56 AM](https://github.com/scaffold-eth/scaffold-eth-2/assets/22818990/dc5b81ba-b212-4ef7-bb75-07cebfa0cca1)

Set a new greeting and bam, Bob's your uncle!

What's that? The transaction failed?

![Admin-call-fails](https://github.com/scaffold-eth/scaffold-eth-2/assets/22818990/a1eaeaeb-90e1-4abc-9593-1cfefdabb5a6)

No worries. This is expected behavior as msg.sender was set as the admin (or owner) of the Proxy contract when we deployed it on chain. The admin address can only call functions on the TransparentUpgradeableProxy functions, any other function calls will not fallback to the implementation contract if made by the admin. Let's log into the app with a different account.

To log in with a new burner wallet, simply open a new tab or window (you'll likely need to open a private or incognito tab in your browser to get a new burner address) and head to `http://localhost:3000/proxiesDebug`. Select a proxy contract and set a new greeting. It should work now! You can also check YourContract and see that the greeting has not been changed on this implementation contract. Cool. So we can create multiple copies of a contract and share the logic of one implementation contract for all proxy contracts. Onto the upgradeable portion of the build.

## The contract upgrade

Upgradeable smart contracts may sound sacrilegious to you, afterall, smart contracts are supposed to be immutable and that's where a large part of their security is derived right?  There may be situations where you want to expand the functionality of your smart contract after you've already deployed it. Maybe you want to have a window of time to debug without having to start over with new smart contracts. In this case, the goal is to 'upgrade' the contract by adding new functionality but also retaining the data immutability; and this is exactly what all of the OpenZeppelin Proxy patterns are designed to do. For a deeper dive, check out this article from OpenZeppelin --> [Proxy Patterns: How they work, lower level](https://blog.openzeppelin.com/proxy-patterns?utm_source=zos&utm_medium=blog&utm_campaign=transparent-proxy-pattern)

Every time that we created a new proxy, we did so with the Factory contract and not with hardhat like the other contracts, YourContract and Factory. For this reason we don't currently have the ABI to interact with any of the TransparentUpgradeableProxy functions or any of the functions that it inherits.

3. Let's deploy an upgraded version of YourContract with some new functionality. Lets also deploy a YourTransparentUpgradeableProxy contract so that we have the TransparentUpgradeableProxy ABI for the frontend. In packages/hardhat/upgrade/contract, copy YourContract2.sol and YourTransparentUpgradeableProxy.sol to the packages/hardhat/contracts directory. In packages/hardhat/upgrade/deploy_script, copy 01_deploy_your_contract_upgrade.ts to the pacakges/hardhat/deploy directory. Hardhat will run the scripts found in this directory in the order of the numerical prefixes in the file names.

#### Now, in the terminal, run:

```
yarn deploy
```

We didn't make any changes to YourContract or Factory so hardhat won't re-deploy these contracts. The ABI for YourContract2 and YourTransparentUpgradeableProxy will be added to nextjs/contracts/deployedContracts so that we can interact with them on the frontend. On the Debug Contracts page you should now see UI for all four contracts.

4. Let's get all of the read and write methods for [TransparentUpgradeableProxy](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/release-v4.8/contracts/proxy/transparent/TransparentUpgradeableProxy.sol) so that we can upgrade a proxy. Let's also use the ABI for YourContract2. To do so, we need to uncomment a few lines in proxiesDebug.tsx file.

### proxiesDebug.tsx modifications

You can search 'step3' to find all instances to uncomment

```
// Uncomment the two lines below after step3

const yourTransparentUpgradeableProxy = deployedcontracts[chain.id].YourTransparentUpgradeableProxy;
const yourContractUpgrade = deployedContracts[chain.id].YourContract2;
```

```
// Uncomment the line below after step3

const [proxyTransparentContractData, setProxyTransparentContractData] = useState();
```

We need to modify one line in an existing useEffect:

```
const data = Object.create(yourContract); // Change "yourContract" to "yourContractUpgrade" after step3.
```

We want to have a copy of the TransparentUpgradeableProxy ABI for every proxy that has been deployed. We can do this by uncommenting the following:

```
// Uncomment the following useEffect after step3
// Creates transparent contract data for each proxy deployed by the Factory contract
// Contract data is then used for ContractProxyUI props

useEffect(() => {
    const dataArray = [];

    const iterate = () => {
      for (let index = 0; index < proxyContracts.length; index++) {
        const data = Object.create(yourTransparentUpgradeableProxy);
        data.address = proxyContracts[index];
        dataArray.push(data);
      }
    };

    if (proxyContracts?.length > 0)
      iterate();
    setProxyContractData(dataArray);
  }, [proxyContracts]);
```

And lastly we need to render the read and write methods:

```
{/* Uncomment the following code after step 3 */}
{proxyTransparentContractData?.map(data => (
  <ContractProxyUI
    key={data.address}
    className={data.address === selectedContract ? "" : "hidden"}
    deployedContractData={data}
  />
))}
```

You should get a load of error notifications.

![fallback-errors](https://github.com/scaffold-eth/scaffold-eth-2/assets/22818990/894da216-5719-4d55-aebe-cad1e5a9069b)


We're now using the ABI for YourContract2 but we haven't upgraded the contract yet so these functions don't exist. Once we do the upgrade, we won't get these errors for this contract anymore. Keep in mind we'll need to upgrade each proxy individually. If you want a pattern where all proxies are upgraded from one upgrade call, check out the [Beacon Proxy pattern](https://blog.openzeppelin.com/the-state-of-smart-contract-upgrades#beacons).

5. Time to upgrade. Make sure you're using the owner (or admin) of the proxy account that you're trying to upgrade. Calls from all other addresses fallback to the implementation contract which isn't what we want. Copy the address of YourContract2 on the Debug page. Call '_upgradeTo' and provide the new implementation address. Now calls to the proxy (which aren't from the admin) will fallback to YourContract2.

6. With an address that is not the owner (or admin) try to make a call to our new function 'setFarewell'. Keep in mind, we're sending the call to the same address that existed before. Can you call 'setFarewell' on a different proxy that hasn't been upgraded?

7. When you're ready to terminate the upgradeable functionality of your smart contract, set the owner as '0x0000000000000000000000000000000000000000' (the Zero Address). Now everyone will know that your smart contract is no longer upgradeable.


If you're looking for a proxy pattern that upgrades all the proxy contracts with one transaction, check out the [Upgradeable Beacon Proxy pattern](https://blog.openzeppelin.com/blog/the-state-of-smart-contract-upgrades#beacons). A similar build will be coming soon for the Beacon Proxy pattern.

Want finer grain control? Stay tuned for a Diamond Standard build coming soon...

Thanks for journeying with me. Keep Buidling!


<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Documentation</a> |
  <a href="https://scaffoldeth.io">Website</a> |
  <a href="https://blog.openzeppelin.com/the-transparent-proxy-pattern">Open Zeppelin Blog - The transparent proxy pattern</a>
</h4>


