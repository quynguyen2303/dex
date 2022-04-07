// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "./ERC20.sol";

contract Bat is ERC20 {
    constructor() ERC20("Brave Browser", "BAT") {}
}