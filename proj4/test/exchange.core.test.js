const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("TokenExchange core AMM", function () {
  const INITIAL_TOKENS = 5000;
  const INITIAL_ETH = ethers.utils.parseEther("5000");
  const MIN_RATE = 0;
  const MAX_RATE = ethers.constants.MaxUint256;

  let owner;
  let lp;
  let trader;
  let token;
  let exchange;

  beforeEach(async function () {
    // The assignment intentionally hard-codes the first deterministic Hardhat
    // deployment address for the token contract.
    await network.provider.send("hardhat_reset");
    [owner, lp, trader] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.deployed();

    const TokenExchange = await ethers.getContractFactory("TokenExchange");
    exchange = await TokenExchange.deploy();
    await exchange.deployed();

    await token.mint(100000);
    await token.approve(exchange.address, 100000);
    await exchange.createPool(INITIAL_TOKENS, { value: INITIAL_ETH });
  });

  it("creates a pool with the expected reserves", async function () {
    const [ethReserves, tokenReserves] = await exchange.getReserves();
    expect(ethReserves).to.equal(INITIAL_ETH);
    expect(tokenReserves).to.equal(INITIAL_TOKENS);
  });

  it("adds proportional liquidity without moving the rate", async function () {
    await token.transfer(lp.address, 100);
    await token.connect(lp).approve(exchange.address, 100);
    await exchange.connect(lp).addLiquidity(MIN_RATE, MAX_RATE, {
      value: ethers.utils.parseEther("100"),
    });

    const [ethReserves, tokenReserves] = await exchange.getReserves();
    const [shares] = await exchange.getLiquidityShares(lp.address);
    expect(ethReserves).to.equal(ethers.utils.parseEther("5100"));
    expect(tokenReserves).to.equal(5100);
    expect(shares).to.equal(2000);
  });

  it("removes some or all of an LP position", async function () {
    await token.transfer(lp.address, 100);
    await token.connect(lp).approve(exchange.address, 100);
    await exchange.connect(lp).addLiquidity(MIN_RATE, MAX_RATE, {
      value: ethers.utils.parseEther("100"),
    });

    await exchange
      .connect(lp)
      .removeLiquidity(ethers.utils.parseEther("40"), MIN_RATE, MAX_RATE);
    let [ethReserves, tokenReserves] = await exchange.getReserves();
    expect(ethReserves).to.equal(ethers.utils.parseEther("5060"));
    expect(tokenReserves).to.equal(5060);

    await exchange.connect(lp).removeAllLiquidity(MIN_RATE, MAX_RATE);
    [ethReserves, tokenReserves] = await exchange.getReserves();
    expect(ethReserves).to.equal(INITIAL_ETH);
    expect(tokenReserves).to.equal(INITIAL_TOKENS);
  });

  it("swaps ETH for tokens on the constant-product curve", async function () {
    const oldK = INITIAL_ETH.mul(INITIAL_TOKENS);
    await exchange.connect(trader).swapETHForTokens(MAX_RATE, {
      value: ethers.utils.parseEther("100"),
    });

    const [ethReserves, tokenReserves] = await exchange.getReserves();
    expect(ethReserves).to.equal(ethers.utils.parseEther("5097"));
    expect(await token.balanceOf(trader.address)).to.be.gt(0);
    expect(ethReserves.mul(tokenReserves)).to.be.gte(oldK);
  });

  it("swaps tokens for ETH on the constant-product curve", async function () {
    await token.transfer(trader.address, 100);
    await token.connect(trader).approve(exchange.address, 100);

    const oldK = INITIAL_ETH.mul(INITIAL_TOKENS);
    await exchange.connect(trader).swapTokensForETH(100, MAX_RATE);

    const [ethReserves, tokenReserves] = await exchange.getReserves();
    expect(tokenReserves).to.equal(5097);
    expect(ethReserves).to.be.lt(INITIAL_ETH);
    expect(ethReserves.mul(tokenReserves)).to.be.gte(oldK);
  });

  it("rejects invalid liquidity and swap requests", async function () {
    await expect(
      exchange.connect(lp).addLiquidity(MIN_RATE, MAX_RATE, { value: 0 })
    ).to.be.reverted;
    await expect(
      exchange.connect(lp).removeAllLiquidity(MIN_RATE, MAX_RATE)
    ).to.be.revertedWith("No liquidity to remove");
    await expect(
      exchange.connect(trader).swapETHForTokens(MAX_RATE, { value: 0 })
    ).to.be.reverted;
    await expect(exchange.connect(trader).swapTokensForETH(1, MAX_RATE)).to.be
      .reverted;
  });
});
