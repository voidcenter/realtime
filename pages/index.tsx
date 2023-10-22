import Image from 'next/image'
import { useEffect, useRef, useState } from 'react';
import dynamic from "next/dynamic";
import styles from './index.module.css';
import classNames from "tailwindcss-classnames";

import { ethers, utils } from "ethers";
import { useAppContext, useAppDispatch } from '@/context/AppContext';
import { TRANSFER_TOPIC } from '@/context/helpers';
import { ContextChange, RawBlock, RawEvent } from '@/context/defs';
const RealtimeView = dynamic(() => import("../components/RealtimeView"), { ssr: false });

import { gql, useQuery } from '@apollo/client';



export default function Home() {

    const context = useAppContext();
    const dispatch = useAppDispatch();


    // console.log(ethers);
    // console.log(window);

    // this the metamask net
    const provider = new ethers.providers.Web3Provider((window as any).ethereum);
    // const provider = new ethers.providers.AlchemyProvider('matic', 'Ce4JsDJknM1Vi6LcVGBMebL21qNiVYkK');
    // console.log(provider);

    const filter = {
        topics: [
            TRANSFER_TOPIC
        ]
    };

    let currentBlock = -1;
    let eventsBuffer: RawEvent[] = [];


    const played = new Set();

    provider.on(filter, async (e: RawEvent) => {

        if (e.blockNumber > currentBlock) {

            if (currentBlock > 0 && !(currentBlock in played)) {
                played.add(currentBlock);
                // console.log('flush logs', currentBlock);
                // flush to context
                const newBlock: RawBlock = {
                    block_number: currentBlock,
                    events: eventsBuffer,
                };

                // console.log(JSON.stringify(newContext));
                await dispatch({type: ContextChange.APPEND_BLOCK, newBlock });
            }
            eventsBuffer = [];
            currentBlock = e.blockNumber;
        }
        eventsBuffer.push(e);
        // console.log(e);
    });


    const [blockNumber, setBlockNumber] = useState(-1);
    const [loadingDots, setLoadingDots] = useState(0);
    const loadingDotRef = useRef(null);

    useEffect(() => {
        // Set up an interval to update the ticker value every second
        const interval = setInterval(() => {
            loadingDotRef.current = (loadingDotRef.current != null) ? (loadingDotRef.current + 1) % 4 : 0;
            setLoadingDots(loadingDotRef.current);
        }, 1000 / 4);
    
        // Clean up the interval on component unmount
        return () => clearInterval(interval);
    }, []);



    const chainId = (window as any).ethereum.networkVersion;
    const chainNameMap = {
        137: "Polygon Mainnet",
        1: "Ethereum Mainnet",
        5000: "Mantle Mainnet"
    };
    const chainSupported = chainId in chainNameMap;
    let chainName = chainSupported ? chainNameMap[chainId] : '';

    const blockUrlPrefixMap = {
       137: 'https://polygonscan.com/block/',
       1: 'https://etherscan.io/block/',
       5000: 'https://explorer.mantle.xyz/block/'
    };

    const blockUrl = chainSupported ? `${blockUrlPrefixMap[chainId]}${blockNumber}` : '';
    
    const addreddUrlPrefixMap = {
        137: 'https://polygonscan.com/address/',
        1: 'https://etherscan.io/address/',
        5000: 'https://explorer.mantle.xyz/address/'
    };

    const addressUrlPrefix = chainSupported ? addreddUrlPrefixMap[chainId] : '';
    

    
    const GET_DATA = gql`
      {
        transfers(orderBy: blockNumber, orderDirection: desc) {
          blockNumber
          blockTimestamp
          from
          to
          value
          transactionHash
        }
      }
    `;


    const { loading, error, data } = useQuery(GET_DATA, {
      variables: { language: 'english' },
    });



  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">

        <div className={styles.topContainer}>
          <div className={styles.title}>
            <h1 className="mb-3 text-3xl font-semibold blue-500 title-color text-title-orange">
              o m n i t r a c e
            </h1>
          </div>
        </div>


      {
        !loading && chainSupported && (
            <div className={styles.viewContainer}>
              <div>
                <div className={styles.chainName}>{`${chainName} ${".".repeat(loadingDots)}`}</div>
                {blockNumber > 0 && (<div className={styles.blockNumber}>
                  <a href={blockUrl} target="_blank" rel="noopener noreferrer">
                    {`BLK: ${blockNumber}`}
                  </a>
                </div>)}
              </div>
            <RealtimeView setBlockNumber={setBlockNumber} addressUrlPrefix={addressUrlPrefix} graphData={data.data.transfers}/>
          </div>  
        )
      }

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left">
        <a
          href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg  border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Technologoy{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Find in-depth information about Omnitrace features and API
          </p>
        </a>

        <a
          href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
          className="group rounded-lg border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Demo{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            View Omnitrace Demos
          </p>
        </a>

        <a
          href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Docs{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Explore the Omnitrace Documentation
          </p>
        </a>

        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
          className="group rounded-lg border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100 hover:dark:border-neutral-700 hover:dark:bg-neutral-800/30"
          target="_blank"
          rel="noopener noreferrer"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Join Us{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-50`}>
            Create something cool
          </p>
        </a>
      </div>
    </main>
  )
}
