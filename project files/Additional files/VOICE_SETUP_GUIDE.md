# 🔧 Voice Billing System - Setup & Installation Guide

## 📋 Prerequisites

Ensure you have the following installed:
- Node.js (v14 or higher)
- npm or yarn
- React 18+
- Axios for API calls

---

## 📦 Required Dependencies

### Core Dependencies (Already Included)
```json
{
  "react": "^18.0.0",
  "axios": "^1.0.0"
}
```

### Optional Dependencies for Full Features

#### For Excel Export (xlsx)
```bash
npm install xlsx
```

**Usage in Voice.jsx:**
```javascript
const XLSX = await import("xlsx");
```

#### For PDF Export (jspdf)
```bash
npm install jspdf
```

**Usage in Voice.jsx:**
```javascript
const jsPDF = (await import("jspdf")).jsPDF;
```

#### Installation Script
```bash
# Install all optional dependencies at once
npm install xlsx jspdf
```

---

## ⚙️ Configuration

### Environment Variables Required

Create `.env` file in `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### Backend API Endpoints Used

The Voice component uses these endpoints:

```
POST /api/math-operations
- Save math calculations
- Body: { expression, result, operationType, timestamp }

POST /api/bills
- Save bills to database
- Body: { items, subtotal, discount, gst, total, ... }

GET /api/bills
- Retrieve saved bills (for future use)
```

---

## 🚀 Getting Started

### Step 1: Install Frontend

```bash
cd frontend
npm install
```

### Step 2: Install Optional Export Libraries

```bash
npm install xlsx jspdf
```

### Step 3: Start Development Server

```bash
npm run dev
```

### Step 4: Access Voice Component

Navigate to the Dashboard and find the Voice Billing section.

---

## 🎯 Quick Start Example

### 1. Click "🎤 Voice Billing System"

### 2. Click "🎙️ Start" Button

The microphone will start listening.

### 3. Say Commands

```
"add milk 2 hundred"      → Add 2 liters of milk at ₹100 each
"add bread 3 50"          → Add 3 breads at ₹50 each
"total"                   → Calculate bill total
"discount 10"             → Apply 10% discount
"save"                    → Save bill to database
```

### 4. Export Bill

- Go to "📤 Export" tab
- Choose format: Excel, CSV, PDF, or Print
- File will download automatically

---

## 🔊 Voice Recognition Setup

### Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ | Full support |
| Edge | ✅ | Full support |
| Safari | ✅ | Full support |
| Firefox | ⚠️ | Limited support |

### Microphone Permissions

#### Chrome/Edge
1. Click microphone icon in address bar
2. Select "Always allow on this site"

#### Safari
1. System Preferences → Security & Privacy
2. Allow microphone access

#### Firefox
Firefox doesn't support Web Speech API natively

---

## 📱 Responsive Design

### Desktop (1024px+)
- Full feature display
- All tabs visible
- Full statistics display
- Multi-column export options

### Tablet (768px-1024px)
- Vertical scrolling
- Touch-optimized buttons
- Stacked layouts

### Mobile (<768px)
- Simplified interface
- Single-column layout
- Larger touch targets
- Horizontal scrolling for tables

---

## 💾 Data Persistence

### LocalStorage

Automatically saves:
- All bills (under key `voice_bills`)
- Persists across browser sessions
- No setup required

**Clear LocalStorage (if needed):**
```javascript
localStorage.removeItem('voice_bills');
// Refresh page to clear cache
```

### Database

Bills are also sent to backend API:
- Requires valid authentication token
- Persistent cloud backup
- Available for reporting and analytics

---

## 🧪 Testing

### Test Excel Export

```javascript
// In Voice component
1. Add items: "add milk 2 100"
2. Click Export tab
3. Click "📊 Excel XLSX" button
4. File "voice_bills_[timestamp].xlsx" will download
5. Open in Excel to verify
```

### Test CSV Export

```javascript
1. Add items: "add rice 1 250"
2. Click Export tab
3. Click "📄 CSV File" button
4. File "voice_bill_[timestamp].csv" will download
5. Open in any spreadsheet app
```

### Test PDF Export

```javascript
1. Add items and set GST
2. Click Export tab
3. Click "📋 PDF Report" button
4. File "voice_bill_[timestamp].pdf" will download
5. Open in PDF viewer
```

### Test Print

```javascript
1. Add items
2. Click Export tab
3. Click "🖨️ Print" button
4. Browser print dialog opens
5. Select printer and print
```

---

## 🎤 Voice Commands - Complete Reference

### Item Management

```
Pattern: "add [item_name] [quantity] [price]"

Examples:
"add milk 2 hundred"
"add rice 5 kg 250"
"add bread 3 50"
"add butter 1 kg 500"
"add eggs 1 dozen 200"

Units supported:
- kg, liter, piece, dozen, box, pack, gram, ml
```

### Calculations

```
"total"              → Show bill total with tax
"discount 10"        → Set 10% discount
"gst 18"             → Set 18% GST
"margin 30"          → Set 30% profit margin

