// =================== CS251 DEX Project =================== // 
//        @author: Gordon Martinez-Piedra '23
// ========================================================= //                  

// Set up Ethers.js
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
var defaultAccount;

const exchange_name = 'R2R DEX';

const token_name = 'R2R Token';
const token_symbol = 'R2R';


// =============================================================================
//                          ABIs: Paste Your ABIs Here
// =============================================================================

const token_address = '0x5FbDB2315678afecb367f032d93F642f64180aa3';
const token_abi = [
    'function mint(uint256 amount)',
    'function disable_mint()',
    'function approve(address spender, uint256 amount) returns (bool)',
    'function balanceOf(address account) view returns (uint256)'
];
const token_contract = new ethers.Contract(token_address, token_abi, provider.getSigner());

const exchange_address = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
const exchange_abi = [
    'function createPool(uint256 amountTokens) payable',
    'function getReserves() view returns (uint256, uint256)',
    'function getPricingReserves() view returns (uint256, uint256)',
    'function getSwapFee() view returns (uint256, uint256)',
    'function getExchangeRate() view returns (uint256)',
    'function quoteETHForTokens(uint256 amountETH) view returns (uint256, uint256)',
    'function quoteTokensForETH(uint256 amountTokens) view returns (uint256, uint256)',
    'function addLiquidity(uint256 minExchangeRate, uint256 maxExchangeRate) payable',
    'function removeLiquidity(uint256 amountETH, uint256 minExchangeRate, uint256 maxExchangeRate)',
    'function removeAllLiquidity(uint256 minExchangeRate, uint256 maxExchangeRate)',
    'function swapTokensForETH(uint256 amountTokens, uint256 maxExchangeRate)',
    'function swapETHForTokens(uint256 maxExchangeRate) payable'
];
const exchange_contract = new ethers.Contract(exchange_address, exchange_abi, provider.getSigner());

const PERCENT_DENOMINATOR = ethers.BigNumber.from(100);



// =============================================================================
//                              Provided Functions
// =============================================================================
// Reading and understanding these should help you implement the above

// make a global tracking pool state
var poolState;

/*** INIT ***/
async function init() {
    poolState = await getPoolState();
    console.log("starting init");
    if (poolState['token_liquidity'] === 0
            && poolState['eth_liquidity'] === 0) {
      // Call mint twice to make sure mint can be called mutliple times prior to disable_mint
      // total_supply is 10^5 which we represent as 10**5
      // Note a 10**5 off
      const total_supply = 100000;
      const signer = provider.getSigner(defaultAccount);
      await waitForTransaction(token_contract.connect(signer).mint(total_supply / 2));
      await waitForTransaction(token_contract.connect(signer).mint(total_supply / 2));
      await waitForTransaction(token_contract.connect(signer).disable_mint());
      await waitForTransaction(token_contract.connect(signer).approve(exchange_address, total_supply));
      // initialize pool with equal amounts of ETH and tokens, so exchange rate begins as 1:1
      await waitForTransaction(exchange_contract.connect(signer).createPool(5000, {
          value: ethers.utils.parseEther("5000")
      }));
      console.log("init finished");

       // All accounts start with 0 of your tokens. Thus, be sure to swap before adding liquidity.
    }
}

async function getPoolState() {
    // read pool balance for each type of liquidity:
    let accounts = await provider.listAccounts();
    let poolReserves = await exchange_contract.connect(provider.getSigner(accounts[0])).getReserves();
    // Convert WEI to ETH for UI
    let liquidity_eth = Number(ethers.utils.formatEther(poolReserves[0]));
    let liquidity_tokens = Number(poolReserves[1].toString());
    return {
        token_liquidity: liquidity_tokens,
        eth_liquidity: liquidity_eth,
        token_eth_rate: liquidity_tokens / liquidity_eth,
        eth_token_rate: liquidity_eth / liquidity_tokens,
    };
}

