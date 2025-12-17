pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CustomERC20Token is ERC20, Ownable {
    uint8 private _decimals;
    
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals_
    ) ERC20(name, symbol) Ownable(msg.sender) {
        _decimals = decimals_;
        // Mint 1 triệu token ban đầu cho owner
        _mint(msg.sender, 1_000_000 * 10 ** decimals_);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    // Hàm mint cho testing
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    // Hàm faucet để user có thể lấy token test miễn phí
    function faucet() external {
        require(balanceOf(msg.sender) < 10000 * 10 ** _decimals, "Already have enough tokens");
        _mint(msg.sender, 1000 * 10 ** _decimals);
    }
}