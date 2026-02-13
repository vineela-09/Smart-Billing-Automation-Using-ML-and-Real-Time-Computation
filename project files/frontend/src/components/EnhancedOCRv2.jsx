import React, { useState, useEffect, useRef, useMemo } from "react";
import Tesseract from "tesseract.js";
import axios from "axios";

/**
 * EnhancedOCRv2.jsx
 * Complete OCR solution with:
 * - Advanced image upload with drag-drop
 * - Multi-image batch processing (6 images max)
 * - 5-step preprocessing for handwritten text
 * - Tesseract OCR integration
 * - Text extraction and display
 * - Editable textarea with re-parse
 * - Automatic item parsing
 * - Item operations (add/edit/delete)
 * - Running totals and calculations
 * - Multi-format exports (Excel, PDF, CSV)
 * - Progress tracking and confidence scoring
 * - Real-time error handling and toast notifications
 */

// Toast Notification Component
const Toast = ({ message, type = "info", onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
    warning: "bg-yellow-500"
  }[type];

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className={`${bgColor} text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2`}>
        {type === "success" && "✅"}
        {type === "error" && "❌"}
        {type === "info" && "ℹ️"}
        {type === "warning" && "⚠️"}
        {message}
      </div>
    </div>
  );
};

// Progress Bar Component
const ProgressBar = ({ progress, status }) => {
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-semibold text-gray-700">{status}</span>
        <span className="text-sm font-bold text-blue-600">{Math.round(progress)}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

// Image Preprocessing Function (5-step pipeline)
async function preprocessHandwrittenImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const fr = new FileReader();

    fr.onload = (e) => {
      img.src = e.target.result;
    };

    fr.onerror = () => reject(new Error("Failed to read file"));

    img.onload = () => {
      try {
        // Scale down if too large
        const maxWidth = 1600;
        const scale = Math.min(1, maxWidth / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);

        let imgd = ctx.getImageData(0, 0, w, h);
        let data = imgd.data;

        // STEP 1: Convert to grayscale
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          data[i] = data[i + 1] = data[i + 2] = gray;
        }

        // STEP 2: Enhance contrast (2.5x multiplier)
        const contrast = 2.5;
        const intercept = 128 * (1 - contrast) / 2;
        for (let i = 0; i < data.length; i += 4) {
          const val = Math.min(255, Math.max(0, data[i] * contrast + intercept));
          data[i] = data[i + 1] = data[i + 2] = val;
        }

        // STEP 3: Binary thresholding (threshold = 130)
        const threshold = 130;
        for (let i = 0; i < data.length; i += 4) {
          const val = data[i] > threshold ? 255 : 0;
          data[i] = data[i + 1] = data[i + 2] = val;
        }

        // STEP 4: Median denoise (3x3 kernel)
        const tempData = new Uint8ClampedArray(data);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const pixels = [];
            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                const idx = ((y + dy) * w + (x + dx)) * 4;
                pixels.push(tempData[idx]);
              }
            }
            pixels.sort((a, b) => a - b);
            const median = pixels[4];
            const idx = (y * w + x) * 4;
            data[idx] = data[idx + 1] = data[idx + 2] = median;
          }
        }

        // STEP 5: Sharpen filter
        const kernel = [-1, -1, -1, -1, 9, -1, -1, -1, -1];
        const newData = new Uint8ClampedArray(data);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            let sum = 0;
            for (let ky = -1; ky <= 1; ky++) {
              for (let kx = -1; kx <= 1; kx++) {
                const idx = ((y + ky) * w + (x + kx)) * 4;
                sum += tempData[idx] * kernel[(ky + 1) * 3 + (kx + 1)];
              }
            }
            const idx = (y * w + x) * 4;
            data[idx] = data[idx + 1] = data[idx + 2] = Math.min(255, Math.max(0, sum / 1));
          }
        }

        ctx.putImageData(imgd, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    fr.readAsDataURL(file);
  });
}

// Download blob utility
const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export to Excel
const exportToXLS = async (items, extractedText) => {
  try {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("OCR Items");

    ws.columns = [
      { header: "Item Name", key: "name", width: 25 },
      { header: "Quantity", key: "quantity", width: 15 },
      { header: "Unit Price", key: "price", width: 15 },
      { header: "Subtotal", key: "subtotal", width: 15 }
    ];

    items.forEach((item) => {
      ws.addRow({
        name: item.name,
        quantity: item.quantity || 1,
        price: item.price || 0,
        subtotal: (item.quantity || 1) * (item.price || 0)
      });
    });

    // Summary row
    const total = items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.price || 0)), 0);
    ws.addRow({
      name: "TOTAL",
      quantity: "",
      price: "",
      subtotal: total
    });

    const buffer = await wb.xlsx.writeBuffer();
    downloadBlob(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `ocr_items_${Date.now()}.xlsx`);
  } catch (error) {
    console.error("Excel export error:", error);
    throw new Error("Failed to export Excel file");
  }
};

