require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;
const public_key_99cf2422bf97bf9d59e23 = process.env.RETELL_API_KEY;
const agent_e7c053ec4a9fe16d18eb967e3d = process.env.RETELL_AGENT_ID;

app.use(express.json());
app.use(express.static(__dirname));

app.post("/create-call", async (req, res) => {
  if (!RETELL_API_KEY || !RETELL_AGENT_ID) {
    return res.status(500).json({
      error: "Server configuration error: RETELL_API_KEY and RETELL_AGENT_ID must be set."
    });
  }

  try {
    const response = await fetch("https://api.retellai.com/v2/create-web-call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RETELL_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ agent_id: RETELL_AGENT_ID })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.json(data);
  } catch (error) {
    console.error("Create call error:", error);
    return res.status(500).json({ error: "Unable to create call" });
  }
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});