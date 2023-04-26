import { ethers } from "hardhat";

async function main() {
  const GithubPullRequestFacetMock = await ethers.getContractFactory(
    "GithubPullRequestFacetMock"
  );
  const githubPullRequestFacetMock = await GithubPullRequestFacetMock.deploy();

  await githubPullRequestFacetMock.deployed();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