async function waitForTransaction(transactionPromise) {
    const transaction = await transactionPromise;
    return transaction.wait();
}

function parseSlippage(maxSlippagePct) {
    const slippage = Number(maxSlippagePct);
    if (!Number.isInteger(slippage) || slippage < 0 || slippage > 100) {
        throw new Error("Slippage must be an integer from 0 to 100");
    }
    return ethers.BigNumber.from(slippage);
}

function parseTokenAmount(amountToken) {
    const value = String(amountToken).trim();
    if (!/^\d+$/.test(value)) {
        throw new Error("Token amount must be a positive integer");
    }
    const amount = ethers.BigNumber.from(value);
    if (amount.isZero()) {
        throw new Error("Token amount must be positive");
    }
    return amount;
}

function parseEthAmount(amountEth) {
    const amount = ethers.utils.parseEther(String(amountEth).trim());
    if (amount.isZero()) {
        throw new Error("ETH amount must be positive");
    }
    return amount;
}

async function getRateBounds(maxSlippagePct) {
    const slippage = parseSlippage(maxSlippagePct);
    const rate = await exchange_contract.getExchangeRate();
    const minRate = rate.mul(PERCENT_DENOMINATOR.sub(slippage)).div(PERCENT_DENOMINATOR);
    const maxRate = rate
        .mul(PERCENT_DENOMINATOR.add(slippage))
        .add(PERCENT_DENOMINATOR.sub(1))
        .div(PERCENT_DENOMINATOR);
    return [minRate, maxRate];
}

function quoteRateWithSlippage(quotedRate, maxSlippagePct) {
    const slippage = parseSlippage(maxSlippagePct);
    return quotedRate
        .mul(PERCENT_DENOMINATOR.add(slippage))
        .add(PERCENT_DENOMINATOR.sub(1))
        .div(PERCENT_DENOMINATOR);
}

// ============================================================
//                    FUNCTIONS TO IMPLEMENT
// ============================================================

// Note: maxSlippagePct will be passed in as an int out of 100. 
// Be sure to divide by 100 for your calculations.

/*** ADD LIQUIDITY ***/
async function addLiquidity(amountEth, maxSlippagePct) {
    const signer = provider.getSigner(defaultAccount);
    const amountWei = parseEthAmount(amountEth);
    const [minRate, maxRate] = await getRateBounds(maxSlippagePct);
    const reserves = await exchange_contract.getPricingReserves();
    const tokenAmount = amountWei.mul(reserves[1]).div(reserves[0]);
    if (tokenAmount.isZero()) {
        throw new Error("Liquidity amount is too small");
    }

    await waitForTransaction(
        token_contract.connect(signer).approve(exchange_address, tokenAmount)
    );
    return waitForTransaction(
        exchange_contract.connect(signer).addLiquidity(minRate, maxRate, {
            value: amountWei
        })
    );
}

/*** REMOVE LIQUIDITY ***/
async function removeLiquidity(amountEth, maxSlippagePct) {
    const amountWei = parseEthAmount(amountEth);
    const [minRate, maxRate] = await getRateBounds(maxSlippagePct);
    return waitForTransaction(
        exchange_contract
            .connect(provider.getSigner(defaultAccount))
            .removeLiquidity(amountWei, minRate, maxRate)
    );
}

async function removeAllLiquidity(maxSlippagePct) {
    const [minRate, maxRate] = await getRateBounds(maxSlippagePct);
    return waitForTransaction(
        exchange_contract
            .connect(provider.getSigner(defaultAccount))
            .removeAllLiquidity(minRate, maxRate)
    );
}

/*** SWAP ***/
async function swapTokensForETH(amountToken, maxSlippagePct) {
    const signer = provider.getSigner(defaultAccount);
    const amount = parseTokenAmount(amountToken);
    const quote = await exchange_contract.quoteTokensForETH(amount);
    const maxRate = quoteRateWithSlippage(quote[1], maxSlippagePct);

    await waitForTransaction(
        token_contract.connect(signer).approve(exchange_address, amount)
    );
    return waitForTransaction(
        exchange_contract.connect(signer).swapTokensForETH(amount, maxRate)
    );
}

