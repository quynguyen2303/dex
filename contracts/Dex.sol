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
        bytes32 ticker;
        uint256 id;
        uint256 amount;
        uint256 price;
        uint256 filled;
        Side side;
        uint date;
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
    mapping(address => mapping(bytes32 => uint256)) public traderBalances;
    // mapping to stores order book, pool of orders
    mapping(bytes32 => mapping(uint256 => Order[])) public orderbook; // uint is reference for Side.BUY or Side.SELL
    // pointer for Order book
    uint256 public nextOrderId;
    bytes32 constant DAI = bytes32("DAI");

    constructor() {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can add new token");
        _;
    }
    // modifier to check a token is existed in Dex
    modifier tokenExist(bytes32 _ticker) {
        require(
            tokens[_ticker].tokenAddress != address(0),
            "Token is not in the DEX yet."
        );
        _;
    }

    /**
     * @dev Add a token to Dex
     */
    function addToken(bytes32 _ticker, address _tokenAddress)
        external
        onlyAdmin
    {
        tokens[_ticker] = Token(_ticker, _tokenAddress);
        tokenList.push(_ticker);
    }

    /**
     * @dev Deposit a balance
     */
    function deposit(uint256 _amount, bytes32 _ticker)
        external
        tokenExist(_ticker)
    {
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
        uint256 _amount
    ) external tokenExist(_ticker) {
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
        // TODO: add parame_ters
        bytes32 _ticker,
        uint256 _amount,
        uint256 _price,
        Side _side
    ) external {
        // check the ticker is not DAI, we don't trade DAI
        require(_ticker != DAI, "Cannot trade DAI");
        // Define a order is SELL or BUY
        if (_side == Side.BUY) {
            // Check the balance if SELL or BUY
            require(
                (_amount * _price) < traderBalances[msg.sender][DAI],
                "Not enoung DAI"
            );
        }
        if (_side == Side.SELL) {
            // TODO: Check the balance if SELL or BUY
            require(
                _amount <= traderBalances[msg.sender][_ticker],
                "Not enough token"
            );
        }
        // Add the order to orderbook
        Order[] storage orders = orderbook[_ticker][uint256(_side)];
        orders.push(Order(_ticker, nextOrderId, _amount, _price, 0, _side, block.timestamp));
        // Sort the orderbook as order of best price
        uint i = orders.length - 1;
        while (i > 0) {
            if (_side == Side.BUY && orders[i].price < orders[i-1].price) {
                break;
            } 
            if (_side == Side.SELL && orders[i].price < orders[i-1].price) {
                break;
            } 

            Order memory order = orders[i-1];
            orders[i-1] = orders[i];
            orders[i] = order;
            i--;
        }
        nextOrderId++;
    }

    /**
     * @dev Create a market order
     */
}
