// PaymentRouter.sol (ĐÃ TỐI ƯU HÓA STACK)

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20; 

import "@openzeppelin/contracts/access/Ownable.sol"; 
import "@openzeppelin/contracts/utils/Context.sol";

// Import các file giao diện cục bộ
import "./IPermit2.sol"; 
import "./IERC20.sol"; 

/**
 * @title PaymentRouter
 * @dev Hợp đồng này nhận chữ ký Permit2 off-chain và thực hiện chuyển tiền on-chain.
 */
contract PaymentRouter is Context, Ownable {
    address public immutable PERMIT2;
    mapping(uint256 => bool) private _processedPaymentIds;
    
    event PaymentProcessed(
        bytes32 indexed transactionHash,
        address indexed payer,
        address indexed payee,
        address token,
        uint256 amount
    );

    constructor(address permit2Address) Ownable(_msgSender()) {
        require(permit2Address != address(0), "PERMIT2_ZERO_ADDRESS");
        PERMIT2 = permit2Address;
    }

    /**
     * @notice Thực hiện thanh toán bằng chữ ký Permit2.
     * @dev Đã refactor để giảm độ sâu stack.
     */
    function requestPaymentWithPermit(
        address payee,
        uint256 amount,
        address token,
        uint256 deadline,
        bytes calldata signature,
        uint256 paymentId
    ) public {
        // 1. Kiểm tra tính hợp lệ
        require(payee != address(0), "PAYEE_ZERO_ADDRESS");
        require(amount > 0, "ZERO_AMOUNT");
        require(token != address(0), "TOKEN_ZERO_ADDRESS");
        require(deadline >= block.timestamp, "DEADLINE_EXPIRED");
        require(!_processedPaymentIds[paymentId], "PAYMENT_ID_ALREADY_PROCESSED");

        // Tối ưu hóa: Khai báo permitted array
        IPermit2.TokenPermissions[] memory permitted = new IPermit2.TokenPermissions[](1);
        // Sử dụng cú pháp struct rút gọn
        permitted[0] = IPermit2.TokenPermissions(token, amount); 
        
        // 2. Gọi Permit2 để chuyển token từ người gửi tới Router (Pull logic)
        // Tạo các struct cần thiết inline để giảm biến cục bộ.
        (address owner, uint256 transferredAmount) = IPermit2(PERMIT2).permitTransferFrom(
            IPermit2.PermitTransferFrom({
                permitted: permitted,
                spender: address(this), 
                nonce: paymentId,       
                deadline: deadline
            }), 
            IPermit2.TransferDetails(address(this), amount), // Router nhận tiền
            address(0), 
            signature
        );
        
        // 3. Chuyển token từ Router đến Payee (Push logic)
        require(transferredAmount == amount, "PERMIT2_TRANSFER_FAILED");

        // Tránh biến bool 'success'
        require(IERC20(token).transfer(payee, amount), "TOKEN_TRANSFER_FAILED");

        // 4. Cập nhật trạng thái và phát sự kiện
        _processedPaymentIds[paymentId] = true;

        // Tạo txHash inline trong emit để tránh biến cục bộ 'txHash'
        emit PaymentProcessed(
            keccak256(abi.encodePacked(owner, payee, token, amount, paymentId)), 
            owner, // Người đã ký (Payer)
            payee,
            token,
            amount
        );
    }
}