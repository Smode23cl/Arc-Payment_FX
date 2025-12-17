// src/contexts/LanguageContext.jsx

import React, { createContext, useContext, useState, useMemo } from 'react';
import { LANGUAGES, translations } from '../config/i18n';

// 1. Khởi tạo Context
const LanguageContext = createContext(null);

// Hook tùy chỉnh với error handling
export const useLanguage = () => {
  const context = useContext(LanguageContext);

  // Kiểm tra xem hook có được gọi trong Provider không
  if (context === null) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
};

// 2. Provider Component
export const LanguageProvider = ({ children }) => {
  // Lấy ngôn ngữ từ localStorage, mặc định là Tiếng Việt
  const [language, setLanguage] = useState(() => {
    try {
      return localStorage.getItem('appLanguage') || LANGUAGES.VI;
    } catch (error) {
      console.error('Error loading language from localStorage:', error);
      return LANGUAGES.VI;
    }
  });

  // Cập nhật localStorage mỗi khi ngôn ngữ thay đổi
  const updateLanguage = (newLang) => {
    setLanguage(newLang);
    try {
      localStorage.setItem('appLanguage', newLang);
    } catch (error) {
      console.error('Error saving language to localStorage:', error);
    }
  };

  // Giá trị Context với memoization
  const contextValue = useMemo(() => {
    // Đảm bảo luôn có dữ liệu dịch thuật hợp lệ
    const t = translations[language] || translations[LANGUAGES.VI] || {};

    return {
      language,
      setLanguage: updateLanguage,
      t, // Biến 't' (translation) để sử dụng trong các components
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};