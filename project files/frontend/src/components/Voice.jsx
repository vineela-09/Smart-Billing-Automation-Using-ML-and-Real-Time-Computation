import React, { useRef, useState, useEffect } from "react";
import axios from "axios";

export default function Voice({ onSaved }) {
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [paused, setPaused] = useState(false);

  const [transcript, setTranscript] = useState("");
  const [items, setItems] = useState([]);
  const [history, setHistory] = useState([]);
  const [mathResult, setMathResult] = useState("");
  const [currentResult, setCurrentResult] = useState(null);
  const [savedBills, setSavedBills] = useState([]);
  const [activeTab, setActiveTab] = useState("billing"); // billing, history, settings
  const [discountPercent, setDiscountPercent] = useState(0);
  const [gstPercent, setGstPercent] = useState(18);
  const [marginPercent, setMarginPercent] = useState(30);
  const [billName, setBillName] = useState("");

  const [stats, setStats] = useState({
    totalCalculations: 0,
    totalItemsAdded: 0,
    totalAmount: 0,
    totalBillsSaved: 0,
    totalProfit: 0,
  });

  // Store token
  const token = localStorage.getItem("token");

  // ==================== LOAD BILLS FROM LOCALSTORAGE ==================== //
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("voice_bills") || "[]");
    setSavedBills(saved);
  }, []);

  // ================== SPEECH INITIALIZATION ================== //
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Speech Recognition Not Supported.");
      return;
    }

    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";

    rec.onresult = (event) => {
      const text = event.results[event.resultIndex][0].transcript
        .trim()
        .toLowerCase();

      setTranscript((prev) => prev + " " + text);

      if (!paused) processCommand(text);
    };

    recRef.current = rec;
  }, [paused, items, discountPercent, gstPercent, marginPercent, savedBills, stats]);

  // ==================== PARSE ADVANCED ITEM COMMAND ==================== //
  // Supports: "add milk 2 hundred with discount 10" or "add rice 5 kg for 250 each"
  const parseAdvancedItemCommand = (cmd) => {
    cmd = convertWordsToNumbers(cmd);
    let originalCmd = cmd;
    
    // Extract numbers from the command
    const numbers = cmd.match(/\d+/g) || [];
    
    let name = "";
    let qty = 1;
    let price = 0;
    let unit = "";

    // Check if "price" keyword is present
    const hasPriceKeyword = /\bprice\b/i.test(cmd);
    const hasQtyKeyword = /\b(quantity|qty)\b/i.test(cmd);

    // Remove keywords to get item name
    let nameWords = cmd
      .replace(/\badd\b/i, "")
      .replace(/\b(item|quantity|qty|price|rupees|rs|for|of|each|with|per|total)\b/i, "")
      .split(/\s+/)
      .filter(w => w && isNaN(w));

    // Extract units
    const units = ["kg", "liter", "piece", "dozen", "box", "pack", "gram", "ml"];
    const foundUnit = nameWords.find(w => units.includes(w.toLowerCase()));
    if (foundUnit) {
      unit = foundUnit.toLowerCase();
      nameWords = nameWords.filter(w => w !== foundUnit);
    }

    name = nameWords.join(" ").trim();

    // Parse numbers based on context
    if (numbers.length === 0) {
      qty = 1;
      price = 0;
    } else if (numbers.length === 1) {
      // Single number: if "price" keyword exists, it's price; otherwise it's price
      if (hasPriceKeyword || !hasQtyKeyword) {
        price = Number(numbers[0]);
        qty = 1;
      } else {
        qty = Number(numbers[0]);
        price = 0;
      }
    } else if (numbers.length >= 2) {
      // Multiple numbers: first is qty, second is price
      // OR if "price" keyword exists, use different logic
      if (hasPriceKeyword && hasQtyKeyword) {
        qty = Number(numbers[0]);
        price = Number(numbers[1]);
      } else if (hasPriceKeyword) {
        price = Number(numbers[numbers.length - 1]);
        qty = 1;
      } else {
        qty = Number(numbers[0]);
        price = Number(numbers[1]);
      }
    }

    const total = qty * price;
    const principleAmount = price * ((100 - marginPercent) / 100);

    return {
      name: name || "Item",
      qty,
      price,
      unit: unit || "",
      total,
      principleAmount,
      profitPerUnit: price - principleAmount,
      totalProfit: (price - principleAmount) * qty,
      category: "general",
      timestamp: new Date().toLocaleString(),
    };
  };

  // ==================== START LISTENING ==================== //
  const startListening = () => {
    if (!recRef.current) return;
    recRef.current.start();
    setListening(true);
    setPaused(false);
  };

  // ==================== STOP LISTENING ==================== //
  const stopListening = () => {
    if (!recRef.current) return;
    recRef.current.stop();
    setListening(false);
    setPaused(false);
  };

  // ==================== PAUSE LISTENING ==================== //
  const pauseListening = () => {
    setPaused(true);
  };

  // ============== NUMBER WORDS MAPPING (EN + HI + TE) ============== //
  const numberMap = {
    zero: 0, one: 1, two: 2, to: 2, too: 2, three: 3, four: 4, for: 4, five: 5,
    six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
    eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15,
    sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20,

    // Hindi
    ek: 1, do: 2, teen: 3, char: 4, paanch: 5, chhah: 6, saat: 7, aath: 8, nau: 9, das: 10,

    // Telugu
    okati: 1, rendu: 2, moodu: 3, nalugu: 4, aidu: 5, aaru: 6, eedi: 7, enimidi: 8, tommidi: 9, padi: 10,
  };

  const convertWordsToNumbers = (text) => {
    return text
      .split(" ")
      .map((w) => (numberMap[w] !== undefined ? numberMap[w] : w))
      .join(" ");
  };

  // ==================== MATH SOLVER ==================== //
  const solveMath = (exp) => {
    try {
      exp = convertWordsToNumbers(exp)
        .replace(/plus/g, "+")
        .replace(/minus/g, "-")
        .replace(/into|times|x|multiply/g, "*")
        .replace(/divide|by/g, "/")
        .replace(/mod/g, "%")
        .replace(/power/g, "**");

      let result = eval(exp);
      if (isNaN(result)) return null;
      return result;
    } catch {
      return null;
    }
  };

  // ==================== PARSE ITEM COMMAND ==================== //
  const parseItemCommand = (cmd) => {
    return parseAdvancedItemCommand(cmd);
  };

  // ==================== VOICE COMMAND PROCESSOR ==================== //
  const processCommand = (cmd) => {
    // Special commands
    if (cmd.includes("total")) {
      const subtotal = items.reduce((sum, itm) => sum + itm.total, 0);
      const discount = (subtotal * discountPercent) / 100;
      const afterDiscount = subtotal - discount;
      const gst = (afterDiscount * gstPercent) / 100;
      const finalTotal = afterDiscount + gst;
      
      setMathResult(`Subtotal: ₹${subtotal}, Discount: ₹${discount.toFixed(2)}, GST: ₹${gst.toFixed(2)}, Total: ₹${finalTotal.toFixed(2)}`);
      setCurrentResult({ type: "total", subtotal, discount, gst, finalTotal });
      addToHistory({ type: "command", text: cmd, result: `₹${finalTotal.toFixed(2)}` });
      return;
    }

    if (cmd.includes("discount")) {
      const match = cmd.match(/\d+/);
      if (match) {
        const percent = parseInt(match[0]);
        setDiscountPercent(percent);
        setCurrentResult({ type: "setting", setting: "discount", value: percent });
        addToHistory({ type: "command", text: `Set discount to ${percent}%`, result: "success" });
      }
      return;
    }

    if (cmd.includes("gst") || cmd.includes("tax")) {
      const match = cmd.match(/\d+/);
      if (match) {
        const percent = parseInt(match[0]);
        setGstPercent(percent);
        setCurrentResult({ type: "setting", setting: "gst", value: percent });
        addToHistory({ type: "command", text: `Set GST to ${percent}%`, result: "success" });
      }
      return;
    }

    if (cmd.includes("margin")) {
      const match = cmd.match(/\d+/);
      if (match) {
        const percent = parseInt(match[0]);
        setMarginPercent(percent);
        setCurrentResult({ type: "setting", setting: "margin", value: percent });
        addToHistory({ type: "command", text: `Set margin to ${percent}%`, result: "success" });
      }
      return;
    }

    if (cmd.includes("clear") || cmd.includes("reset")) {
      setItems([]);
      setTranscript("");
      setMathResult("");
      setCurrentResult(null);
      addToHistory({ type: "command", text: "Clear all items", result: "cleared" });
      return;
    }

    if (cmd.startsWith("remove") || cmd.startsWith("delete")) {
      let name = cmd.replace("remove", "").replace("delete", "").trim();
      const removed = items.filter((i) => i.name.includes(name));
      setItems((prev) => prev.filter((i) => !i.name.includes(name)));
      if (removed.length > 0) {
        addToHistory({ type: "removed", item: removed[0] });
      }
      return;
    }

    if (cmd.includes("save")) {
      saveBill();
      return;
    }

    // Math operations - Check FIRST before item addition
    if (cmd.includes("plus") || cmd.includes("minus") || cmd.includes("into") || cmd.includes("times") || cmd.includes("multiply") || cmd.includes("divide") || cmd.includes("mod") || cmd.includes("power")) {
      let result = solveMath(cmd);
      if (result !== null) {
        const resultText = `${cmd} = ${result}`;
        setMathResult(resultText);
        setCurrentResult({ type: "calculation", expr: cmd, result });
        setStats((prev) => ({ ...prev, totalCalculations: prev.totalCalculations + 1 }));
        addToHistory({ type: "calculation", expr: cmd, result });
        saveMathOperation(cmd, result);
      }
      return;
    }

    // Add item
    if (cmd.includes("add") || /^[a-z]+\s+\d+\s+\d+/.test(cmd)) {
      cmd = cmd.replace("add", "").trim();
      const itemData = parseItemCommand(cmd);
      
      if (itemData.price > 0) {
        setItems((prev) => [...prev, itemData]);
        setCurrentResult({ type: "item_added", name: itemData.name, qty: itemData.qty, price: itemData.price, total: itemData.total });
        setStats((prev) => ({
          ...prev,
          totalItemsAdded: prev.totalItemsAdded + itemData.qty,
          totalAmount: prev.totalAmount + itemData.total,
        }));
        addToHistory({ type: "item_added", item: itemData });
      }
      return;
    }
  };

  // ==================== ADD TO HISTORY ==================== //
  const addToHistory = (entry) => {
    setHistory((prev) => [{ id: Date.now(), ...entry, timestamp: new Date().toLocaleTimeString() }, ...prev]);
  };

  // ==================== SAVE MATH OPERATION TO DATABASE ==================== //
  const saveMathOperation = async (expression, result) => {
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/math-operations`,
        {
          expression,
          result,
          operationType: "voice_math",
          timestamp: new Date(),
        },
        { headers: { Authorization: "Bearer " + token } }
      );
      console.log("✅ Math operation saved:", expression, "=", result);
    } catch (e) {
      console.error("Error saving math operation:", e.message);
    }
  };

  // ==================== SAVE BILL TO DATABASE ==================== //
  const saveBill = async () => {
    if (items.length === 0) {
      alert("No items to save");
      return;
    }

    try {
      const subtotal = items.reduce((sum, itm) => sum + itm.total, 0);
      const discount = (subtotal * discountPercent) / 100;
      const afterDiscount = subtotal - discount;
      const gst = (afterDiscount * gstPercent) / 100;
      const totalAmount = afterDiscount + gst;
      const principleTotal = items.reduce((sum, itm) => sum + (itm.principleAmount * itm.qty), 0);
      const profitLoss = totalAmount - principleTotal;

      const billData = {
        billName: billName || `Bill-${new Date().getTime()}`,
        items,
        subtotal,
        discount,
        discountPercent,
        gst,
        gstPercent,
        total: totalAmount,
        principleTotal,
        profitLoss,
        source: "voice",
        billDate: new Date().toLocaleString(),
        timestamp: Date.now(),
      };

      // Save to localStorage
      const updatedBills = [...savedBills, billData];
      localStorage.setItem("voice_bills", JSON.stringify(updatedBills));
      setSavedBills(updatedBills);

      // Save to database
      await axios.post(
        `${import.meta.env.VITE_API_URL}/bills`,
        billData,
        { headers: { Authorization: "Bearer " + token } }
      );

      setCurrentResult({ type: "bill_saved", total: totalAmount, profit: profitLoss });
      addToHistory({ type: "bill_saved", total: totalAmount, items: items.length });
      setStats((prev) => ({
        ...prev,
        totalBillsSaved: prev.totalBillsSaved + 1,
        totalProfit: prev.totalProfit + profitLoss,
      }));
      
      setItems([]);
      setMathResult("");
      setTranscript("");
      setBillName("");
      setDiscountPercent(0);
      
      if (onSaved) onSaved();
    } catch (e) {
      console.error("Error saving bill:", e);
    }
  };

  const totalAmount = items.reduce((sum, itm) => sum + itm.total, 0);
  const totalProfit = items.reduce((sum, itm) => sum + itm.totalProfit, 0);
  const subtotal = totalAmount;
  const discount = (subtotal * discountPercent) / 100;
  const afterDiscount = subtotal - discount;
  const gst = (afterDiscount * gstPercent) / 100;
  const finalTotal = afterDiscount + gst;

  // ==================== EXPORT TO EXCEL ==================== //
  const exportToExcel = async () => {
    if (items.length === 0) {
      alert("No items to export");
      return;
    }

    try {
      const { default: XLSX } = await import("xlsx");
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      
      // Sheet 1: Current Bill
      const billData = [
        ["SMART BILLING - VOICE BILL REPORT"],
        [],
        ["Bill Name:", billName || "Current Bill"],
        ["Date:", new Date().toLocaleString()],
        ["Source:", "Voice Billing System"],
        [],
        ["Item Name", "Quantity", "Unit", "Price per Unit", "Total", "Profit per Unit", "Total Profit"],
        ...items.map(item => [
          item.name,
          item.qty,
          item.unit,
          item.price,
          item.total,
          item.profitPerUnit.toFixed(2),
          item.totalProfit.toFixed(2)
        ]),
        [],
        ["SUMMARY"],
        ["Subtotal", "", "", "", subtotal],
        [`Discount (${discountPercent}%)`, "", "", "", -discount.toFixed(2)],
        [`GST (${gstPercent}%)`, "", "", "", gst.toFixed(2)],
        ["TOTAL", "", "", "", finalTotal.toFixed(2)],
        ["Total Profit", "", "", "", totalProfit.toFixed(2)],
      ];

      const ws1 = XLSX.utils.aoa_to_sheet(billData);
      ws1["!cols"] = [
        { wch: 20 },
        { wch: 12 },
        { wch: 10 },
        { wch: 15 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 }
      ];
      XLSX.utils.book_append_sheet(workbook, ws1, "Current Bill");

      // Sheet 2: Summary Statistics
      const summaryData = [
        ["BILLING STATISTICS"],
        [],
        ["Total Bills Saved:", stats.totalBillsSaved],
        ["Total Items Added:", stats.totalItemsAdded],
        ["Total Calculations:", stats.totalCalculations],
        ["Total Amount Processed:", stats.totalAmount],
        ["Total Profit Generated:", stats.totalProfit.toFixed(2)],
        [],
        ["CURRENT BILL DETAILS"],
        ["Items Count:", items.length],
        ["Subtotal:", subtotal],
        ["Discount Percentage:", discountPercent + "%"],
        ["Discount Amount:", discount.toFixed(2)],
        ["GST Percentage:", gstPercent + "%"],
        ["GST Amount:", gst.toFixed(2)],
        ["Final Total:", finalTotal.toFixed(2)],
        ["Margin Percentage:", marginPercent + "%"],
      ];

      const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
      ws2["!cols"] = [{ wch: 25 }, { wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, ws2, "Summary");

      // Sheet 3: All Saved Bills
      if (savedBills.length > 0) {
        const allBillsData = [
          ["BILL NAME", "DATE", "ITEMS", "SUBTOTAL", "DISCOUNT", "GST", "TOTAL", "PROFIT"],
          ...savedBills.map(bill => [
            bill.billName,
            bill.billDate,
            bill.items.length,
            bill.subtotal,
            bill.discount.toFixed(2),
            bill.gst.toFixed(2),
            bill.total.toFixed(2),
            bill.profitLoss.toFixed(2)
          ])
        ];
        const ws3 = XLSX.utils.aoa_to_sheet(allBillsData);
        ws3["!cols"] = [
          { wch: 20 }, { wch: 20 }, { wch: 10 },
          { wch: 12 }, { wch: 12 }, { wch: 12 },
          { wch: 12 }, { wch: 12 }
        ];
        XLSX.utils.book_append_sheet(workbook, ws3, "All Bills");
      }

      // Generate file
      XLSX.writeFile(workbook, `voice_bills_${new Date().getTime()}.xlsx`);
      addToHistory({ type: "export", format: "Excel", itemsCount: items.length });
    } catch (error) {
      console.error("Excel export error:", error);
      alert("Install xlsx package: npm install xlsx");
    }
  };

  // ==================== EXPORT TO CSV ==================== //
  const exportToCSV = () => {
    if (items.length === 0) {
      alert("No items to export");
      return;
    }

    const headers = ["Item Name", "Quantity", "Unit", "Price", "Total", "Profit"];
    const rows = items.map(item => [
      item.name,
      item.qty,
      item.unit,
      item.price,
      item.total.toFixed(2),
      item.totalProfit.toFixed(2)
    ]);

    const summary = [
      [],
      ["SUMMARY"],
      ["Subtotal", subtotal],
      [`Discount (${discountPercent}%)`, discount.toFixed(2)],
      [`GST (${gstPercent}%)`, gst.toFixed(2)],
      ["TOTAL", finalTotal.toFixed(2)],
      ["Total Profit", totalProfit.toFixed(2)]
    ];

    const csv = [
      [billName || "Voice Bill Report"],
      [new Date().toLocaleString()],
      [],
      headers,
      ...rows,
      ...summary
    ]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `voice_bill_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    addToHistory({ type: "export", format: "CSV", itemsCount: items.length });
  };

  // ==================== EXPORT TO PDF ==================== //
  const exportToPDF = async () => {
    if (items.length === 0) {
      alert("No items to export");
      return;
    }

    try {
      const jsPDF = (await import("jspdf")).jsPDF;
      const doc = new jsPDF();
      let yPos = 20;

      // Title
      doc.setFontSize(18);
      doc.text("SMART BILLING - VOICE BILL", 15, yPos);
      yPos += 10;

      // Header Info
      doc.setFontSize(10);
      doc.text(`Bill Name: ${billName || "Current Bill"}`, 15, yPos);
      yPos += 5;
      doc.text(`Date: ${new Date().toLocaleString()}`, 15, yPos);
      yPos += 5;
      doc.text(`Source: Voice Billing System`, 15, yPos);
      yPos += 10;

      // Table Headers
      doc.setFontSize(11);
      doc.setFont(undefined, "bold");
      const headers = ["Item", "Qty", "Price", "Total", "Profit"];
      const colWidth = 40;
      const xPositions = [15, 55, 85, 115, 145];

      headers.forEach((header, i) => {
        doc.text(header, xPositions[i], yPos);
      });
      yPos += 7;

      // Table Rows
      doc.setFont(undefined, "normal");
      doc.setFontSize(9);
      items.forEach(item => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(item.name.substring(0, 20), xPositions[0], yPos);
        doc.text(item.qty.toString(), xPositions[1], yPos);
        doc.text(`₹${item.price}`, xPositions[2], yPos);
        doc.text(`₹${item.total.toFixed(2)}`, xPositions[3], yPos);
        doc.text(`₹${item.totalProfit.toFixed(2)}`, xPositions[4], yPos);
        yPos += 6;
      });

      yPos += 5;
      // Summary Section
      doc.setFont(undefined, "bold");
      doc.setFontSize(10);
      doc.text("SUMMARY", 15, yPos);
      yPos += 7;

      doc.setFont(undefined, "normal");
      doc.setFontSize(9);
      const summaryItems = [
        [`Subtotal: ₹${subtotal.toFixed(2)}`],
        [`Discount (${discountPercent}%): -₹${discount.toFixed(2)}`],
        [`GST (${gstPercent}%): +₹${gst.toFixed(2)}`],
        [`TOTAL: ₹${finalTotal.toFixed(2)}`],
        [`Total Profit: ₹${totalProfit.toFixed(2)}`]
      ];

      summaryItems.forEach(item => {
        doc.text(item[0], 15, yPos);
        yPos += 6;
      });

      doc.save(`voice_bill_${new Date().getTime()}.pdf`);
      addToHistory({ type: "export", format: "PDF", itemsCount: items.length });
    } catch (error) {
      console.error("PDF export error:", error);
      alert("Install jspdf package: npm install jspdf");
    }
  };

  // ==================== PRINT BILL ==================== //
  const printBill = () => {
    if (items.length === 0) {
      alert("No items to print");
      return;
    }

    const printWindow = window.open("", "", "height=600,width=800");
    const html = `
      <html>
      <head><title>Voice Bill</title>
      <style>
        body { font-family: Arial; margin: 20px; }
        h1 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background-color: #f2f2f2; }
        .summary { margin: 20px 0; font-weight: bold; }
      </style>
      </head>
      <body>
        <h1>SMART BILLING - VOICE BILL</h1>
        <p><strong>Bill Name:</strong> ${billName || "Current Bill"}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
        <table>
          <tr>
            <th>Item Name</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Total</th>
            <th>Profit</th>
          </tr>
          ${items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.qty} ${item.unit}</td>
              <td>₹${item.price}</td>
              <td>₹${item.total.toFixed(2)}</td>
              <td>₹${item.totalProfit.toFixed(2)}</td>
            </tr>
          `).join("")}
        </table>
        <div class="summary">
          <p>Subtotal: ₹${subtotal.toFixed(2)}</p>
          <p>Discount (${discountPercent}%): -₹${discount.toFixed(2)}</p>
          <p>GST (${gstPercent}%): +₹${gst.toFixed(2)}</p>
          <p style="font-size: 18px; color: green;">TOTAL: ₹${finalTotal.toFixed(2)}</p>
          <p>Total Profit: ₹${totalProfit.toFixed(2)}</p>
        </div>
      </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-4xl">🎤</span>
        <div>
          <h2 className="text-2xl font-bold text-pink">Voice Billing System</h2>
          <p className="text-sm text-gray-300">Say item name, quantity, and price</p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={startListening}
          disabled={listening}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold disabled:opacity-50 transition"
        >
          🎙️ Start
        </button>

        <button
          onClick={pauseListening}
          disabled={!listening}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold disabled:opacity-50 transition"
        >
          ⏸️ Pause
        </button>

        <button
          onClick={stopListening}
          disabled={!listening}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold disabled:opacity-50 transition"
        >
          ⏹️ Stop
        </button>

        <button
          onClick={() => {
            setItems([]);
            setTranscript("");
            setMathResult("");
            setCurrentResult(null);
            setHistory([]);
          }}
          className="px-6 py-2 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-semibold transition"
        >
          🗑️ Clear
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-4 border-b-2 border-gray-600 pb-3">
        <button
          onClick={() => setActiveTab("billing")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "billing"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          💳 Billing
        </button>
        <button
          onClick={() => setActiveTab("export")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "export"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          📤 Export
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "settings"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          ⚙️ Settings
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "history"
              ? "text-blue-400 border-b-2 border-blue-400"
              : "text-gray-400 hover:text-white"
          }`}
        >
          📜 History
        </button>
      </div>

      {/* Current Result Display */}
      {currentResult && (
        <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
          {currentResult.type === "calculation" && (
            <div className="flex items-center gap-2 text-lg font-semibold text-blue-900">
              🧮 <span>{currentResult.expr} = {currentResult.result}</span>
            </div>
          )}
          {currentResult.type === "item_added" && (
            <div className="flex items-center gap-2 text-lg font-semibold text-green-900">
              ✅ <span>{currentResult.name} × {currentResult.qty} @ ₹{currentResult.price} = ₹{currentResult.total}</span>
            </div>
          )}
          {currentResult.type === "total" && (
            <div className="flex items-center gap-2 text-lg font-semibold text-purple-900">
              📊 <span>Subtotal: ₹{currentResult.subtotal}, After Discount: ₹{currentResult.finalTotal ? (currentResult.subtotal - currentResult.discount) : currentResult.subtotal}, Total: ₹{currentResult.finalTotal || currentResult.total}</span>
            </div>
          )}
          {currentResult.type === "bill_saved" && (
            <div className="flex items-center gap-2 text-lg font-semibold text-green-900">
              💾 <span>Bill Saved! Total: ₹{currentResult.total.toFixed(2)}, Profit: ₹{currentResult.profit.toFixed(2)}</span>
            </div>
          )}
          {currentResult.type === "setting" && (
            <div className="flex items-center gap-2 text-lg font-semibold text-orange-900">
              ⚙️ <span>{currentResult.setting.toUpperCase()} set to {currentResult.value}%</span>
            </div>
          )}
        </div>
      )}

      {/* Transcript */}
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono">
        <strong>📝 Transcript:</strong> {transcript || "Listening..."}
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{stats.totalCalculations}</div>
          <div className="text-sm">Calculations</div>
        </div>
        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{stats.totalItemsAdded}</div>
          <div className="text-sm">Items Added</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">₹{stats.totalAmount.toFixed(0)}</div>
          <div className="text-sm">Total Amount</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg text-center">
          <div className="text-2xl font-bold">{stats.totalBillsSaved}</div>
          <div className="text-sm">Bills Saved</div>
        </div>
      </div>

      {/* Items List */}
      <div>
        <h3 className="text-xl font-bold text-pink mb-4 flex items-center gap-2">
          🛒 Items ({items.length})
        </h3>
        {items.length === 0 ? (
          <p className="text-gray-400">No items added yet. Say "add milk 2 hundred"</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="bg-white/10 border border-white/20 rounded-lg p-4 flex justify-between items-center">
                <div className="flex-1">
                  <div className="font-semibold text-white">{item.name} {item.unit && `(${item.unit})`}</div>
                  <div className="text-sm text-gray-300">{item.qty} × ₹{item.price} = ₹{item.total}</div>
                  <div className="text-xs text-green-400">Profit: ₹{item.totalProfit.toFixed(2)}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-white">₹{item.total}</div>
                </div>
              </div>
            ))}

            {/* Bill Settings */}
            {activeTab === "billing" && (
              <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 mt-4 space-y-3">
                <input
                  type="text"
                  placeholder="Bill Name"
                  value={billName}
                  onChange={(e) => setBillName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-slate-900 text-white border border-slate-600"
                />
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-xs text-gray-400">Discount %</label>
                    <input
                      type="number"
                      value={discountPercent}
                      onChange={(e) => setDiscountPercent(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded bg-slate-900 text-white border border-slate-600 text-sm"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">GST %</label>
                    <input
                      type="number"
                      value={gstPercent}
                      onChange={(e) => setGstPercent(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded bg-slate-900 text-white border border-slate-600 text-sm"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">Margin %</label>
                    <input
                      type="number"
                      value={marginPercent}
                      onChange={(e) => setMarginPercent(Number(e.target.value))}
                      className="w-full px-2 py-1 rounded bg-slate-900 text-white border border-slate-600 text-sm"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Total Summary */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg font-bold mt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {discountPercent > 0 && (
                <div className="flex justify-between mb-2 text-green-200">
                  <span>Discount ({discountPercent}%):</span>
                  <span>-₹{discount.toFixed(2)}</span>
                </div>
              )}
              {gstPercent > 0 && (
                <div className="flex justify-between mb-2">
                  <span>GST ({gstPercent}%):</span>
                  <span>+₹{gst.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg border-t-2 pt-2">
                <span>Total:</span>
                <span>₹{finalTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Profit:</span>
                <span className="text-green-200">₹{totalProfit.toFixed(2)}</span>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveBill}
              className="w-full mt-4 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold transition"
            >
              💾 Save Bill to Database
            </button>
          </div>
        )}
      </div>

      {/* EXPORT TAB */}
      {activeTab === "export" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-pink mb-4">📤 Export & Print Options</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={exportToExcel}
              disabled={items.length === 0}
              className="px-4 py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              📊 Excel XLSX
            </button>

            <button
              onClick={exportToCSV}
              disabled={items.length === 0}
              className="px-4 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              📄 CSV File
            </button>

            <button
              onClick={exportToPDF}
              disabled={items.length === 0}
              className="px-4 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              📋 PDF Report
            </button>

            <button
              onClick={printBill}
              disabled={items.length === 0}
              className="px-4 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              🖨️ Print
            </button>
          </div>

          {/* Saved Bills */}
          {savedBills.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-bold text-white mb-3">📚 Saved Bills ({savedBills.length})</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {savedBills.map((bill, idx) => (
                  <div key={idx} className="bg-slate-800 border border-slate-700 rounded-lg p-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-white">{bill.billName}</div>
                        <div className="text-sm text-gray-400">{bill.billDate}</div>
                        <div className="text-xs text-gray-500">{bill.items.length} items</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-400">₹{bill.total.toFixed(2)}</div>
                        <div className="text-xs text-green-300">Profit: ₹{bill.profitLoss.toFixed(2)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-pink mb-4">⚙️ Settings & Configuration</h3>
          
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Default Discount (%)</label>
              <input
                type="range"
                min="0"
                max="50"
                value={discountPercent}
                onChange={(e) => setDiscountPercent(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-lg font-bold text-white mt-2">{discountPercent}%</div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Default GST (%)</label>
              <input
                type="range"
                min="0"
                max="28"
                value={gstPercent}
                onChange={(e) => setGstPercent(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-lg font-bold text-white mt-2">{gstPercent}%</div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Profit Margin (%)</label>
              <input
                type="range"
                min="0"
                max="100"
                value={marginPercent}
                onChange={(e) => setMarginPercent(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-lg font-bold text-white mt-2">{marginPercent}%</div>
            </div>

            <div className="bg-blue-500/20 border border-blue-500 rounded p-3 text-sm text-blue-200">
              <strong>💡 Voice Commands:</strong>
              <ul className="mt-2 space-y-1 text-xs">
                <li>• "add milk 2 hundred" - Add item with quantity and price</li>
                <li>• "total" - Calculate bill total with discounts & GST</li>
                <li>• "discount 10" - Set 10% discount</li>
                <li>• "gst 18" - Set 18% GST</li>
                <li>• "margin 30" - Set 30% profit margin</li>
                <li>• "save" - Save bill to database</li>
                <li>• "clear" - Clear all items</li>
                <li>• "remove milk" - Remove specific item</li>
                <li>• Math: "100 plus 50", "200 into 3", "1000 divide 5"</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {activeTab === "history" && history.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-white mb-3">📜 Operation History</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {history.slice(0, 50).map((entry) => (
              <div key={entry.id} className="bg-gray-800 text-gray-200 text-sm p-2 rounded flex justify-between">
                <span>
                  {entry.type === "calculation" && `🧮 ${entry.expr} = ${entry.result}`}
                  {entry.type === "item_added" && `➕ ${entry.item.name} (${entry.item.qty})`}
                  {entry.type === "bill_saved" && `💾 Bill saved (₹${entry.total})`}
                  {entry.type === "removed" && `🗑️ Removed ${entry.item.name}`}
                  {entry.type === "command" && `📌 ${entry.text}`}
                  {entry.type === "export" && `📤 Exported to ${entry.format}`}
                </span>
                <span className="text-xs opacity-70">{entry.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}