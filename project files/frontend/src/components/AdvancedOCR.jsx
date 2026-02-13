import React, { useEffect, useMemo, useRef, useState } from "react";
import Tesseract from "tesseract.js";
import axios from "axios";

/**
 * AdvancedOCR.jsx
 * Enhanced OCR Component with:
 * - Image upload with drag-drop preview
 * - Advanced handwritten text recognition
 * - PDF export (invoice, reports)
 * - Excel (XLS/XLSX) export with operations
 * - CSV export
 * - Batch processing with progress
 * - Handwritten-to-Excel conversion
 * - Real-time data operations
 */

// Toast component
const Toast = ({ msg, onClose }) => {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 4200);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  if (!msg) return null;
  return (
    <div className="fixed right-4 bottom-6 z-50">
      <div className="bg-black text-white px-4 py-2 rounded shadow-lg animate-pulse">
        {msg}
      </div>
    </div>
  );
};

// Progress bar component
const ProgressBar = ({ progress, label }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-xs">
      <span className="font-semibold">{label}</span>
      <span className="text-gray-600">{progress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div
        className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  </div>
);

// Advanced image preprocessing for handwritten text
async function preprocessHandwrittenImage(
  file,
  { maxWidth = 1600, enhance = true } = {}
) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const fr = new FileReader();
    fr.onload = (e) => (img.src = e.target.result);
    fr.onerror = () => reject(new Error("File read error"));

    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      const imgd = ctx.getImageData(0, 0, w, h);
      const data = imgd.data;

      // Step 1: Grayscale
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i],
          g = data[i + 1],
          b = data[i + 2];
        const l = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = data[i + 1] = data[i + 2] = l;
      }

      // Step 2: High contrast for handwritten text (CRITICAL)
      if (enhance) {
        const contrast = 2.5; // Very high for handwriting
        const intercept = 128 * (1 - contrast) / 2;
        for (let i = 0; i < data.length; i += 4) {
          const val = Math.min(255, Math.max(0, data[i] * contrast + intercept));
          data[i] = data[i + 1] = data[i + 2] = val;
        }
      }

      // Step 3: Adaptive thresholding for binary
      const threshold = 130; // Adjusted for handwritten
      for (let i = 0; i < data.length; i += 4) {
        const val = data[i] > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = val;
      }

      // Step 4: Median filter for noise reduction
      const tempData = new Uint8ClampedArray(data);
      for (let i = 0; i < w * h; i++) {
        const pixelIdx = i * 4;
        const row = Math.floor(i / w);
        const col = i % w;

        if (row === 0 || row === h - 1 || col === 0 || col === w - 1)
          continue;

        const neighbors = [];
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((row + dy) * w + (col + dx)) * 4;
            neighbors.push(tempData[nIdx]);
          }
        }

        neighbors.sort((a, b) => a - b);
        const median = neighbors[4];
        data[pixelIdx] = data[pixelIdx + 1] = data[pixelIdx + 2] = median;
      }

      // Step 5: Sharpening for crisp edges
      const sharpData = new Uint8ClampedArray(data);
      const kernel = [-1, -1, -1, -1, 9, -1, -1, -1, -1];
      for (let i = 0; i < w * h; i++) {
        const row = Math.floor(i / w);
        const col = i % w;
        if (row === 0 || row === h - 1 || col === 0 || col === w - 1)
          continue;

        const pixelIdx = i * 4;
        let sum = 0;
        let ki = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nIdx = ((row + dy) * w + (col + dx)) * 4;
            sum += sharpData[nIdx] * kernel[ki++];
          }
        }
        const val = Math.min(255, Math.max(0, sum));
        data[pixelIdx] = data[pixelIdx + 1] = data[pixelIdx + 2] = val;
      }

      ctx.putImageData(imgd, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) reject(new Error("Canvas toBlob failed"));
        else resolve(blob);
      }, "image/jpeg", 0.95);
    };

    img.onerror = () => reject(new Error("Image load failed"));
    fr.readAsDataURL(file);
  });
}

