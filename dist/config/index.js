"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = require("dotenv");
const zod_1 = require("zod");
(0, dotenv_1.config)();
const numericString = (defaultValue) => zod_1.z
    .string()
    .optional()
    .transform((v) => (v === undefined || v === '' ? defaultValue : Number(v)))
    .pipe(zod_1.z.number().finite());
const integerString = (defaultValue) => numericString(defaultValue).pipe(zod_1.z.number().int());
const envSchema = zod_1.z.object({
    HOST: zod_1.z.string().default('0.0.0.0'),
    PORT: integerString(3000),
    LOG_LEVEL: zod_1.z
        .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
        .default('info'),
    CORS_ORIGIN: zod_1.z.string().default('*'),
    PLC_HOST: zod_1.z.string().min(1, 'PLC_HOST is required'),
    PLC_PORT: integerString(502),
    PLC_UNIT_ID: integerString(1),
    PLC_CONNECT_TIMEOUT_MS: integerString(5000),
    PLC_REQUEST_TIMEOUT_MS: integerString(2000),
    PLC_RECONNECT_INTERVAL_MS: integerString(5000),
    PLC_DIGITAL_POLL_INTERVAL_MS: integerString(1000),
    PLC_ANALOG_POLL_INTERVAL_MS: integerString(60000),
    MODBUS_ADDRESS_OFFSET: integerString(0),
    TEMPERATURE_SCALE: numericString(0.1),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:');
    for (const issue of parsed.error.issues) {
        // eslint-disable-next-line no-console
        console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
}
const env = parsed.data;
exports.config = {
    http: {
        host: env.HOST,
        port: env.PORT,
        corsOrigin: env.CORS_ORIGIN === '*'
            ? true
            : env.CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean),
    },
    log: {
        level: env.LOG_LEVEL,
    },
    plc: {
        host: env.PLC_HOST,
        port: env.PLC_PORT,
        unitId: env.PLC_UNIT_ID,
        connectTimeoutMs: env.PLC_CONNECT_TIMEOUT_MS,
        requestTimeoutMs: env.PLC_REQUEST_TIMEOUT_MS,
        reconnectIntervalMs: env.PLC_RECONNECT_INTERVAL_MS,
        digitalPollIntervalMs: env.PLC_DIGITAL_POLL_INTERVAL_MS,
        analogPollIntervalMs: env.PLC_ANALOG_POLL_INTERVAL_MS,
        addressOffset: env.MODBUS_ADDRESS_OFFSET,
        temperatureScale: env.TEMPERATURE_SCALE,
    },
};
//# sourceMappingURL=index.js.map