/**
 * This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
 * © Copyright Utrecht University (Department of Information and Computing Sciences)
 */

import { ethers } from "ethers";
import { Octokit } from "@octokit/rest";
import * as dotenv from "dotenv";
import AsyncLock from "async-lock";

/**
 * We create a lock so that we can only merge one pull request at a time.
 */
const lock = new AsyncLock();

dotenv.config();
// Create a GitHub client so we can merge the pull request
export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
  userAgent: "SecureSECOPullRequestMerger",
});

if (process.env.ENCRYPTION_KEY == null) {
  throw new Error("ENCRYPTION_KEY is not set");
}

// For encrypting the commit hash
import Cryptr from "cryptr";
export const cryptr = new Cryptr(process.env.ENCRYPTION_KEY);

import "./server";
import { abi } from "./abi";

// Create a provider so we can read from the blockchain
const provider = new ethers.providers.JsonRpcProvider(
  process.env.NODE_ENV === "production"
    ? "https://rpc.ankr.com/polygon"
    : "https://rpc.ankr.com/polygon_mumbai"
);

// Keeps track of what pr's have been merged
export const mergedPullRequests = new Map();

/**
 * Handles the MergePullRequest event by attempting to merge the pull request.
 * @param owner Owner of the repository
 * @param repo Repository name
 * @param pull_number Pull request number
 * @param sha Commit hash (encrypted)
 * @param log Log of the event
 */
const handleEvent = async (
  owner: string,
  repo: string,
  pull_number: string,
  sha: string
) => {
  await lock.acquire("merge", async () => {
    console.log(`Merging pull request: (${owner}/${repo}#${pull_number})`);

    let success = false;
    let mergeError;
    try {
      // Retrieve the pull request
      let res = await octokit.pulls.get({
        owner,
        repo,
        pull_number,
      });

      // Check commit hash
      await validateCommitHash(res, sha);

      // Approve the pull request
      await approvePullRequest(owner, repo, pull_number);

      // Retrieve the pull request again (state has updated)
      res = await octokit.pulls.get({
        owner,
        repo,
        pull_number,
      });

      // Get & validate the pull request
      await validatePullRequest(owner, repo, pull_number, res);

      // Merge the pull request
      await mergePullRequest(owner, repo, pull_number);

      success = true;
    } catch (error) {
      console.log("Could not merge pull request: \n", error);
      mergeError = error;
    }

    let commentContent;
    if (success) {
      commentContent = `This pull request has been merged by the [SecureSECO DAO](https://dao.secureseco.org/).`;
    } else {
      commentContent = `This pull request could **not** be merged.\n\nError: \`\`\`${mergeError}\`\`\``;
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
  });
};

/**
 * Makes sure that the pull request is mergeable.
 */
const validatePullRequest = async (
  owner: string,
  repo: string,
  pull_number: string,
  res: any
) => {
  let validValues = ["clean", "has_hooks", "unstable"];
  if (
    res.data == null ||
    res.data.mergeable == false ||
    !validValues.includes(res.data.mergeable_state)
  ) {
    throw new Error(
      `Pull request is not mergeable: (${owner}/${repo}#${pull_number}). ` +
        `Mergeable = ${res.data?.mergeable}, State = ${res.data?.mergeable_state}`
    );
  } else {
    console.log(`Pull request is mergeable: (${owner}/${repo}#${pull_number})`);
  }

  return res;
};

/**
 * Makes sure that the given latest commit hash matches the one in the pull request.
 */
const validateCommitHash = async (
  res: any, // previous response from validatePullRequest
  encryptedSha: string
) => {
  const realSha = res.data.head.sha;
  const decryptedSha = cryptr.decrypt(encryptedSha);

  if (realSha !== decryptedSha) {
    throw new Error(
      `Pull request commit hash does not match: (${res.data.head.repo.full_name}#${res.data.number}). You should not push anything else after submitting the pull request along with the proposal. ` +
        `Expected: ${realSha}, Actual: ${decryptedSha}`
    );
  } else {
    console.log(`Pull request commit hash matches: ${realSha}`);
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

  if (res.data == null || res.data?.state !== "APPROVED") {
    throw new Error(
      `Pull request could not be approved: (${owner}/${repo}#${pull_number}). ` +
        `State = ${res.data?.state}`
    );
  } else {
    console.log(
      `Pull request approved successfully: (${owner}/${repo}#${pull_number})`
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

// Create contract instance so we can listen to events
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS as any,
  abi,
  provider
);

// Detect the MergePullRequest event. This is emitted when a pull request needs to be merged,
//  as a result of the execution of the mergePullRequest function. That function is called
//  when a proposal from the DAO is accepted and executed with a specific action.
contract.on(
  "MergePullRequest(string,string,string,string)",
  async (owner, repo, pull_number, sha) => {
    try {
      const pr = mergedPullRequests.get(`${owner}/${repo}#${pull_number}`);
      if (pr === true) {
        console.log(
          `Pull request already merged: (${owner}/${repo}#${pull_number})`
        );
        return;
      }

      await handleEvent(owner, repo, pull_number, sha);
    } catch (error) {
      console.log("Could not handle event: \n", error);
    }
  }
);

console.log(`🌎 Environment: ${process.env.NODE_ENV}`);
console.log(`📜 Contract address: ${process.env.CONTRACT_ADDRESS}`);

const cleanup = () => {
  provider.removeAllListeners();
  process.exit(0);
};

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
