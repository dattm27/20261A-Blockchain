const assert = require("assert");
const { ethers } = require("hardhat");

async function expectRevert(promise, reason) {
  try {
    await promise;
    assert.fail("Expected transaction to revert");
  } catch (error) {
    assert(
      error.message.includes(reason),
      `Expected revert containing "${reason}", received: ${error.message}`
    );
  }
}

describe("Splitwise", function () {
  let splitwise;
  let alice;
  let bob;
  let carol;

  beforeEach(async function () {
    [alice, bob, carol] = await ethers.getSigners();
    const Splitwise = await ethers.getContractFactory("Splitwise");
    splitwise = await Splitwise.deploy();
    await splitwise.deployed();
  });

  async function lookup(debtor, creditor) {
    const amount = await splitwise.lookup(debtor.address, creditor.address);
    return Number(amount.toString());
  }

  it("starts empty and adds IOUs cumulatively", async function () {
    assert.strictEqual(await lookup(alice, bob), 0);

    await splitwise.connect(alice).add_IOU(bob.address, 7, []);
    await splitwise.connect(alice).add_IOU(bob.address, 5, []);

    assert.strictEqual(await lookup(alice, bob), 12);
  });

  it("resolves a three-person cycle using its minimum edge", async function () {
    await splitwise.connect(alice).add_IOU(bob.address, 15, []);
    await splitwise.connect(bob).add_IOU(carol.address, 11, []);
    await splitwise
      .connect(carol)
      .add_IOU(alice.address, 16, [alice.address, bob.address, carol.address]);

    assert.strictEqual(await lookup(alice, bob), 4);
    assert.strictEqual(await lookup(bob, carol), 0);
    assert.strictEqual(await lookup(carol, alice), 5);
  });

  it("resolves a cycle when the new IOU is the minimum", async function () {
    await splitwise.connect(alice).add_IOU(bob.address, 15, []);
    await splitwise.connect(bob).add_IOU(carol.address, 11, []);
    await splitwise
      .connect(carol)
      .add_IOU(alice.address, 9, [alice.address, bob.address, carol.address]);

    assert.strictEqual(await lookup(alice, bob), 6);
    assert.strictEqual(await lookup(bob, carol), 2);
    assert.strictEqual(await lookup(carol, alice), 0);
  });

  it("handles repayment as an ordinary two-person cycle", async function () {
    await splitwise.connect(alice).add_IOU(bob.address, 10, []);
    await splitwise
      .connect(bob)
      .add_IOU(alice.address, 10, [alice.address, bob.address]);

    assert.strictEqual(await lookup(alice, bob), 0);
    assert.strictEqual(await lookup(bob, alice), 0);
  });

  it("rejects invalid amounts, creditors, and cycle paths", async function () {
    await expectRevert(
      splitwise.connect(alice).add_IOU(bob.address, 0, []),
      "amount must be positive"
    );
    await expectRevert(
      splitwise.connect(alice).add_IOU(alice.address, 1, []),
      "cannot owe yourself"
    );

    await splitwise.connect(alice).add_IOU(bob.address, 10, []);
    await expectRevert(
      splitwise
        .connect(carol)
        .add_IOU(alice.address, 5, [alice.address, bob.address, alice.address, carol.address]),
      "path must be simple"
    );
    await expectRevert(
      splitwise
        .connect(carol)
        .add_IOU(alice.address, 5, [alice.address, bob.address, carol.address]),
      "path contains no debt"
    );

    assert.strictEqual(await lookup(alice, bob), 10);
    assert.strictEqual(await lookup(carol, alice), 0);
  });
});
