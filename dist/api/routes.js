"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
function registerRoutes(app, plc) {
    app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));
    app.get('/api/plc/status', async () => {
        return plc.getState().connection;
    });
    app.get('/api/plc/values', async () => {
        const state = plc.getState();
        return {
            analog: state.analog,
            digitalInputs: state.digitalInputs,
            alarms: state.alarms,
        };
    });
}
//# sourceMappingURL=routes.js.map