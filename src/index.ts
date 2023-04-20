import { createPublicClient, http } from "viem";
import { mainnet, polygonMumbai } from "viem/chains";
import { abi } from "./abi.js";
import * as dotenv from "dotenv";
dotenv.config();

// Create a client so we can read from the blockchain
const client = createPublicClient({
  chain: polygonMumbai,
  transport: http(),
});

console.log(`Contract address: ${process.env.CONTRACT_ADDRESS}`);

// Detect the MergePullRequest event. This is emitted when a pull request needs to be merged,
//  as a result of the execution of the mergePullRequest function. That function is called
//  when a proposal from the DAO is accepted and executed with a specific action.
const unwatch = client.watchContractEvent({
  address: process.env.CONTRACT_ADDRESS as any,
  abi,
  eventName: "MergePullRequest",
  onLogs: (logs) => {
    console.log(logs);
    for (let log of logs) {
      // Extract the owner, repo and pull_number from the event
      const { owner, repo, pull_number } = (log as any).args;
    }
  },
});
