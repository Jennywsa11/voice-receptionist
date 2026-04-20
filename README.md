# AI Voice Receptionist for GlowUp Hair Salon

A one-page website that serves as an AI-powered voice receptionist for GlowUp Hair Salon. The site allows visitors to initiate voice calls with an AI agent that handles customer inquiries and books appointments.

## Features

- Clean, responsive UI with a centered white card design
- Integration with Retell AI API for voice calls
- Real-time call status updates
- Simple call start/end functionality

## Setup Instructions

1. Clone or download the repository
2. Run `npm install` to install dependencies
3. Create a `.env` file from `.env.example` and set your Retell credentials:

   - `RETELL_API_KEY` — your Retell API key
   - `RETELL_AGENT_ID` — the Retell agent ID to use for calls

   Example `.env` contents:
   ```env
   RETELL_API_KEY=your_api_key_here
   RETELL_AGENT_ID=your_agent_id_here
   ```

4. Start the server:
   ```powershell
   npm start
   ```

5. Open `http://localhost:8080` in a browser
6. Click the "Call Now" button to start a voice call
7. The AI receptionist will handle the conversation

## Live URL

[Railway URL Placeholder]