// Export helpers
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportToXLS(items, meta = {}, filename = "data.xlsx") {
  try {
    const ExcelJSModule = await import("exceljs");
    const ExcelJS = ExcelJSModule?.default || ExcelJSModule;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Data");

    ws.columns = [
      { header: "Item", key: "name", width: 20 },
      { header: "Qty", key: "qty", width: 10 },
      { header: "Price", key: "price", width: 12 },
      { header: "Total", key: "total", width: 12 }
    ];

    items.forEach((item) => {
      ws.addRow({
        name: item.name,
        qty: item.qty,
        price: item.price,
        total: (item.qty || 1) * (item.price || 0)
      });
    });

    ws.addRow([]);
    ws.addRow(["Subtotal", "", meta.subtotal ?? 0]);
    ws.addRow(["Tax", "", meta.tax ?? 0]);
    ws.addRow(["Discount", "", meta.discount ?? 0]);
    ws.addRow(["TOTAL", "", meta.total ?? 0]);

    const buf = await wb.xlsx.writeBuffer();
    downloadBlob(
      new Blob([buf], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }),
      filename
    );
  } catch (err) {
    console.error("XLS export error:", err);
    throw err;
  }
}

async function exportToPDF(node, filename = "document.pdf") {
  try {
    const h2pModule = await import("html2pdf.js");
    const html2pdf = h2pModule?.default || h2pModule;
    (html2pdf || window.html2pdf)()
      .from(node)
      .set({
        margin: 0.4,
        filename,
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" }
      })
      .save();
  } catch (err) {
    console.error("PDF export error:", err);
    throw err;
  }
}

