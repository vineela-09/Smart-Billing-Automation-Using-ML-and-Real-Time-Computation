import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import FeaturePanel from "../components/FeaturePanel";

/**
 * EnhancedDashboard.jsx
 * Complete dashboard with:
 * - Right-side icon-based navigation with collapsible feature panel
 * - Advanced OCR, Voice, and Calculator features
 * - Fixed sidebar navigation
 * - Profile overview section
 * - Day-wise bill analytics
 * - Month-wise bill analytics
 * - Year-wise bill analytics
 * - Profit/Loss bar charts
 * - Financial metrics (ROI, Margin, etc.)
 * - Real-time calculations
 */

// Icon-based Navigation Component with Feature Panel Toggle
const SidebarNav = ({ activeSection, setActiveSection, onFeaturesClick }) => {
  const sections = [
    { id: "profile", icon: "👤", label: "Profile", color: "from-blue-500 to-blue-600" },
    { id: "daywise", icon: "📅", label: "Daily", color: "from-green-500 to-green-600" },
    { id: "monthwise", icon: "📊", label: "Monthly", color: "from-purple-500 to-purple-600" },
    { id: "yearwise", icon: "📈", label: "Yearly", color: "from-orange-500 to-orange-600" },
    { id: "items", icon: "🏷️", label: "Items", color: "from-pink-500 to-pink-600" },
    { id: "settings", icon: "⚙️", label: "Settings", color: "from-gray-600 to-gray-700" }
  ];

  return (
    <div className="fixed right-0 top-0 h-screen w-24 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 border-l-4 border-gradient-to-b from-purple-500 to-blue-500 shadow-2xl flex flex-col items-center py-8 gap-4 z-50">
      {sections.map(section => (
        <button
          key={section.id}
          onClick={() => setActiveSection(section.id)}
          title={section.label}
          className={`relative p-4 rounded-2xl transition-all transform duration-300 ${
            activeSection === section.id
              ? `bg-gradient-to-br ${section.color} shadow-2xl scale-110 ring-4 ring-white/30`
              : "bg-white/10 hover:bg-white/20 hover:scale-105"
          }`}
        >
          <div className="text-4xl">{section.icon}</div>
          {activeSection === section.id && (
            <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 bg-white text-gray-800 px-3 py-1 rounded-lg font-semibold text-sm whitespace-nowrap shadow-lg">
              {section.label}
            </div>
          )}
        </button>
      ))}

      {/* Divider */}
      <div className="h-1 w-12 bg-white/20 rounded my-2"></div>

      {/* Features Panel Button */}
      <button
        onClick={onFeaturesClick}
        title="Advanced Features"
        className="relative p-4 rounded-2xl transition-all transform duration-300 bg-gradient-to-br from-emerald-500 to-teal-600 hover:scale-105 shadow-xl ring-2 ring-white/20 animate-pulse"
      >
        <div className="text-4xl">✨</div>
        <div className="absolute -left-14 top-1/2 transform -translate-y-1/2 bg-white text-gray-800 px-3 py-1 rounded-lg font-semibold text-sm whitespace-nowrap shadow-lg">
          Features
        </div>
      </button>
    </div>
  );
};

