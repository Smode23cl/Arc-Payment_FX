// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title IFXRegistry
 * @dev Interface để đọc tỷ giá từ FX Registry
 */
interface IFXRegistry {
    function getLatestPrice(string memory pair) external view returns (int256);
}

/**
 * @title StableFxRouter
 * @dev Router contract để thực hiện swap giữa các stablecoin với tỷ giá từ FX Registry
 * 
 * Features:
 * - Swap USDC <-> các stablecoin khác (VNDC, EUR, GBP, JPY)
 * - Lấy tỷ giá real-time từ FX Registry on-chain
 * - Hỗ trợ slippage protection
 * - Fee mechanism (0.3% mặc định)
 * - Emergency pause
 */
contract StableFxRouter is Ownable, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;

    // ============================================
    // STATE VARIABLES
    // ============================================
    
    /// @notice FX Registry contract để lấy tỷ giá
    IFXRegistry public fxRegistry;
    
    /// @notice Phí swap (basis points: 30 = 0.3%)
    uint256 public swapFeeBps = 30; // 0.3%
    uint256 public constant MAX_FEE_BPS = 100; // 1% max
    uint256 public constant BPS_DENOMINATOR = 10000;
    
    /// @notice FX decimals (thường là 8)
    uint8 public constant FX_DECIMALS = 8;
    
    /// @notice Treasury để nhận phí
    address public treasury;
    
    /// @notice Mapping để track supported tokens
    mapping(address => bool) public supportedTokens;
    
    /// @notice Mapping token address to token symbol
    mapping(address => string) public tokenSymbols;
    
    // ============================================
    // EVENTS
    // ============================================
    
    event Swap(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee,
        int256 fxRate
    );
    
    event TokenAdded(address indexed token, string symbol);
    event TokenRemoved(address indexed token);
    event FeeUpdated(uint256 oldFee, uint256 newFee);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event FXRegistryUpdated(address indexed oldRegistry, address indexed newRegistry);
    
    // ============================================
    // ERRORS
    // ============================================
    
    error TokenNotSupported(address token);
    error InvalidAmount();
    error SlippageTooHigh(uint256 amountOut, uint256 minAmountOut);
    error InvalidFXRate();
    error SameToken();
    error ZeroAddress();
    error FeeTooHigh();
    
    // ============================================
    // CONSTRUCTOR
    // ============================================
    
    constructor(
        address _fxRegistry,
        address _treasury,
        address _usdc
    ) {
        if (_fxRegistry == address(0) || _treasury == address(0) || _usdc == address(0)) {
            revert ZeroAddress();
        }
        
        fxRegistry = IFXRegistry(_fxRegistry);
        treasury = _treasury;
        
        // Add USDC as base token
        supportedTokens[_usdc] = true;
        tokenSymbols[_usdc] = "USDC";
        emit TokenAdded(_usdc, "USDC");
    }
    
    // ============================================
    // MAIN SWAP FUNCTION
    // ============================================
    
    /**
     * @notice Swap tokenIn sang tokenOut với tỷ giá từ FX Registry
     * @param tokenIn Địa chỉ token đầu vào
     * @param tokenOut Địa chỉ token đầu ra
     * @param amountIn Số lượng token đầu vào
     * @param minAmountOut Số lượng tối thiểu token đầu ra (slippage protection)
     * @return amountOut Số lượng token đầu ra thực tế
     */
    function swap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 minAmountOut
    ) external nonReentrant whenNotPaused returns (uint256 amountOut) {
        // Validations
        if (tokenIn == tokenOut) revert SameToken();
        if (amountIn == 0) revert InvalidAmount();
        if (!supportedTokens[tokenIn]) revert TokenNotSupported(tokenIn);
        if (!supportedTokens[tokenOut]) revert TokenNotSupported(tokenOut);
        
        // Transfer tokenIn từ user
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // Tính phí
        uint256 fee = (amountIn * swapFeeBps) / BPS_DENOMINATOR;
        uint256 amountInAfterFee = amountIn - fee;
        
        // Lấy tỷ giá từ FX Registry
        string memory pair = _getPairName(tokenIn, tokenOut);
        int256 fxRate = fxRegistry.getLatestPrice(pair);
        
        if (fxRate <= 0) revert InvalidFXRate();
        
        // Tính amountOut dựa trên FX rate
        amountOut = _calculateAmountOut(
            amountInAfterFee,
            uint256(fxRate),
            tokenIn,
            tokenOut
        );
        
        // Check slippage
        if (amountOut < minAmountOut) {
            revert SlippageTooHigh(amountOut, minAmountOut);
        }
        
        // Transfer tokenOut cho user
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
        
        // Transfer fee to treasury
        if (fee > 0) {
            IERC20(tokenIn).safeTransfer(treasury, fee);
        }
        
        emit Swap(
            msg.sender,
            tokenIn,
            tokenOut,
            amountIn,
            amountOut,
            fee,
            fxRate
        );
    }
    
    // ============================================
    // VIEW FUNCTIONS
    // ============================================
    
    /**
     * @notice Preview số lượng token out sẽ nhận được (không tính phí)
     */
    function getAmountOut(
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) external view returns (uint256 amountOut, uint256 fee) {
        if (!supportedTokens[tokenIn] || !supportedTokens[tokenOut]) {
            return (0, 0);
        }
        
        fee = (amountIn * swapFeeBps) / BPS_DENOMINATOR;
        uint256 amountInAfterFee = amountIn - fee;
        
        string memory pair = _getPairName(tokenIn, tokenOut);
        int256 fxRate = fxRegistry.getLatestPrice(pair);
        
        if (fxRate <= 0) return (0, fee);
        
        amountOut = _calculateAmountOut(
            amountInAfterFee,
            uint256(fxRate),
            tokenIn,
            tokenOut
        );
    }
    
    /**
     * @notice Lấy tỷ giá hiện tại cho một cặp
     */
    function getFXRate(address tokenIn, address tokenOut) 
        external 
        view 
        returns (int256) 
    {
        string memory pair = _getPairName(tokenIn, tokenOut);
        return fxRegistry.getLatestPrice(pair);
    }
    
    // ============================================
    // INTERNAL FUNCTIONS
    // ============================================
    
    /**
     * @dev Tạo tên cặp cho FX Registry (format: "USDC/VNDC")
     */
    function _getPairName(address tokenIn, address tokenOut) 
        internal 
        view 
        returns (string memory) 
    {
        string memory symbolIn = tokenSymbols[tokenIn];
        string memory symbolOut = tokenSymbols[tokenOut];
        
        // Nếu một trong hai là USDC, đặt USDC lên đầu
        if (keccak256(bytes(symbolIn)) == keccak256(bytes("USDC"))) {
            return string(abi.encodePacked("USDC/", symbolOut));
        } else if (keccak256(bytes(symbolOut)) == keccak256(bytes("USDC"))) {
            return string(abi.encodePacked("USDC/", symbolIn));
        }
        
        // Nếu không có USDC, cần swap qua USDC trung gian (chưa implement)
        return "";
    }
    
    /**
     * @dev Tính amount out dựa trên FX rate
     * @param amountIn Amount sau khi trừ phí
     * @param fxRate Tỷ giá từ FX Registry (đã scale với FX_DECIMALS)
     */
    function _calculateAmountOut(
        uint256 amountIn,
        uint256 fxRate,
        address tokenIn,
        address tokenOut
    ) internal view returns (uint256) {
        // Lấy decimals của tokens
        uint8 decimalsIn = _getTokenDecimals(tokenIn);
        uint8 decimalsOut = _getTokenDecimals(tokenOut);
        
        // Chuẩn hóa về 18 decimals để tính toán
        uint256 normalizedAmountIn = amountIn * (10 ** (18 - decimalsIn));
        
        string memory symbolIn = tokenSymbols[tokenIn];
        uint256 amountOut;
        
        // Nếu tokenIn là USDC: amountOut = amountIn * fxRate
        if (keccak256(bytes(symbolIn)) == keccak256(bytes("USDC"))) {
            amountOut = (normalizedAmountIn * fxRate) / (10 ** FX_DECIMALS);
        } else {
            // Nếu tokenOut là USDC: amountOut = amountIn / fxRate
            amountOut = (normalizedAmountIn * (10 ** FX_DECIMALS)) / fxRate;
        }
        
        // Chuyển về decimals của tokenOut
        return amountOut / (10 ** (18 - decimalsOut));
    }
    
    /**
     * @dev Lấy decimals của token (giả sử tất cả là 6 decimals)
     */
    function _getTokenDecimals(address token) internal pure returns (uint8) {
        // Trong thực tế, nên call token.decimals()
        // Ở đây giả sử tất cả stablecoin đều có 6 decimals
        return 6;
    }
    
    // ============================================
    // ADMIN FUNCTIONS
    // ============================================
    
    /**
     * @notice Thêm token mới được hỗ trợ
     */
    function addToken(address token, string memory symbol) external onlyOwner {
        if (token == address(0)) revert ZeroAddress();
        supportedTokens[token] = true;
        tokenSymbols[token] = symbol;
        emit TokenAdded(token, symbol);
    }
    
    /**
     * @notice Xóa token khỏi danh sách hỗ trợ
     */
    function removeToken(address token) external onlyOwner {
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }
    
    /**
     * @notice Cập nhật phí swap
     */
    function setSwapFee(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        uint256 oldFee = swapFeeBps;
        swapFeeBps = newFeeBps;
        emit FeeUpdated(oldFee, newFeeBps);
    }
    
    /**
     * @notice Cập nhật treasury address
     */
    function setTreasury(address newTreasury) external onlyOwner {
        if (newTreasury == address(0)) revert ZeroAddress();
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
    
    /**
     * @notice Cập nhật FX Registry address
     */
    function setFXRegistry(address newRegistry) external onlyOwner {
        if (newRegistry == address(0)) revert ZeroAddress();
        address oldRegistry = address(fxRegistry);
        fxRegistry = IFXRegistry(newRegistry);
        emit FXRegistryUpdated(oldRegistry, newRegistry);
    }
    
    /**
     * @notice Pause contract
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Emergency withdraw tokens (chỉ khi pause)
     */
    function emergencyWithdraw(address token, uint256 amount) 
        external 
        onlyOwner 
        whenPaused 
    {
        IERC20(token).safeTransfer(owner(), amount);
    }
}