function exportToCSV(items, meta = {}, filename = "data.csv") {
  const rows = [["Item", "Qty", "Price", "Total"]];
  items.forEach((i) =>
    rows.push([i.name, i.qty, i.price, ((i.qty || 1) * (i.price || 0)).toFixed(2)])
  );
  rows.push([]);
  rows.push(["Subtotal", meta.subtotal ?? ""]);
  rows.push(["Tax", meta.tax ?? ""]);
  rows.push(["Discount", meta.discount ?? ""]);
  rows.push(["Total", meta.total ?? ""]);

  const csv = rows
    .map((r) =>
      r
        .map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`)
        .join(",")
    )
    .join("\n");

  downloadBlob(new Blob([csv], { type: "text/csv" }), filename);
}

// Main Advanced OCR Component
export default function AdvancedOCR({ onSaved }) {
  const [images, setImages] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [ocrText, setOcrText] = useState("");
  const [editingText, setEditingText] = useState("");
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({
    subtotal: 0,
    tax: 0,
    discount: 0,
    total: 0
  });
  const [toast, setToast] = useState("");
  const [progress, setProgress] = useState(0);
  const [confidence, setConfidence] = useState(0);
  const [uploadedImages, setUploadedImages] = useState([]); // Store previews
  const printableRef = useRef();

  const addToast = (m) => setToast(m);

  // File handlers
  const handleFilesSelected = (fileList) => {
    const arr = Array.from(fileList).slice(0, 6);
    const mapped = arr.map((f) => ({
      file: f,
      preview: URL.createObjectURL(f),
      processed: null,
      name: f.name
    }));
    setImages((prev) => [...prev, ...mapped]);
    setUploadedImages((prev) => [
      ...prev,
      ...mapped.map((m) => ({ name: m.name, preview: m.preview }))
    ]);
    addToast(`${mapped.length} images uploaded`);
  };

  const onFileChange = (e) => {
    if (!e.target.files) return;
    handleFilesSelected(e.target.files);
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer?.files) handleFilesSelected(e.dataTransfer.files);
  };

  // Advanced OCR with preprocessing
  const runAdvancedOCR = async () => {
    if (!images.length) return addToast("Upload at least one image");
    setProcessing(true);
    setProgress(0);
    setOcrText("");
    setItems([]);

    try {
      // Preprocess images for handwritten text
      for (let i = 0; i < images.length; i++) {
        setProgress(Math.round((i / images.length) * 30));
        addToast(`Preprocessing image ${i + 1}/${images.length} for handwritten text`);
        images[i].processed = await preprocessHandwrittenImage(images[i].file, {
          maxWidth: 1600,
          enhance: true
        });
      }

      // Run OCR with English + support for handwriting
      let combinedText = "";
      let confidenceSum = 0;

      for (let i = 0; i < images.length; i++) {
        setProgress(30 + Math.round((i / images.length) * 70));
        addToast(`Recognizing text in image ${i + 1}/${images.length}`);

        const res = await Tesseract.recognize(
          images[i].processed || images[i].file,
          "eng",
          { logger: (m) => {} }
        );

        combinedText += "\n\n" + (res?.data?.text || "");
        if (res?.data?.confidence) confidenceSum += res.data.confidence;
      }

      const avgConfidence = images.length > 0 ? confidenceSum / images.length : 0;
      setConfidence(Math.round(avgConfidence));

      setOcrText(combinedText.trim());
      setEditingText(combinedText.trim());
      setProgress(100);
      addToast(`✅ OCR Complete - ${Math.round(avgConfidence)}% confidence`);
    } catch (err) {
      console.error(err);
      addToast("❌ OCR failed: " + err.message);
    } finally {
      setProcessing(false);
      setProgress(0);
    }
  };

  // Parse text to extract items and metadata
  const parseText = (text) => {
    const lines = text.split("\n").filter((l) => l.trim());
    const priceRegex = /[₹$]\s*([0-9]+(?:[.,][0-9]{2})?)/gi;
    const items = [];
    let subtotal = 0;

    lines.forEach((line) => {
      const prices = [...line.matchAll(priceRegex)];
      if (prices.length > 0) {
        const price = parseFloat(prices[prices.length - 1][1].replace(/,/g, ""));
        const name = line
          .replace(priceRegex, "")
          .trim()
          .substring(0, 50) || "Item";
        items.push({ name, qty: 1, price });
        subtotal += price;
      }
    });

    setItems(items);
    setMeta({
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: 0,
      discount: 0,
      total: parseFloat(subtotal.toFixed(2))
    });
  };

  const reparse = () => {
    parseText(editingText || ocrText);
    addToast("Text reparsed");
  };

  // Item operations
  const addItem = (name = "Item", qty = 1, price = 0) => {
    setItems((prev) => [...prev, { name, qty: Number(qty), price: Number(price) }]);
  };

  const editItem = (index, field, value) => {
    setItems((prev) => {
      const cp = [...prev];
      cp[index] = {
        ...cp[index],
        [field]: field === "name" ? value : Number(value)
      };
      return cp;
    });
  };

  const removeItem = (index) => setItems((prev) => prev.filter((_, i) => i !== index));

  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (s, it) => s + (it.qty || 1) * (it.price || 0),
      0
    );
    const tax = 0;
    const discount = 0;
    const total = subtotal + tax - discount;
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax,
      discount,
      total: parseFloat(total.toFixed(2))
    };
  }, [items]);

  // Export handlers
  const handleExportXLS = async () => {
    try {
      await exportToXLS(items, totals, `ocr_data_${Date.now()}.xlsx`);
      addToast("✅ Excel file downloaded");
    } catch (err) {
      addToast("❌ XLS export failed");
    }
  };

  const handleExportPDF = async () => {
    if (!printableRef.current) return;
    try {
      await exportToPDF(
        printableRef.current,
        `ocr_document_${Date.now()}.pdf`
      );
      addToast("✅ PDF export triggered");
    } catch (err) {
      addToast("❌ PDF export failed");
    }
  };

  const handleExportCSV = () => {
    exportToCSV(items, totals, `ocr_data_${Date.now()}.csv`);
    addToast("✅ CSV file downloaded");
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 space-y-6">
      <Toast msg={toast} onClose={() => setToast("")} />

      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-4xl font-bold text-gray-800 flex items-center gap-3">
          🖼️ Advanced OCR - Handwritten Text Recognition
        </h1>
        <p className="text-gray-600 mt-2">Upload images with handwritten content to extract text and convert to data</p>
      </div>

      {/* Image Upload Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">📤 Image Upload</h2>

        {/* Drag-drop area */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-4 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50 hover:bg-blue-100 transition"
        >
          <div className="text-5xl mb-3">📸</div>
          <p className="text-lg text-gray-700 font-semibold mb-2">
            Drag & drop images here
          </p>
          <p className="text-gray-600 mb-4">or click to select (max 6 images)</p>
          <label className="inline-block">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={onFileChange}
              className="hidden"
            />
            <span className="bg-blue-600 text-white px-6 py-3 rounded-lg cursor-pointer hover:bg-blue-700 transition font-semibold">
              Choose Files
            </span>
          </label>
        </div>

        {/* Image previews */}
        {uploadedImages.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              Uploaded Images ({uploadedImages.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative group bg-gray-100 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition"
                >
                  <img
                    src={img.preview}
                    alt={img.name}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    ✕
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 truncate">
                    {img.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* OCR Controls */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={runAdvancedOCR}
            disabled={processing || images.length === 0}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-bold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50"
          >
            {processing ? "🔄 Processing..." : "🚀 Run Advanced OCR"}
          </button>
          <button
            onClick={() => {
              setImages([]);
              setUploadedImages([]);
              setOcrText("");
              addToast("Images cleared");
            }}
            className="px-6 py-3 bg-gray-300 text-gray-800 rounded-lg font-semibold hover:bg-gray-400 transition"
          >
            Clear
          </button>
        </div>

        {/* Progress bar */}
        {processing && (
          <div className="mt-6">
            <ProgressBar progress={progress} label="Processing..." />
          </div>
        )}

        {/* Confidence display */}
        {confidence > 0 && (
          <div className="mt-4 p-4 bg-green-100 rounded-lg border-l-4 border-green-600">
            <p className="text-gray-800 font-semibold">
              ✅ Recognition Confidence: <span className="text-lg text-green-600">{confidence}%</span>
            </p>
          </div>
        )}
      </div>

      {/* OCR Results */}
      {ocrText && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📝 Extracted Text</h2>
          <textarea
            className="w-full p-4 border-2 border-gray-300 rounded-lg font-mono text-sm resize-none focus:border-blue-500 outline-none"
            rows="6"
            value={editingText}
            onChange={(e) => setEditingText(e.target.value)}
          />
          <div className="mt-4 flex gap-3">
            <button
              onClick={reparse}
              className="px-6 py-2 bg-yellow-600 text-white rounded-lg font-semibold hover:bg-yellow-700 transition"
            >
              Re-Parse
            </button>
            <button
              onClick={() => navigator.clipboard.writeText(editingText)}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
            >
              Copy Text
            </button>
          </div>
        </div>
      )}

      {/* Items Table */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📋 Extracted Items</h2>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-blue-600 text-white">
                <tr>
                  <th className="p-3 text-left">Item Name</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right">Total</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className="border-b hover:bg-blue-50">
                    <td className="p-3">
                      <input
                        type="text"
                        value={it.name}
                        onChange={(e) => editItem(idx, "name", e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={it.qty}
                        onChange={(e) => editItem(idx, "qty", e.target.value)}
                        className="w-16 p-2 border rounded text-center"
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="number"
                        value={it.price}
                        onChange={(e) => editItem(idx, "price", e.target.value)}
                        className="w-24 p-2 border rounded text-right"
                      />
                    </td>
                    <td className="p-3 text-right font-bold">
                      ₹{((it.qty || 1) * (it.price || 0)).toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-red-600 hover:text-red-800 font-bold"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-l-4 border-blue-600">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-bold text-gray-800">
              <div>
                Subtotal: <span className="text-blue-600">₹{totals.subtotal.toFixed(2)}</span>
              </div>
              <div>
                Tax: <span className="text-green-600">₹{totals.tax.toFixed(2)}</span>
              </div>
              <div>
                Discount: <span className="text-orange-600">₹{totals.discount.toFixed(2)}</span>
              </div>
              <div>
                Total: <span className="text-lg text-purple-600">₹{totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Options */}
      {items.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📥 Export Options</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={handleExportXLS}
              className="p-4 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-bold hover:from-green-600 hover:to-green-700 transition shadow-md flex items-center justify-center gap-2"
            >
              📊 Export to Excel (XLS)
            </button>
            <button
              onClick={handleExportCSV}
              className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg font-bold hover:from-blue-600 hover:to-blue-700 transition shadow-md flex items-center justify-center gap-2"
            >
              📄 Export to CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="p-4 bg-gradient-to-br from-red-500 to-red-600 text-white rounded-lg font-bold hover:from-red-600 hover:to-red-700 transition shadow-md flex items-center justify-center gap-2"
            >
              📑 Export to PDF
            </button>
          </div>
        </div>
      )}

      {/* Hidden printable reference */}
      <div style={{ display: "none" }}>
        <div ref={printableRef} id="ocr-printable">
          <h2>OCR Extracted Data</h2>
          <table border="1" cellPadding="8">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i}>
                  <td>{it.name}</td>
                  <td>{it.qty}</td>
                  <td>{it.price}</td>
                  <td>{((it.qty || 1) * (it.price || 0)).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: "20px" }}>
            <p>Subtotal: ₹{totals.subtotal.toFixed(2)}</p>
            <p>Tax: ₹{totals.tax.toFixed(2)}</p>
            <p>Discount: ₹{totals.discount.toFixed(2)}</p>
            <p style={{ fontSize: "18px", fontWeight: "bold" }}>
              Total: ₹{totals.total.toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