// Export to PDF
const exportToPDF = async (items, extractedText) => {
  try {
    const html2pdf = (await import("html2pdf.js")).default;

    const element = document.createElement("div");
    element.innerHTML = `
      <div style="padding: 20px; font-family: Arial;">
        <h1 style="text-align: center; color: #1e40af;">OCR Extraction Report</h1>
        <p><strong>Extracted Text:</strong></p>
        <pre style="background: #f3f4f6; padding: 10px; border-radius: 5px;">${extractedText}</pre>
        
        <h2 style="margin-top: 20px;">Items Identified:</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #1e40af; color: white;">
              <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Item Name</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Qty</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
              <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item) => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 8px;">${item.name}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.quantity || 1}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${(item.price || 0).toFixed(2)}</td>
                <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">₹${((item.quantity || 1) * (item.price || 0)).toFixed(2)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div style="margin-top: 20px; text-align: right; font-size: 18px; font-weight: bold;">
          Total: ₹${items.reduce((sum, item) => sum + ((item.quantity || 1) * (item.price || 0)), 0).toFixed(2)}
        </div>
      </div>
    `;

    html2pdf().set({ margin: 10, filename: `ocr_report_${Date.now()}.pdf` }).from(element).save();
  } catch (error) {
    console.error("PDF export error:", error);
    throw new Error("Failed to export PDF file");
  }
};

// Export to CSV
const exportToCSV = (items, extractedText) => {
  const headers = ["Item Name", "Quantity", "Unit Price", "Subtotal"];
  const rows = items.map((item) => [
    item.name,
    item.quantity || 1,
    item.price || 0,
    ((item.quantity || 1) * (item.price || 0)).toFixed(2)
  ]);

  const csv = [
    headers.join(","),
    ...rows.map((row) => row.join(","))
  ].join("\n");

  downloadBlob(new Blob([csv], { type: "text/csv" }), `ocr_items_${Date.now()}.csv`);
};

// Parse extracted text to items
const parseTextToItems = (text) => {
  const lines = text.split("\n").filter((line) => line.trim());
  const items = [];

  lines.forEach((line) => {
    const match = line.match(/([a-zA-Z\s]+)\s*(\d+\.?\d*)?(?:\s*[×x]\s*(\d+\.?\d*))?(?:\s*₹?\s*(\d+\.?\d*))?/i);
    if (match) {
      const name = match[1]?.trim();
      const quantity = match[2] ? parseInt(match[2]) : 1;
      const price = match[4] ? parseFloat(match[4]) : 0;

      if (name && name.length > 1) {
        items.push({ id: Date.now() + Math.random(), name, quantity, price });
      }
    }
  });

  return items;
};