// Profile Section
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
      {/* Total Revenue */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-2xl shadow-xl">
        <div className="text-sm opacity-90 font-semibold mb-2">💰 Total Revenue</div>
        <div className="text-4xl font-bold">₹{stats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div className="text-sm opacity-75 mt-3">{stats.billCount} transactions</div>
      </div>

      {/* Total Profit */}
      <div className={`bg-gradient-to-br ${stats.totalProfit >= 0 ? 'from-emerald-500 to-emerald-600' : 'from-red-500 to-red-600'} text-white p-6 rounded-2xl shadow-xl`}>
        <div className="text-sm opacity-90 font-semibold mb-2">{stats.totalProfit >= 0 ? '📈 Total Profit' : '📉 Total Loss'}</div>
        <div className="text-4xl font-bold">₹{Math.abs(stats.totalProfit).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div className="text-sm opacity-75 mt-3">{stats.totalProfit >= 0 ? '✅ Positive' : '⚠️ Negative'}</div>
      </div>

      {/* Overall Margin */}
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-xl">
        <div className="text-sm opacity-90 font-semibold mb-2">📊 Profit Margin</div>
        <div className="text-4xl font-bold">{stats.marginPercentage.toFixed(1)}%</div>
        <div className="text-sm opacity-75 mt-3">Per transaction</div>
      </div>

      {/* Average Bill */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-xl">
        <div className="text-sm opacity-90 font-semibold mb-2">🧾 Average Bill</div>
        <div className="text-4xl font-bold">₹{stats.avgBill.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
        <div className="text-sm opacity-75 mt-3">Per transaction</div>
      </div>
    </div>
  </div>
);

// Day-wise Section with Chart
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
              
              {/* Revenue Bar */}
              <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-end pr-2"
                  style={{ width: `${Math.min(day.revenue / Math.max(...data.map(d => d.revenue)) * 100, 100)}%` }}
                >
                  <span className="text-white text-xs font-bold">₹{day.revenue}</span>
                </div>
              </div>

              {/* Profit Bar */}
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

// Month-wise Section
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

// Year-wise Section
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

            {/* Annual bar chart */}
            <div className="mt-6 h-16 bg-gray-200 rounded-lg overflow-hidden">
              <div className="h-full flex gap-1 p-2 bg-gray-100">
                {/* Simulate 12 months in miniature */}
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

// Items Management Section
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
                const margin = item.sellingPrice > 0 ? ((profitPerUnit / item.sellingPrice) * 100) : 0;
                
                return (
                  <tr key={idx} className="hover:bg-blue-50 transition">
                    <td className="px-6 py-4 font-semibold text-gray-800">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">₹{item.principleAmount.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">₹{item.sellingPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`font-bold ${margin > 30 ? 'text-emerald-600' : margin > 15 ? 'text-orange-600' : 'text-red-600'}`}>
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-purple-600">₹{profitPerUnit.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {items.length > 10 && (
          <div className="bg-gray-50 px-6 py-4 text-center text-gray-600 font-semibold border-t">
            Showing 10 of {items.length} items
          </div>
        )}
      </div>
    ) : (
      <div className="text-center py-12 bg-white/10 rounded-2xl">
        <div className="text-5xl mb-4">📦</div>
        <p className="text-white text-lg">No items configured yet</p>
        <p className="text-gray-300 mt-2">Add items from the settings section</p>
      </div>
    )}
  </div>
);

// Settings Section
const SettingsSection = () => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
      <span className="text-4xl">⚙️</span> Dashboard Settings
    </h2>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Display Settings */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📺 Display Settings</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-gray-700 font-semibold">Show Profit Margin</label>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-gray-700 font-semibold">Show ROI</label>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-gray-700 font-semibold">Show Trends</label>
            <input type="checkbox" defaultChecked className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Calculation Settings */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4">🧮 Calculation Settings</h3>
        <div className="space-y-4">
          <div>
            <label className="text-gray-700 font-semibold block mb-2">Default Margin %</label>
            <input type="number" defaultValue="30" min="0" max="100" className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500" />
          </div>
          <div>
            <label className="text-gray-700 font-semibold block mb-2">Currency Symbol</label>
            <select className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500">
              <option>₹ (INR)</option>
              <option>$ (USD)</option>
              <option>€ (EUR)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Export/Import */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📤 Data Management</h3>
        <div className="space-y-3">
          <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition font-semibold">
            📥 Import Items
          </button>
          <button className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition font-semibold">
            📤 Export Data
          </button>
        </div>
      </div>

      {/* Notifications */}
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

