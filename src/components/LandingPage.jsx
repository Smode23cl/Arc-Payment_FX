import React from 'react';
import { ArrowRight, Globe, Wallet, ArrowLeftRight, Shield, Zap, BarChart3, Users, DollarSign, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';

export default function LandingPage({ onStart }) {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        {/* Main heading with animation */}
        <div className="text-center mb-16 animate-fade-in">
          <div className="inline-block mb-4">
            <span className="px-4 py-2 bg-purple-500 bg-opacity-20 border border-purple-400 rounded-full text-purple-300 text-sm font-semibold">
              {t.landing.poweredBy}
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-6">
            Arc FX <span className="text-purple-400">{t.app.tabs.payment}</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8">
            {t.app.tagline}
          </p>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-12">
            {t.landing.description}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={onStart}
              className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-5 rounded-full text-xl font-semibold inline-flex items-center gap-3 transition-all hover:scale-105 shadow-2xl hover:shadow-purple-500/50"
            >
              {t.app.startButton}<ArrowRight className="w-6 h-6" />
            </button>

            <a
              href="https://docs.arc.network"
              target="_blank"
              rel="noopener noreferrer"
              className="border-2 border-white border-opacity-30 hover:border-opacity-50 text-white px-12 py-5 rounded-full text-xl font-semibold inline-flex items-center gap-3 transition-all hover:scale-105"
            >
              {t.landing.learnMore}
            </a>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-24">
          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 hover:scale-105 hover:border-purple-400 transition-all duration-300 group">
            <Globe className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold text-white mb-3">{t.landing.featureCrossBorderTitle}</h3>
            <p className="text-gray-300">
              {t.landing.featureCrossBorderDesc}
            </p>
            <div className="mt-4 text-purple-400 text-sm font-semibold">
              {t.landing.featureCrossBorderSub}
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 hover:scale-105 hover:border-purple-400 transition-all duration-300 group">
            <ArrowLeftRight className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold text-white mb-3">{t.landing.featureFXSwapTitle}</h3>
            <p className="text-gray-300">
              {t.landing.featureFXSwapDesc}
            </p>
            <div className="mt-4 text-purple-400 text-sm font-semibold">
              {t.landing.featureFXSwapSub}
            </div>
          </div>

          <div className="bg-white bg-opacity-10 backdrop-blur-lg rounded-2xl p-8 border border-white border-opacity-20 hover:scale-105 hover:border-purple-400 transition-all duration-300 group">
            <Wallet className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="text-2xl font-bold text-white mb-3">{t.landing.featureUSDCGasTitle}</h3>
            <p className="text-gray-300">
              {t.landing.featureUSDCGasDesc}
            </p>
            <div className="mt-4 text-purple-400 text-sm font-semibold">
              {t.landing.featureUSDCGasSub}
            </div>
          </div>
        </div>

        {/* Why Arc FX Section */}
        <div className="mt-32 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t.landing.whyArcTitle}
          </h2>
          <p className="text-xl text-gray-400 mb-16 max-w-2xl mx-auto">
            {t.landing.whyArcSubtitle}
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="text-left bg-white bg-opacity-5 backdrop-blur rounded-xl p-6 border border-white border-opacity-10 hover:border-purple-400 hover:bg-opacity-10 transition-all">
              <Zap className="w-10 h-10 text-purple-400 mb-3" />
              <h4 className="text-xl font-bold text-white mb-2">{t.landing.whyArcInstantTitle}</h4>
              <p className="text-gray-300 text-sm">
                {t.landing.whyArcInstantDesc}
              </p>
            </div>

            <div className="text-left bg-white bg-opacity-5 backdrop-blur rounded-xl p-6 border border-white border-opacity-10 hover:border-purple-400 hover:bg-opacity-10 transition-all">
              <BarChart3 className="w-10 h-10 text-purple-400 mb-3" />
              <h4 className="text-xl font-bold text-white mb-2">{t.landing.whyArcTransparentTitle}</h4>
              <p className="text-gray-300 text-sm">
                {t.landing.whyArcTransparentDesc}
              </p>
            </div>

            <div className="text-left bg-white bg-opacity-5 backdrop-blur rounded-xl p-6 border border-white border-opacity-10 hover:border-purple-400 hover:bg-opacity-10 transition-all">
              <DollarSign className="w-10 h-10 text-purple-400 mb-3" />
              <h4 className="text-xl font-bold text-white mb-2">{t.landing.whyArcCompetitiveTitle}</h4>
              <p className="text-gray-300 text-sm">
                {t.landing.whyArcCompetitiveDesc}
              </p>
            </div>

            <div className="text-left bg-white bg-opacity-5 backdrop-blur rounded-xl p-6 border border-white border-opacity-10 hover:border-purple-400 hover:bg-opacity-10 transition-all">
              <Shield className="w-10 h-10 text-purple-400 mb-3" />
              <h4 className="text-xl font-bold text-white mb-2">{t.landing.whyArcSecureTitle}</h4>
              <p className="text-gray-300 text-sm">
                {t.landing.whyArcSecureDesc}
              </p>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="mt-32">
          <h2 className="text-4xl md:text-5xl font-bold text-white text-center mb-16">
            {t.landing.useCasesTitle}
          </h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-8 text-white hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">💼</div>
              <h3 className="text-2xl font-bold mb-4">{t.landing.caseB2BTitle}</h3>
              <p className="text-purple-100 mb-4">
                {t.landing.caseB2BDesc}
              </p>
              <ul className="space-y-2 text-sm text-purple-100">
                <li>{t.landing.caseB2BItem1}</li>
                <li>{t.landing.caseB2BItem2}</li>
                <li>{t.landing.caseB2BItem3}</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-pink-600 to-purple-600 rounded-2xl p-8 text-white hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-2xl font-bold mb-4">{t.landing.caseRemittanceTitle}</h3>
              <p className="text-pink-100 mb-4">
                {t.landing.caseRemittanceDesc}
              </p>
              <ul className="space-y-2 text-sm text-pink-100">
                <li>{t.landing.caseRemittanceItem1}</li>
                <li>{t.landing.caseRemittanceItem2}</li>
                <li>{t.landing.caseRemittanceItem3}</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-8 text-white hover:scale-105 transition-transform">
              <div className="text-5xl mb-4">👥</div>
              <h3 className="text-2xl font-bold mb-4">{t.landing.casePayrollTitle}</h3>
              <p className="text-blue-100 mb-4">
                {t.landing.casePayrollDesc}
              </p>
              <ul className="space-y-2 text-sm text-blue-100">
                <li>{t.landing.casePayrollItem1}</li>
                <li>{t.landing.casePayrollItem2}</li>
                <li>{t.landing.casePayrollItem3}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-32 bg-white bg-opacity-5 backdrop-blur rounded-3xl p-12 border border-white border-opacity-10">
          <h3 className="text-3xl font-bold text-white text-center mb-12">
            {t.landing.statsTitle}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-purple-400 mb-2">$2.5M+</div>
              <div className="text-gray-300">{t.landing.stat1Label}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-purple-400 mb-2">1,200+</div>
              <div className="text-gray-300">{t.landing.stat2Label}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-purple-400 mb-2">&lt;2s</div>
              <div className="text-gray-300">{t.landing.stat3Label}</div>
            </div>
            <div className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-purple-400 mb-2">0.1%</div>
              <div className="text-gray-300">{t.landing.stat4Label}</div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-32 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t.landing.finalCTATitle}
          </h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
            {t.landing.finalCTASubtitle}
          </p>
          <button
            onClick={onStart}
            className="bg-purple-600 hover:bg-purple-700 text-white px-16 py-6 rounded-full text-2xl font-semibold inline-flex items-center gap-3 transition-all hover:scale-110 shadow-2xl hover:shadow-purple-500/50"
          >
            {t.landing.finalCTAButton} <ArrowRight className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white border-opacity-10 mt-32 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="text-white font-bold text-lg mb-4">{t.landing.title}</h4>
              <p className="text-gray-400 text-sm">
                {t.landing.footerDesc}
              </p>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg mb-4">{t.landing.footerProductTitle}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>{t.landing.footerProductItem1}</li>
                <li>{t.landing.footerProductItem2}</li>
                <li>{t.landing.footerProductItem3}</li>
                <li>{t.landing.footerProductItem4}</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg mb-4">{t.landing.footerCompanyTitle}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>{t.landing.footerCompanyItem1}</li>
                <li>{t.landing.footerCompanyItem2}</li>
                <li>{t.landing.footerCompanyItem3}</li>
                <li>{t.landing.footerCompanyItem4}</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-bold text-lg mb-4">{t.landing.footerSupportTitle}</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>{t.landing.footerSupportItem1}</li>
                <li>{t.landing.footerSupportItem2}</li>
                <li>{t.landing.footerSupportItem3}</li>
                <li>{t.landing.footerSupportItem4}</li>
              </ul>
            </div>
          </div>
          <div className="absolute top-8 right-8 z-20">
            <LanguageSelector />
          </div>
          <div className="text-center text-gray-400 pt-8 border-t border-white border-opacity-10">
            <p>{t.landing.footerCopyright}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}