const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

// ===== Middleware =====
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== File Setup =====
const scansFile = path.join(__dirname, "scans.json");

// Create scans.json if not exists
if (!fs.existsSync(scansFile)) {
  fs.writeFileSync(scansFile, JSON.stringify([]));
}

// ===== Risk Score Engine =====
function calculateRisk(url) {
  let score = 0;
  let reasons = [];

  if (url.includes("bit.ly") || url.includes("tinyurl")) {
    score += 30;
    reasons.push("Shortened URL detected");
  }

  if (url.match(/\d+\.\d+\.\d+\.\d+/)) {
    score += 40;
    reasons.push("IP address used instead of domain");
  }

  if (url.length > 60) {
    score += 20;
    reasons.push("Unusually long URL");
  }

  if (url.match(/login|verify|bank|update/i)) {
    score += 25;
    reasons.push("Suspicious keyword detected");
  }

  return {
    score,
    level:
      score > 70 ? "HIGH" :
      score > 40 ? "MEDIUM" :
      "LOW",
    reasons
  };
}

// ===== Login API (Role-Based Access) =====
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const users = {
    visitor: { password: "123", role: "VISITOR" },
    admin: { password: "admin123", role: "ADMIN" },
    analyst: { password: "soc123", role: "ANALYST" }
  };

  if (users[username] && users[username].password === password) {
    res.json({ success: true, role: users[username].role });
  } else {
    res.json({ success: false });
