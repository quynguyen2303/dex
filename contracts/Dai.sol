pragma solidity ^0.8.0;
import "./ERC20.sol";

contract Dai is ERC20 {
    constructor() ERC20("Dai Stablecoin", "DAI") public {}

}