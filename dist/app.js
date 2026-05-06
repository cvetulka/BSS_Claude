"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("@fastify/cors"));
const fastify_1 = __importDefault(require("fastify"));
const routes_1 = require("./api/routes");
const config_1 = require("./config");
const logger_1 = require("./logger");
const websocket_1 = require("./realtime/websocket");
const plcService_1 = require("./services/plcService");
const stateStore_1 = require("./services/stateStore");
async function main() {
    const app = (0, fastify_1.default)({
        logger: {
            level: config_1.config.log.level,
            transport: process.env.NODE_ENV === 'production'
                ? undefined
                : {
                    target: 'pino-pretty',
                    options: {
                        colorize: true,
                        translateTime: 'SYS:HH:MM:ss.l',
                        ignore: 'pid,hostname',
                    },
                },
        },
    });
    await app.register(cors_1.default, {
        origin: config_1.config.http.corsOrigin,
    });
    const store = new stateStore_1.StateStore({
        host: config_1.config.plc.host,
        port: config_1.config.plc.port,
        unitId: config_1.config.plc.unitId,
    });
    const plc = (0, plcService_1.createPlcService)({ config: config_1.config, logger: logger_1.logger, store });
    (0, routes_1.registerRoutes)(app, plc);
    await app.listen({ host: config_1.config.http.host, port: config_1.config.http.port });
    (0, websocket_1.attachWebSocket)({
        httpServer: app.server,
        plc,
        logger: logger_1.logger,
        corsOrigin: config_1.config.http.corsOrigin,
    });
    plc.start();
    const shutdown = async (signal) => {
        logger_1.logger.info({ signal }, 'shutting down');
        try {
            await plc.stop();
            await app.close();
            process.exit(0);
        }
        catch (err) {
            logger_1.logger.error({ err }, 'error during shutdown');
            process.exit(1);
        }
    };
    process.on('SIGINT', () => void shutdown('SIGINT'));
    process.on('SIGTERM', () => void shutdown('SIGTERM'));
}
main().catch((err) => {
    logger_1.logger.fatal({ err }, 'fatal error during startup');
    process.exit(1);
});
//# sourceMappingURL=app.js.map