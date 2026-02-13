import React, { useState, useEffect } from "react";
import axios from "axios";
import SuperiorOCRv3 from "../components/SuperiorOCRv3";

/**
 * ModernDashboardv2.jsx
 * Dashboard with hamburger menu containing all features
 * - Three-line icon on top-right
 * - Collapsible menu with OCR, Voice, Calculator
 * - Dashboard sections: Overview, Bills, Reports, Profile
 * - Real-time data integration
 * - Responsive design
 */

// Sidebar Navigation Component
const HamburgerMenu = ({ isOpen, onToggle, activeFeature, onSelectFeature, userName }) => {
  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={onToggle}
        className="fixed top-6 right-6 z-40 bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-lg hover:shadow-lg transition-all duration-300 md:hidden"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span className={`h-0.5 w-full bg-white transition-all duration-300 ${isOpen ? "rotate-45 translate-y-2" : ""}`} />
          <span className={`h-0.5 w-full bg-white transition-opacity duration-300 ${isOpen ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-full bg-white transition-all duration-300 ${isOpen ? "-rotate-45 -translate-y-2" : ""}`} />
        </div>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 right-0 h-screen w-72 bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 shadow-2xl transform transition-transform duration-300 z-50 overflow-y-auto ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-6 pt-20">
          {/* Close Button */}
          <button
            onClick={onToggle}
            className="absolute top-4 right-4 text-white text-2xl font-bold hover:text-gray-300 transition"
          >
            ✕
          </button>

          {/* User Info */}
          <div className="mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3">
              {userName?.charAt(0).toUpperCase() || "U"}
            </div>
            <p className="text-white font-semibold text-lg">{userName || "User"}</p>
            <p className="text-blue-300 text-sm">Premium User</p>
          </div>

          {/* Features Section */}
          <div className="space-y-3">
            <p className="text-blue-200 uppercase text-xs font-bold tracking-widest mb-4">Features</p>

            {[
              { id: "ocr", icon: "🖼️", label: "Advanced OCR", desc: "Upload & extract text" },
              { id: "voice", icon: "🎤", label: "Voice Input", desc: "Voice to text" },
              { id: "calculator", icon: "🧮", label: "Calculator", desc: "Quick calculations" }
            ].map(feature => (
              <button
                key={feature.id}
                onClick={() => {
                  onSelectFeature(feature.id);
                  onToggle();
                }}
                className={`w-full p-4 rounded-lg transition-all duration-300 ${
                  activeFeature === feature.id
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg scale-105"
                    : "bg-gray-800 text-blue-200 hover:bg-gray-700"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{feature.icon}</span>
                  <div className="text-left">
                    <p className="font-semibold text-sm">{feature.label}</p>
                    <p className="text-xs opacity-75">{feature.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Dashboard Section */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-blue-200 uppercase text-xs font-bold tracking-widest mb-4">Dashboard</p>

            {[
              { id: "overview", icon: "📊", label: "Overview" },
              { id: "bills", icon: "📋", label: "Bills" },
              { id: "reports", icon: "📈", label: "Reports" },
              { id: "profile", icon: "👤", label: "Profile" }
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  onSelectFeature(item.id);
                  onToggle();
                }}
                className={`w-full p-3 rounded-lg mb-2 transition-all duration-300 flex items-center gap-3 ${
                  activeFeature === item.id
                    ? "bg-gradient-to-r from-purple-500 to-purple-600 text-white"
                    : "text-blue-200 hover:bg-gray-800"
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </div>

          {/* Logout Button */}
          <button className="w-full mt-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all duration-300">
            🚪 Logout
          </button>
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

// Stats Card Component
const StatsCard = ({ icon, title, value, color, trend }) => (
  <div className={`bg-gradient-to-br ${color} rounded-2xl p-6 shadow-lg text-white`}>
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm opacity-75 font-medium">{title}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
        {trend && <p className="text-xs mt-2 opacity-75">{trend}</p>}
      </div>
      <span className="text-4xl">{icon}</span>
    </div>
  </div>
);

// Profile Section
const ProfileSection = ({ userData }) => (
  <div className="space-y-6">
    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl">
          👤
        </div>
        <div>
          <h2 className="text-2xl font-bold">{userData?.name || "John Doe"}</h2>
          <p className="text-blue-100">{userData?.email || "user@example.com"}</p>
          <p className="text-xs mt-2 bg-white bg-opacity-20 w-fit px-3 py-1 rounded-full">
            Member since {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <StatsCard icon="📋" title="Total Bills" value={userData?.totalBills || 0} color="from-purple-500 to-purple-600" />
      <StatsCard icon="💰" title="Total Amount" value={`₹${(userData?.totalAmount || 0).toLocaleString()}`} color="from-green-500 to-green-600" />
      <StatsCard icon="📊" title="Avg Amount" value={`₹${(userData?.avgAmount || 0).toLocaleString()}`} color="from-orange-500 to-orange-600" />
      <StatsCard icon="⭐" title="Rating" value={userData?.rating || "4.8/5"} color="from-yellow-500 to-yellow-600" />
    </div>
  </div>
);

// Overview Section
const OverviewSection = ({ stats }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <StatsCard
        icon="📊"
        title="Total Bills"
        value={stats?.totalBills || 0}
        color="from-blue-500 to-blue-600"
        trend="30 this month"
      />
      <StatsCard
        icon="💰"
        title="Total Revenue"
        value={`₹${(stats?.totalRevenue || 0).toLocaleString()}`}
        color="from-green-500 to-green-600"
        trend="↑ 12% from last month"
      />
      <StatsCard
        icon="📈"
        title="Total Profit"
        value={`₹${(stats?.totalProfit || 0).toLocaleString()}`}
        color="from-purple-500 to-purple-600"
        trend="↑ 8% from last month"
      />
      <StatsCard
        icon="👥"
        title="Active Users"
        value={stats?.activeUsers || 0}
        color="from-pink-500 to-pink-600"
        trend="Growth on track"
      />
    </div>

    {/* Charts Area */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Monthly Trends</h3>
        <div className="h-48 flex items-end gap-2">
          {[40, 60, 45, 75, 80, 55, 85].map((value, idx) => (
            <div
              key={idx}
              className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t opacity-80 hover:opacity-100 transition"
              style={{ height: `${value}%` }}
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">🎯 Performance</h3>
        <div className="space-y-4">
          {[
            { label: "Conversion", value: 85 },
            { label: "Customer Satisfaction", value: 92 },
            { label: "Delivery Time", value: 78 }
          ].map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700">{item.label}</span>
                <span className="text-sm font-bold text-blue-600">{item.value}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Bills Section
const BillsSection = ({ bills }) => (
  <div className="space-y-4">
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Recent Bills</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Bill ID</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Customer</th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Date</th>
            </tr>
          </thead>
          <tbody>
            {(bills && bills.length > 0 ? bills : [
              { id: "BL001", customer: "ABC Company", amount: 5000, status: "Paid", date: "2024-01-15" },
              { id: "BL002", customer: "XYZ Store", amount: 3500, status: "Pending", date: "2024-01-16" },
              { id: "BL003", customer: "Tech Solutions", amount: 8000, status: "Paid", date: "2024-01-17" }
            ]).map((bill, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-3 font-semibold text-gray-800">{bill.id}</td>
                <td className="px-4 py-3 text-gray-700">{bill.customer}</td>
                <td className="px-4 py-3 text-right font-bold text-green-600">₹{bill.amount.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    bill.status === "Paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {bill.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-700">{bill.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// Reports Section
const ReportsSection = ({ stats }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-sm opacity-75">Avg Bill Value</p>
        <p className="text-3xl font-bold mt-2">₹{((stats?.totalRevenue || 0) / (stats?.totalBills || 1)).toLocaleString()}</p>
        <p className="text-xs mt-2 opacity-75">Per transaction</p>
      </div>
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-sm opacity-75">Success Rate</p>
        <p className="text-3xl font-bold mt-2">98.5%</p>
        <p className="text-xs mt-2 opacity-75">All transactions</p>
      </div>
      <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-sm opacity-75">Pending Bills</p>
        <p className="text-3xl font-bold mt-2">{stats?.pendingBills || 0}</p>
        <p className="text-xs mt-2 opacity-75">Awaiting payment</p>
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📊 Revenue Breakdown</h3>
        <div className="space-y-3">
          {[
            { category: "Products", percentage: 60, amount: 180000 },
            { category: "Services", percentage: 30, amount: 90000 },
            { category: "Others", percentage: 10, amount: 30000 }
          ].map((item, idx) => (
            <div key={idx}>
              <div className="flex justify-between mb-2">
                <span className="font-semibold text-gray-700">{item.category}</span>
                <span className="font-bold text-gray-800">₹{item.amount.toLocaleString()}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`h-full rounded-full ${
                    idx === 0 ? "bg-blue-500" : idx === 1 ? "bg-green-500" : "bg-purple-500"
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">📈 Growth Metrics</h3>
        <div className="space-y-3">
          {[
            { metric: "Revenue Growth", value: "+23.5%", color: "text-green-600" },
            { metric: "Customer Growth", value: "+15.2%", color: "text-blue-600" },
            { metric: "Efficiency", value: "+8.7%", color: "text-purple-600" }
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="font-semibold text-gray-700">{item.metric}</span>
              <span className={`font-bold text-lg ${item.color}`}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Main Dashboard Component
export default function ModernDashboardv2() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState("overview");
  const [userData, setUserData] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats calculation
  const stats = {
    totalBills: bills?.length || 0,
    totalRevenue: bills?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0,
    totalProfit: Math.round((bills?.reduce((sum, b) => sum + (b.amount || 0), 0) || 0) * 0.35),
    activeUsers: 324,
    pendingBills: bills?.filter(b => b.status === "Pending").length || 0
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        // Fetch user profile
        try {
          const userRes = await axios.get("http://localhost:5000/api/user/profile", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setUserData(userRes.data.data);
        } catch (err) {
          // Use default data if API fails
          setUserData({ name: "John Doe", email: "user@example.com" });
        }

        // Fetch bills
        try {
          const billsRes = await axios.get("http://localhost:5000/api/bills", {
            headers: { Authorization: `Bearer ${token}` }
          });
          setBills(billsRes.data.data || []);
        } catch (err) {
          // Use default data if API fails
          setBills([]);
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to load data");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Render content based on active feature
  const renderContent = () => {
    switch (activeFeature) {
      case "ocr":
        return <SuperiorOCRv3 />;
      case "voice":
        return (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-6xl mb-4">🎤</p>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Voice Input</h2>
            <p className="text-gray-600">Voice to text feature coming soon...</p>
          </div>
        );
      case "calculator":
        return (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-6xl mb-4">🧮</p>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Calculator</h2>
            <p className="text-gray-600">Advanced calculator feature coming soon...</p>
          </div>
        );
      case "bills":
        return <BillsSection bills={bills} />;
      case "reports":
        return <ReportsSection stats={stats} />;
      case "profile":
        return <ProfileSection userData={userData} />;
      case "overview":
      default:
        return <OverviewSection stats={stats} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50">
      {/* Hamburger Menu */}
      <HamburgerMenu
        isOpen={menuOpen}
        onToggle={() => setMenuOpen(!menuOpen)}
        activeFeature={activeFeature}
        onSelectFeature={setActiveFeature}
        userName={userData?.name}
      />

      {/* Main Content */}
      <div className="p-4 md:p-8">
        <div className="max-w-7xl mx-auto pt-6">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-2">
              Welcome Back! 👋
            </h1>
            <p className="text-gray-600 text-lg">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric"
              })}
            </p>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="inline-block">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
              </div>
              <p className="text-gray-600 mt-4">Loading dashboard...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Content */}
          {!loading && !error && renderContent()}

          {/* Mobile Hint */}
          <div className="md:hidden fixed bottom-4 left-4 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm">
            Tap ☰ to access menu
          </div>
        </div>
      </div>

      {/* Desktop Sidebar Hint */}
      <div className="hidden md:block fixed top-4 right-4 text-gray-600 text-sm">
        📌 Menu available on mobile
      </div>
    </div>
  );
}
