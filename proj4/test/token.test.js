const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Token", function () {
  let owner;
  let other;
  let token;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.deployed();
  });

  it("uses the configured name and symbol", async function () {
    expect(await token.name()).to.equal("R2R Token");
    expect(await token.symbol()).to.equal("R2R");
  });

  it("lets the owner mint more than once", async function () {
    await token.mint(40);
    await token.mint(60);

    expect(await token.totalSupply()).to.equal(100);
    expect(await token.balanceOf(owner.address)).to.equal(100);
  });

  it("rejects zero-value and non-owner minting", async function () {
    await expect(token.mint(0)).to.be.revertedWith(
      "Mint amount must be positive"
    );
    await expect(token.connect(other).mint(1)).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });

  it("permanently disables minting", async function () {
    await token.mint(100);
    await token.disable_mint();

    await expect(token.mint(1)).to.be.revertedWith("Minting is disabled");
    expect(await token.totalSupply()).to.equal(100);
  });

  it("only lets the owner disable minting", async function () {
    await expect(token.connect(other).disable_mint()).to.be.revertedWith(
      "Ownable: caller is not the owner"
    );
  });
});
