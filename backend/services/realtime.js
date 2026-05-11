const { WebSocketServer } = require('ws');
const logger = require('./logger');

let wss = null;
const clients = new Map();

function initRealtime(server) {
    wss = new WebSocketServer({ server, path: '/ws' });

    wss.on('connection', (ws, req) => {
        const clientId = `${req.socket.remoteAddress}-${Date.now()}`;
        clients.set(clientId, ws);
        logger.info('WebSocket client connected', { clientId, total: clients.size });

        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data);
                if (msg.type === 'subscribe' && msg.channel) {
                    ws.channel = msg.channel;
                    ws.send(JSON.stringify({ type: 'subscribed', channel: msg.channel }));
                }
            } catch (e) {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
            }
        });

        ws.on('close', () => {
            clients.delete(clientId);
            logger.info('WebSocket client disconnected', { clientId, total: clients.size });
        });

        ws.on('error', (err) => {
            logger.error('WebSocket error', { clientId, error: err.message });
        });

        // Send initial heartbeat
        ws.send(JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() }));
    });

    logger.info('WebSocket server initialized on /ws');
    return wss;
}

function broadcast(channel, payload) {
    if (!wss) return;
    const message = JSON.stringify({ type: 'broadcast', channel, payload, timestamp: new Date().toISOString() });
    clients.forEach((ws) => {
        if (ws.readyState === 1 && (!channel || ws.channel === channel)) {
            ws.send(message);
        }
    });
}

module.exports = { initRealtime, broadcast };