Math operations:
"100 plus 50"        → 150
"200 into 5"         → 1000
"1000 divide 5"      → 200
"50 minus 10"        → 40
```

### Item Management

```
"remove milk"        → Remove milk items
"delete bread"       → Delete bread items
"clear"              → Clear all items
"reset"              → Reset everything
```

### Actions

```
"save"               → Save bill to database
"export"             → (Trigger export menu)
"print"              → Print bill
```

---

## 🐛 Debugging

### Enable Console Logging

Add to Voice.jsx for debugging:

```javascript
// Track all commands
console.log('Processing command:', cmd);

// Track items
console.log('Items:', items);

// Track exports
console.log('Excel export initiated');
```

### Check Browser Console

Press `F12` → Console tab to view:
- API responses
- Errors
- Export status
- Speech recognition events

### Check Network Tab

Press `F12` → Network tab to verify:
- Bill save requests
- Math operation saves
- API response status

---

## ⚡ Performance Tips

### 1. Optimize Re-renders

```javascript
// Use useCallback for command processing
const processCommand = useCallback((cmd) => {
  // Process command
}, [paused, items, discountPercent, gstPercent, marginPercent]);
```

### 2. Lazy Load Export Libraries

Already implemented:
```javascript
// Only loaded when needed
const XLSX = await import("xlsx");
```

### 3. Limit History Size

Current limit: 50 recent operations
```javascript
{history.slice(0, 50).map(...)}
```

### 4. Cache Calculations

```javascript
// Memoize calculations
const subtotal = useMemo(() => 
  items.reduce((sum, itm) => sum + itm.total, 0),
  [items]
);
```

---

## 🔐 Security Considerations

### 1. Token Management

```javascript
const token = localStorage.getItem("token");
// Used in API headers: Authorization: "Bearer " + token
```

### 2. Input Validation

```javascript
// All voice inputs are validated before processing
if (itemData.price > 0) {
  // Process item
}
```

### 3. XSS Prevention

```javascript
// React automatically escapes rendered text
<div>{item.name}</div>  // Safe from XSS
```

### 4. CORS Headers

Ensure backend has CORS enabled:
```javascript
// Backend should include CORS headers
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
```

---

## 📚 File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Voice.jsx              ← Main component
│   │   ├── Calculator.jsx
│   │   ├── OCR.jsx
│   │   └── Sidebar.jsx
│   ├── pages/
│   │   └── Dashboard.jsx
│   └── main.jsx
└── package.json
```

---

## 🌐 API Integration

### Save Bill Endpoint

```javascript
POST /api/bills
Headers: {
  Authorization: "Bearer {token}",
  Content-Type: "application/json"
}
Body: {
  billName: "Daily Sales",
  items: [{...}],
  subtotal: 1000,
  discount: 100,
  discountPercent: 10,
  gst: 162,
  gstPercent: 18,
  total: 1062,
  principleTotal: 700,
  profitLoss: 362,
  source: "voice",
  billDate: "12/8/2025, 10:30:45 AM"
}
```

### Response

```javascript
{
  success: true,
  message: "Bill saved successfully",
  billId: "507f1f77bcf86cd799439011",
  bill: {...}
}
```

---

## 🚨 Error Handling

### Common Issues

#### Issue: "Speech Recognition Not Supported"
**Solution:** Use a compatible browser (Chrome, Edge, Safari)

#### Issue: Export buttons disabled
**Solution:** Add at least one item to the bill

#### Issue: Bills not saving
**Solution:** 
- Check internet connection
- Verify backend is running
- Check token validity
- Check CORS settings

#### Issue: Permission denied for microphone
**Solution:** 
- Grant microphone permission in browser settings
- Refresh page after granting permission

---

## 📞 Support & Troubleshooting

### Quick Checklist

- [ ] Browser supports Web Speech API
- [ ] Microphone is connected and enabled
- [ ] Backend API is running
- [ ] VITE_API_URL is correctly configured
- [ ] Token is valid in localStorage
- [ ] Export packages (xlsx, jspdf) installed for full features
- [ ] Network requests are successful (check Console)

### Debug Mode

Enable detailed logging:
```javascript
// Add to Voice.jsx top
const DEBUG = true;

if (DEBUG) {
  console.log('Command:', cmd);
  console.log('Items:', items);
  console.log('Result:', currentResult);
}
```

---

## 🎓 Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ✅ Test voice recognition
4. ✅ Add sample items via voice
5. ✅ Test export functionality
6. ✅ Verify bill saving
7. ✅ Deploy to production

---

## 📊 Feature Checklist

- [x] Voice item addition
- [x] Quantity parsing
- [x] Unit support
- [x] Profit margin calculation
- [x] Discount support
- [x] GST calculation
- [x] Excel export
- [x] CSV export
- [x] PDF export
- [x] Print functionality
- [x] Local storage
- [x] Settings panel
- [x] Statistics tracking
- [x] History logging
- [x] Error handling
- [x] Responsive design

---

**Last Updated:** December 8, 2025
**Status:** ✅ Complete
**Version:** 2.0 (Enhanced)
