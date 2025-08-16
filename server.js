const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, "data.xlsx");

// Sheets used by the app
const SHEETS = [
  "stores",
  "products",
  "orders",
  "payments",
  "agents",
  "transportation",
  "receivedCommissions",
  "cart",
  "meta" // for agent password or small key-values
];

// Ensure data.xlsx exists with required sheets
function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const wb = XLSX.utils.book_new();
    SHEETS.forEach((s) => {
      const ws = XLSX.utils.json_to_sheet([]);
      XLSX.utils.book_append_sheet(wb, ws, s);
    });
    XLSX.writeFile(wb, DATA_FILE);
  } else {
    // ensure all sheets exist
    const wb = XLSX.readFile(DATA_FILE);
    let changed = false;
    SHEETS.forEach((s) => {
      if (!wb.Sheets[s]) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([]), s);
        changed = true;
      }
    });
    if (changed) XLSX.writeFile(wb, DATA_FILE);
  }
}
ensureDataFile();

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public"))); // serve frontend

// helpers
function readSheet(name) {
  ensureDataFile();
  const wb = XLSX.readFile(DATA_FILE);
  const ws = wb.Sheets[name] || XLSX.utils.json_to_sheet([]);
  const json = XLSX.utils.sheet_to_json(ws, { defval: null });
  return json;
}

function writeSheet(name, data) {
  const wb = XLSX.readFile(DATA_FILE);
  wb.Sheets[name] = XLSX.utils.json_to_sheet(data);
  XLSX.writeFile(wb, DATA_FILE);
}

// Format date
function getFormattedDate() {
  const now = new Date();
  return now.toLocaleString("en-GB"); // DD/MM/YYYY, HH:MM:SS format
}

// Generic endpoints:
// GET /api/:sheet        -> list (sheet must be known)
// POST /api/:sheet       -> append (body = object)
// PUT  /api/:sheet/:idx  -> replace row at index (body = object)
// DELETE /api/:sheet/:idx-> delete row at index
// PUT  /api/:sheet       -> replace entire sheet (used for cart updates delivering array)

app.get("/api/:sheet", (req, res) => {
  const sheet = req.params.sheet;
  if (!SHEETS.includes(sheet))
    return res.status(404).json({ error: "Unknown sheet" });
  const data = readSheet(sheet);
  res.json(data);
});

app.post("/api/:sheet", (req, res) => {
  const sheet = req.params.sheet;
  if (!SHEETS.includes(sheet))
    return res.status(404).json({ error: "Unknown sheet" });

  const data = readSheet(sheet);
  let newEntry = req.body || {};

  // 🆕 Add date automatically if this is an order
  if (sheet === "orders") {
    newEntry.date = getFormattedDate();
  }

  data.push(newEntry);
  writeSheet(sheet, data);
  res.json({ success: true, data });
});

app.put("/api/:sheet/:index", (req, res) => {
  const sheet = req.params.sheet;
  const index = parseInt(req.params.index, 10);
  if (!SHEETS.includes(sheet))
    return res.status(404).json({ error: "Unknown sheet" });
  const data = readSheet(sheet);
  if (isNaN(index) || index < 0 || index >= data.length)
    return res.status(400).json({ error: "Invalid index" });

  let updated = req.body || {};
  if (sheet === "orders" && !updated.date) {
    // ensure orders always have a date
    updated.date = getFormattedDate();
  }

  data[index] = updated;
  writeSheet(sheet, data);
  res.json({ success: true, data });
});

// Replace whole sheet (useful for cart PUT)
app.put("/api/:sheet", (req, res) => {
  const sheet = req.params.sheet;
  if (!SHEETS.includes(sheet))
    return res.status(404).json({ error: "Unknown sheet" });
  const payload = req.body;
  if (!Array.isArray(payload))
    return res
      .status(400)
      .json({ error: "Body must be array to replace sheet" });

  // ensure date column exists for orders
  if (sheet === "orders") {
    payload = payload.map((order) => {
      if (!order.date) order.date = getFormattedDate();
      return order;
    });
  }

  writeSheet(sheet, payload);
  res.json({ success: true, data: payload });
});

app.delete("/api/:sheet/:index", (req, res) => {
  const sheet = req.params.sheet;
  const index = parseInt(req.params.index, 10);
  if (!SHEETS.includes(sheet))
    return res.status(404).json({ error: "Unknown sheet" });
  const data = readSheet(sheet);
  if (isNaN(index) || index < 0 || index >= data.length)
    return res.status(400).json({ error: "Invalid index" });
  data.splice(index, 1);
  writeSheet(sheet, data);
  res.json({ success: true, data });
});

// Helpful endpoint to update meta key (agentPassword)
app.post("/api/meta", (req, res) => {
  const meta = readSheet("meta");
  // store as object { key: "agentPassword", value: "..." }
  const { key, value } = req.body || {};
  if (!key) return res.status(400).json({ error: "Key required" });
  // remove existing same-key
  const filtered = meta.filter((m) => m.key !== key);
  filtered.push({ key, value });
  writeSheet("meta", filtered);
  res.json({ success: true, data: filtered });
});

app.get("/api/meta/:key", (req, res) => {
  const key = req.params.key;
  const meta = readSheet("meta");
  const found = meta.find((m) => m.key === key);
  res.json(found || null);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
