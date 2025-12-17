// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// ====================================================================
// PHẦN 1: GIAO DIỆN CHUẨN CHAINLINK
// ====================================================================

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function description() external view returns (string memory);
    function version() external view returns (uint256);

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer, // Giá trị đã nhân với 10^Decimals
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

// ====================================================================
// PHẦN 2: HỢP ĐỒNG MÔ PHỎNG MỘT NGUỒN CẤP DỮ LIỆU ĐƠN LẺ
// (Được thiết lập nội bộ trong Registry)
// ====================================================================

contract MockAggregator is AggregatorV3Interface {
    // Lưu trữ số chữ số thập phân cho các cặp FX
    uint8 internal constant DECIMALS = 8;
    int256 internal answer; 
    uint80 internal roundId;
    uint256 internal startedAt;
    uint256 internal updatedAt;
    string internal feedDescription;

    address public immutable owner;

    constructor(int256 _initialAnswer, string memory _description) {
        owner = msg.sender;
        answer = _initialAnswer;
        feedDescription = _description;
        roundId = 1;
        startedAt = block.timestamp;
        updatedAt = block.timestamp;
    }

    modifier onlyOwner() {
        // Chỉ có MockFeedRegistry mới có thể cập nhật giá
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    // Hàm được gọi để mô phỏng việc thay đổi tỷ giá FX
    function updateAnswer(int256 newAnswer) public onlyOwner {
        roundId++;
        answer = newAnswer;
        updatedAt = block.timestamp;
        startedAt = block.timestamp;
        emit AnswerUpdated(newAnswer, updatedAt, roundId);
    }
    
    event AnswerUpdated(int256 indexed current, uint256 indexed updatedAt, uint80 indexed roundId);

    // Triển khai các hàm của AggregatorV3Interface
    function decimals() external view override returns (uint8) { return DECIMALS; }
    function description() external view override returns (string memory) { return feedDescription; }
    function version() external pure override returns (uint256) { return 4; }

    function latestRoundData()
        external
        view
        override
        returns (uint80, int256, uint256, uint256, uint80)
    {
        return (roundId, answer, startedAt, updatedAt, roundId);
    }
}

// ====================================================================
// PHẦN 3: REGISTRY VÀ QUẢN LÝ TỶ GIÁ NHIỀU CẶP TIỀN TỆ
// ====================================================================

contract FullMockFXRegistry {
    // Mapping: Ký hiệu Cặp tiền tệ (ví dụ: "USD/JPY") -> Địa chỉ Hợp đồng Mock Aggregator
    mapping(string => address) public feeds;
    
    address public immutable owner;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    // Hàm Admin: Triển khai và Đăng ký một nguồn cấp giá mới
    function registerNewFeed(
        string memory pair, // Ví dụ: "USD/JPY"
        int256 initialAnswer // Ví dụ: 15000000000 (cho 150.00)
    ) public onlyOwner {
        require(feeds[pair] == address(0), "Feed already exists for this pair");
        
        // Triển khai MockAggregator mới nội bộ
        MockAggregator newFeed = new MockAggregator(initialAnswer, pair);
        
        // Đăng ký địa chỉ mới
        feeds[pair] = address(newFeed);
    }

    // Hàm Admin: Cập nhật tỷ giá cho một cặp tiền tệ đã đăng ký
    function updatePrice(
        string memory pair, 
        int256 newAnswer
    ) public onlyOwner {
        address feedAddress = feeds[pair];
        require(feedAddress != address(0), "Feed not registered for this pair");
        
        // Gọi hàm updateAnswer trên MockAggregator tương ứng
        MockAggregator(feedAddress).updateAnswer(newAnswer);
    }
    
    // HÀM CHÍNH ĐỂ ỨNG DỤNG FX GỌI: Lấy tỷ giá mới nhất
    function getLatestPrice(string memory pair) public view returns (int256) {
        address feedAddress = feeds[pair];
        require(feedAddress != address(0), "Feed not registered for this pair");
        
        AggregatorV3Interface feed = AggregatorV3Interface(feedAddress);
        
        // Gọi hàm latestRoundData()
        // 
        (, int256 price, , , ) = feed.latestRoundData();
        return price;
    }
    
    // Hàm tùy chọn để lấy số chữ số thập phân
    function getDecimals(string memory pair) public view returns (uint8) {
        address feedAddress = feeds[pair];
        require(feedAddress != address(0), "Feed not registered for this pair");
        
        AggregatorV3Interface feed = AggregatorV3Interface(feedAddress);
        return feed.decimals();
    }
}