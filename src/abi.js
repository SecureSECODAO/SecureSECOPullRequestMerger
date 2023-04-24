/**
 * This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
 * © Copyright Utrecht University (Department of Information and Computing Sciences)
 */

module.exports = {
  abi: [
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
      inputs: [
        {
          internalType: "string",
          name: "_owner",
          type: "string",
        },
        {
          internalType: "string",
          name: "_rep",
          type: "string",
        },
        {
          internalType: "string",
          name: "_pull_number",
          type: "string",
        },
      ],
      name: "mergePullRequest",
      outputs: [],
      stateMutability: "nonpayable",
      type: "function",
    },
  ],
};
