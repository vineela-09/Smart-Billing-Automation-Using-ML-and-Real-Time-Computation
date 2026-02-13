import React, { useState } from "react";
import AdvancedOCR from "./AdvancedOCR";
import Voice from "./Voice";
import Calculator from "./Calculator";

/**
 * FeaturePanel.jsx
 * Collapsible right-side panel with advanced features:
 * - Advanced OCR (handwritten text recognition)
 * - Voice to Text (speech recognition with analytics)
 * - Calculator (with bill operations)
 * - Real-time data processing
 */

export default function FeaturePanel({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("ocr");

  const features = [
    { id: "ocr", icon: "🖼️", label: "Advanced OCR", title: "Handwritten Text Recognition" },
    { id: "voice", icon: "🎤", label: "Voice Input", title: "Speech to Text & Analysis" },
    { id: "calc", icon: "🧮", label: "Calculator", title: "Advanced Calculations" }
  ];

  return (
    <div
      className={`fixed right-0 top-0 h-screen w-full md:w-96 bg-white shadow-2xl z-40 transform transition-transform duration-300 overflow-hidden ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex justify-between items-center sticky top-0 z-50">
        <h2 className="text-xl font-bold flex items-center gap-2">
          ⚙️ Advanced Features
        </h2>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded transition text-lg"
        >
          ✕
        </button>
      </div>

      {/* Feature Tabs */}
      <div className="flex gap-2 p-4 border-b bg-gray-50 sticky top-16 z-40">
        {features.map((feature) => (
          <button
            key={feature.id}
            onClick={() => setActiveTab(feature.id)}
            className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition flex flex-col items-center gap-1 ${
              activeTab === feature.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-gray-100 border"
            }`}
            title={feature.title}
          >
            <span className="text-lg">{feature.icon}</span>
            <span className="hidden sm:inline">{feature.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="overflow-y-auto h-[calc(100vh-130px)] pb-6">
        {/* OCR Tab */}
        {activeTab === "ocr" && (
          <div className="p-4 space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600">
              <h3 className="font-bold text-gray-800 mb-2">🖼️ Advanced OCR</h3>
              <p className="text-sm text-gray-700">
                Upload handwritten or printed images to extract text and convert to Excel sheets for data operations.
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <AdvancedOCR />
            </div>
          </div>
        )}

        {/* Voice Tab */}
        {activeTab === "voice" && (
          <div className="p-4 space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-600">
              <h3 className="font-bold text-gray-800 mb-2">🎤 Voice Input</h3>
              <p className="text-sm text-gray-700">
                Use voice commands to add items, perform calculations, and create bills. Includes real-time transcription and analytics.
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <Voice />
            </div>
          </div>
        )}

        {/* Calculator Tab */}
        {activeTab === "calc" && (
          <div className="p-4 space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-600">
              <h3 className="font-bold text-gray-800 mb-2">🧮 Calculator</h3>
              <p className="text-sm text-gray-700">
                Perform quick calculations with support for percentages, complex expressions, and add results directly to bills.
              </p>
            </div>
            <div className="max-h-96 overflow-y-auto">
              <Calculator />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-50 border-t p-4 text-xs text-gray-600 text-center">
        ✨ All features work with your dashboard data
      </div>
    </div>
  );
}
