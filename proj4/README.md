# Project 4 - R2R DEX

Project 4 implements a local Uniswap-V1-style decentralized exchange between
test ETH and the group's ERC-20 token, `R2R Token` (`R2R`). The exchange supports
constant-product swaps, LP shares, 3% swap fees, LP fee rewards, and on-chain
slippage checks.

## Requirements

- Node.js and npm
- Python 3 for serving the static browser client

Install dependencies and run all contract and browser-client tests:

```bash
cd proj4
npm install
npm test
```

## Run locally

Use a fresh Hardhat node. The assignment uses deterministic local deployment
addresses, so the token must be the first deployed contract and the exchange the
second.

Terminal 1:

```bash
cd proj4
npm run node
```

Terminal 2:

```bash
cd proj4
npm run deploy
```

Terminal 3:

```bash
cd proj4
npm run serve
```

Open <http://127.0.0.1:8081/index.html>. On the first load, account 0 mints the
token supply, permanently disables further minting, approves the exchange, and
creates the initial 5,000 ETH / 5,000 R2R pool.

All non-owner accounts begin with zero R2R. Swap ETH for R2R before trying to add
liquidity from one of those accounts. Enter slippage as an integer percentage,
for example `5` for 5%.

Restarting the Hardhat node clears all local chain state. After a restart, run
`npm run deploy` again and refresh the web page.

## Main files

- `contracts/token.sol`: owner-controlled ERC-20 minting and permanent mint lock.
- `contracts/exchange.sol`: pool reserves, LP shares, swaps, slippage, and fees.
- `web_app/exchange.js`: ethers.js client and transaction orchestration.
- `DesignDoc.txt`: architecture and design rationale.

## Submission

Create the group submission archive with:

```bash
./make_submit.sh
```

The script creates `../Nhom12-proj4.zip` containing only the required source
files plus `Nhom12-ThongTinNhom.txt`.
