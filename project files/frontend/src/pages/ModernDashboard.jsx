import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import EnhancedOCRv2 from "../components/EnhancedOCRv2";
import Voice from "../components/Voice";
import Calculator from "../components/Calculator";

/**
 * ModernDashboard.jsx
 * Icon-based dashboard with:
 * - Icon sidebar on the right
 * - Collapsible feature panel for advanced features
 * - EnhancedDashboard features integrated into the panel
 * - OCR, Voice, and Calculator features
 * - Profile overview, analytics, and bill management
 * - Smooth animations and responsive design
 */

// Profile Card
const ProfileCard = ({ user }) => (
  <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg">
    <div className="flex items-center gap-4 mb-6">
      <div className="w-16 h-16 bg-white/30 rounded-full flex items-center justify-center text-3xl">
        👤
      </div>
      <div>
        <h2 className="text-2xl font-bold">{user?.name || "User"}</h2>
        <p className="text-white/80">{user?.email || "user@example.com"}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white/20 rounded-lg p-3">
        <p className="text-sm text-white/80">Total Bills</p>
        <p className="text-2xl font-bold">{user?.totalBills || 0}</p>
      </div>
      <div className="bg-white/20 rounded-lg p-3">
        <p className="text-sm text-white/80">Total Revenue</p>
        <p className="text-2xl font-bold">₹{(user?.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
      </div>
    </div>
  </div>
);

// Stats Card
const StatsCard = ({ icon, title, value, color = "blue" }) => {
  const colors = {
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    purple: "from-purple-500 to-purple-600",
    orange: "from-orange-500 to-orange-600",
    red: "from-red-500 to-red-600"
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-6 text-white shadow-lg`}>
      <p className="text-4xl mb-2">{icon}</p>
      <p className="text-sm text-white/80 mb-2">{title}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
};

// Sidebar Navigation
const SidebarNav = ({ activeIcon, setActiveIcon, onFeaturesClick }) => {
  const icons = [
    { id: "profile", icon: "👤", label: "Profile", color: "purple" },
    { id: "analytics", icon: "📊", label: "Analytics", color: "blue" },
    { id: "bills", icon: "📋", label: "Bills", color: "green" },
    { id: "reports", icon: "📈", label: "Reports", color: "orange" }
  ];

  return (
    <div className="fixed right-0 top-0 h-screen w-20 bg-gradient-to-b from-slate-900 to-slate-800 shadow-2xl z-40 flex flex-col items-center py-4 gap-4">
      {/* Logo */}
      <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg mb-4">
        💳
      </div>

      {/* Nav Icons */}
      <div className="flex-1 flex flex-col gap-6">
        {icons.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveIcon(item.id)}
            className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl transition-all transform hover:scale-110 ${
              activeIcon === item.id
                ? `bg-gradient-to-br from-${item.color}-400 to-${item.color}-600 shadow-lg scale-105`
                : "bg-slate-700 hover:bg-slate-600"
            }`}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* Features Button (Bottom) */}
      <div className="mt-auto pt-4 border-t border-slate-700">
        <button
          onClick={onFeaturesClick}
          className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-2xl hover:shadow-lg transition-all transform hover:scale-110 animate-pulse"
          title="Advanced Features"
        >
          ✨
        </button>
      </div>
    </div>
  );
};

