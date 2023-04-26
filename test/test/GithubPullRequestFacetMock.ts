import { time, loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("GithubPullRequestFacetMock", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployOneYearLockFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const GithubPullRequestFacetMock = await ethers.getContractFactory(
      "GithubPullRequestFacetMock"
    );
    const githubPullRequestFacetMock =
      await GithubPullRequestFacetMock.deploy();

    return { githubPullRequestFacetMock, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should deploy correctly", async function () {
      const { githubPullRequestFacetMock } = await loadFixture(
        deployOneYearLockFixture
      );
      expect(await githubPullRequestFacetMock.deployed()).to.exist;
    });
  });

  describe("Event", function () {
    it("Should fire an event", async function () {
      const { githubPullRequestFacetMock } = await loadFixture(
        deployOneYearLockFixture
      );

      const pr = {
        _owner: "owner",
        _repo: "repo",
        _pull_number: "1",
      };

      await expect(
        githubPullRequestFacetMock.merge(pr._owner, pr._repo, pr._pull_number)
      )
        .to.emit(githubPullRequestFacetMock, "MergePullRequest")
        .withArgs(pr._owner, pr._repo, pr._pull_number);
    });
  });
});
