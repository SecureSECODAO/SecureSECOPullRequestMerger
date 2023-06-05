# SecureSECOPullRequestMerger

Listens to DAO Smart Contract and merges PRs for SecureSECO repositories when needed.

## Setup

Go to server directory

    cd server

Install packages

    npm install

Create .env in root of project

    CONTRACT_ADDRESS=0x...
    GITHUB_TOKEN=...

## Build

    npm run build

## Run

### Development

    npm start:dev

### Production

    npm start

## How it works

In the DAO, a proposal can be made with a specific action. If someone wants to merge a pull request, they can make a proposal with an action that triggers the `mergePullRequest` function in the diamond.

Once the proposal is accepted and executed, that function is actually executed and a MergePullRequest event is emitted. This server listens for that event, and when it is emitted, it will merge the pull request using the GitHub API. The event contains data about the owner of the repository, the repository name, and the pull request number.

## License

This repository is [MIT licensed](./LICENSE).