// Feature Panel
const FeaturePanel = ({ isOpen, onClose, activeTab, setActiveTab }) => {
  return (
    <div
      className={`fixed right-20 top-0 h-screen w-96 bg-white shadow-2xl transform transition-transform duration-300 z-30 overflow-hidden ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">✨ Advanced Features</h2>
          <button
            onClick={onClose}
            className="text-2xl hover:bg-white/20 w-8 h-8 rounded flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50">
          <button
            onClick={() => setActiveTab("ocr")}
            className={`flex-1 py-3 font-semibold transition ${
              activeTab === "ocr"
                ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            🖼️ OCR
          </button>
          <button
            onClick={() => setActiveTab("voice")}
            className={`flex-1 py-3 font-semibold transition ${
              activeTab === "voice"
                ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            🎤 Voice
          </button>
          <button
            onClick={() => setActiveTab("calculator")}
            className={`flex-1 py-3 font-semibold transition ${
              activeTab === "calculator"
                ? "border-b-2 border-blue-600 text-blue-600 bg-white"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            🧮 Calc
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "ocr" && <EnhancedOCRv2 />}
          {activeTab === "voice" && <Voice />}
          {activeTab === "calculator" && <Calculator />}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 p-4 text-xs text-gray-600 text-center">
          💡 Use these advanced tools to enhance your billing workflow
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
export default function ModernDashboard() {
  const [activeIcon, setActiveIcon] = useState("profile");
  const [featurePanelOpen, setFeaturePanelOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ocr");
  const [userData, setUserData] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const userRes = await axios.get("http://localhost:5000/api/users/profile", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const billsRes = await axios.get("http://localhost:5000/api/bills", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUserData(userRes.data);
        setBills(billsRes.data || []);

        // Calculate analytics
        const totalBills = billsRes.data?.length || 0;
        const totalRevenue = billsRes.data?.reduce((sum, bill) => sum + (bill.total || 0), 0) || 0;
        const totalProfit = billsRes.data?.reduce((sum, bill) => sum + (bill.profitLoss || 0), 0) || 0;

        setAnalytics({
          totalBills,
          totalRevenue,
          totalProfit,
          averageBill: totalBills > 0 ? totalRevenue / totalBills : 0
        });

        setLoading(false);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen pr-20">
      {/* Sidebar */}
      <SidebarNav
        activeIcon={activeIcon}
        setActiveIcon={setActiveIcon}
        onFeaturesClick={() => setFeaturePanelOpen(true)}
      />

      {/* Feature Panel */}
      <FeaturePanel
        isOpen={featurePanelOpen}
        onClose={() => setFeaturePanelOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Content */}
      <main className="p-8 max-w-7xl mx-auto">
        {/* Profile Section */}
        {activeIcon === "profile" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">👤 Profile</h1>
              <p className="text-gray-600">View your account information and statistics</p>
            </div>

            <ProfileCard user={userData} />

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard
                icon="📋"
                title="Total Bills"
                value={analytics?.totalBills || 0}
                color="blue"
              />
              <StatsCard
                icon="💰"
                title="Total Revenue"
                value={`₹${(analytics?.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                color="green"
              />
              <StatsCard
                icon="📈"
                title="Total Profit"
                value={`₹${(analytics?.totalProfit || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                color="purple"
              />
              <StatsCard
                icon="💵"
                title="Avg Bill"
                value={`₹${(analytics?.averageBill || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                color="orange"
              />
            </div>

            {/* Recent Bills */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Recent Bills</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Date</th>
                      <th className="px-4 py-3 text-left font-semibold">Items</th>
                      <th className="px-4 py-3 text-right font-semibold">Total</th>
                      <th className="px-4 py-3 text-right font-semibold">Profit/Loss</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bills.slice(0, 5).map((bill, idx) => (
                      <tr key={idx} className="hover:bg-blue-50 transition">
                        <td className="px-4 py-3 font-semibold text-gray-800">
                          {new Date(bill.billDate || bill.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-gray-700">
                          {bill.items?.length || 0} items
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-green-600">
                          ₹{(bill.total || 0).toFixed(2)}
                        </td>
                        <td className={`px-4 py-3 text-right font-bold ${(bill.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ₹{(bill.profitLoss || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Section */}
        {activeIcon === "analytics" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">📊 Analytics</h1>
              <p className="text-gray-600">Detailed insights and performance metrics</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <StatsCard
                icon="📋"
                title="Total Bills"
                value={analytics?.totalBills || 0}
                color="blue"
              />
              <StatsCard
                icon="💰"
                title="Total Revenue"
                value={`₹${(analytics?.totalRevenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                color="green"
              />
              <StatsCard
                icon="📈"
                title="Total Profit"
                value={`₹${(analytics?.totalProfit || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                color="purple"
              />
              <StatsCard
                icon="💵"
                title="Avg Bill"
                value={`₹${(analytics?.averageBill || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                color="orange"
              />
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                  <span className="text-gray-700 font-semibold">Total Bills:</span>
                  <span className="text-2xl font-bold text-blue-600">{analytics?.totalBills || 0}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="text-gray-700 font-semibold">Total Revenue:</span>
                  <span className="text-2xl font-bold text-green-600">₹{(analytics?.totalRevenue || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
                  <span className="text-gray-700 font-semibold">Total Profit:</span>
                  <span className="text-2xl font-bold text-purple-600">₹{(analytics?.totalProfit || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                  <span className="text-gray-700 font-semibold">Average Bill:</span>
                  <span className="text-2xl font-bold text-orange-600">₹{(analytics?.averageBill || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bills Section */}
        {activeIcon === "bills" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">📋 Bills</h1>
              <p className="text-gray-600">Manage all your billing records</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-lg overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Date</th>
                    <th className="px-4 py-3 text-left font-semibold">Items</th>
                    <th className="px-4 py-3 text-right font-semibold">Total</th>
                    <th className="px-4 py-3 text-right font-semibold">Profit/Loss</th>
                    <th className="px-4 py-3 text-center font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {bills.map((bill, idx) => (
                    <tr key={idx} className="hover:bg-blue-50 transition">
                      <td className="px-4 py-3 font-semibold text-gray-800">
                        {new Date(bill.billDate || bill.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {bill.items?.map(i => i.name).join(", ") || "N/A"}
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
            </div>
          </div>
        )}

        {/* Reports Section */}
        {activeIcon === "reports" && (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">📈 Reports</h1>
              <p className="text-gray-600">Comprehensive business reports and insights</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">💰 Revenue Overview</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Revenue:</span>
                    <span className="text-2xl font-bold text-green-600">₹{(analytics?.totalRevenue || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Profit:</span>
                    <span className="text-2xl font-bold text-blue-600">₹{(analytics?.totalProfit || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Number of Bills:</span>
                    <span className="text-2xl font-bold text-purple-600">{analytics?.totalBills || 0}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-lg">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📊 Bill Statistics</h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg Bill Value:</span>
                    <span className="text-2xl font-bold text-orange-600">₹{(analytics?.averageBill || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Highest Bill:</span>
                    <span className="text-2xl font-bold text-pink-600">
                      ₹{bills.length > 0 ? Math.max(...bills.map(b => b.total || 0)).toFixed(2) : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Lowest Bill:</span>
                    <span className="text-2xl font-bold text-cyan-600">
                      ₹{bills.length > 0 ? Math.min(...bills.map(b => b.total || 0)).toFixed(2) : "0.00"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => setFeaturePanelOpen(!featurePanelOpen)}
        className="fixed bottom-8 right-28 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all transform hover:scale-110 animate-pulse z-20"
        title="Open Features"
      >
        ✨
      </button>

      <style>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
