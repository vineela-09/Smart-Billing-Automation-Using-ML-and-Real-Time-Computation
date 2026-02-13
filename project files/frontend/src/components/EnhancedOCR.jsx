import React, { useRef, useState, useEffect } from "react";
import Tesseract from "tesseract.js";
import axios from "axios";

/**
 * Enhanced OCR Component with Advanced Features:
 * - Handwritten bill/receipt recognition
 * - Multiple image support
 * - Intelligent item extraction
 * - Profit/Loss tracking
 * - Image preprocessing for handwritten text
 * - Auto-categorization
 */

const Toast = ({ msg, onClose }) => {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [msg, onClose]);
  
  return msg ? (
    <div className="fixed bottom-6 right-6 bg-black text-white px-6 py-4 rounded-lg shadow-2xl z-50 animate-pulse">
      {msg}
    </div>
  ) : null;
};

const Loader = ({ text = "Processing..." }) => (
  <div className="flex items-center gap-3 text-sm text-blue-600 font-semibold">
    <div className="animate-spin text-2xl">⏳</div>
    <div>{text}</div>
  </div>
);

// Preprocess image for better handwriting recognition
async function preprocessHandwrittenImage(file, options = {}) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const fr = new FileReader();

    fr.onload = (e) => {
      img.src = e.target.result;
    };

    fr.onerror = () => reject(new Error("Failed to read file"));

    img.onload = () => {
      const scale = Math.min(1, 1600 / img.width);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);

      let imgData = ctx.getImageData(0, 0, w, h);
      const data = imgData.data;

      // Step 1: Convert to grayscale
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = data[i + 1] = data[i + 2] = gray;
      }

      // Step 2: Increase contrast for handwritten text
      const contrast = 2.5;
      const intercept = 128 * (1 - contrast) / 2;
      for (let i = 0; i < data.length; i += 4) {
        const val = Math.min(255, Math.max(0, data[i] * contrast + intercept));
        data[i] = data[i + 1] = data[i + 2] = val;
      }

      // Step 3: Apply thresholding
      const threshold = 130;
      for (let i = 0; i < data.length; i += 4) {
        const val = data[i] > threshold ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = val;
      }

      // Step 4: Denoise
      const tempData = new Uint8ClampedArray(data);
      for (let i = 0; i < w * h; i++) {
        const pixelIdx = i * 4;
        const row = Math.floor(i / w);
        const col = i % w;

        if (row === 0 || row === h - 1 || col === 0 || col === w - 1) continue;

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

      ctx.putImageData(imgData, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) reject(new Error("Failed to process image"));
        else resolve(blob);
      }, "image/jpeg", 0.98);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    fr.readAsDataURL(file);
  });
}

// Extract items from OCR text
function extractItemsFromOCR(text) {
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  const items = [];
  const priceRegex = /(?:₹|Rs\.?|INR)?\s*([0-9]+(?:[.,][0-9]{1,2})?)/g;

  for (const line of lines) {
    // Skip headers and totals
    if (/^(item|name|description|sl\.?no|quantity|price|total|subtotal|tax|discount|amount|bill|invoice|date|time)/i.test(line)) {
      continue;
    }

    // Pattern: "2 x 50" or "2x50"
    const xMatch = line.match(/([0-9]+)\s*[xX]\s*([0-9]+(?:\.[0-9]{1,2})?)/);
    if (xMatch) {
      const qty = parseInt(xMatch[1], 10);
      const price = parseFloat(xMatch[2]);
      const name = line.replace(xMatch[0], "").trim() || "Item";
      items.push({
        name: name.substring(0, 50),
        qty,
        price,
        principleAmount: price * 0.7, // Default: 70% of selling price
        category: detectCategory(name)
      });
      continue;
    }

    // Pattern: "milk 2 hundred" or similar
    const priceMatches = [...line.matchAll(priceRegex)];
    if (priceMatches.length >= 2) {
      const prices = priceMatches.map(m => parseFloat(m[1].replace(/,/g, "")));
      const qty = Math.round(prices[0]) <= 100 ? Math.round(prices[0]) : 1;
      const price = prices[priceMatches.length - 1];
      const name = line.replace(/([0-9]+\.?[0-9]*)/g, "").trim() || "Item";
      
      items.push({
        name: name.substring(0, 50),
        qty,
        price,
        principleAmount: price * 0.7,
        category: detectCategory(name)
      });
      continue;
    }

    // Single price in line
    if (priceMatches.length === 1) {
      const price = parseFloat(priceMatches[0][1].replace(/,/g, ""));
      const name = line.replace(priceMatches[0][0], "").trim() || "Item";
      
      if (price > 0) {
        items.push({
          name: name.substring(0, 50),
          qty: 1,
          price,
          principleAmount: price * 0.7,
          category: detectCategory(name)
        });
      }
    }
  }

  return items;
}

