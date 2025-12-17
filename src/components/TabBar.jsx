// src/components/TabBar.jsx (FILE MỚI)

import React from 'react';
import { DollarSign, BarChart3, Clock, Send } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

// Danh sách các tab
const tabs = [
    { key: 'payment', labelKey: 'payment', icon: Send },
    { key: 'rates', labelKey: 'rates', icon: BarChart3 },
    { key: 'history', labelKey: 'history', icon: Clock },
];

export default function TabBar({ currentTab, setCurrentTab }) {
    const { t } = useLanguage();

    return (
        <div className="max-w-xl mx-auto mb-6">
            <div className="flex justify-between p-1 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setCurrentTab(tab.key)}
                        className={`
                            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-all text-sm font-bold 
                            ${currentTab === tab.key
                                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/30'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }
                        `}
                    >
                        <tab.icon className="w-5 h-5" />
                        <span>{t.app.tabs[tab.labelKey] || tab.labelKey}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}