"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachWebSocket = attachWebSocket;
const socket_io_1 = require("socket.io");
function attachWebSocket(deps) {
    const { httpServer, plc, logger, corsOrigin } = deps;
    const io = new socket_io_1.Server(httpServer, {
        cors: { origin: corsOrigin === true ? '*' : corsOrigin },
    });
    io.on('connection', (socket) => {
        logger.debug({ id: socket.id }, 'ws client connected');
        // Send a snapshot immediately so newly connected clients render right away.
        socket.emit('plc:data', plc.getState());
        socket.emit('plc:status', plc.getState().connection);
        socket.on('disconnect', (reason) => {
            logger.debug({ id: socket.id, reason }, 'ws client disconnected');
        });
    });
    plc.on('data', (state) => {
        io.emit('plc:data', state);
    });
    plc.on('status', (status) => {
        io.emit('plc:status', status);
    });
    plc.on('error', (payload) => {
        io.emit('plc:error', payload);
    });
    return io;
}
//# sourceMappingURL=websocket.js.map