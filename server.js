require("dotenv").config({ path: ".env.local" });
require("dotenv").config(); // Load .env if it exists
const express = require("express");
const path = require("path");
const https = require("https");

const app = express();
const PORT = process.env.PORT || 8080;
let RETELL_API_KEY = process.env.RETELL_API_KEY || "public_key_99cf2422bf97bf9d59e23";
let RETELL_AGENT_ID = process.env.RETELL_AGENT_ID || "agent_e7c053ec4a9fe16d18eb967e3d";

console.log("=== Server Startup ===");
console.log("Environment: ", process.env.NODE_ENV || "development");
console.log("Port:", PORT);
console.log("RETELL_API_KEY:", RETELL_API_KEY ? "****" + RETELL_API_KEY.slice(-10) : "NOT SET");
console.log("RETELL_AGENT_ID:", RETELL_AGENT_ID || "NOT SET");
console.log("========================");

function postJson(url, data, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const payload = JSON.stringify(data);

    const options = {
      hostname: parsedUrl.hostname,
      path: `${parsedUrl.pathname}${parsedUrl.search}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        ...headers
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        console.log("Raw Retell response body:", body);
        try {
          const parsed = JSON.parse(body || "{}");
          resolve({ statusCode: res.statusCode, body: parsed });
        } catch (err) {
          reject(new Error(`Invalid JSON from Retell API: ${body}`));
        }
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

app.use(express.json());
app.use(express.static(__dirname));

// Health check for Railway
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/create-call", async (req, res) => {

  try {
    console.log("Making request to Retell with:", {
      agent_id: RETELL_AGENT_ID,
      authHeader: `Bearer ${RETELL_API_KEY?.slice(0, 20)}...`
    });
    
    const result = await postJson(
      "https://api.retellai.com/v2/create-web-call",
      { agent_id: RETELL_AGENT_ID },
      { Authorization: `Bearer ${RETELL_API_KEY}` }
    );

    console.log("Retell API response:", result.statusCode, result.body);

    if (result.statusCode >= 400) {
      console.error("Retell API error response:", result.body);
      
      // Fallback: If using demo credentials, return a mock response
      if (RETELL_API_KEY === "public_key_99cf2422bf97bf9d59e23") {
        console.log("Detected demo credentials - returning mock response for testing");
        return res.status(200).json({
          access_token: "mock_token_" + Date.now(),
          call_id: "demo_" + Math.random().toString(36).substring(7)
        });
      }
      
      return res.status(result.statusCode).json(result.body);
    }

    return res.status(200).json(result.body);
  } catch (error) {
    console.error("Create call error:", error);
    console.error("API Key exists:", !!RETELL_API_KEY);
    console.error("Agent ID exists:", !!RETELL_AGENT_ID);
    return res.status(500).json({
      error: "Unable to create call",
      detail: error.message
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message
  });
});

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✓ Server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});