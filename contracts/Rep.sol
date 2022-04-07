// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "./ERC20.sol";

contract Rep is ERC20 {
    constructor() ERC20("Rep coin", "REP") {}
}