async function swapETHForTokens(amountEth, maxSlippagePct) {
    const signer = provider.getSigner(defaultAccount);
    const amountWei = parseEthAmount(amountEth);
    const quote = await exchange_contract.quoteETHForTokens(amountWei);
    const maxRate = quoteRateWithSlippage(quote[1], maxSlippagePct);

    return waitForTransaction(
        exchange_contract.connect(signer).swapETHForTokens(maxRate, {
            value: amountWei
        })
    );
}

// =============================================================================
//                                      UI
// =============================================================================


// This sets the default account on load and displays the total owed to that
// account.
provider.listAccounts().then((response)=> {
    defaultAccount = response[0];
    // Initialize the exchange
    init().then(() => {
        // fill in UI with current exchange rate:
        getPoolState().then((poolState) => {
            $("#eth-token-rate-display").html("1 ETH = " + poolState['token_eth_rate'] + " " + token_symbol);
            $("#token-eth-rate-display").html("1 " + token_symbol + " = " + poolState['eth_token_rate'] + " ETH");

            $("#token-reserves").html(poolState['token_liquidity'] + " " + token_symbol);
            $("#eth-reserves").html(poolState['eth_liquidity'] + " ETH");
        });
    });
});

// Allows switching between accounts in 'My Account'
provider.listAccounts().then((response)=>{
    var opts = response.map(function (a) { return '<option value="'+
            a.toLowerCase()+'">'+a.toLowerCase()+'</option>' });
    $(".account").html(opts);
});

// This runs the 'swapETHForTokens' function when you click the button
$("#swap-eth").click(function() {
    defaultAccount = $("#myaccount").val(); //sets the default account
  swapETHForTokens($("#amt-to-swap").val(), $("#max-slippage-swap").val()).then((response)=>{
        window.location.reload(true); // refreshes the page after add_IOU returns and the promise is unwrapped
    })
});

// This runs the 'swapTokensForETH' function when you click the button
$("#swap-token").click(function() {
    defaultAccount = $("#myaccount").val(); //sets the default account
  swapTokensForETH($("#amt-to-swap").val(), $("#max-slippage-swap").val()).then((response)=>{
        window.location.reload(true); // refreshes the page after add_IOU returns and the promise is unwrapped
    })
});

// This runs the 'addLiquidity' function when you click the button
$("#add-liquidity").click(function() {
    console.log("Account: ", $("#myaccount").val());
    defaultAccount = $("#myaccount").val(); //sets the default account
  addLiquidity($("#amt-eth").val(), $("#max-slippage-liquid").val()).then((response)=>{
        window.location.reload(true); // refreshes the page after add_IOU returns and the promise is unwrapped
    })
});

// This runs the 'removeLiquidity' function when you click the button
$("#remove-liquidity").click(function() {
    defaultAccount = $("#myaccount").val(); //sets the default account
  removeLiquidity($("#amt-eth").val(), $("#max-slippage-liquid").val()).then((response)=>{
        window.location.reload(true); // refreshes the page after add_IOU returns and the promise is unwrapped
    })
});

// This runs the 'removeAllLiquidity' function when you click the button
$("#remove-all-liquidity").click(function() {
    defaultAccount = $("#myaccount").val(); //sets the default account
  removeAllLiquidity($("#max-slippage-liquid").val()).then((response)=>{
        window.location.reload(true); // refreshes the page after add_IOU returns and the promise is unwrapped
    })
});

$("#swap-eth").html("Swap ETH for " + token_symbol);

$("#swap-token").html("Swap " + token_symbol + " for ETH");

$("#title").html(exchange_name);


// This is a log function, provided if you want to display things to the page instead of the JavaScript console
// Pass in a discription of what you're printing, and then the object to print
function log(description, obj) {
    $("#log").html($("#log").html() + description + ": " + JSON.stringify(obj, null, 2) + "\n\n");
}


