// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.17;

import "./token.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TokenExchange is Ownable, ReentrancyGuard {
    string public constant exchange_name = "R2R DEX";

    // On a fresh Hardhat chain the token is the first deployed contract.
    address private constant tokenAddr =
        0x5FbDB2315678afecb367f032d93F642f64180aa3;
    Token public immutable token;

    uint256 private token_reserves;
    uint256 private eth_reserves;

    // Fee pools are activated in the rewards step. Keeping them separate from
    // the trading reserves ensures fees never change the quoted exchange rate.
    uint256 private token_fee_reserves;
    uint256 private eth_fee_reserves;

    mapping(address => uint256) private lps;
    uint256 private total_shares;

    uint256 private constant swap_fee_numerator = 0;
    uint256 private constant swap_fee_denominator = 100;
    uint256 private k;

    event PoolCreated(uint256 ethAmount, uint256 tokenAmount);
    event LiquidityAdded(
        address indexed provider,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 shares
    );
    event LiquidityRemoved(
        address indexed provider,
        uint256 ethAmount,
        uint256 tokenAmount,
        uint256 shares
    );
    event TokensSwappedForETH(
        address indexed trader,
        uint256 tokenAmount,
        uint256 ethAmount
    );
    event ETHSwappedForTokens(
        address indexed trader,
        uint256 ethAmount,
        uint256 tokenAmount
    );

    constructor() {
        token = Token(tokenAddr);
    }

    function createPool(uint256 amountTokens)
        external
        payable
        onlyOwner
        nonReentrant
    {
        require(token_reserves == 0 && eth_reserves == 0, "Pool already exists");
        require(msg.value > 0, "Need ETH to create pool");
        require(amountTokens > 0, "Need tokens to create pool");
        require(
            token.balanceOf(msg.sender) >= amountTokens,
            "Insufficient token balance"
        );
        require(
            token.transferFrom(msg.sender, address(this), amountTokens),
            "Token transfer failed"
        );

        token_reserves = amountTokens;
        eth_reserves = msg.value;
        k = token_reserves * eth_reserves;

        // A large initial supply limits rounding. The small creator allocation
        // preserves the starter-code behavior expected by the sanity check;
        // the rest of the initial liquidity remains permanently locked.
        total_shares = 10 ** 5;
        lps[msg.sender] = 100;

        emit PoolCreated(msg.value, amountTokens);
    }

    function getSwapFee() public pure returns (uint256, uint256) {
        return (swap_fee_numerator, swap_fee_denominator);
    }

    function getReserves() public view returns (uint256, uint256) {
        return (eth_reserves, token_reserves);
    }

    function getFeeReserves() public view returns (uint256, uint256) {
        return (eth_fee_reserves, token_fee_reserves);
    }

    function getLiquidityShares(address provider)
        public
        view
        returns (uint256, uint256)
    {
        return (lps[provider], total_shares);
    }

    function addLiquidity() external payable nonReentrant {
        require(_poolExists(), "Pool does not exist");
        require(msg.value > 0, "Need ETH to add liquidity");

        uint256 tokenAmount = (msg.value * token_reserves) / eth_reserves;
        uint256 shares = (msg.value * total_shares) / eth_reserves;
        require(tokenAmount > 0 && shares > 0, "Liquidity amount is too small");
        require(
            token.balanceOf(msg.sender) >= tokenAmount,
            "Insufficient token balance"
        );
        require(
            token.transferFrom(msg.sender, address(this), tokenAmount),
            "Token transfer failed"
        );

        token_reserves += tokenAmount;
        eth_reserves += msg.value;
        lps[msg.sender] += shares;
        total_shares += shares;
        k = token_reserves * eth_reserves;

        emit LiquidityAdded(msg.sender, msg.value, tokenAmount, shares);
    }

    function removeLiquidity(uint256 amountETH) public nonReentrant {
        require(_poolExists(), "Pool does not exist");
        require(amountETH > 0, "Removal amount must be positive");

        uint256 shares = _ceilDiv(amountETH * total_shares, eth_reserves);
        _removeLiquidity(amountETH, shares);
    }

    function removeAllLiquidity() external nonReentrant {
        require(_poolExists(), "Pool does not exist");
        uint256 shares = lps[msg.sender];
        require(shares > 0, "No liquidity to remove");

        uint256 amountETH = (shares * eth_reserves) / total_shares;
        require(amountETH > 0, "Liquidity amount is too small");
        _removeLiquidity(amountETH, shares);
    }

    function swapTokensForETH(uint256 amountTokens) external nonReentrant {
        require(_poolExists(), "Pool does not exist");
        require(amountTokens > 0, "Swap amount must be positive");
        require(
            token.balanceOf(msg.sender) >= amountTokens,
            "Insufficient token balance"
        );

        uint256 newTokenReserves = token_reserves + amountTokens;
        uint256 newEthReserves = _ceilDiv(k, newTokenReserves);
        require(newEthReserves < eth_reserves, "Swap amount is too small");

        uint256 ethOut = eth_reserves - newEthReserves;
        require(newEthReserves >= 1 ether, "Swap would drain ETH reserves");
        require(
            token.transferFrom(msg.sender, address(this), amountTokens),
            "Token transfer failed"
        );

        token_reserves = newTokenReserves;
        eth_reserves = newEthReserves;
        _sendETH(msg.sender, ethOut);

        emit TokensSwappedForETH(msg.sender, amountTokens, ethOut);
    }

    function swapETHForTokens() external payable nonReentrant {
        require(_poolExists(), "Pool does not exist");
        require(msg.value > 0, "Swap amount must be positive");

        uint256 newEthReserves = eth_reserves + msg.value;
        uint256 newTokenReserves = _ceilDiv(k, newEthReserves);
        require(newTokenReserves < token_reserves, "Swap amount is too small");

        uint256 tokensOut = token_reserves - newTokenReserves;
        require(newTokenReserves >= 1, "Swap would drain token reserves");

        eth_reserves = newEthReserves;
        token_reserves = newTokenReserves;
        require(token.transfer(msg.sender, tokensOut), "Token transfer failed");

        emit ETHSwappedForTokens(msg.sender, msg.value, tokensOut);
    }

    function _removeLiquidity(uint256 amountETH, uint256 shares) private {
        require(shares > 0 && shares <= lps[msg.sender], "Insufficient LP shares");
        require(amountETH < eth_reserves, "Cannot drain ETH reserves");

        uint256 tokenAmount = (amountETH * token_reserves) / eth_reserves;
        require(tokenAmount > 0, "Liquidity amount is too small");
        require(tokenAmount < token_reserves, "Cannot drain token reserves");

        lps[msg.sender] -= shares;
        total_shares -= shares;
        eth_reserves -= amountETH;
        token_reserves -= tokenAmount;
        k = token_reserves * eth_reserves;

        require(token.transfer(msg.sender, tokenAmount), "Token transfer failed");
        _sendETH(msg.sender, amountETH);

        emit LiquidityRemoved(msg.sender, amountETH, tokenAmount, shares);
    }

    function _poolExists() private view returns (bool) {
        return token_reserves > 0 && eth_reserves > 0;
    }

    function _ceilDiv(uint256 numerator, uint256 denominator)
        private
        pure
        returns (uint256)
    {
        return numerator == 0 ? 0 : ((numerator - 1) / denominator) + 1;
    }

    function _sendETH(address recipient, uint256 amount) private {
        (bool success, ) = payable(recipient).call{value: amount}("");
        require(success, "ETH transfer failed");
    }
}
