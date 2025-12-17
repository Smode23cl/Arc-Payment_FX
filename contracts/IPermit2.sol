// IPermit2.sol

pragma solidity ^0.8.20; // Đã Cập Nhật

interface IPermit2 {
    struct TokenPermissions {
        address token;
        uint256 amount;
    }
    struct PermitTransferFrom {
        TokenPermissions[] permitted;
        address spender;
        uint256 nonce;
        uint256 deadline;
    }
    struct TransferDetails {
        address to;
        uint256 requestedAmount;
    }

    function permitTransferFrom(
        PermitTransferFrom memory permit,
        TransferDetails memory transferDetails,
        address owner,
        bytes memory signature
    ) external returns (address signer, uint256 transferredAmount);
}