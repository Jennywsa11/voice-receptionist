require("dotenv").config();

const express = require("express");
const path = require("path");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 8080;

// ✅ Load environment variables
const RETELL_API_KEY = process.env.RETELL_API_KEY;
const RETELL_AGENT_ID = process.env.RETELL_AGENT_ID;

// ❌ Stop if missing
if (!RETELL_API_KEY || !RETELL_AGENT_ID) {
  console.error("❌ Missing RETELL_API_KEY or RETELL_AGENT_ID in .env");
  process.exit(1);
}

console.log("✅ Server started");
console.log("🤖 Agent ID:", RETELL_AGENT_ID);

// ✅ Helper function (clean + correct)
function postJson(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const payload = JSON.stringify(data);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search, // ✅ IMPORTANT FIX
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        ...headers,
      },
    };

    const req = https.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const json = JSON.parse(body || "{}");

          console.log("📡 Retell response:", json); // ✅ DEBUG

          resolve({
            statusCode: res.statusCode,
            body: json,
          });
        } catch (e) {
          console.error("❌ JSON parse error:", body);
          reject(new Error("Invalid JSON response"));
        }
      });
    });

    req.on("error", (err) => {
      console.error("❌ HTTPS error:", err);
      reject(err);
    });

    req.write(payload);
    req.end();
  });
}

// ✅ Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ✅ Create call endpoint
app.post("/create-call", async (req, res) => {
  console.log("🔥 /create-call endpoint hit");

  try {
    const result = await postJson(
      "https://api.retellai.com/v2/create-web-call",
      {
        agent_id: RETELL_AGENT_ID,
      },
      {
        Authorization: `Bearer ${RETELL_API_KEY}`,
      }
    );

    if (result.statusCode >= 400) {
      console.error("❌ Retell API error:", result.body);
      return res.status(result.statusCode).json(result.body);
    }

    return res.json(result.body); // ✅ send real token to frontend
  } catch (err) {
    console.error("❌ Server error:", err);
    return res.status(500).json({ error: err.message });
  }
});

// ✅ Serve homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Start server (FIXES EADDRINUSE automatically)
app.listen(PORT, () => {
  console.log(`🚀 Running on http://localhost:${PORT}`);
}).on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.log("👉 Close other terminals or run:");
    console.log(`   npx kill-port ${PORT}`);
  } else {
    console.error("❌ Server failed:", err);
  }
});