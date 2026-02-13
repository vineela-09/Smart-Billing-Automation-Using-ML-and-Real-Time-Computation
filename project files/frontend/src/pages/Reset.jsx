import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function Reset() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);
  const nav = useNavigate();

  useEffect(() => {
    // Get email and otp from localStorage (set by Forgot page)
    const storedEmail = localStorage.getItem("resetEmail");
    const storedOTP = localStorage.getItem("resetOTP");

    if (!storedEmail || !storedOTP) {
      setError("Invalid access. Please start from forgot password page.");
      setTimeout(() => nav("/forgot"), 2000);
      return;
    }

    setEmail(storedEmail);
    setOtp(storedOTP);
  }, [nav]);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Password is required");
      triggerShake();
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      triggerShake();
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/reset`, {
        email,
        otp,
        password,
      });

      setSuccess(true);
      localStorage.removeItem("resetEmail");
      localStorage.removeItem("resetOTP");

      setTimeout(() => {
        nav("/");
      }, 2000);
    } catch (err) {
      const errorMsg = err?.response?.data?.message || "Password reset failed";
      setError(errorMsg);
      triggerShake();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-emerald-900 via-green-900 to-teal-900 p-4">
      {/* Animated Background Elements */}
      <div className="absolute w-96 h-96 bg-green-500/30 blur-3xl rounded-full top-0 left-0 animate-pulse"></div>
      <div className="absolute w-96 h-96 bg-teal-500/30 blur-3xl rounded-full bottom-0 right-0 animate-pulse"></div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 5}s infinite`,
              animationDelay: `${Math.random() * 4}s`,
              opacity: Math.random() * 0.7 + 0.3,
            }}
          ></div>
        ))}
      </div>

      {/* Main Card */}
      <div className={`relative z-10 w-full max-w-md transform transition-all duration-300 ${shake ? "animate-shake" : ""}`}>
        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl border border-white/20 hover:border-green-400/50 transition">
          {success ? (
            // Success State
            <>
              <div className="text-center">
                <div className="text-6xl mb-4 animate-bounce">✅</div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                  Success!
                </h1>
                <p className="text-gray-300 text-sm mt-4">
                  Your password has been reset successfully. Redirecting to login...
                </p>
              </div>
            </>
          ) : (
            // Reset Form
            <>
              <div className="text-center mb-8">
                <div className="text-5xl mb-3">🔑</div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-teal-400 bg-clip-text text-transparent">
                  Set New Password
                </h1>
                <p className="text-gray-300 text-sm mt-2">Create a strong password for your account</p>
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-4 text-sm animate-fadeIn">
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleReset} className="space-y-4">
                {/* Email Display */}
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full p-3 rounded-lg bg-white/10 text-gray-400 placeholder-gray-400 border border-white/20 focus:outline-none opacity-60"
                  />
                </div>

                {/* New Password Input */}
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:border-green-400 focus:outline-none transition"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-white transition text-lg"
                    >
                      {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  <p className="text-gray-400 text-xs mt-1">Minimum 6 characters</p>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-gray-300 text-sm font-semibold mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full p-3 rounded-lg bg-white/10 text-white placeholder-gray-400 border border-white/20 focus:border-green-400 focus:outline-none transition"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {/* Password Strength Indicator */}
                {password && (
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex justify-between mb-2">
                      <span className="text-xs text-gray-300">Password Strength:</span>
                      <span className={`text-xs font-semibold ${
                        password.length < 6
                          ? "text-red-400"
                          : password.length < 10
                          ? "text-yellow-400"
                          : "text-green-400"
                      }`}>
                        {password.length < 6 ? "Weak" : password.length < 10 ? "Medium" : "Strong"}
                      </span>
                    </div>
                    <div className="w-full bg-white/10 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition ${
                          password.length < 6
                            ? "w-1/3 bg-red-400"
                            : password.length < 10
                            ? "w-2/3 bg-yellow-400"
                            : "w-full bg-green-400"
                        }`}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Reset Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white font-bold rounded-lg shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Resetting Password...
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </button>

                <p className="text-center text-gray-400 text-sm">
                  Remember your password?{" "}
                  <Link to="/" className="text-green-400 hover:text-green-300 font-semibold transition">
                    Login
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .animate-fadeIn {
          animation: fadeIn 0.4s ease-in-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        .animate-bounce {
          animation: bounce 1s infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
