// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import @openzeppelin/contracts;

contract Dai is ERC20 {
    constructor() ERC20("Dai Stablecoin", "DAI") {}
}