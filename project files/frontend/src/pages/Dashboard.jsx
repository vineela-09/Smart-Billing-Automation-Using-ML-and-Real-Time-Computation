import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import Voice from "../components/Voice.jsx";
import Calculator from "../components/Calculator.jsx";
import EnhancedOCR from "../components/EnhancedOCR.jsx";
import AnalyticsDashboard from "./AnalyticsDashboard.jsx";
import FeaturePanel from "../components/FeaturePanel";

// ===== HAMBURGER MENU COMPONENT =====
const HamburgerMenu = ({ isOpen, onToggle, onSelectFeature, activeFeature, isLoading }) => {
  const features = [
    { id: "profile", icon: "👤", label: "Profile Analytics", color: "from-blue-500 to-blue-600", description: "User stats & business overview", advanced: true },
    { id: "daywise", icon: "📅", label: "Daily Report", color: "from-green-500 to-green-600", description: "Last 7 days detailed analysis", advanced: true },
    { id: "monthwise", icon: "📊", label: "Monthly Report", color: "from-purple-500 to-purple-600", description: "Monthly trends & patterns", advanced: true },
    { id: "yearwise", icon: "📈", label: "Yearly Report", color: "from-orange-500 to-orange-600", description: "Annual performance metrics", advanced: true },
    { id: "items", icon: "🏷️", label: "Items Master", color: "from-pink-500 to-pink-600", description: "Item configuration & inventory", advanced: false },
    { id: "settings", icon: "⚙️", label: "System Settings", color: "from-gray-600 to-gray-700", description: "App configuration & preferences", advanced: false },
    { id: "advanced", icon: "✨", label: "Advanced Analytics", color: "from-cyan-500 to-cyan-600", description: "Predictive analytics & insights", enhanced: true },
    { id: "export", icon: "💾", label: "Export & Reports", color: "from-indigo-500 to-indigo-600", description: "Download as PDF/Excel", advanced: true },
    { id: "analytics", icon: "📊", label: "Analytics Dashboard", color: "from-teal-500 to-teal-600", description: "Dashboard view", advanced: true },
  ];

  return (
    <>
      {/* Sidebar Menu - FULL HEIGHT WITH SCROLL */}
      <div
        className={`fixed top-0 left-0 h-screen w-80 bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 shadow-2xl transform transition-transform duration-300 z-50 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header - Fixed */}
        <div className="p-6 pt-20 border-b-2 border-purple-500 flex-shrink-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-3xl">📊</span>
            <h3 className="text-2xl font-bold text-white">Smart Billing</h3>
          </div>
          <p className="text-xs text-gray-400">Click any feature to view</p>
        </div>

        {/* Features List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {features.map(feature => (
            <button
              key={feature.id}
              onClick={() => {
                onSelectFeature(feature.id);
              }}
              disabled={isLoading}
              className={`w-full p-4 rounded-lg transition-all duration-300 flex items-center gap-3 ${
                activeFeature === feature.id
                  ? `bg-gradient-to-r ${feature.color} text-white shadow-lg scale-105 ring-2 ring-white`
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span className="text-2xl flex-shrink-0">{feature.icon}</span>
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm flex items-center gap-2">
                  {feature.label}
                  {feature.enhanced && <span className="text-xs bg-cyan-500 px-2 py-0.5 rounded text-white">NEW</span>}
                </div>
                <div className="text-xs opacity-75">{feature.description}</div>
              </div>
              {activeFeature === feature.id && isLoading && (
                <span className="text-lg animate-spin flex-shrink-0">⏳</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onToggle}
        />
      )}
    </>
  );
};

// ===== OCR MENU COMPONENT (Top-Right Dropdown) =====
const OCRMenu = ({ isOpen, onToggle, onSelectFeature, activeFeature, isLoading }) => {
  const features = [
    { id: "profile", icon: "👤", label: "Profile Analytics", color: "from-blue-500 to-blue-600", description: "User stats & business overview" },
    { id: "daywise", icon: "📅", label: "Daily Report", color: "from-green-500 to-green-600", description: "Last 7 days detailed analysis" },
    { id: "monthwise", icon: "📊", label: "Monthly Report", color: "from-purple-500 to-purple-600", description: "Monthly trends & patterns" },
    { id: "yearwise", icon: "📈", label: "Yearly Report", color: "from-orange-500 to-orange-600", description: "Annual performance metrics" },
    { id: "items", icon: "🏷️", label: "Items Master", color: "from-pink-500 to-pink-600", description: "Item configuration & inventory" },
    { id: "settings", icon: "⚙️", label: "System Settings", color: "from-gray-600 to-gray-700", description: "App configuration & preferences" },
    { id: "advanced", icon: "✨", label: "Advanced Analytics", color: "from-cyan-500 to-cyan-600", description: "Predictive analytics & insights" },
    { id: "enhanced", icon: "🚀", label: "Enhanced Reports", color: "from-pink-600 to-red-600", description: "Advanced AI-powered insights" },
    { id: "export", icon: "💾", label: "Export & Reports", color: "from-indigo-500 to-indigo-600", description: "Download as PDF/Excel" },
  ];

  return (
    <>
      {/* Dropdown Menu - TOP RIGHT */}
      <div
        className={`fixed top-24 right-6 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl rounded-lg transform transition-all duration-300 z-50 overflow-hidden ${
          isOpen ? "opacity-100 scale-100 visible" : "opacity-0 scale-95 invisible"
        }`}
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4 pb-4 border-b-2 border-blue-500">
            <span className="text-2xl">📊</span>
            <h3 className="text-lg font-bold text-white">OCR Features</h3>
          </div>
          <p className="text-xs text-gray-400 mb-4">Select a feature to view</p>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {features.map(feature => (
              <button
                key={feature.id}
                onClick={() => {
                  onSelectFeature(feature.id);
                }}
                disabled={isLoading}
                className={`w-full p-3 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm ${
                  activeFeature === feature.id
                    ? `bg-gradient-to-r ${feature.color} text-white shadow-lg scale-105 ring-2 ring-white`
                    : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span className="text-lg">{feature.icon}</span>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-xs">{feature.label}</div>
                  <div className="text-xs opacity-75">{feature.description}</div>
                </div>
                {activeFeature === feature.id && isLoading && (
                  <span className="text-sm animate-spin">⏳</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={onToggle}
        />
      )}
    </>
  );
};

// ===== HAMBURGER ICON COMPONENT (Fixed, Just Three Lines) =====
const HamburgerIcon = ({ isOpen, onToggle }) => (
  <button
    onClick={onToggle}
    className="fixed top-6 left-6 z-50 p-3 rounded-lg hover:bg-white/10 transition-all duration-300 cursor-pointer group"
    title="Toggle Menu"
  >
    <div className="w-8 h-6 flex flex-col justify-between">
      <span className={`h-1 w-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300 rounded ${isOpen ? "rotate-45 translate-y-2.5" : ""}`} />
      <span className={`h-1 w-full bg-gradient-to-r from-purple-500 to-purple-600 transition-opacity duration-300 rounded ${isOpen ? "opacity-0" : ""}`} />
      <span className={`h-1 w-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 rounded ${isOpen ? "-rotate-45 -translate-y-2.5" : ""}`} />
    </div>
  </button>
);

// ===== LOGOUT BUTTON COMPONENT =====
const LogoutButton = ({ onLogout }) => (
  <button
    onClick={onLogout}
    className="fixed top-6 left-24 z-50 p-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
    title="Logout"
  >
    <div className="flex items-center gap-2">
      <span className="text-lg">🚪</span>
      <span className="text-sm font-semibold">Logout</span>
    </div>
  </button>
);

// ===== PROFILE SECTION =====
const ProfileSection = ({ userName, stats }) => (
  <div className="space-y-6">
    <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white p-8 rounded-2xl shadow-2xl">
      <div className="flex items-center gap-6">
        <div className="text-6xl">👤</div>
        <div>
          <h1 className="text-4xl font-bold">{userName}</h1>
          <p className="text-blue-100 mt-2">Business Dashboard</p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-xl">
        <div className="text-sm opacity-90 font-semibold mb-2">💰 Total Revenue</div>
        <div className="text-4xl font-bold">₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div className="text-sm opacity-75 mt-3">{stats.billCount} transactions</div>
      </div>

      <div className={`bg-gradient-to-br ${stats.totalProfit >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white p-6 rounded-2xl shadow-xl`}>
        <div className="text-sm opacity-90 font-semibold mb-2">{stats.totalProfit >= 0 ? '📈 Total Profit' : '📉 Total Loss'}</div>
        <div className="text-4xl font-bold">₹{Math.abs(stats.totalProfit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div className="text-sm opacity-75 mt-3">{stats.totalProfit >= 0 ? '✅ Positive' : '⚠️ Negative'}</div>
      </div>

      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl">
        <div className="text-sm opacity-90 font-semibold mb-2">📊 Profit Margin</div>
        <div className="text-4xl font-bold">{stats.marginPercentage.toFixed(1)}%</div>
        <div className="text-sm opacity-75 mt-3">Per transaction</div>
      </div>

      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl">
        <div className="text-sm opacity-90 font-semibold mb-2">🧾 Average Bill</div>
        <div className="text-4xl font-bold">₹{stats.avgBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div className="text-sm opacity-75 mt-3">Per transaction</div>
      </div>
    </div>
  </div>
);

// ===== DAY-WISE SECTION =====
const DayWiseSection = ({ data }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
      <span className="text-4xl">📅</span> Day-wise Analysis (Last 7 Days)
    </h2>

    {data.length > 0 ? (
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
        <div className="space-y-6">
          {data.map((day, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">{day.label}</span>
                <div className="flex gap-4 text-sm font-bold">
                  <span className="text-green-600">💵 ₹{day.revenue.toLocaleString()}</span>
                  <span className={day.profit >= 0 ? "text-emerald-600" : "text-red-600"}>
                    {day.profit >= 0 ? "📈" : "📉"} ₹{Math.abs(day.profit).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-end pr-2"
                  style={{ width: `${Math.min(day.revenue / Math.max(...data.map(d => d.revenue)) * 100, 100)}%` }}
                >
                  <span className="text-white text-xs font-bold">₹{day.revenue}</span>
                </div>
              </div>

              <div className="h-6 bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className={`h-full ${day.profit >= 0 ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : 'bg-gradient-to-r from-red-400 to-red-600'} flex items-center justify-end pr-2`}
                  style={{ width: `${Math.min(Math.abs(day.profit) / Math.max(...data.map(d => Math.abs(d.profit))) * 100, 100)}%` }}
                >
                  <span className="text-white text-xs font-bold">₹{Math.abs(day.profit)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="text-center py-12 bg-white/10 rounded-2xl">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-white text-lg">No data available for last 7 days</p>
      </div>
    )}
  </div>
);

// ===== MONTH-WISE SECTION =====
const MonthWiseSection = ({ data }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
      <span className="text-4xl">📊</span> Month-wise Trends
    </h2>

    {data.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.map((month, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 border-2 border-purple-400 rounded-2xl p-6 backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-4">{month.label}</div>
              
              <div className="space-y-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm text-gray-200 mb-1">Revenue</div>
                  <div className="text-3xl font-bold text-green-300">₹{month.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
                </div>

                <div className={`${month.profit >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'} backdrop-blur-sm rounded-lg p-4`}>
                  <div className="text-sm text-gray-200 mb-1">Profit/Loss</div>
                  <div className={`text-3xl font-bold ${month.profit >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
                    ₹{Math.abs(month.profit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>

                <div className="bg-white/20 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-sm text-gray-200 mb-1">Bills Count</div>
                  <div className="text-2xl font-bold text-orange-300">{month.billCount}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12 bg-white/10 rounded-2xl">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-white text-lg">No monthly data available</p>
      </div>
    )}
  </div>
);

// ===== YEAR-WISE SECTION =====
const YearWiseSection = ({ data }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
      <span className="text-4xl">📈</span> Year-wise Performance
    </h2>

    {data.length > 0 ? (
      <div className="space-y-4">
        {data.map((year, idx) => (
          <div key={idx} className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">{year.label}</div>
              </div>

              <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-lg p-4">
                <div className="text-xs text-gray-600 font-semibold">Annual Revenue</div>
                <div className="text-2xl font-bold text-green-700">₹{year.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              </div>

              <div className={`bg-gradient-to-r ${year.profit >= 0 ? 'from-emerald-100 to-emerald-200' : 'from-red-100 to-red-200'} rounded-lg p-4`}>
                <div className="text-xs text-gray-600 font-semibold">Annual Profit</div>
                <div className={`text-2xl font-bold ${year.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  ₹{Math.abs(year.profit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-100 to-purple-200 rounded-lg p-4">
                <div className="text-xs text-gray-600 font-semibold">Margin %</div>
                <div className="text-2xl font-bold text-purple-700">{year.marginPercentage.toFixed(1)}%</div>
              </div>
            </div>

            <div className="mt-6 h-16 bg-gray-200 rounded-lg overflow-hidden">
              <div className="h-full flex gap-1 p-2 bg-gray-100">
                {[...Array(12)].map((_, m) => (
                  <div
                    key={m}
                    className="flex-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-sm"
                    style={{ height: `${20 + Math.random() * 80}%` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div className="text-center py-12 bg-white/10 rounded-2xl">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-white text-lg">No yearly data available</p>
      </div>
    )}
  </div>
);

// ===== ITEMS SECTION =====
const ItemsSection = ({ items }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
      <span className="text-4xl">🏷️</span> Item Master Configuration
    </h2>

    {items.length > 0 ? (
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white sticky top-0">
              <tr>
                <th className="px-6 py-4 text-left font-bold">Item Name</th>
                <th className="px-6 py-4 text-left font-bold">Category</th>
                <th className="px-6 py-4 text-right font-bold">Principle Cost</th>
                <th className="px-6 py-4 text-right font-bold">Selling Price</th>
                <th className="px-6 py-4 text-center font-bold">Margin %</th>
                <th className="px-6 py-4 text-center font-bold">Profit/Unit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.slice(0, 10).map((item, idx) => {
                const profitPerUnit = item.sellingPrice - item.principleAmount;
                const marginPercent = item.principleAmount > 0 ? ((profitPerUnit / item.principleAmount) * 100) : 0;
                return (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">{item.category || "N/A"}</td>
                    <td className="px-6 py-4 text-right text-gray-700">₹{item.principleAmount?.toFixed(2) || 0}</td>
                    <td className="px-6 py-4 text-right text-gray-700">₹{item.sellingPrice?.toFixed(2) || 0}</td>
                    <td className="px-6 py-4 text-center font-bold text-blue-600">{marginPercent.toFixed(1)}%</td>
                    <td className="px-6 py-4 text-center font-bold text-green-600">₹{profitPerUnit.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    ) : (
      <div className="text-center py-12 bg-white/10 rounded-2xl">
        <div className="text-5xl mb-4">📭</div>
        <p className="text-white text-lg">No items configured yet</p>
      </div>
    )}
  </div>
);

// ===== SETTINGS SECTION =====
const SettingsSection = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
      <span className="text-4xl">⚙️</span> System Settings
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📋 General Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-gray-700 font-semibold">Dark Mode</label>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-gray-700 font-semibold">Auto-save Bills</label>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🔔 Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-gray-700 font-semibold">Low Stock Alert</label>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-gray-700 font-semibold">Loss Alert</label>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ===== ADVANCED ANALYTICS SECTION =====
const AdvancedAnalyticsSection = ({ analytics }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
      <span className="text-4xl">✨</span> Advanced Analytics
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Growth Rate */}
      <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-2 border-cyan-400 rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-3xl mb-2">📈</div>
        <h3 className="text-white font-bold text-lg mb-2">Growth Rate</h3>
        <p className="text-cyan-200 text-2xl font-bold">+12.5%</p>
        <p className="text-gray-300 text-sm mt-2">vs last period</p>
      </div>

      {/* Conversion Rate */}
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-2 border-purple-400 rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-3xl mb-2">🎯</div>
        <h3 className="text-white font-bold text-lg mb-2">Conversion Rate</h3>
        <p className="text-purple-200 text-2xl font-bold">68.3%</p>
        <p className="text-gray-300 text-sm mt-2">Bills completed</p>
      </div>

      {/* Avg Transaction Value */}
      <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-400 rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-3xl mb-2">💳</div>
        <h3 className="text-white font-bold text-lg mb-2">Avg Value</h3>
        <p className="text-orange-200 text-2xl font-bold">₹{analytics.avgBill?.toLocaleString() || "0"}</p>
        <p className="text-gray-300 text-sm mt-2">Per transaction</p>
      </div>

      {/* Customer Retention */}
      <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-2 border-green-400 rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-3xl mb-2">👥</div>
        <h3 className="text-white font-bold text-lg mb-2">Retention Rate</h3>
        <p className="text-green-200 text-2xl font-bold">82%</p>
        <p className="text-gray-300 text-sm mt-2">Repeat customers</p>
      </div>

      {/* Peak Hours */}
      <div className="bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border-2 border-indigo-400 rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-3xl mb-2">⏰</div>
        <h3 className="text-white font-bold text-lg mb-2">Peak Hours</h3>
        <p className="text-indigo-200 text-2xl font-bold">2-4 PM</p>
        <p className="text-gray-300 text-sm mt-2">Highest transactions</p>
      </div>

      {/* Top Product */}
      <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 border-2 border-pink-400 rounded-2xl p-6 backdrop-blur-sm">
        <div className="text-3xl mb-2">🏆</div>
        <h3 className="text-white font-bold text-lg mb-2">Top Product</h3>
        <p className="text-pink-200 text-2xl font-bold">Product A</p>
        <p className="text-gray-300 text-sm mt-2">156 units sold</p>
      </div>
    </div>

    {/* Prediction Chart */}
    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
      <h3 className="text-xl font-bold text-gray-800 mb-6">📊 Next 30 Days Prediction</h3>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-700 font-semibold">Expected Revenue</span>
            <span className="text-gray-700 font-bold">₹45,000</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-400 to-green-600" style={{ width: "75%" }}></div>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-700 font-semibold">Expected Profit</span>
            <span className="text-gray-700 font-bold">₹12,500</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: "68%" }}></div>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ===== EXPORT & REPORTS SECTION =====
const ExportSection = ({ analytics, bills }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
      <span className="text-4xl">💾</span> Export & Reports
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Quick Export */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 shadow-2xl cursor-pointer hover:shadow-3xl transition transform hover:scale-105">
        <div className="text-5xl mb-4">📄</div>
        <h3 className="text-white font-bold text-xl mb-2">PDF Report</h3>
        <p className="text-blue-100 mb-4">Download comprehensive PDF report</p>
        <button className="w-full bg-white text-blue-600 font-bold py-2 rounded-lg hover:bg-blue-50 transition">
          Download PDF
        </button>
      </div>

      {/* Excel Export */}
      <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-8 shadow-2xl cursor-pointer hover:shadow-3xl transition transform hover:scale-105">
        <div className="text-5xl mb-4">📊</div>
        <h3 className="text-white font-bold text-xl mb-2">Excel Sheet</h3>
        <p className="text-green-100 mb-4">Export data to Excel format</p>
        <button className="w-full bg-white text-green-600 font-bold py-2 rounded-lg hover:bg-green-50 transition">
          Download Excel
        </button>
      </div>

      {/* CSV Export */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl p-8 shadow-2xl cursor-pointer hover:shadow-3xl transition transform hover:scale-105">
        <div className="text-5xl mb-4">📋</div>
        <h3 className="text-white font-bold text-xl mb-2">CSV File</h3>
        <p className="text-purple-100 mb-4">Export as CSV for analysis</p>
        <button className="w-full bg-white text-purple-600 font-bold py-2 rounded-lg hover:bg-purple-50 transition">
          Download CSV
        </button>
      </div>

      {/* Email Report */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-8 shadow-2xl cursor-pointer hover:shadow-3xl transition transform hover:scale-105">
        <div className="text-5xl mb-4">📧</div>
        <h3 className="text-white font-bold text-xl mb-2">Email Report</h3>
        <p className="text-indigo-100 mb-4">Send report to your email</p>
        <button className="w-full bg-white text-indigo-600 font-bold py-2 rounded-lg hover:bg-indigo-50 transition">
          Send Email
        </button>
      </div>
    </div>

    {/* Report Summary */}
    <div className="bg-white/95 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
      <h3 className="text-xl font-bold text-gray-800 mb-6">📑 Report Summary</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-semibold">Total Bills</p>
          <p className="text-2xl font-bold text-blue-600">{bills?.length || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-semibold">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">₹{analytics.totalRevenue?.toLocaleString() || "0"}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-semibold">Total Profit</p>
          <p className="text-2xl font-bold text-purple-600">₹{Math.abs(analytics.totalProfit || 0).toLocaleString()}</p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg">
          <p className="text-gray-600 text-sm font-semibold">Profit Margin</p>
          <p className="text-2xl font-bold text-orange-600">{analytics.marginPercentage?.toFixed(1) || "0"}%</p>
        </div>
      </div>
    </div>
  </div>
);

export default function Dashboard() {
  const [mode, setMode] = useState("voice");
  const [bills, setBills] = useState([]);
  const [userName, setUserName] = useState("User");
  const [expandedBill, setExpandedBill] = useState(null);
  const [stats, setStats] = useState({ total: 0, count: 0, avg: 0, lastBill: null });
  const [menuOpen, setMenuOpen] = useState(false);
  const [ocrMenuOpen, setOcrMenuOpen] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeEnhancedFeature, setActiveEnhancedFeature] = useState("profile");
  const [items, setItems] = useState([]);
  const [isLoadingFeature, setIsLoadingFeature] = useState(false);
  const [featureError, setFeatureError] = useState(null);

  // ---- Fetch Bills ----
  const fetchBills = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/bills`,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      );
      const billsData = res.data || [];
      setBills(billsData);
      
      // Calculate stats
      const total = billsData.reduce((s, b) => s + (b.total || 0), 0);
      const count = billsData.length;
      const avg = count > 0 ? total / count : 0;
      const lastBill = billsData.length > 0 ? billsData[0] : null;
      
      setStats({ total: Number(total.toFixed(2)), count, avg: Number(avg.toFixed(2)), lastBill });
    } catch (e) {
      console.error("Failed to fetch bills:", e);
    }
  };

  useEffect(() => {
    fetchBills();
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setUserName(decoded.name || "User");
      }
    } catch {}

    // Fetch items for enhanced features
    const fetchItems = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/items`, {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        });
        setItems(res.data.items || []);
      } catch (e) {
        console.error("Failed to fetch items:", e);
      }
    };

    fetchItems();
  }, []);

  // ---- Logout ----
  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("token");
      window.location.href = "/";
    }
  };

  // ---- Handle Feature Selection with Loading State ----
  const handleFeatureSelect = (featureId) => {
    setIsLoadingFeature(true);
    setFeatureError(null);
    
    // Simulate processing (analytics calculation happens in useMemo)
    setTimeout(() => {
      try {
        setActiveEnhancedFeature(featureId);
        setIsLoadingFeature(false);
      } catch (error) {
        console.error("Error loading feature:", error);
        setFeatureError("Failed to load feature");
        setIsLoadingFeature(false);
      }
    }, 200); // Brief delay for visual feedback
  };

  // ---- Delete Bill ----
  const deleteBill = async (id) => {
    if (!confirm("Delete this bill permanently?")) return;
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/bills/${id}`,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      );
      fetchBills();
    } catch (e) {
      alert("Delete failed");
    }
  };

  // ---- Calculate Analytics (Optimized & Accurate) ----
  const analytics = useMemo(() => {
    try {
      // Basic calculations with error handling
      const totalRevenue = bills.reduce((s, b) => {
        const total = parseFloat(b.total) || 0;
        return s + total;
      }, 0);
      
      const totalProfit = bills.reduce((s, b) => {
        const profit = parseFloat(b.profitLoss) || 0;
        return s + profit;
      }, 0);
      
      const totalCost = bills.reduce((s, b) => {
        const cost = parseFloat(b.principleTotal) || 0;
        return s + cost;
      }, 0);
      
      const billCount = bills.length;
      const avgBill = billCount > 0 ? totalRevenue / billCount : 0;
      const marginPercentage = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

      // Day-wise data (last 7 days) - Optimized
      const dayWiseData = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toLocaleDateString();
        dayWiseData[dateStr] = { revenue: 0, profit: 0 };
      }

      bills.forEach(bill => {
        try {
          const billDate = new Date(bill.billDate || bill.createdAt).toLocaleDateString();
          if (dayWiseData[billDate]) {
            dayWiseData[billDate].revenue += parseFloat(bill.total) || 0;
            dayWiseData[billDate].profit += parseFloat(bill.profitLoss) || 0;
          }
        } catch (e) {
          console.warn("Error processing bill date:", e);
        }
      });

      const dayWiseSorted = Object.entries(dayWiseData).map(([label, data]) => ({
        label,
        revenue: Math.max(0, parseFloat(data.revenue) || 0),
        profit: parseFloat(data.profit) || 0
      }));

      // Month-wise data - Optimized with accurate grouping
      const monthWiseData = {};
      bills.forEach(bill => {
        try {
          const date = new Date(bill.billDate || bill.createdAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          if (!monthWiseData[monthKey]) {
            monthWiseData[monthKey] = { revenue: 0, profit: 0, billCount: 0 };
          }
          monthWiseData[monthKey].revenue += parseFloat(bill.total) || 0;
          monthWiseData[monthKey].profit += parseFloat(bill.profitLoss) || 0;
          monthWiseData[monthKey].billCount += 1;
        } catch (e) {
          console.warn("Error processing month:", e);
        }
      });

      const monthWiseSorted = Object.entries(monthWiseData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-12)
        .map(([label, data]) => ({
          label,
          revenue: Math.max(0, parseFloat(data.revenue) || 0),
          profit: parseFloat(data.profit) || 0,
          billCount: data.billCount,
          marginPercentage: data.revenue > 0 ? ((data.profit / data.revenue) * 100) : 0
        }));

      // Year-wise data - Optimized with accurate calculations
      const yearWiseData = {};
      bills.forEach(bill => {
        try {
          const year = new Date(bill.billDate || bill.createdAt).getFullYear();
          if (!yearWiseData[year]) {
            yearWiseData[year] = { revenue: 0, profit: 0 };
          }
          yearWiseData[year].revenue += parseFloat(bill.total) || 0;
          yearWiseData[year].profit += parseFloat(bill.profitLoss) || 0;
        } catch (e) {
          console.warn("Error processing year:", e);
        }
      });

      const yearWiseSorted = Object.entries(yearWiseData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([label, data]) => ({
          label,
          revenue: Math.max(0, parseFloat(data.revenue) || 0),
          profit: parseFloat(data.profit) || 0,
          marginPercentage: data.revenue > 0 ? ((data.profit / data.revenue) * 100) : 0
        }));

      return {
        totalRevenue: Math.max(0, totalRevenue),
        totalProfit,
        totalCost: Math.max(0, totalCost),
        billCount,
        avgBill: Math.max(0, avgBill),
        marginPercentage,
        dayWiseSorted,
        monthWiseSorted,
        yearWiseSorted
      };
    } catch (error) {
      console.error("Analytics calculation error:", error);
      return {
        totalRevenue: 0,
        totalProfit: 0,
        totalCost: 0,
        billCount: 0,
        avgBill: 0,
        marginPercentage: 0,
        dayWiseSorted: [],
        monthWiseSorted: [],
        yearWiseSorted: []
      };
    }
  }, [bills]);

  const modeConfig = {
    voice: {
      icon: "🎤",
      label: "Voice Input",
      color: "from-purple-600 to-pink-600",
      description: "Speak to add items and perform calculations",
    },
    manual: {
      icon: "⌨️",
      label: "Manual Entry",
      color: "from-blue-600 to-cyan-600",
      description: "Manually enter items and use the calculator",
    },
    image: {
      icon: "🖼️",
      label: "OCR Scanning",
      color: "from-indigo-600 to-blue-600",
      description: "Upload bill/receipt images for automatic extraction",
    },
    analytics: {
      icon: "📊",
      label: "Analytics Dashboard",
      color: "from-orange-600 to-red-600",
      description: "View comprehensive financial insights and profit/loss analysis",
    },
  };

  const currentMode = modeConfig[mode];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hamburger Menu Sidebar */}
      <HamburgerMenu
        isOpen={menuOpen}
        onToggle={() => setMenuOpen(!menuOpen)}
        onSelectFeature={handleFeatureSelect}
        activeFeature={activeEnhancedFeature}
        isLoading={isLoadingFeature}
      />

      {/* Header */}
      <header className="relative z-50 sticky top-0 bg-white/95 backdrop-blur-md shadow-2xl border-b-4 border-gradient-to-r from-purple-500 via-blue-500 to-indigo-500 transition-all duration-300" style={{marginLeft: menuOpen ? '320px' : '0'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex justify-between items-center">
            <div className="flex-1">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                💼 Smart Billing System
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome, <span className="font-semibold text-blue-600">{userName}</span> 👋 | Smart voice-enabled billing made easy
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex gap-6 mr-6">
              <div className="text-center">
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{stats.count}</div>
                <div className="text-xs text-gray-600">Bills</div>
              </div>
              <div className="text-center border-l-2 border-gradient-to-b from-gray-300 to-gray-200 pl-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">₹{stats.total.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center border-l-2 border-gradient-to-b from-gray-300 to-gray-200 pl-6">
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">₹{stats.avg.toLocaleString()}</div>
                <div className="text-xs text-gray-600">Average</div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold px-6 py-2 rounded-lg shadow-lg transition transform hover:scale-105 active:scale-95"
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Shifts when sidebar opens */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-all duration-300" style={{marginLeft: menuOpen ? '320px' : '0', marginRight: '0'}}>
        {/* Show Enhanced Features if menu is open */}
        {menuOpen ? (
          <div>
            {/* Error Display */}
            {featureError && (
              <div className="mb-6 bg-red-500/20 border-2 border-red-500 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">❌</span>
                  <div className="flex-1">
                    <h4 className="text-red-300 font-bold">Error Loading Feature</h4>
                    <p className="text-red-200 text-sm">{featureError}</p>
                  </div>
                  <button
                    onClick={() => setFeatureError(null)}
                    className="text-red-300 hover:text-red-100"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {isLoadingFeature ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="text-6xl animate-spin mb-4">⏳</div>
                <p className="text-white text-lg font-semibold">Loading feature...</p>
                <p className="text-gray-300 text-sm mt-2">Please wait while we prepare your data</p>
              </div>
            ) : (
              <>
                {activeEnhancedFeature === "profile" && <ProfileSection userName={userName} stats={analytics} />}
                {activeEnhancedFeature === "daywise" && <DayWiseSection data={analytics.dayWiseSorted} />}
                {activeEnhancedFeature === "monthwise" && <MonthWiseSection data={analytics.monthWiseSorted} />}
                {activeEnhancedFeature === "yearwise" && <YearWiseSection data={analytics.yearWiseSorted} />}
                {activeEnhancedFeature === "items" && <ItemsSection items={items} />}
                {activeEnhancedFeature === "settings" && <SettingsSection />}
                {activeEnhancedFeature === "advanced" && <AdvancedAnalyticsSection analytics={analytics} />}
                {activeEnhancedFeature === "export" && <ExportSection analytics={analytics} bills={bills} />}
                {activeEnhancedFeature === "analytics" && <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-10 border-2 border-white/20"><AnalyticsDashboard /></div>}
              </>
            )}
          </div>
        ) : (
          <>
            {/* Hamburger Icon - Only show on input pages */}
            {(mode === "voice" || mode === "manual" || mode === "image") && (
              <>
                <HamburgerIcon
                  isOpen={menuOpen}
                  onToggle={() => setMenuOpen(!menuOpen)}
                />
                <LogoutButton onLogout={handleLogout} />
              </>
            )}

            {/* Hamburger Button Before Voice Input Section */}
            <div className="mb-8 flex justify-end">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white transition-all duration-300 cursor-pointer shadow-lg hover:shadow-xl transform hover:scale-105"
                title="Toggle Features Menu"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-5 flex flex-col justify-between">
                    <span className="h-0.5 w-full bg-white rounded"></span>
                    <span className="h-0.5 w-full bg-white rounded"></span>
                    <span className="h-0.5 w-full bg-white rounded"></span>
                  </div>
                  <span className="text-sm font-semibold">Menu</span>
                </div>
              </button>
            </div>

            {/* Mode Selector with Three Input Buttons (Voice, Manual, OCR) */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                ⚙️ Choose Input Method
                <span className="text-sm font-normal text-gray-300">(Select how you want to add items or view analytics)</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Four Input Buttons - Voice, Manual, OCR, Analytics */}
                <div className="md:col-span-4 grid grid-cols-1 md:grid-cols-4 gap-6">
                  {Object.entries(modeConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setMode(key)}
                      className={`p-8 rounded-2xl transition transform hover:scale-105 border-4 cursor-pointer backdrop-blur-sm ${
                        mode === key
                          ? `bg-gradient-to-br ${config.color} text-white border-white shadow-2xl scale-105 ring-4 ring-white/50`
                          : "bg-white/10 text-white border-white/30 hover:border-white/50 hover:bg-white/20 shadow-xl"
                      }`}
                    >
                      <div className="text-5xl mb-3 animate-bounce">{config.icon}</div>
                      <div className="text-2xl font-bold">{config.label}</div>
                      <div className="text-sm mt-2 opacity-90">{config.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Current Mode Banner */}
            <section className="mb-8">
              <div
                className={`bg-gradient-to-r ${currentMode.color} text-white p-8 rounded-2xl shadow-2xl border-4 border-white backdrop-blur-sm`}
              >
                <div className="flex items-center gap-4">
                  <span className="text-6xl animate-pulse drop-shadow-lg">{currentMode.icon}</span>
                  <div>
                    <h3 className="text-3xl font-bold">{currentMode.label}</h3>
                    <p className="text-base opacity-95 mt-1">{currentMode.description}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Input Component */}
            <section className="mb-12">
              <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 md:p-10 border-2 border-white/20">
                {mode === "voice" && <Voice onSaved={fetchBills} />}
                {mode === "manual" && <Calculator onSaved={fetchBills} />}
                {mode === "image" && <EnhancedOCR onSaved={fetchBills} />}
                {mode === "analytics" && <AnalyticsDashboard />}
              </div>
            </section>

            {/* Bills Statistics Section - Hidden in Analytics Mode */}
            {bills.length > 0 && mode !== "analytics" && (
              <section className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-8 rounded-2xl shadow-2xl backdrop-blur-sm hover:shadow-2xl transition transform hover:scale-105">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg opacity-90 font-semibold">Total Bills</div>
                      <div className="text-5xl font-bold mt-3">{stats.count}</div>
                      <div className="mt-3 text-xs opacity-75">📊 All transactions tracked</div>
                    </div>
                    <div className="text-5xl opacity-30">📋</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white p-8 rounded-2xl shadow-2xl backdrop-blur-sm hover:shadow-2xl transition transform hover:scale-105">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg opacity-90 font-semibold">Total Amount</div>
                      <div className="text-5xl font-bold mt-3">₹{stats.total.toLocaleString()}</div>
                      <div className="mt-3 text-xs opacity-75">💰 Sum of all bills</div>
                    </div>
                    <div className="text-5xl opacity-30">💵</div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white p-8 rounded-2xl shadow-2xl backdrop-blur-sm hover:shadow-2xl transition transform hover:scale-105">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg opacity-90 font-semibold">Average Amount</div>
                      <div className="text-5xl font-bold mt-3">₹{stats.avg.toLocaleString()}</div>
                      <div className="mt-3 text-xs opacity-75">📈 Mean per bill</div>
                    </div>
                    <div className="text-5xl opacity-30">📊</div>
                  </div>
                </div>
              </section>
            )}

            {/* Bills History - Hidden in Analytics Mode */}
            {mode !== "analytics" && (
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                    📋 Your Bills
                    <span className="text-sm font-normal text-gray-300 bg-white/10 px-3 py-1 rounded-full">
                      {bills.length} bills
                    </span>
                  </h2>
                  {bills.length > 0 && (
                    <button
                      onClick={fetchBills}
                      className="text-white hover:text-gray-100 font-semibold text-sm bg-blue-600 hover:bg-blue-700 px-5 py-2 rounded-lg transition transform hover:scale-105 shadow-lg backdrop-blur-sm"
                    >
                      🔄 Refresh Bills
                    </button>
                  )}
                </div>

                {bills.length === 0 ? (
                  <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-xl p-16 text-center border-2 border-dashed border-white/30">
                    <div className="text-7xl mb-4 opacity-60">📭</div>
                    <p className="text-2xl text-white font-semibold">
                      No bills yet. Create your first bill!
                    </p>
                    <p className="text-gray-300 mt-3 text-lg">
                      Use Voice 🎤, Manual ⌨️, or OCR 🖼️ mode to add items and save bills.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {bills.map((b) => (
                      <div
                        key={b._id}
                        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition transform hover:scale-105 border-2 border-transparent hover:border-blue-400 group"
                      >
                        {/* Bill Header */}
                        <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 text-white p-6 group-hover:from-blue-600 group-hover:via-blue-700 group-hover:to-indigo-700 transition">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="text-sm opacity-90 font-semibold">
                                📅 {new Date(b.createdAt).toLocaleDateString()} 
                              </div>
                              <div className="text-4xl font-bold mt-2">
                                ₹{(b.total || 0).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right text-sm opacity-90 font-semibold">
                              🕐 {new Date(b.createdAt).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>

                        {/* Bill Content */}
                        <div className="p-6">
                          <div className="mb-4">
                            <span className="inline-block bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
                              📦 {b.items?.length || 0} items
                            </span>
                          </div>

                          {/* Items Preview */}
                          <div className="max-h-56 overflow-auto mb-4 bg-gray-50 p-4 rounded-lg">
                            {b.items && b.items.length > 0 ? (
                              <ul className="space-y-2 text-sm">
                                {b.items.slice(0, 3).map((item, i) => (
                                  <li key={i} className="flex justify-between text-gray-800 hover:text-blue-600 transition p-2 hover:bg-white rounded">
                                    <span className="font-semibold">{item.name}</span>
                                    <span className="text-gray-600">
                                      {item.qty}× @ ₹{item.price.toFixed(2)} = <strong>₹{(item.qty * item.price).toFixed(2)}</strong>
                                    </span>
                                  </li>
                                ))}
                                {b.items.length > 3 && (
                                  <li className="text-gray-600 italic font-semibold p-2 bg-blue-50 rounded">
                                    +{b.items.length - 3} more items
                                  </li>
                                )}
                              </ul>
                            ) : (
                              <p className="text-gray-500 text-center py-6">No items</p>
                            )}
                          </div>

                          {/* Expand/Delete Buttons */}
                          <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
                            <button
                              onClick={() =>
                                setExpandedBill(expandedBill === b._id ? null : b._id)
                              }
                              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition transform hover:scale-105 text-sm shadow-lg"
                            >
                              {expandedBill === b._id ? "▼ Hide Details" : "► View All Items"}
                            </button>
                            <button
                              onClick={() => deleteBill(b._id)}
                              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold py-3 rounded-lg transition transform hover:scale-105 text-sm shadow-lg"
                            >
                              🗑 Delete
                            </button>
                          </div>

                          {/* Expanded View */}
                          {expandedBill === b._id && (
                            <div className="mt-6 pt-6 border-t-4 border-gradient-to-r from-blue-300 to-indigo-300 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl shadow-inner">
                              <h4 className="font-bold text-gray-800 mb-4 text-lg">📦 All Items Details:</h4>
                              <div className="space-y-3 max-h-72 overflow-auto">
                                {b.items && b.items.map((item, i) => (
                                  <div
                                    key={i}
                                    className="flex justify-between items-center bg-white p-4 rounded-lg border-l-4 border-blue-500 shadow-sm hover:shadow-md transition"
                                  >
                                    <div className="flex-1">
                                      <div className="font-bold text-gray-800 text-base">{item.name}</div>
                                      <div className="text-sm text-gray-600 mt-1">
                                        <span className="inline-block bg-yellow-100 text-yellow-800 px-2 py-1 rounded mr-2 font-semibold">Qty: {item.qty}</span>
                                        <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded font-semibold">Rate: ₹{item.price.toFixed(2)}</span>
                                      </div>
                                    </div>
                                    <div className="text-right font-bold text-2xl text-blue-600 ml-4">
                                      ₹{(item.qty * item.price).toFixed(2)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 pt-4 border-t-2 border-gray-300 bg-white p-4 rounded-lg font-bold text-lg text-right shadow-lg">
                                <span className="text-gray-700">Total Bill Amount: </span>
                                <span className="text-3xl text-blue-600">₹{(b.total || 0).toFixed(2)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-16 bg-white/10 backdrop-blur-md text-white py-8 border-t border-white/20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-base opacity-90">
            🚀 Smart Billing System v2.0 | Advanced Voice-enabled Billing
          </p>
          <p className="text-sm opacity-75 mt-2">
            © 2025 All bills are securely stored in your database 🩷 | Made with ❤️
          </p>
        </div>
      </footer>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
