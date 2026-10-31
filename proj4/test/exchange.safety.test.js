const { expect } = require("chai");
const { ethers, network } = require("hardhat");

describe("TokenExchange fees and slippage", function () {
  const MIN_RATE = 0;
  const MAX_RATE = ethers.constants.MaxUint256;

  let owner;
  let lp;
  let trader;
  let token;
  let exchange;

  beforeEach(async function () {
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
    await exchange.createPool(5000, {
      value: ethers.utils.parseEther("5000"),
    });
  });

  it("charges ETH fees without including them in pricing reserves", async function () {
    const amountIn = ethers.utils.parseEther("100");
    const [quotedTokens, maxRate] = await exchange.quoteETHForTokens(amountIn);

    await exchange.connect(trader).swapETHForTokens(maxRate, {
      value: amountIn,
    });

    const [ethReserves] = await exchange.getReserves();
    const [ethFees, tokenFees] = await exchange.getFeeReserves();
    expect(ethReserves).to.equal(ethers.utils.parseEther("5097"));
    expect(ethFees).to.equal(ethers.utils.parseEther("3"));
    expect(tokenFees).to.equal(0);
    expect(await token.balanceOf(trader.address)).to.equal(quotedTokens);
  });

  it("charges token fees without including them in pricing reserves", async function () {
    await token.transfer(trader.address, 100);
    await token.connect(trader).approve(exchange.address, 100);
    const [, maxRate] = await exchange.quoteTokensForETH(100);

    await exchange.connect(trader).swapTokensForETH(100, maxRate);

    const [, tokenReserves] = await exchange.getReserves();
    const [ethFees, tokenFees] = await exchange.getFeeReserves();
    expect(tokenReserves).to.equal(5097);
    expect(ethFees).to.equal(0);
    expect(tokenFees).to.equal(3);
  });

  it("rejects a stale swap quote", async function () {
    const amountIn = ethers.utils.parseEther("100");
    const [, effectiveRate] = await exchange.quoteETHForTokens(amountIn);

    await expect(
      exchange.connect(trader).swapETHForTokens(effectiveRate.sub(1), {
        value: amountIn,
      })
    ).to.be.revertedWith("Slippage limit exceeded");
  });

  it("enforces both sides of the liquidity rate range", async function () {
    await token.transfer(lp.address, 100);
    await token.connect(lp).approve(exchange.address, 100);

    await expect(
      exchange.connect(lp).addLiquidity(100001, 110000, {
        value: ethers.utils.parseEther("100"),
      })
    ).to.be.revertedWith("Slippage limit exceeded");

    await expect(
      exchange.connect(lp).addLiquidity(90000, 99999, {
        value: ethers.utils.parseEther("100"),
      })
    ).to.be.revertedWith("Slippage limit exceeded");

    await exchange.connect(lp).addLiquidity(99999, 100001, {
      value: ethers.utils.parseEther("100"),
    });
  });

  it("pays an LP its proportional share of accumulated fees", async function () {
    await token.transfer(lp.address, 100);
    await token.connect(lp).approve(exchange.address, 100);
    await exchange.connect(lp).addLiquidity(MIN_RATE, MAX_RATE, {
      value: ethers.utils.parseEther("100"),
    });

    const amountIn = ethers.utils.parseEther("100");
    const [, maxRate] = await exchange.quoteETHForTokens(amountIn);
    await exchange.connect(trader).swapETHForTokens(maxRate, {
      value: amountIn,
    });

    const [feesBefore] = await exchange.getFeeReserves();
    const [lpShares, totalShares] = await exchange.getLiquidityShares(lp.address);
    const expectedReward = feesBefore.mul(lpShares).div(totalShares);

    await exchange.connect(lp).removeAllLiquidity(MIN_RATE, MAX_RATE);

    const [feesAfter] = await exchange.getFeeReserves();
    expect(feesBefore.sub(feesAfter)).to.equal(expectedReward);
    expect(feesAfter).to.be.lt(feesBefore);
  });
});
