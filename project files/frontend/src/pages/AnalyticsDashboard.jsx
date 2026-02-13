import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

/**
 * AnalyticsDashboard.jsx
 * Comprehensive dashboard with:
 * - Profile overview
 * - Day-wise billing summary
 * - Month-wise trends
 * - Year-wise financial insights
 * - Profit/Loss tracking
 * - Advanced filtering
 * - Dynamic charts and visualizations
 * - Export capabilities
 */

// Simple Chart Component (using ASCII/HTML visualization)
const BarChart = ({ data, title, color = "blue" }) => {
  if (!data || data.length === 0) return <div className="text-gray-500">No data available</div>;
  
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const colors = {
    blue: "bg-blue-500",
    green: "bg-green-500",
    red: "bg-red-500",
    purple: "bg-purple-500",
    orange: "bg-orange-500"
  };
  
  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-4">
            <div className="w-24 text-sm font-semibold text-gray-700 truncate">{item.label}</div>
            <div className="flex-1">
              <div className="h-8 bg-gray-200 rounded-lg overflow-hidden relative">
                <div
                  className={`h-full ${colors[color]} transition-all duration-500 flex items-center justify-end pr-2`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                >
                  <span className="text-white text-xs font-bold">{item.value}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Pie Chart Component
const PieChart = ({ data, title }) => {
  if (!data || data.length === 0) return <div className="text-gray-500">No data</div>;
  
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ["bg-blue-500", "bg-green-500", "bg-red-500", "bg-purple-500", "bg-orange-500", "bg-pink-500"];
  
  let startAngle = 0;
  const slices = data.map((item, idx) => {
    const sliceAngle = (item.value / total) * 360;
    const slice = {
      label: item.label,
      value: item.value,
      percent: ((item.value / total) * 100).toFixed(1),
      startAngle,
      angle: sliceAngle,
      color: colors[idx % colors.length]
    };
    startAngle += sliceAngle;
    return slice;
  });
  
  return (
    <div className="w-full">
      <h3 className="text-lg font-bold mb-4 text-gray-800">{title}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Legend */}
        <div className="space-y-2">
          {slices.map((slice, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${slice.color}`}></div>
              <span className="text-sm text-gray-700">{slice.label}</span>
              <span className="text-sm font-bold text-gray-900 ml-auto">{slice.percent}%</span>
            </div>
          ))}
        </div>
        {/* Pie visualization */}
        <div className="flex items-center justify-center">
          <div className="relative w-32 h-32 rounded-full border-4 border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-800">₹{total}</div>
              <div className="text-xs text-gray-600">Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AnalyticsDashboard() {
  const [bills, setBills] = useState([]);
  const [userName, setUserName] = useState("User");
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [filterType, setFilterType] = useState("month"); // month, year, day
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [itemFilter, setItemFilter] = useState("all");
  
  // Analytics data
  const [analytics, setAnalytics] = useState({
    totalRevenue: 0,
    totalProfit: 0,
    totalLoss: 0,
    billCount: 0,
    avgBillAmount: 0,
    bestSellingItem: null,
    highestProfitItem: null,
    lowestProfitItem: null
  });

  // Fetch bills
  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/bills`,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        }
      );
      setBills(res.data || []);
    } catch (e) {
      console.error("Failed to fetch bills:", e);
    } finally {
      setLoading(false);
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
  }, []);

  // Calculate filtered analytics
  const filteredAnalytics = useMemo(() => {
    let filtered = [...bills];

    // Apply date filter
    if (dateRange.start && dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      filtered = filtered.filter(b => {
        const billDate = new Date(b.billDate || b.createdAt);
        return billDate >= start && billDate <= end;
      });
    }

    // Apply item filter
    if (itemFilter !== "all") {
      filtered = filtered.filter(b =>
        b.items.some(item => item.name.toLowerCase().includes(itemFilter.toLowerCase()))
      );
    }

    // Apply category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter(b =>
        b.items.some(item => item.category === selectedCategory)
      );
    }

    // Calculate metrics
    const totalRevenue = filtered.reduce((sum, b) => sum + (b.total || 0), 0);
    const totalProfit = filtered.reduce((sum, b) => sum + (b.profitLoss || 0), 0);
    const totalLoss = filtered.filter(b => (b.profitLoss || 0) < 0).reduce((sum, b) => sum + Math.abs(b.profitLoss || 0), 0);
    
    // Best selling item
    const itemCount = {};
    filtered.forEach(b => {
      b.items?.forEach(item => {
        itemCount[item.name] = (itemCount[item.name] || 0) + item.qty;
      });
    });
    const bestSellingItem = Object.entries(itemCount).sort((a, b) => b[1] - a[1])[0];

    // Profit analysis
    const itemProfit = {};
    filtered.forEach(b => {
      b.items?.forEach(item => {
        const profit = (item.price - (item.principleAmount || 0)) * item.qty;
        if (!itemProfit[item.name]) {
          itemProfit[item.name] = { total: 0, count: 0 };
        }
        itemProfit[item.name].total += profit;
        itemProfit[item.name].count += item.qty;
      });
    });

    const profitEntries = Object.entries(itemProfit).sort((a, b) => b[1].total - a[1].total);
    const highestProfitItem = profitEntries[0];
    const lowestProfitItem = profitEntries[profitEntries.length - 1];

    return {
      totalRevenue,
      totalProfit,
      totalLoss,
      billCount: filtered.length,
      avgBillAmount: filtered.length > 0 ? totalRevenue / filtered.length : 0,
      bestSellingItem: bestSellingItem ? { name: bestSellingItem[0], qty: bestSellingItem[1] } : null,
      highestProfitItem: highestProfitItem ? { name: highestProfitItem[0], profit: highestProfitItem[1].total } : null,
      lowestProfitItem: lowestProfitItem ? { name: lowestProfitItem[0], profit: lowestProfitItem[1].total } : null,
      filteredBills: filtered
    };
  }, [bills, dateRange, selectedCategory, itemFilter]);

  // Calculate day-wise summary
  const dayWiseSummary = useMemo(() => {
    const summary = {};
    filteredAnalytics.filteredBills.forEach(b => {
      const date = new Date(b.billDate || b.createdAt).toLocaleDateString();
      if (!summary[date]) {
        summary[date] = { revenue: 0, profit: 0, bills: 0 };
      }
      summary[date].revenue += b.total || 0;
      summary[date].profit += b.profitLoss || 0;
      summary[date].bills += 1;
    });
    return Object.entries(summary)
      .sort((a, b) => new Date(a[0]) - new Date(b[0]))
      .slice(-7) // Last 7 days
      .map(([date, data]) => ({
        label: date,
        value: data.revenue,
        profit: data.profit,
        bills: data.bills
      }));
  }, [filteredAnalytics]);

  // Calculate month-wise summary
  const monthWiseSummary = useMemo(() => {
    const summary = {};
    bills.forEach(b => {
      const date = new Date(b.billDate || b.createdAt);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!summary[month]) {
        summary[month] = { revenue: 0, profit: 0, bills: 0 };
      }
      summary[month].revenue += b.total || 0;
      summary[month].profit += b.profitLoss || 0;
      summary[month].bills += 1;
    });
    return Object.entries(summary)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, data]) => ({
        label: month,
        value: data.revenue,
        profit: data.profit,
        bills: data.bills
      }));
  }, [bills]);

  // Calculate year-wise summary
  const yearWiseSummary = useMemo(() => {
    const summary = {};
    bills.forEach(b => {
      const year = new Date(b.billDate || b.createdAt).getFullYear();
      if (!summary[year]) {
        summary[year] = { revenue: 0, profit: 0, bills: 0 };
      }
      summary[year].revenue += b.total || 0;
      summary[year].profit += b.profitLoss || 0;
      summary[year].bills += 1;
    });
    return Object.entries(summary)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([year, data]) => ({
        label: year,
        value: data.revenue,
        profit: data.profit,
        bills: data.bills
      }));
  }, [bills]);

  // Get unique items and categories
  const allItems = useMemo(() => {
    const items = new Set();
    bills.forEach(b => {
      b.items?.forEach(item => items.add(item.name));
    });
    return Array.from(items);
  }, [bills]);

  const allCategories = useMemo(() => {
    const categories = new Set();
    bills.forEach(b => {
      b.items?.forEach(item => {
        if (item.category) categories.add(item.category);
      });
    });
    return Array.from(categories);
  }, [bills]);

  // Export functionality
  const exportAnalyticsCSV = () => {
    const headers = ["Date", "Revenue", "Profit/Loss", "Bill Count"];
    const data = dayWiseSummary.map(d => [
      d.label,
      d.value.toFixed(2),
      d.profit.toFixed(2),
      d.bills
    ]);

    const csv = [headers, ...data].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const exportAnalyticsJSON = () => {
    const data = {
      generatedAt: new Date().toISOString(),
      summary: filteredAnalytics,
      dayWise: dayWiseSummary,
      monthWise: monthWiseSummary,
      yearWise: yearWiseSummary,
      bills: filteredAnalytics.filteredBills
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl font-bold">Loading Analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Animation */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <header className="relative z-50 sticky top-0 bg-white/95 backdrop-blur-md shadow-2xl border-b-4 border-gradient-to-r from-purple-500 via-blue-500 to-indigo-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            📊 Advanced Analytics Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-2">
            Welcome, <span className="font-semibold text-blue-600">{userName}</span> | Comprehensive financial insights and analysis
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filter Section */}
        <section className="mb-8 bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/20">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            🔍 Advanced Filters
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
              <input
                type="date"
                value={dateRange.start || ""}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
              <input
                type="date"
                value={dateRange.end || ""}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Item Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Item</label>
              <select
                value={itemFilter}
                onChange={(e) => setItemFilter(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Items</option>
                {allItems.map(item => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter Actions */}
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => {
                setDateRange({ start: null, end: null });
                setSelectedCategory("all");
                setItemFilter("all");
              }}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition transform hover:scale-105"
            >
              ↻ Clear Filters
            </button>
            <button
              onClick={exportAnalyticsCSV}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition transform hover:scale-105"
            >
              📥 Export CSV
            </button>
            <button
              onClick={exportAnalyticsJSON}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition transform hover:scale-105"
            >
              📥 Export JSON
            </button>
          </div>
        </section>

        {/* Key Metrics */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Revenue */}
          <div className="bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white p-6 rounded-2xl shadow-2xl backdrop-blur-sm hover:shadow-2xl transition transform hover:scale-105">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm opacity-90 font-semibold">Total Revenue</div>
                <div className="text-4xl font-bold mt-3">₹{filteredAnalytics.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                <div className="mt-3 text-xs opacity-75">📈 {filteredAnalytics.billCount} bills</div>
              </div>
              <div className="text-5xl opacity-30">💰</div>
            </div>
          </div>

          {/* Total Profit */}
          <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-6 rounded-2xl shadow-2xl backdrop-blur-sm hover:shadow-2xl transition transform hover:scale-105">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm opacity-90 font-semibold">Total Profit</div>
                <div className="text-4xl font-bold mt-3" style={{ color: filteredAnalytics.totalProfit >= 0 ? '#4ade80' : '#f87171' }}>
                  ₹{Math.abs(filteredAnalytics.totalProfit).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                </div>
                <div className="mt-3 text-xs opacity-75">{filteredAnalytics.totalProfit >= 0 ? '✅ Profit' : '⚠️ Loss'}</div>
              </div>
              <div className="text-5xl opacity-30">{filteredAnalytics.totalProfit >= 0 ? '📈' : '📉'}</div>
            </div>
          </div>

          {/* Average Bill Amount */}
          <div className="bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white p-6 rounded-2xl shadow-2xl backdrop-blur-sm hover:shadow-2xl transition transform hover:scale-105">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm opacity-90 font-semibold">Average Bill</div>
                <div className="text-4xl font-bold mt-3">₹{filteredAnalytics.avgBillAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</div>
                <div className="mt-3 text-xs opacity-75">📊 Per bill</div>
              </div>
              <div className="text-5xl opacity-30">📋</div>
            </div>
          </div>

          {/* Total Bills */}
          <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 text-white p-6 rounded-2xl shadow-2xl backdrop-blur-sm hover:shadow-2xl transition transform hover:scale-105">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm opacity-90 font-semibold">Total Bills</div>
                <div className="text-4xl font-bold mt-3">{filteredAnalytics.billCount}</div>
                <div className="mt-3 text-xs opacity-75">📝 Transactions</div>
              </div>
              <div className="text-5xl opacity-30">🧾</div>
            </div>
          </div>
        </section>

        {/* Item Performance */}
        <section className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Best Selling Item */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🏆 Best Selling Item</h3>
            {filteredAnalytics.bestSellingItem ? (
              <div className="bg-gradient-to-r from-blue-100 to-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{filteredAnalytics.bestSellingItem.name}</div>
                <div className="text-sm text-gray-600 mt-2">Qty Sold: <span className="font-bold text-gray-800">{filteredAnalytics.bestSellingItem.qty} units</span></div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </div>

          {/* Highest Profit Item */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4">💎 Highest Profit Item</h3>
            {filteredAnalytics.highestProfitItem ? (
              <div className="bg-gradient-to-r from-green-100 to-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{filteredAnalytics.highestProfitItem.name}</div>
                <div className="text-sm text-gray-600 mt-2">Total Profit: <span className="font-bold text-green-600">₹{filteredAnalytics.highestProfitItem.profit.toFixed(2)}</span></div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </div>

          {/* Lowest Profit Item */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/20">
            <h3 className="text-xl font-bold text-gray-800 mb-4">⚠️ Lowest Profit Item</h3>
            {filteredAnalytics.lowestProfitItem ? (
              <div className="bg-gradient-to-r from-red-100 to-red-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{filteredAnalytics.lowestProfitItem.name}</div>
                <div className="text-sm text-gray-600 mt-2">Total Profit/Loss: <span className={`font-bold ${filteredAnalytics.lowestProfitItem.profit < 0 ? 'text-red-600' : 'text-red-600'}`}>₹{filteredAnalytics.lowestProfitItem.profit.toFixed(2)}</span></div>
              </div>
            ) : (
              <div className="text-gray-500">No data available</div>
            )}
          </div>
        </section>

        {/* Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Day-wise Revenue */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/20">
            <BarChart
              data={dayWiseSummary}
              title="Day-wise Revenue (Last 7 Days)"
              color="blue"
            />
          </div>

          {/* Day-wise Profit */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/20">
            <BarChart
              data={dayWiseSummary}
              title="Day-wise Profit/Loss (Last 7 Days)"
              color="green"
            />
          </div>

          {/* Month-wise Trends */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/20">
            <BarChart
              data={monthWiseSummary}
              title="Month-wise Revenue Trends"
              color="purple"
            />
          </div>

          {/* Year-wise Overview */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/20">
            <BarChart
              data={yearWiseSummary}
              title="Year-wise Revenue Overview"
              color="orange"
            />
          </div>
        </section>

        {/* Detailed Bills Table */}
        <section className="mb-8">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">📋 Detailed Bills</h2>
            
            {filteredAnalytics.filteredBills.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Items</th>
                      <th className="px-4 py-3 text-right font-semibold">Revenue</th>
                      <th className="px-4 py-3 text-right font-semibold">Profit/Loss</th>
                      <th className="px-4 py-3 text-center font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredAnalytics.filteredBills.slice(0, 10).map((bill, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition">
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {new Date(bill.billDate || bill.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {bill.items?.map(i => i.name).join(", ")}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">
                          ₹{(bill.total || 0).toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${(bill.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{(bill.profitLoss || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${(bill.profitLoss || 0) >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {(bill.profitLoss || 0) >= 0 ? '✅ Profit' : '⚠️ Loss'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredAnalytics.filteredBills.length > 10 && (
                  <div className="text-center mt-4 text-gray-600 font-semibold">
                    Showing 10 of {filteredAnalytics.filteredBills.length} bills
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-600">
                No bills found matching the selected filters
              </div>
            )}
          </div>
        </section>
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
