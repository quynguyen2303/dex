pragma solidity 0.6.3;

contract Dex {
    struct Token {
        bytes32 ticker;
        address tokenAddress;
    }

    mapping(bytes32 => Token) public tokens;
    bytes32[] public tokenList;
    address public admin;

    constructor() public {
        admin = msg.sender;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can add new token");
        _;
    }

    function addToken(
        bytes32 _ticker,
        address _tokenAddress)
        onlyAdmin()
        external {
            tokens[_ticker] = Token(_ticker, _tokenAddress);
            tokenList.push(_ticker);
    }
}