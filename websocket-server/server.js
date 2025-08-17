const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 8080;
const WS_PORT = 8081;

// Email storage (in production, use a database)
const EMAILS_FILE = path.join(__dirname, 'emails.json');

// Initialize emails file if it doesn't exist
if (!fs.existsSync(EMAILS_FILE)) {
  fs.writeFileSync(EMAILS_FILE, JSON.stringify({
    emails: [],
    totalCount: 1247 // Starting count for social proof
  }));
}

// Read email data
const readEmailData = () => {
  try {
    const data = fs.readFileSync(EMAILS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading email data:', error);
    return { emails: [], totalCount: 1247 };
  }
};

// Write email data
const writeEmailData = (data) => {
  try {
    fs.writeFileSync(EMAILS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing email data:', error);
  }
};

// WebSocket Server
const wss = new WebSocket.Server({ port: WS_PORT });

console.log(`WebSocket server running on ws://localhost:${WS_PORT}`);

// Track connected clients
const clients = new Set();

// Broadcast to all connected clients
const broadcast = (message) => {
  const messageStr = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(messageStr);
    }
  });
};

wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);
  
  // Send current count to new client
  const emailData = readEmailData();
  ws.send(JSON.stringify({
    type: 'count_update',
    count: emailData.totalCount
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'get_count':
          const emailData = readEmailData();
          ws.send(JSON.stringify({
            type: 'count_update',
            count: emailData.totalCount
          }));
          break;
          
        case 'email_added':
          // Just broadcast the current count without incrementing
          // (the REST API already handled the increment)
          const currentData = readEmailData();
          
          // Broadcast updated count to all clients
          broadcast({
            type: 'count_update',
            count: currentData.totalCount
          });
          
          console.log(`Email count broadcasted: ${currentData.totalCount}`);
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });
  
  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// REST API for email collection
app.post('/api/emails', (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email required' });
  }
  
  const emailData = readEmailData();
  
  // Check if email already exists
  const emailExists = emailData.emails.some(entry => entry.email === email);
  if (emailExists) {
    return res.status(409).json({ error: 'Email already registered' });
  }
  
  // Add new email
  emailData.emails.push({
    email,
    timestamp: new Date().toISOString()
  });
  emailData.totalCount += 1;
  
  writeEmailData(emailData);
  
  // Broadcast updated count to all WebSocket clients
  broadcast({
    type: 'count_update',
    count: emailData.totalCount
  });
  
  console.log(`New email added: ${email}. Total count: ${emailData.totalCount}`);
  
  res.json({
    success: true,
    count: emailData.totalCount
  });
});

// Get current count
app.get('/api/count', (req, res) => {
  const emailData = readEmailData();
  res.json({ count: emailData.totalCount });
});

// Get all emails (admin only - add authentication in production)
app.get('/api/emails', (req, res) => {
  const emailData = readEmailData();
  res.json({
    emails: emailData.emails,
    totalCount: emailData.totalCount
  });
});

// Start HTTP server
app.listen(PORT, () => {
  console.log(`HTTP server running on http://localhost:${PORT}`);
});

console.log('🚀 Real-time email counter server started!');
console.log(`📊 WebSocket: ws://localhost:${WS_PORT}`);
console.log(`🌐 HTTP API: http://localhost:${PORT}`);