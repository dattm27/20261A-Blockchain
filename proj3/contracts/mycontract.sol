// SPDX-License-Identifier: UNLICENSED

// DO NOT MODIFY BELOW THIS
pragma solidity ^0.8.17;

import "hardhat/console.sol";

contract Splitwise {
// DO NOT MODIFY ABOVE THIS

// ADD YOUR CONTRACT CODE BELOW

    mapping(address => mapping(address => uint32)) private debts;

    function lookup(address debtor, address creditor)
        public
        view
        returns (uint32 ret)
    {
        return debts[debtor][creditor];
    }

    function add_IOU(
        address creditor,
        uint32 amount,
        address[] calldata path
    ) external {
        require(amount > 0, "amount must be positive");
        require(creditor != address(0), "invalid creditor");
        require(creditor != msg.sender, "cannot owe yourself");

        uint32 reduction = 0;

        if (path.length > 0) {
            require(path[0] == creditor, "path must start at creditor");
            require(
                path[path.length - 1] == msg.sender,
                "path must end at debtor"
            );

            // A simple path prevents a malicious client from subtracting the
            // same debt more than once by repeating a node.
            for (uint256 i = 0; i < path.length; i++) {
                for (uint256 j = i + 1; j < path.length; j++) {
                    require(path[i] != path[j], "path must be simple");
                }
            }

            reduction = amount;
            for (uint256 i = 0; i + 1 < path.length; i++) {
                uint32 edge = debts[path[i]][path[i + 1]];
                require(edge > 0, "path contains no debt");
                if (edge < reduction) {
                    reduction = edge;
                }
            }

            for (uint256 i = 0; i + 1 < path.length; i++) {
                debts[path[i]][path[i + 1]] -= reduction;
            }
        }

        debts[msg.sender][creditor] += amount - reduction;
    }

}