// Main Enhanced Dashboard Component
export default function EnhancedDashboard({ bills = [] }) {
  const [activeSection, setActiveSection] = useState("profile");
  const [userName, setUserName] = useState("User");
  const [items, setItems] = useState([]);
  const [featurePanelOpen, setFeaturePanelOpen] = useState(false);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = JSON.parse(atob(token.split(".")[1]));
        setUserName(decoded.name || "User");
      }
    } catch (e) {
      console.error("Token decode error:", e);
    }

    // Fetch items
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

  // Calculate analytics
  const analytics = useMemo(() => {
    const totalRevenue = bills.reduce((s, b) => s + (b.total || 0), 0);
    const totalProfit = bills.reduce((s, b) => s + (b.profitLoss || 0), 0);
    const totalCost = bills.reduce((s, b) => s + (b.principleTotal || 0), 0);
    const billCount = bills.length;
    const avgBill = billCount > 0 ? totalRevenue / billCount : 0;
    const marginPercentage = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

    // Day-wise data (last 7 days)
    const dayWiseData = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString();
      dayWiseData[dateStr] = { revenue: 0, profit: 0 };
    }

    bills.forEach(bill => {
      const billDate = new Date(bill.billDate || bill.createdAt).toLocaleDateString();
      if (dayWiseData[billDate]) {
        dayWiseData[billDate].revenue += bill.total || 0;
        dayWiseData[billDate].profit += bill.profitLoss || 0;
      }
    });

    const dayWiseSorted = Object.entries(dayWiseData).map(([label, data]) => ({
      label,
      revenue: data.revenue,
      profit: data.profit
    }));

    // Month-wise data
    const monthWiseData = {};
    bills.forEach(bill => {
      const date = new Date(bill.billDate || bill.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthWiseData[monthKey]) {
        monthWiseData[monthKey] = { revenue: 0, profit: 0, billCount: 0 };
      }
      monthWiseData[monthKey].revenue += bill.total || 0;
      monthWiseData[monthKey].profit += bill.profitLoss || 0;
      monthWiseData[monthKey].billCount += 1;
    });

    const monthWiseSorted = Object.entries(monthWiseData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([label, data]) => ({
        label,
        revenue: data.revenue,
        profit: data.profit,
        billCount: data.billCount,
        marginPercentage: data.revenue > 0 ? ((data.profit / data.revenue) * 100) : 0
      }));

    // Year-wise data
    const yearWiseData = {};
    bills.forEach(bill => {
      const year = new Date(bill.billDate || bill.createdAt).getFullYear();
      if (!yearWiseData[year]) {
        yearWiseData[year] = { revenue: 0, profit: 0 };
      }
      yearWiseData[year].revenue += bill.total || 0;
      yearWiseData[year].profit += bill.profitLoss || 0;
    });

    const yearWiseSorted = Object.entries(yearWiseData)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([label, data]) => ({
        label,
        revenue: data.revenue,
        profit: data.profit,
        marginPercentage: data.revenue > 0 ? ((data.profit / data.revenue) * 100) : 0
      }));

    return {
      totalRevenue,
      totalProfit,
      totalCost,
      billCount,
      avgBill,
      marginPercentage,
      dayWiseSorted,
      monthWiseSorted,
      yearWiseSorted
    };
  }, [bills]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Feature Panel */}
      <FeaturePanel isOpen={featurePanelOpen} onClose={() => setFeaturePanelOpen(false)} />

      {/* Right-side Navigation */}
      <SidebarNav activeSection={activeSection} setActiveSection={setActiveSection} onFeaturesClick={() => setFeaturePanelOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 mr-24 relative z-10 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Profile Section */}
          {activeSection === "profile" && <ProfileSection userName={userName} stats={analytics} />}

          {/* Day-wise Section */}
          {activeSection === "daywise" && <DayWiseSection data={analytics.dayWiseSorted} />}

          {/* Month-wise Section */}
          {activeSection === "monthwise" && <MonthWiseSection data={analytics.monthWiseSorted} />}

          {/* Year-wise Section */}
          {activeSection === "yearwise" && <YearWiseSection data={analytics.yearWiseSorted} />}

          {/* Items Section */}
          {activeSection === "items" && <ItemsSection items={items} />}

          {/* Settings Section */}
          {activeSection === "settings" && <SettingsSection />}
        </div>
      </main>

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
