const { spawn } = require("child_process");
const fs = require("fs");
const net = require("net");
const path = require("path");
const vm = require("vm");
const { ethers } = require("ethers");

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

async function waitFor(predicate, message, timeoutMs = 60000) {
  const startedAt = Date.now();
  let lastError;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const value = await predicate();
      if (value) return value;
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`${message}${lastError ? `: ${lastError.message}` : ""}`);
}

function jqueryStub() {
  return {
    html() {
      return this;
    },
    click() {
      return this;
    },
    change() {
      return this;
    },
    val() {
      return "";
    },
  };
}

async function main() {
  const projectRoot = path.resolve(__dirname, "..");
  const port = await getFreePort();
  const hardhatExecutable = path.join(
    projectRoot,
    "node_modules",
    ".bin",
    process.platform === "win32" ? "hardhat.cmd" : "hardhat"
  );
  const node = spawn(
    hardhatExecutable,
    ["node", "--hostname", "127.0.0.1", "--port", String(port)],
    { cwd: projectRoot, stdio: ["ignore", "pipe", "pipe"] }
  );

  let nodeOutput = "";
  node.stdout.on("data", (chunk) => {
    nodeOutput = (nodeOutput + chunk.toString()).slice(-12000);
  });
  node.stderr.on("data", (chunk) => {
    nodeOutput = (nodeOutput + chunk.toString()).slice(-12000);
  });

  try {
    const rpcUrl = `http://127.0.0.1:${port}`;
    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    await waitFor(
      async () => (await provider.listAccounts()).length === 20,
      "Hardhat node did not start"
    );

    const tokenArtifact = require("../artifacts/contracts/token.sol/Token.json");
    const exchangeArtifact = require(
      "../artifacts/contracts/exchange.sol/TokenExchange.json"
    );
    const signer = provider.getSigner(0);
    const tokenFactory = new ethers.ContractFactory(
      tokenArtifact.abi,
      tokenArtifact.bytecode,
      signer
    );
    const token = await tokenFactory.deploy();
    await token.deployed();
    const exchangeFactory = new ethers.ContractFactory(
      exchangeArtifact.abi,
      exchangeArtifact.bytecode,
      signer
    );
    const exchange = await exchangeFactory.deploy();
    await exchange.deployed();

    if (
      token.address.toLowerCase() !==
        "0x5fbdb2315678afecb367f032d93f642f64180aa3" ||
      exchange.address.toLowerCase() !==
        "0xe7f1725e7734ce288f8367e1bb143e90bb3f0512"
    ) {
      throw new Error("Unexpected deterministic Hardhat deployment addresses");
    }

    const clientPath = path.join(projectRoot, "web_app", "exchange.js");
    const clientSource = fs
      .readFileSync(clientPath, "utf8")
      .replace("http://127.0.0.1:8545", rpcUrl);
    const context = {
      console,
      ethers,
      $: jqueryStub,
      window: { location: { reload() {} } },
      setTimeout,
      clearTimeout,
    };
    vm.createContext(context);
    vm.runInContext(clientSource, context, { filename: clientPath });

    await waitFor(async () => {
      const [ethReserves, tokenReserves] = await exchange.getReserves();
      return !ethReserves.isZero() && !tokenReserves.isZero();
    }, "Browser client did not initialize the pool");

    const accounts = await provider.listAccounts();
    const initializedSnapshot = await provider.send("evm_snapshot", []);
    await vm.runInContext("sanityCheck()", context);
    await provider.send("evm_revert", [initializedSnapshot]);

    context.defaultAccount = accounts[1];
    await context.swapETHForTokens("100", "5");
    const traderBalance = await token.balanceOf(accounts[1]);
    if (traderBalance.isZero()) {
      throw new Error("Client ETH-to-token swap produced no tokens");
    }

    await context.addLiquidity("10", "5");
    let [shares] = await exchange.getLiquidityShares(accounts[1]);
    if (shares.isZero()) {
      throw new Error("Client add-liquidity call produced no LP shares");
    }

    await context.removeAllLiquidity("5");
    [shares] = await exchange.getLiquidityShares(accounts[1]);
    if (!shares.isZero()) {
      throw new Error("Client remove-all call left LP shares behind");
    }

    console.log("Client integration: initialization, swap, add, and remove passed");
  } catch (error) {
    if (nodeOutput) {
      console.error("Hardhat node output (tail):\n" + nodeOutput);
    }
    throw error;
  } finally {
    node.kill("SIGTERM");
    await new Promise((resolve) => {
      if (node.exitCode !== null) {
        resolve();
        return;
      }
      node.once("exit", resolve);
      setTimeout(resolve, 2000);
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
