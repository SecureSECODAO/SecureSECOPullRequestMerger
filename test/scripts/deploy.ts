import { ethers } from "hardhat";

async function main() {
  const currentTimestampInSeconds = Math.round(Date.now() / 1000);
  const unlockTime = currentTimestampInSeconds + 60;

  const lockedAmount = ethers.utils.parseEther("0.001");

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
