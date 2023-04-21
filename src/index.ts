import { createPublicClient, http } from "viem";
import { mainnet, polygonMumbai } from "viem/chains";
import { Octokit } from "@octokit/rest";
import { abi } from "./abi.js";
import * as dotenv from "dotenv";
dotenv.config();

// Create a GitHub client so we can merge the pull request
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: "SecureSECOPullRequestMerger",
});

// Create a client so we can read from the blockchain
const client = createPublicClient({
  chain: polygonMumbai,
  transport: http(),
});

console.log(`Contract address: ${process.env.CONTRACT_ADDRESS}`);

// Detect the MergePullRequest event. This is emitted when a pull request needs to be merged,
//  as a result of the execution of the mergePullRequest function. That function is called
//  when a proposal from the DAO is accepted and executed with a specific action.
client.watchContractEvent({
  address: process.env.CONTRACT_ADDRESS as any,
  abi,
  eventName: "MergePullRequest",
  onLogs: async (logs) => {
    console.log(logs);
    for (let log of logs) {
      try {
        // Extract the owner, repo and pull_number from the event
        const { owner, repo, pull_number } = (log as any).args;

        // Merge the pull request
        const res = await octokit.pulls.merge({
          owner,
          repo,
          pull_number,
        });

        if (res.data && res.data.merged === true) {
          console.log(
            `Pull request merged successfully: (${owner}/${repo}#${pull_number})`
          );
        } else {
          console.log("Pull request not merged: \n", res);
        }
      } catch (error) {
        console.log("Could not merge pull request: \n", error);
      }
    }
  },
});
