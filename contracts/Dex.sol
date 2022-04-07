// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// Interface for contract
import "./IERC20.sol";

/**
 * @title Dexs
 * @dev Decentralized Exchange
 */
contract Dex {
    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }
    // struct for store an order
    struct Order {
        // TODO
        uint id;
        uint amount;
    }

    // enum for Buy or Sell
    enum Side {
        BUY,
        SELL
    }

    mapping(bytes32 => Token) public tokens;
    bytes32[] public tokenList;
    address public admin;
    // stores trader' balances
    mapping(address => mapping(bytes32 => uint)) public traderBalances;
    // mapping to stores order book, pool of orders
    // TODO
    // pointer for Order book
    // TODO

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can add new token");
        _;
    }
    // modifier to check a token is existed in Dex
    modifier tokenExist(bytes32 _ticker) {
        require(tokens[_ticker].tokenAddress != address(0),
        "Token is not in the DEX yet.");
        _;
    }

    /**
     * @dev Add a token to Dex
     */
    function addToken(
        bytes32 _ticker,
        address _tokenAddress)
        onlyAdmin()
        external {
            tokens[_ticker] = Token(_ticker, _tokenAddress);
            tokenList.push(_ticker);
    }

    /**
     * @dev Deposit a balance
     */
    function deposit(
        uint _amount,
        bytes32 _ticker)
        tokenExist(_ticker)
        external {
            IERC20(tokens[_ticker].tokenAddress).transferFrom(
                msg.sender,
                address(this),
                _amount
            );
            traderBalances[msg.sender][_ticker] += _amount;
    }

    /**
     * @dev Withdraw a balance
     */
    function withdraw(
        address _to,
        bytes32 _ticker,
        uint _amount)
        tokenExist(_ticker)
        external {
            require(
                traderBalances[msg.sender][_ticker] >= _amount,
                "Balance is too low"
            );
            IERC20(tokens[_ticker].tokenAddress).transferFrom(
                address(this),
                _to,
                _amount
            );
            traderBalances[msg.sender][_ticker] -= _amount;
    }

    /**
     * @dev Create a limit order
     */
    function createLimitOrder(
        // TODO: add parameters
        ) 
        external {
        // TODO: check the ticker is not DAI, we don't trade DAI

        // TODO: Define a order is SELL or BUY

        // TODO: Check the balance if SELL or BUY

        // TODO: Add the order to orderbook

        // TODO: Sort the orderbook as order of best price

    }
    
}