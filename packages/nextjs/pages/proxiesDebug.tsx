// @ts-nocheck
import { useEffect, useState, useRef } from "react";
import type { NextPage } from "next";
import { useLocalStorage } from "usehooks-ts";
import { MetaHeader } from "~~/components/MetaHeader";
import { ContractProxyUI } from "~~/components/scaffold-eth/Contract";
import { getContractNames } from "~~/utils/scaffold-eth/contractNames"
import { useContractRead } from "wagmi";
import deployedContracts from "~~/contracts/deployedContracts";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useOutsideClick } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";

const selectedContractStorageKey = "scaffoldEth2.selectedContractClone";
const contractNames = getContractNames();


const ClonesDebug: NextPage = () => {
  // add networks in scaffoldConfig, change the number in the targetNetwork[] below for deployed public network contracts
  const chain  = scaffoldConfig.targetNetworks[0];
  const factory = deployedContracts[chain.id].Factory;
  const yourContract = deployedContracts[chain.id].YourContract;

  // Uncomment the line below after step3
  // const yourContractUpgrade = deployedContracts[chain.id].YourContract2;


  // Array of contract addresses from contractRead
  const [proxyContracts, setProxyContracts] = useState<string[]>();
  const [proxyContractData, setProxyContractData] = useState<object[]>();

  const [selectedContract, setSelectedContract] = useLocalStorage(
    selectedContractStorageKey,
    "",
  );

  // Gets array of contract addresses from the Factory contract
  const contractRead = useContractRead({
    address: factory.address,
    abi: factory.abi,
    functionName: "readProxyList",
  });

  // Used for the Proxy Contract selector / dropdown menu
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const closeDropdown = () => {
    dropdownRef.current?.removeAttribute("open");
  };
  useOutsideClick(dropdownRef, closeDropdown);

  // Set array of contract addresses after first render
  useEffect(() => {
    if (contractRead)
      setProxyContracts(contractRead.data)
      if (contractRead.data.length < 2)
        setSelectedContract(contractRead.data[0])
  }, [contractRead]);


  // Create contract data for each proxy deployed by the Factory contract
  // Contract data is then used for ContractProxyUI
  useEffect(() => {
    const dataArray = [];

    const iterate = () => {
      for (let index = 0; index < proxyContracts.length; index++) {
        const data = Object.create(yourContract); // Change "yourContract" to "yourContractUpgrade" after step3.
        data.address = proxyContracts[index];
        dataArray.push(data);
      }
    };

    if (proxyContracts?.length > 0)
      iterate();
    setProxyContractData(dataArray);
  }, [proxyContracts]);


  return (
    <>
      <MetaHeader
        title="Debug Contracts | Scaffold-ETH 2"
        description="Debug your factory clone 🏗 Scaffold-ETH 2 contracts in an easy way"
      />
      <div className="flex flex-col gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
        {contractNames.length === 0 ? (
          <p className="text-3xl mt-14">No clones found!</p>
        ) : (
          <>
            {contractNames?.length > 1 && (
              <div className="flex flex-row gap-2 w-full max-w-7xl pb-1 px-6 lg:px-10 flex-wrap">
                <details ref={dropdownRef} className="dropdown dropdown-right leading-3">
                  <summary tabIndex={0} className="btn btn-secondary btn-sm shadow-md dropdown-toggle gap-0 !h-auto">
                    Select Proxy Contract
                    <ChevronDownIcon className="h-6 w-4 ml-2 sm:ml-0" />
                  </summary>
                  <ul
                    className="dropdown-content menu z-[100] p-2 mt-2 shadow-center shadow-accent bg-base-200 rounded-box gap-1"
                  >
                    {proxyContracts?.map((address) => (
                      <li
                        key={address}
                        onClick={() => {setSelectedContract(address);closeDropdown();}}
                        onKeyUp={() => setSelectedContract(address)}
                      >
                        <Address
                          address={address}
                          disableAddressLink={true}
                        />
                      </li>
                    ))}
                  </ul>
                </details>

              </div>
            )}
            {proxyContractData?.map(data => (
              <ContractProxyUI
                key={data.address}
                className={data.address === selectedContract ? "" : "hidden"}
                deployedContractData={data}
              />
            ))}
          </>
        )}
      </div>
      <div className="text-center mt-8 bg-secondary p-10">
        <h1 className="text-4xl my-0">Debug Proxies</h1>
        <p className="text-neutral">
          You can debug & interact with your deployed contracts here.
          <br /> Check{" "}
          <code className="italic bg-base-300 text-base font-bold [word-spacing:-0.5rem] px-1">
            packages / nextjs / pages / proxiesDebug.tsx
          </code>{" "}
        </p>
      </div>
    </>
  );
};

export default ClonesDebug;
