// IERC20.sol

pragma solidity ^0.8.20; // Đã Cập Nhật

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}