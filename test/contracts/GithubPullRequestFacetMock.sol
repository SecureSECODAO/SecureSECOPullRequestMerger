// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

/**
 * This program has been developed by students from the bachelor Computer Science at Utrecht University within the Software Project course.
 * © Copyright Utrecht University (Department of Information and Computing Sciences)
 */

// Uncomment this line to use console.log
import "hardhat/console.sol";

contract GithubPullRequestFacetMock {
    /// @notice Emitted when a pull request needs to be merged as a result of a proposal action
    /// @param owner Owner of the repository
    /// @param repo Name of the repository
    /// @param pull_number Number of the pull request
    event MergePullRequest(string owner, string repo, string pull_number);

    /// @notice The permission identifier to merge pull requests.
    bytes32 public constant MERGE_PR_PERMISSION_ID =
        keccak256("MERGE_PR_PERMISSION");

    /// Function that emits an event to merge a pull request
    /// @param owner Owner of the repository
    /// @param rep Name of the repository
    /// @param pull_number Number of the pull request
    function merge(
        string memory owner,
        string memory rep,
        string memory pull_number
    ) external /*auth(MERGE_PR_PERMISSION_ID)*/ {
        emit MergePullRequest(owner, rep, pull_number);
    }
}
