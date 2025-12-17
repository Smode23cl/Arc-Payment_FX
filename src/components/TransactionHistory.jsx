import React, { useState } from 'react';
import { History, ExternalLink, Filter, Download, Search, RefreshCw } from 'lucide-react';
import { useAccount } from 'wagmi';
import useTransactions from '../hooks/useTransaction';
import { getStatusLabel, getStatusColor } from '../config/contracts';
import { useLanguage } from '../contexts/LanguageContext';

// ----------------------------------------------------------------------
// SỬA LỖI: Đặt giá trị mặc định cho prop t = {} và sử dụng Optional Chaining.
// ----------------------------------------------------------------------

// Helper function để xử lý chuỗi có tham số (ví dụ: phân trang)
const getPaginationText = (template, from, to, total) => {
  // Fallback string nếu template bị thiếu
  let safeTemplate = template || `Hiển thị {{from}}-{{to}} / {{total}} giao dịch`;

  return safeTemplate
    .replace('{{from}}', from)
    .replace('{{to}}', to)
    .replace('{{total}}', total);
}

// Component chính
// Nhận đối tượng dịch t qua prop. Nếu không có, default về một đối tượng rỗng.
export default function TransactionHistory({ t: propT, onSwapClick, fullWidth = false }) {
  const contextData = useLanguage();
  const t = propT || contextData?.t;
  const { address } = useAccount();
  const { transactions, isLoading, refetch } = useTransactions(address);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filter transactions (Giữ nguyên)
  const filteredTransactions = transactions.filter(tx => {
    const matchesStatus = filterStatus === 'all' || tx.status === parseInt(filterStatus);
    const matchesSearch = searchTerm === '' ||
      tx.payee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.currency.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.id.toString().includes(searchTerm);

    return matchesStatus && matchesSearch;
  });

  // Pagination (Giữ nguyên)
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Export CSV (Giữ nguyên)
  const handleExportCSV = () => {
    // Giữ nguyên headers VI cho file CSV
    const headers = ['ID', 'Người gửi', 'Người nhận', 'Số tiền', 'Loại tiền', 'Thời gian', 'Trạng thái'];
    const rows = filteredTransactions.map(tx => [
      tx.id,
      tx.payer,
      tx.payee,
      tx.amount,
      tx.currency,
      new Date(tx.timestamp).toLocaleString('vi-VN'),
      getStatusLabel(tx.status)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `arc_transactions_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate statistics (Giữ nguyên)
  const stats = {
    total: transactions.length,
    completed: transactions.filter(tx => tx.status === 2).length,
    pending: transactions.filter(tx => tx.status === 0 || tx.status === 1).length,
    totalVolume: transactions.reduce((sum, tx) => sum + parseFloat(tx.amount || 0), 0)
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            {/* Sửa lỗi tại đây, t.history?.loading */}
            <p className="text-gray-500">{t.history?.loading || 'Đang tải lịch sử giao dịch...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <History className="w-6 h-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-800">{t.history?.title || 'Lịch sử giao dịch'}</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title={t.history?.refresh || 'Làm mới'}
          >
            <RefreshCw className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
          >
            <Download className="w-4 h-4" />
            {t.history?.export || 'Xuất CSV'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <div className="text-sm text-purple-600 mb-1 font-medium">{t.history?.stats?.total || 'Tổng giao dịch'}</div>
          <div className="text-2xl font-bold text-purple-900">{stats.total}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-green-600 mb-1 font-medium">{t.history?.stats?.completed || 'Thành công'}</div>
          <div className="text-2xl font-bold text-green-900">{stats.completed}</div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
          <div className="text-sm text-yellow-600 mb-1 font-medium">{t.history?.stats?.pending || 'Đang chờ'}</div>
          <div className="text-2xl font-bold text-yellow-900">{stats.pending}</div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-blue-600 mb-1 font-medium">{t.history?.stats?.volume || 'Tổng khối lượng'}</div>
          <div className="text-2xl font-bold text-blue-900">
            ${stats.totalVolume.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder={t.history?.searchPlaceholder || 'Tìm kiếm theo địa chỉ, ID hoặc loại tiền...'}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="all">{t.history?.allStatus || 'Tất cả trạng thái'}</option>
            {/* getStatusLabel() giả định đã được i18n hóa hoặc trả về tiếng Anh/key */}
            <option value="0">{getStatusLabel(0)}</option>
            <option value="1">{getStatusLabel(1)}</option>
            <option value="2">{getStatusLabel(2)}</option>
            <option value="3">{getStatusLabel(3)}</option>
            <option value="4">{getStatusLabel(4)}</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        {currentTransactions.length === 0 ? (
          <div className="text-center py-12">
            <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg font-medium">
              {searchTerm || filterStatus !== 'all'
                ? t.history?.notFound || 'Không tìm thấy giao dịch phù hợp'
                : t.history?.noTransactions || 'Chưa có giao dịch nào'
              }
            </p>
            <p className="text-gray-400 text-sm mt-2">
              {searchTerm || filterStatus !== 'all'
                ? t.history?.adjustFilter || 'Thử điều chỉnh bộ lọc của bạn'
                : t.history?.emptyHint || 'Giao dịch của bạn sẽ hiển thị tại đây'
              }
            </p>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">ID</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">{t.payment?.recipientAddress || 'Người nhận'}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">{t.payment?.amount || 'Số tiền'}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">{t.payment?.currency || 'Loại tiền'}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">{t.history?.date || 'Thời gian'}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">{t.history?.status || 'Trạng thái'}</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 text-sm">{t.history?.view || 'Chi tiết'}</th>
                </tr>
              </thead>
              <tbody>
                {currentTransactions.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-sm text-gray-900">
                      #{tx.id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-mono text-sm text-gray-700">
                        {tx.payee.slice(0, 6)}...{tx.payee.slice(-4)}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      {parseFloat(tx.amount).toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                        {tx.currency}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      <div>{new Date(tx.timestamp).toLocaleDateString('vi-VN')}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(tx.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(tx.status)}`}>
                        {getStatusLabel(tx.status)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <a
                        href={`https://explorer-testnet.arc.network/tx/${tx.txHash || ''}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 text-sm font-medium transition-colors"
                      >
                        {t.history?.view || 'Xem'} <ExternalLink className="w-4 h-4" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {getPaginationText(
                    t.history?.pagination?.showing,
                    startIndex + 1,
                    Math.min(endIndex, filteredTransactions.length),
                    filteredTransactions.length
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {t.history?.pagination?.prev || 'Trước'}
                  </button>
                  <div className="flex items-center gap-1">
                    {/* Simplified pagination rendering for up to 5 pages */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                            ? 'bg-purple-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                  >
                    {t.history?.pagination?.next || 'Sau'}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}