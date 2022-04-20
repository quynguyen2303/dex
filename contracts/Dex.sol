// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

// Interface for contract
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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
        uint256 date;
        address owner;
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
    uint256 public nextTradeId;
    // stores DAI ticker for consistent and save gas cause it only runs when compile
    bytes32 constant DAI = bytes32("DAI");

    // event for a new trade
    event NewTrade(
        uint256 tradeId,
        bytes32 ticker,
        uint256 amount,
        address seller,
        address buyer,
        uint256 price,
        uint256 date
    );

    constructor() {
        admin = msg.sender;
    }
    // modifier to add new token to the exchange
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can add new token");
        _;
    }
    // modifier to check a token is existed in Dex
    modifier tokenExists(bytes32 _ticker) {
        require(
            tokens[_ticker].tokenAddress != address(0),
            "Token is not in the DEX yet."
        );
        _;
    }
    // modifier to check the trade token is not DAI
    modifier isNotDAI(bytes32 _ticker) {
        require(_ticker != bytes32("DAI"), "Cannot trade DAI.");
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
    function deposit(bytes32 _ticker, uint256 _amount )
        external
        tokenExists(_ticker)
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
        bytes32 _ticker,
        uint256 _amount
        ) 
        external 
        tokenExists(_ticker) {
        require(
            traderBalances[msg.sender][_ticker] >= _amount,
            "Balance is too low"
        );

        IERC20(tokens[_ticker].tokenAddress).transfer(
            msg.sender,
            _amount
        );
        traderBalances[msg.sender][_ticker] -= _amount;
    }
    /**
     * @dev Create a limit order
     */
    function createLimitOrder(
        bytes32 _ticker,
        uint256 _amount,
        uint256 _price,
        Side _side
        ) 
        external 
        isNotDAI(_ticker) 
        tokenExists(_ticker) {
        // Define a order is SELL or BUY
        if (_side == Side.BUY) {
            // Check the balance if SELL or BUY
            require(
                (_amount * _price) < traderBalances[msg.sender][DAI],
                "Not enoung DAI"
            );
        }
        if (_side == Side.SELL) {
            // Check the balance if SELL or BUY
            require(
                _amount <= traderBalances[msg.sender][_ticker],
                "Not enough token"
            );
        }
        // Add the order to orderbook
        Order[] storage orders = orderbook[_ticker][uint256(_side)];
        orders.push(
            Order(
                _ticker,
                nextOrderId,
                _amount,
                _price,
                0,
                _side,
                block.timestamp,
                msg.sender
            )
        );
        // Sort the orderbook as order of best price
        uint256 i = orders.length > 0 ? (orders.length - 1) : 0;
        while (i > 0) {
            if (_side == Side.BUY && orders[i].price < orders[i - 1].price) {
                break;
            }
            if (_side == Side.SELL && orders[i].price < orders[i - 1].price) {
                break;
            }
            Order memory order = orders[i - 1];
            orders[i - 1] = orders[i];
            orders[i] = order;
            i--;
        }
        nextOrderId++;
    }
    /**
     * @dev Create a market order
     */
    function createMarketOrder(
        bytes32 _ticker,
        uint256 _amount,
        Side _side
        ) 
        external 
        isNotDAI(_ticker) 
        tokenExists(_ticker) {
        if (_side == Side.SELL) {
            require(
                traderBalances[msg.sender][_ticker] >= _amount,
                "Balance is not enough."
            );
        }
        // Keep track of the _amount of this order to be filled
        uint256 remaining = _amount;
        // Get the first order in orderBook
        uint256 i;
        Order[] storage orders = orderbook[_ticker][
            uint256(_side == Side.BUY ? Side.SELL : Side.BUY)
        ];

        while (i < orders.length - 1 && remaining > 0) {
            uint256 available = orders[i].amount - orders[i].filled;
            uint256 matched = remaining > available ? available : remaining;

            remaining -= matched;
            orders[i].filled += matched;
            emit NewTrade(
                nextTradeId,
                _ticker,
                available,
                msg.sender,
                orders[i].owner,
                orders[i].price,
                block.timestamp
            );

            if (_side == Side.BUY) {
                require(
                    traderBalances[msg.sender][DAI] >=
                        matched * orders[i].price,
                    "Not enough DAI"
                );
                traderBalances[msg.sender][_ticker] += matched;
                traderBalances[msg.sender][DAI] -= matched * orders[i].price;
                traderBalances[orders[i].owner][_ticker] -= matched;
                traderBalances[orders[i].owner][DAI] +=
                    matched *
                    orders[i].price;
            }
            if (_side == Side.SELL) {
                traderBalances[msg.sender][_ticker] -= matched;
                traderBalances[msg.sender][DAI] += matched * orders[i].price;
                traderBalances[orders[i].owner][_ticker] += matched;
                traderBalances[orders[i].owner][DAI] -=
                    matched *
                    orders[i].price;
            }
            i++;
            nextTradeId++;
        }

        i = 0;
        // Remove the all filled orders in the top of orderBook
        while(i < orders.length && orders[i].filled == orders[i].amount) {
            for (uint j = i; j < orders.length - 1; j++) {
                orders[j] = orders[j+1];
            }
            orders.pop();
            i++;
        }
    }
}
