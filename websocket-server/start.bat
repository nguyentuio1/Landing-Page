@echo off
echo Installing WebSocket server dependencies...
cd websocket-server
npm install

echo.
echo Starting WebSocket server...
npm start