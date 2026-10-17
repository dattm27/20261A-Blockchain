const assert = require("assert");
const fs = require("fs");
const net = require("net");
const path = require("path");
const vm = require("vm");
const { spawn } = require("child_process");
const ethers = require("ethers");

const projectRoot = path.resolve(__dirname, "..");
let rpcUrl;

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
  });
}

function waitForNode(process) {
  return new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => {
      reject(new Error(`Timed out waiting for the Hardhat node\n${output}`));
    }, 20000);

    function inspect(chunk) {
      output += chunk.toString();
      if (output.includes("Started HTTP and WebSocket JSON-RPC server")) {
        clearTimeout(timeout);
        resolve();
      }
    }

    process.stdout.on("data", inspect);
    process.stderr.on("data", inspect);
    process.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(
        `Hardhat node exited before startup with code ${code}\n${output}`
      ));
    });
  });
}

function makeJQueryStub() {
  return function jqueryStub() {
    return {
      change() {},
      click() {},
      html() {},
      val() { return ""; }
    };
  };
}

async function stopProcess(process) {
  if (process.exitCode !== null) {
    return;
  }

  await new Promise((resolve) => {
    const forceStop = setTimeout(() => process.kill("SIGKILL"), 3000);
    process.once("exit", () => {
      clearTimeout(forceStop);
      resolve();
    });
    process.kill("SIGTERM");
  });
}

function loadClient(contractAddress) {
  const context = {
    console,
    ethers,
    XMLHttpRequest: function XMLHttpRequest() {},
    setTimeout,
    clearTimeout,
    Promise,
    Set,
    Date,
    $: makeJQueryStub(),
    window: { location: { reload() {} } },
    timeConverter(timestamp) { return String(timestamp); }
  };
  vm.createContext(context);

  const decoderSource = fs.readFileSync(
    path.join(projectRoot, "web_app", "abi-decoder.js"),
    "utf8"
  );
  vm.runInContext(decoderSource, context, { filename: "abi-decoder.js" });

  let clientSource = fs.readFileSync(
    path.join(projectRoot, "web_app", "script.js"),
    "utf8"
  );
  clientSource = clientSource.replace(
    /new ethers\.providers\.JsonRpcProvider\("[^"]+"\)/,
    `new ethers.providers.JsonRpcProvider("${rpcUrl}")`
  );
  clientSource = clientSource.replace(
    /var contractAddress = "[^"]*";/,
    `var contractAddress = "${contractAddress}";`
  );
  vm.runInContext(clientSource, context, { filename: "script.js" });
  return context;
}

async function main() {
  const rpcPort = await getFreePort();
  rpcUrl = `http://127.0.0.1:${rpcPort}`;
  const hardhatCli = path.join(
    projectRoot,
    "node_modules",
    "hardhat",
    "internal",
    "cli",
    "cli.js"
  );
  const nodeProcess = spawn(
    process.execPath,
    [hardhatCli, "node", "--port", String(rpcPort)],
    {
      cwd: projectRoot,
      stdio: ["ignore", "pipe", "pipe"]
    }
  );

  try {
    await waitForNode(nodeProcess);

    const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
    const accounts = await provider.listAccounts();
    const artifact = JSON.parse(
      fs.readFileSync(
        path.join(
          projectRoot,
          "artifacts",
          "contracts",
          "mycontract.sol",
          "Splitwise.json"
        ),
        "utf8"
      )
    );
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      provider.getSigner(accounts[0])
    );
    const contract = await factory.deploy();
    await contract.deployed();

    const client = loadClient(contract.address);
    client.defaultAccount = accounts[0];

    assert.deepStrictEqual(Array.from(await client.getUsers()), []);
    assert.strictEqual(await client.getTotalOwed(accounts[0]), 0);
    assert.strictEqual(await client.getLastActive(accounts[0]), null);

    await client.add_IOU(accounts[1], 10);
    let users = Array.from(await client.getUsers());
    assert.strictEqual(users.length, 2);
    assert(users.includes(accounts[0].toLowerCase()));
    assert(users.includes(accounts[1].toLowerCase()));
    assert.strictEqual(await client.getTotalOwed(accounts[0]), 10);

    const lastActive = await client.getLastActive(accounts[0].toUpperCase());
    assert.strictEqual(typeof lastActive, "number");
    assert(lastActive > 0);

    client.defaultAccount = accounts[1];
    await client.add_IOU(accounts[2], 7);
    client.defaultAccount = accounts[2];
    await client.add_IOU(accounts[0], 8);

    assert.strictEqual(await client.getTotalOwed(accounts[0]), 3);
    assert.strictEqual(await client.getTotalOwed(accounts[1]), 0);
    assert.strictEqual(await client.getTotalOwed(accounts[2]), 1);

    console.log("Client integration: all checks passed");
  } finally {
    await stopProcess(nodeProcess);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
