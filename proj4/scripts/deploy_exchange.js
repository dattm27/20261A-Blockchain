const hre = require("hardhat");
const fs = require('fs');

async function main() {
  const expectedTokenAddress = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  const deployedTokenAddress = fs.readFileSync('./token_address.txt', 'utf8').trim();
  if (deployedTokenAddress.toLowerCase() !== expectedTokenAddress.toLowerCase()) {
    throw new Error(
      `Token was deployed at ${deployedTokenAddress}, but exchange.sol expects ` +
      `${expectedTokenAddress}. Restart the Hardhat node and deploy the token first.`
    );
  }

  const ExchangeContract = await hre.ethers.getContractFactory("TokenExchange");
  const exchangeContract = await ExchangeContract.deploy();
  await exchangeContract.deployed();
  try {
    fs.writeFileSync('./exchange_address.txt',`${exchangeContract.address}`, (error) => {
      console.log(`Failed to write to file`);
      console.log(`Manually input contract address: ${exchangeContract.address}`);
    });
    console.log(`Successfully wrote exchange address ${exchangeContract.address} to exchange_address.txt`)

  } catch(error) {
    console.log(`Failed to write to file`);
    console.log(`Manually input exchange address: ${exchangeContract.address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
