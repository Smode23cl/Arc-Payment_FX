// src/components/LanguageSelector.jsx

import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { LANGUAGES } from '../config/i18n';

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
  };

  return (
    <div className="relative inline-flex items-center">
      <Globe className="w-5 h-5 text-gray-500 mr-2 absolute left-2 pointer-events-none" />
      <select
        value={language}
        onChange={handleLanguageChange}
        className="appearance-none bg-gray-100 border border-gray-300 text-gray-700 py-1.5 pl-8 pr-4 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
      >
        <option value={LANGUAGES.VI}>🇻🇳 Tiếng Việt</option>
        <option value={LANGUAGES.EN}>EN English</option>
      </select>
    </div>
  );
}