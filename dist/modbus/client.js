"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModbusClient = void 0;
const modbus_serial_1 = __importDefault(require("modbus-serial"));
/**
 * Thin wrapper around modbus-serial that:
 *   - serializes all reads (modbus-serial's underlying socket is single-channel)
 *   - exposes a stable async API (readCoils / readDiscreteInputs / readHoldingRegisters)
 *   - reports connection state without throwing on transient errors
 *
 * Reconnect orchestration lives in PlcService; this class just owns the socket.
 */
class ModbusClient {
    client = new modbus_serial_1.default();
    opts;
    queue = Promise.resolve();
    connected = false;
    constructor(opts) {
        this.opts = opts;
    }
    isConnected() {
        return this.connected && this.client.isOpen;
    }
    async connect() {
        if (this.isConnected())
            return;
        const { host, port, unitId, connectTimeoutMs, requestTimeoutMs, logger } = this.opts;
        // debug, not info: this fires on every reconnect attempt (potentially every
        // few seconds during a long outage). PlcService logs the higher-signal
        // "PLC online"/"PLC went offline"/"PLC error" lines at info/warn.
        logger.debug({ host, port, unitId }, 'connecting to PLC');
        await this.client.connectTCP(host, { port });
        this.client.setID(unitId);
        this.client.setTimeout(requestTimeoutMs);
        // connectTimeoutMs is informational; modbus-serial uses its own internal
        // socket timeout, but we expose the value for future migration.
        void connectTimeoutMs;
        this.connected = true;
        logger.info('PLC connection established');
    }
    async close() {
        this.connected = false;
        await new Promise((resolve) => {
            try {
                this.client.close(() => resolve());
            }
            catch {
                resolve();
            }
        });
    }
    readCoils(address, length) {
        return this.enqueue(async () => {
            const res = (await this.client.readCoils(address, length));
            return res.data.slice(0, length);
        });
    }
    readDiscreteInputs(address, length) {
        return this.enqueue(async () => {
            const res = (await this.client.readDiscreteInputs(address, length));
            return res.data.slice(0, length);
        });
    }
    readHoldingRegisters(address, length) {
        return this.enqueue(async () => {
            const res = await this.client.readHoldingRegisters(address, length);
            return res.data.slice(0, length);
        });
    }
    /**
     * Serialize all transactions through a single promise chain. modbus-serial
     * cannot interleave requests on one TCP socket, so concurrent calls would
     * otherwise corrupt each other's responses.
     */
    enqueue(task) {
        const next = this.queue.then(task, task);
        this.queue = next.catch(() => undefined);
        return next.catch((err) => {
            // A transport error invalidates the connection; mark dirty so PlcService
            // can trigger a reconnect. We re-throw so the caller can react too.
            if (isTransportError(err)) {
                this.connected = false;
            }
            throw err;
        });
    }
}
exports.ModbusClient = ModbusClient;
function isTransportError(err) {
    if (!err || typeof err !== 'object')
        return false;
    const code = err.code;
    if (code && /^(ECONNRESET|ECONNREFUSED|ETIMEDOUT|EHOSTUNREACH|ENETUNREACH|EPIPE|EHOSTDOWN)$/.test(code)) {
        return true;
    }
    const message = err.message ?? '';
    return /port not open|not connected|timed out/i.test(message);
}
//# sourceMappingURL=client.js.map