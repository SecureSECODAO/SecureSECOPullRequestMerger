/**
 * This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
 * © Copyright Utrecht University (Department of Information and Computing Sciences)
 */

export const abi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "string",
        name: "owner",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "repo",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "pull_number",
        type: "string",
      },
      {
        indexed: false,
        internalType: "string",
        name: "sha",
        type: "string",
      },
    ],
    name: "MergePullRequest",
    type: "event",
  },
  {
    inputs: [],
    name: "MERGE_PR_PERMISSION_ID",
    outputs: [
      {
        internalType: "bytes32",
        name: "",
        type: "bytes32",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "__GithubPullRequestFacet_init",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "deinit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "bytes",
        name: "",
        type: "bytes",
      },
    ],
    name: "init",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "string",
        name: "_owner",
        type: "string",
      },
      {
        internalType: "string",
        name: "_repo",
        type: "string",
      },
      {
        internalType: "string",
        name: "_pull_number",
        type: "string",
      },
      {
        internalType: "string",
        name: "_sha",
        type: "string",
      },
    ],
    name: "merge",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
