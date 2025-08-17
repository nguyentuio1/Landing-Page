# Real-time Email Counter WebSocket Server

This WebSocket server provides real-time email counting functionality for your landing page.

## Features

- **Real-time WebSocket updates** - Instant count updates across all connected clients
- **REST API** - HTTP endpoints for email collection
- **Persistent storage** - Emails saved to JSON file (easily replaceable with database)
- **Connection management** - Handles client connections and disconnections
- **Error handling** - Robust error handling and validation

## Quick Start

### 1. Install Dependencies
```bash
cd websocket-server
npm install
```

### 2. Start the Server
```bash
npm start
```

Or on Windows, just double-click `start.bat`

### 3. Server URLs
- **WebSocket**: `ws://localhost:8081`
- **HTTP API**: `http://localhost:8080`

## API Endpoints

### POST /api/emails
Add a new email to the list
```json
{
  "email": "user@example.com"
}
```

### GET /api/count
Get current email count
```json
{
  "count": 1250
}
```

### GET /api/emails
Get all emails (admin endpoint)
```json
{
  "emails": [...],
  "totalCount": 1250
}
```

## WebSocket Messages

### Client → Server
```json
{
  "type": "get_count"
}
```

```json
{
  "type": "email_added",
  "email": "user@example.com",
  "timestamp": 1234567890
}
```

### Server → Client
```json
{
  "type": "count_update",
  "count": 1250
}
```

## Production Deployment

### Environment Variables
- `PORT` - HTTP server port (default: 8080)
- `WS_PORT` - WebSocket server port (default: 8081)

### Database Integration
Replace the JSON file storage in `server.js` with your preferred database:
- MongoDB
- PostgreSQL
- MySQL
- Redis

### Security Considerations
- Add authentication for admin endpoints
- Implement rate limiting
- Add CORS configuration
- Use HTTPS/WSS in production
- Validate and sanitize inputs

### Deployment Options
- **Heroku**: Easy deployment with WebSocket support
- **Railway**: Modern deployment platform
- **DigitalOcean**: VPS with Docker
- **AWS EC2**: Full control deployment
- **Vercel**: Serverless functions (HTTP only)

## File Structure
```
websocket-server/
├── server.js          # Main WebSocket + HTTP server
├── package.json       # Dependencies
├── emails.json        # Email storage (auto-created)
├── start.bat          # Windows startup script
└── README.md          # This file
```