// Main Component
export default function EnhancedOCRv2() {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [extractedText, setExtractedText] = useState("");
  const [items, setItems] = useState([]);
  const [toast, setToast] = useState({ message: "", type: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [editingItem, setEditingItem] = useState(null);
  const fileInputRef = useRef(null);

  // Handle image upload
  const handleImageUpload = async (files) => {
    if (files.length + images.length > 6) {
      setToast({ message: "Maximum 6 images allowed", type: "warning" });
      return;
    }

    const newPreviews = [];
    const newImages = [];

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setToast({ message: `${file.name} is not an image`, type: "error" });
        continue;
      }

      newImages.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target.result);
        if (newPreviews.length === files.length) {
          setImages((prev) => [...prev, ...newImages]);
          setPreviews((prev) => [...prev, ...newPreviews]);
          setToast({ message: `${files.length} image(s) added successfully`, type: "success" });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle drag-drop
  const handleDragDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    handleImageUpload(files);
  };

  // Remove image
  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // Run OCR
  const runOCR = async () => {
    if (images.length === 0) {
      setToast({ message: "Please upload images first", type: "warning" });
      return;
    }

    setIsProcessing(true);
    let allText = "";
    const totalImages = images.length;

    try {
      for (let i = 0; i < images.length; i++) {
        setStatus(`Processing image ${i + 1} of ${totalImages}...`);
        setProgress((i / totalImages) * 100);

        // Preprocess image
        const processedImage = await preprocessHandwrittenImage(images[i]);

        // Run OCR
        const result = await Tesseract.recognize(processedImage, "eng");
        allText += result.data.text + "\n";
        setConfidence(Math.round(result.data.confidence));

        setProgress(((i + 1) / totalImages) * 100);
      }

      setExtractedText(allText);
      const parsedItems = parseTextToItems(allText);
      setItems(parsedItems);
      setStatus("OCR completed successfully!");
      setToast({ message: "Text extraction successful", type: "success" });
      setProgress(100);
    } catch (error) {
      console.error("OCR error:", error);
      setToast({ message: "OCR processing failed", type: "error" });
    } finally {
      setIsProcessing(false);
      setTimeout(() => setStatus(""), 2000);
    }
  };

  // Update extracted text
  const updateExtractedText = (text) => {
    setExtractedText(text);
    const parsedItems = parseTextToItems(text);
    setItems(parsedItems);
  };

  // Add item
  const addItem = () => {
    const newItem = {
      id: Date.now(),
      name: "New Item",
      quantity: 1,
      price: 0
    };
    setItems([...items, newItem]);
  };

  // Edit item
  const updateItem = (id, field, value) => {
    setItems(items.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  // Delete item
  const deleteItem = (id) => {
    setItems(items.filter((item) => item.id !== id));
  };

  // Calculate total
  const total = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity || 1) * (item.price || 0), 0),
    [items]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🖼️ Advanced OCR System</h1>
          <p className="text-gray-600">Upload images, extract text, and manage items with ease</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Image Upload */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-4">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📁 Image Upload</h2>

              {/* Drag-Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDragDrop}
                className="border-2 border-dashed border-blue-400 rounded-lg p-6 text-center cursor-pointer hover:border-blue-600 transition mb-4 bg-blue-50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleImageUpload(Array.from(e.target.files))}
                  className="hidden"
                />
                <div onClick={() => fileInputRef.current?.click()}>
                  <div className="text-4xl mb-2">🖼️</div>
                  <p className="text-sm font-semibold text-gray-700">Drag images or click to upload</p>
                  <p className="text-xs text-gray-500">Max 6 images, up to 10MB each</p>
                </div>
              </div>

              {/* Image Preview Grid */}
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-700 text-sm">Uploaded Images ({previews.length}/6)</h3>
                <div className="grid grid-cols-2 gap-2">
                  {previews.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      <img src={preview} alt={`preview-${idx}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={runOCR}
                disabled={isProcessing || images.length === 0}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-3 rounded-lg hover:shadow-lg disabled:opacity-50 mt-4 transition"
              >
                {isProcessing ? "⏳ Processing..." : "🚀 Run OCR"}
              </button>

              {/* Progress */}
              {isProcessing && (
                <div className="mt-4">
                  <ProgressBar progress={progress} status={status} />
                </div>
              )}

              {confidence > 0 && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Confidence:</strong> <span className="text-green-600">{confidence}%</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Text & Items */}
          <div className="lg:col-span-2 space-y-6">
            {/* Extracted Text */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">📝 Extracted Text</h2>
              <textarea
                value={extractedText}
                onChange={(e) => updateExtractedText(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Extracted text will appear here..."
              />
            </div>

            {/* Items Table */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">📦 Identified Items</h2>
                <button
                  onClick={addItem}
                  className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-600 transition"
                >
                  + Add Item
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold">Item Name</th>
                      <th className="px-4 py-2 text-center font-semibold">Qty</th>
                      <th className="px-4 py-2 text-right font-semibold">Price</th>
                      <th className="px-4 py-2 text-right font-semibold">Subtotal</th>
                      <th className="px-4 py-2 text-center font-semibold">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-blue-50 transition">
                        <td className="px-4 py-2">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, "name", e.target.value)}
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="px-4 py-2 text-center">
                          <input
                            type="number"
                            value={item.quantity || 1}
                            onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                            className="w-16 px-2 py-1 border rounded text-center"
                          />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <input
                            type="number"
                            value={item.price || 0}
                            onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border rounded text-right"
                            step="0.01"
                          />
                        </td>
                        <td className="px-4 py-2 text-right font-semibold">
                          ₹{((item.quantity || 1) * (item.price || 0)).toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <button
                            onClick={() => deleteItem(item.id)}
                            className="text-red-500 hover:text-red-700 font-bold"
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {items.length > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <div className="text-right">
                    <p className="text-gray-700 mb-2">Total Items: <strong>{items.length}</strong></p>
                    <p className="text-2xl font-bold text-blue-600">
                      Total: ₹{total.toFixed(2)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Export Options */}
            {items.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4">📥 Export Options</h2>
                <div className="grid grid-cols-3 gap-4">
                  <button
                    onClick={() => {
                      exportToXLS(items, extractedText);
                      setToast({ message: "Excel file downloaded", type: "success" });
                    }}
                    className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition font-semibold"
                  >
                    📊 Excel
                  </button>
                  <button
                    onClick={() => {
                      exportToPDF(items, extractedText);
                      setToast({ message: "PDF file downloaded", type: "success" });
                    }}
                    className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition font-semibold"
                  >
                    📄 PDF
                  </button>
                  <button
                    onClick={() => {
                      exportToCSV(items, extractedText);
                      setToast({ message: "CSV file downloaded", type: "success" });
                    }}
                    className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition font-semibold"
                  >
                    📋 CSV
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