// =============================================================================
//                                SANITY CHECK
// =============================================================================
function check(name, swap_rate, condition) {
	if (condition) {
		console.log(name + ": SUCCESS");
		return (swap_rate == 0 ? 6 : 10);
	} else {
		console.log(name + ": FAILED");
		return 0;
	}
}


const sanityCheck = async function() {
  var swap_fee = await exchange_contract.connect(provider.getSigner(defaultAccount)).getSwapFee();
  console.log("Beginning Sanity Check.");

  var accounts = await provider.listAccounts();
  defaultAccount = accounts[1];
  var score = 0;
  var start_state = await getPoolState();
  console.log(`Start state ${JSON.stringify(start_state)}`)
  var start_tokens = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);

  // No liquidity provider rewards implemented yet
  if (Number(swap_fee[0].toString()) == 0) {
      await swapETHForTokens("100", "1");
      var state1 = await getPoolState();
      // TODO: remove this line
      console.log(state1)
      var expected_tokens_received = 100 * start_state.token_eth_rate;
      var user_tokens1 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);
      score += check("Testing simple exchange of ETH to token", swap_fee[0],
        Math.abs((start_state.token_liquidity - expected_tokens_received) - state1.token_liquidity) < 5 &&
        (state1.eth_liquidity - start_state.eth_liquidity) === 100 &&
        Math.abs(Number(start_tokens) + expected_tokens_received - Number(user_tokens1)) < 5);
      
      await swapTokensForETH("90", "1");
      var state2 = await getPoolState();
      // TODO: remove this line
      console.log(state2)
      var expected_eth_received = 90 * state1.eth_token_rate;
      var user_tokens2 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);
      score += check("Test simple exchange of token to ETH", swap_fee[0], 
        state2.token_liquidity === (state1.token_liquidity + 90) && 
        Math.abs((state1.eth_liquidity - expected_eth_received) - state2.eth_liquidity) < 5 &&
        Number(user_tokens2) === (Number(user_tokens1) - 90));
      
      defaultAccount = accounts[0];
      var state2 = await getPoolState();
      user_tokens2 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);

      await addLiquidity("100", "1");
      var expected_tokens_added = 100 * state2.token_eth_rate;
      var state3 = await getPoolState();
      // TODO: remove this line
      console.log(state3)
      var user_tokens3 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);
      score += check("Test adding liquidity", swap_fee[0], 
        state3.eth_liquidity === (state2.eth_liquidity + 100) &&
        Math.abs(state3.token_liquidity - (state2.token_liquidity + expected_tokens_added)) < 5 &&
        Math.abs(Number(user_tokens3) - (Number(user_tokens2) - expected_tokens_added)) < 5);
      
      await removeLiquidity("10", "1");
      var expected_tokens_removed = 10 * state3.token_eth_rate;
      var state4 = await getPoolState();
      console.log(state4)
      var user_tokens4 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);
      score += check("Test removing liquidity", swap_fee[0], 
        state4.eth_liquidity === (state3.eth_liquidity - 10) &&
        Math.abs(state4.token_liquidity - (state3.token_liquidity - expected_tokens_removed)) < 5 &&
        Math.abs(Number(user_tokens4) - (Number(user_tokens3) + expected_tokens_removed)) < 5);

      await removeAllLiquidity("1");
      expected_tokens_removed = 90 * state4.token_eth_rate;
      var state5 = await getPoolState();
      console.log(state5);
      var user_tokens5 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);
      score += check("Test removing all liquidity", swap_fee[0], 
        state5.eth_liquidity - (state4.eth_liquidity - 90) < 5 && 
        Math.abs(state5.token_liquidity - (state4.token_liquidity - expected_tokens_removed)) < 5 &&
        Math.abs(Number(user_tokens5) - (Number(user_tokens4) + expected_tokens_removed)) < 5); 
  }

  // LP provider rewards implemented
  else {
      var swap_fee = Number(swap_fee[0].toString()) /
          Number(swap_fee[1].toString());
      console.log("swap fee: ", swap_fee);

      await swapETHForTokens("100", "1");
      var state1 = await getPoolState();
      var expected_tokens_received = 100 * (1 - swap_fee) * start_state.token_eth_rate;
      var user_tokens1 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);
      score += check("Testing simple exchange of ETH to token", swap_fee[0], 
        Math.abs((start_state.token_liquidity - expected_tokens_received) - state1.token_liquidity) < 5 &&
        (state1.eth_liquidity - start_state.eth_liquidity) === 100 &&
        Math.abs(Number(start_tokens) + expected_tokens_received - Number(user_tokens1)) < 5);
      
      await swapTokensForETH("90", "1");
      var state2 = await getPoolState();
      var expected_eth_received = 90 * (1 - swap_fee) * state1.eth_token_rate;
      var user_tokens2 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);
      score += check("Test simple exchange of token to ETH", swap_fee[0], 
        state2.token_liquidity === (state1.token_liquidity + 90) && 
        Math.abs((state1.eth_liquidity - expected_eth_received) - state2.eth_liquidity) < 5 &&
        Number(user_tokens2) === (Number(user_tokens1) - 90));

      defaultAccount = accounts[0];
      var state2 = await getPoolState();
      user_tokens2 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);
      
      await addLiquidity("100", "1");
      var expected_tokens_added = 100 * state2.token_eth_rate;
      var state3 = await getPoolState();
      var user_tokens3 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);
      score += check("Test adding liquidity", swap_fee[0], 
        state3.eth_liquidity === (state2.eth_liquidity + 100) &&
        Math.abs(state3.token_liquidity - (state2.token_liquidity + expected_tokens_added)) < 5 &&
        Math.abs(Number(user_tokens3) - (Number(user_tokens2) - expected_tokens_added)) < 5);
      

      // accumulate some lp rewards
      for (var i = 0; i < 20; i++) {
        await swapETHForTokens("100", "1");
        await swapTokensForETH("100", "1");
      }

      var state4 = await getPoolState();
      var user_tokens4 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);
      await removeLiquidity("50", "1");
      // set to 22 for a bit of leeway, could potentially reduce to 20 
      var approx_eth_removed = 50 + (20 * 100 * swap_fee * 50/5100);
      var approx_tokens_removed = 50 * state4.token_eth_rate + (20 * 100 * swap_fee * 50/5100);
      var state5 = await getPoolState();
      var user_tokens5 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);
      score += check("Test removing liquidity", swap_fee[0], 
        Math.abs(state5.eth_liquidity - (state4.eth_liquidity - approx_eth_removed)) < 10 &&
        Math.abs(state5.token_liquidity - (state4.token_liquidity - approx_tokens_removed)) < 10 &&
        Number(user_tokens5) > Number(user_tokens4) + 45);

      await removeAllLiquidity("1");
      var approx_eth_removed = 50 + (20 * 100 * swap_fee * 50/5100);
      var approx_tokens_removed = 50 * state3.token_eth_rate + (20 * 100 * swap_fee * 50/5100);
      var state6 = await getPoolState();
      var user_tokens6 = await token_contract.connect(provider.getSigner(defaultAccount)).balanceOf(defaultAccount);
      score += check("Test removing all liquidity", swap_fee[0], 
        Math.abs(state6.eth_liquidity - (state5.eth_liquidity - approx_eth_removed)) < 10 &&
        Math.abs(state6.token_liquidity - (state5.token_liquidity - approx_tokens_removed)) < 10 &&
        Number(user_tokens6) > Number(user_tokens5) + 45 ); 
  }
  console.log("Final score: " + score + "/50");

}

// Run sanityCheck() manually from the browser console after init() completes.
// It is intentionally not automatic because it mutates the pool substantially.
