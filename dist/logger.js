"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
const config_1 = require("./config");
exports.logger = (0, pino_1.default)({
    level: config_1.config.log.level,
    // Without this, passing `{ err }` would render as `{}` because Error's own
    // properties (message, stack) are non-enumerable.
    serializers: { err: pino_1.default.stdSerializers.err },
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
});
//# sourceMappingURL=logger.js.map