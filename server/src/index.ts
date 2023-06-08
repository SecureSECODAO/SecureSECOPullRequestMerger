/**
 * This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
 * © Copyright Utrecht University (Department of Information and Computing Sciences)
 */

import { Log, createPublicClient, http } from "viem";
import { polygon, polygonMumbai } from "viem/chains";
import { Octokit } from "@octokit/rest";
import { abi } from "./abi";
import express from "express";
import * as dotenv from "dotenv";
dotenv.config();

const app = express();
app.listen(process.env.PORT || 3000);

// Create a GitHub client so we can merge the pull request
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: "SecureSECOPullRequestMerger",
});

// Create a client so we can read from the blockchain
const client = createPublicClient({
  chain: process.env.NODE_ENV === "production" ? polygon : polygonMumbai,
  transport: http(),
});

// Keeps track of what pr's have been merged
export const mergedPullRequests = new Map();

/**
 * Handles the MergePullRequest event by attempting to merge the pull request.
 * @param owner Owner of the repository
 * @param repo Repository name
 * @param pull_number Pull request number
 * @param log Log of the event
 */
const handleEvent = async (
  owner: string,
  repo: string,
  pull_number: string,
  log: Log
) => {
  console.log(`Merging pull request: (${owner}/${repo}#${pull_number})`);

  let success = false;
  let mergeError;
  try {
    // Get & validate the pull request
    await validatePullRequest(owner, repo, pull_number);

    // Approve the pull request
    await approvePullRequest(owner, repo, pull_number);

    // Merge the pull request
    await mergePullRequest(owner, repo, pull_number);

    success = true;
  } catch (error) {
    console.log("Could not merge pull request: \n", error);
    mergeError = error;
  }

  let commentContent;
  if (success) {
    commentContent = `This pull request has been merged by the [SecureSECO DAO](https://dao.secureseco.org/).\n\nExecuted by: \`${log.address}\`\nTransaction hash: \`${log.transactionHash}\``;
  } else {
    commentContent = `This pull request could **not** be merged.\n\nExecuted by: \`${log.address}\`\nTransaction hash: \`${log.transactionHash}\`\n\nError: \`\`\`${mergeError}\`\`\``;
  }

  octokit.issues
    .createComment({
      owner,
      repo,
      issue_number: pull_number,
      body: commentContent,
    })
    .catch((error) => {
      console.log("Could not comment on pull request: \n", error);
    });
};

/**
 * Makes sure that the pull request is mergeable.
 */
const validatePullRequest = async (
  owner: string,
  repo: string,
  pull_number: string
) => {
  const res = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
  });

  let validValues = ["clean", "has_hooks", "unstable"];
  if (
    res.data &&
    res.data.mergeable === true &&
    !validValues.includes(res.data.mergeable_state)
  ) {
    throw new Error(
      `Pull request is not mergeable: (${owner}/${repo}#${pull_number}). ` +
        `Mergeable = ${res.data?.mergeable}, State = ${res.data?.mergeable_state}`
    );
  }
};

/**
 * Writes an approval on the pull request, so it can be merged.
 */
const approvePullRequest = async (
  owner: string,
  repo: string,
  pull_number: string
) => {
  const res = await octokit.pulls.createReview({
    owner,
    repo,
    pull_number,
    event: "APPROVE",
  });

  if (res.data && res.data.state !== "APPROVED") {
    throw new Error(
      `Pull request could not be approved: (${owner}/${repo}#${pull_number}). ` +
        `State = ${res.data?.state}`
    );
  }
};

/**
 * Merges the pull request.
 */
const mergePullRequest = async (
  owner: string,
  repo: string,
  pull_number: string
) => {
  const res = await octokit.pulls.merge({
    owner,
    repo,
    pull_number,
  });

  if (res.data && res.data.merged === true) {
    console.log(
      `Pull request merged successfully: (${owner}/${repo}#${pull_number})`
    );

    // Add the pull request to the merged pull requests map
    mergedPullRequests.set(`${owner}/${repo}#${pull_number}`, true);
  } else {
    console.log("Pull request not merged: \n", res);
    throw new Error(
      `Pull request could not be merged: (${owner}/${repo}#${pull_number}). ` +
        `Merged = ${res.data?.merged}`
    );
  }
};

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
      // Extract the owner, repo and pull_number from the event
      const { owner, repo, pull_number } = log.args;
      try {
        const pr = mergedPullRequests.get(`${owner}/${repo}#${pull_number}`);
        if (pr === true) {
          console.log(
            `Pull request already merged: (${owner}/${repo}#${pull_number})`
          );
          continue;
        }

        await handleEvent(owner, repo, pull_number, log);
      } catch (error) {
        console.log("Could not handle event: \n", error);
      }
    }
  },
});

console.log(`Environment: ${process.env.NODE_ENV}`);
console.log(`Contract address: ${process.env.CONTRACT_ADDRESS}`);
