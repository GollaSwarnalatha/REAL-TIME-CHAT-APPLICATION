import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Store connected clients and message history
const clients = new Set();
const messageHistory = [];

// Broadcast message to all connected clients
function broadcast(message) {
  clients.forEach(client => {
    if (client.readyState === 1) { // 1 = WebSocket.OPEN
      client.send(JSON.stringify(message));
    }
  });
}

wss.on('connection', (ws) => {
  // Add new client to the set
  clients.add(ws);
  console.log('Client connected. Total clients:', clients.size);
  
  // Send message history to new client
  ws.send(JSON.stringify({
    type: 'history',
    data: messageHistory
  }));

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);
      
      // Add timestamp to message
      const messageWithTimestamp = {
        ...message,
        timestamp: new Date().toISOString()
      };
      
      // Store message in history (limit to last 100 messages)
      messageHistory.push(messageWithTimestamp);
      if (messageHistory.length > 100) {
        messageHistory.shift();
      }
      
      // Broadcast message to all clients
      broadcast({
        type: 'message',
        data: messageWithTimestamp
      });
      
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Handle client disconnection
  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total clients:', clients.size);
  });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(join(__dirname, '../dist')));
  app.get('*', (req, res) => {
    res.sendFile(join(__dirname, '../dist/index.html'));
  });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server is running on port ${PORT}`);
});