// Auto-categorize items based on keywords
function detectCategory(itemName) {
  const name = itemName.toLowerCase();
  
  const categories = {
    groceries: ["rice", "wheat", "flour", "sugar", "salt", "spice", "oil", "ghee", "butter", "milk", "egg", "vegetables", "fruits"],
    dairy: ["milk", "yogurt", "curd", "paneer", "cheese", "butter", "ghee"],
    bakery: ["bread", "cake", "pastry", "bun", "donut"],
    beverages: ["tea", "coffee", "juice", "water", "soda", "coke", "pepsi"],
    electronics: ["phone", "laptop", "tablet", "charger", "cable", "headphones"],
    clothing: ["shirt", "pants", "dress", "shoe", "jacket", "hat"],
    books: ["book", "notebook", "pen", "pencil", "paper"],
    household: ["soap", "shampoo", "detergent", "cleaner", "towel", "bucket"],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(kw => name.includes(kw))) {
      return category;
    }
  }

  return "general";
}

export default function EnhancedOCR({ onSaved }) {
  const fileRef = useRef(null);
  const [images, setImages] = useState([]);
  const [extractedItems, setExtractedItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [billNotes, setBillNotes] = useState("");

  // Process single image
  const processImage = async (file) => {
    try {
      setLoading(true);
      
      // Preprocess image
      const preprocessed = await preprocessHandwrittenImage(file);
      
      // Run OCR
      const result = await Tesseract.recognize(preprocessed, "eng", {
        logger: m => {
          if (m.status === "recognizing") {
            const progress = Math.round(m.progress * 100);
            setToast(`🔍 Processing: ${progress}%`);
          }
        }
      });

      const text = result.data.text;
      const items = extractItemsFromOCR(text);

      return { file: file.name, text, items, confidence: result.data.confidence };
    } catch (e) {
      setToast(`❌ Error processing ${file.name}: ${e.message}`);
      return null;
    }
  };

  // Handle file upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setToast("🔄 Processing images...");
    
    const processed = [];
    let allItems = [];

    for (const file of files) {
      const result = await processImage(file);
      if (result) {
        processed.push(result);
        allItems = [...allItems, ...result.items];
      }
    }

    setImages(processed);
    setExtractedItems(allItems);
    
    if (allItems.length > 0) {
      setToast(`✅ Extracted ${allItems.length} items from ${processed.length} image(s)`);
    }
  };

  // Remove item
  const removeItem = (index) => {
    setExtractedItems(prev => prev.filter((_, i) => i !== index));
  };

  // Update item
  const updateItem = (index, field, value) => {
    setExtractedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  // Save bill
  const saveBill = async () => {
    if (extractedItems.length === 0) {
      setToast("❌ No items to save");
      return;
    }

    try {
      setLoading(true);
      
      const total = extractedItems.reduce((s, i) => s + (i.qty || 1) * (i.price || 0), 0);
      const principleTotal = extractedItems.reduce((s, i) => s + (i.principleAmount || 0) * (i.qty || 1), 0);
      const profitLoss = total - principleTotal;

      const billData = {
        items: extractedItems,
        total,
        principleTotal,
        profitLoss,
        source: "ocr",
        billDate: new Date(),
        notes: billNotes
      };

      await axios.post(
        `${import.meta.env.VITE_API_URL}/bills`,
        billData,
        {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") }
        }
      );

      setToast("✅ Bill saved successfully!");
      setExtractedItems([]);
      setImages([]);
      setBillNotes("");
      
      if (onSaved) onSaved();
    } catch (e) {
      setToast(`❌ Save failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalBilled = extractedItems.reduce((s, i) => s + (i.qty || 1) * (i.price || 0), 0);
  const totalPrinciple = extractedItems.reduce((s, i) => s + (i.principleAmount || 0) * (i.qty || 1), 0);
  const profitLoss = totalBilled - totalPrinciple;

  return (
    <div className="space-y-6">
      <Toast msg={toast} onClose={() => setToast("")} />

      {/* Upload Section */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-4 border-dashed border-blue-300 bg-blue-50 rounded-2xl p-12 text-center cursor-pointer hover:bg-blue-100 transition"
      >
        <div className="text-6xl mb-4">📸</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">Upload Handwritten Bills</h3>
        <p className="text-gray-600 mb-4">Click to select images, or drag & drop</p>
        <p className="text-sm text-gray-500">Supports JPG, PNG, and other image formats</p>
        
        <input
          ref={fileRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </div>

      {/* Processed Images */}
      {images.length > 0 && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/20">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📷 Processed Images ({images.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((img, idx) => (
              <div key={idx} className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                <div className="font-semibold text-gray-800 mb-2">{img.file}</div>
                <div className="text-sm text-gray-600 mb-2">
                  <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                    ✅ {img.items.length} items
                  </span>
                  <span className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded">
                    🎯 {Math.round(img.confidence)}% confidence
                  </span>
                </div>
                <div className="max-h-40 overflow-auto text-xs text-gray-600 bg-white p-2 rounded border border-gray-300 font-mono">
                  {img.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Items Section */}
      {extractedItems.length > 0 && (
        <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-2xl border-2 border-white/20">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📋 Extracted Items ({extractedItems.length})</h3>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg shadow-lg">
              <div className="text-sm opacity-90">Total Billed</div>
              <div className="text-3xl font-bold mt-2">₹{totalBilled.toFixed(2)}</div>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg shadow-lg">
              <div className="text-sm opacity-90">Total Cost</div>
              <div className="text-3xl font-bold mt-2">₹{totalPrinciple.toFixed(2)}</div>
            </div>
            <div className={`bg-gradient-to-br ${profitLoss >= 0 ? 'from-purple-500 to-purple-600' : 'from-red-500 to-red-600'} text-white p-4 rounded-lg shadow-lg`}>
              <div className="text-sm opacity-90">{profitLoss >= 0 ? 'Profit' : 'Loss'}</div>
              <div className="text-3xl font-bold mt-2">₹{Math.abs(profitLoss).toFixed(2)}</div>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <tr>
                  <th className="px-4 py-3 text-left">Item Name</th>
                  <th className="px-4 py-3 text-center">Qty</th>
                  <th className="px-4 py-3 text-right">Sell Price</th>
                  <th className="px-4 py-3 text-right">Cost Price</th>
                  <th className="px-4 py-3 text-right">Category</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {extractedItems.map((item, idx) => (
                  <tr key={idx} className="hover:bg-blue-50 transition">
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateItem(idx, "name", e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <input
                        type="number"
                        value={item.qty}
                        onChange={(e) => updateItem(idx, "qty", parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItem(idx, "price", parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        value={item.principleAmount}
                        onChange={(e) => updateItem(idx, "principleAmount", parseFloat(e.target.value) || 0)}
                        className="w-20 px-2 py-1 border border-gray-300 rounded text-right"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(idx, "category", e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option>general</option>
                        <option>groceries</option>
                        <option>dairy</option>
                        <option>bakery</option>
                        <option>beverages</option>
                        <option>electronics</option>
                        <option>clothing</option>
                        <option>books</option>
                        <option>household</option>
                      </select>
                    </td>
                    <td className="px-4 py-3 text-center">
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

          {/* Notes Section */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Bill Notes (Optional)</label>
            <textarea
              value={billNotes}
              onChange={(e) => setBillNotes(e.target.value)}
              placeholder="Add any additional notes about this bill..."
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={saveBill}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition disabled:opacity-50 shadow-lg transform hover:scale-105"
            >
              {loading ? <Loader text="Saving..." /> : "💾 Save Bill to Database"}
            </button>
            <button
              onClick={() => {
                setExtractedItems([]);
                setImages([]);
                setBillNotes("");
              }}
              className="px-6 bg-gray-600 text-white font-semibold py-3 rounded-lg hover:bg-gray-700 transition shadow-lg"
            >
              🗑 Clear All
            </button>
          </div>
        </div>
      )}

      {/* No Items Message */}
      {images.length > 0 && extractedItems.length === 0 && (
        <div className="text-center py-12 bg-yellow-50 rounded-2xl border-2 border-yellow-300">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-lg text-gray-700 font-semibold">No items found in images</p>
          <p className="text-sm text-gray-600 mt-2">Try uploading clearer images or bills with visible item details</p>
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && extractedItems.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-gray-300">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-lg text-gray-700 font-semibold">Upload handwritten bills to get started</p>
          <p className="text-sm text-gray-600 mt-2">Our OCR engine will automatically extract items, quantities, and prices</p>
        </div>
      )}
    </div>
  );
}
