"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlcService = createPlcService;
const node_events_1 = require("node:events");
const client_1 = require("../modbus/client");
const registers_1 = require("../modbus/registers");
function createPlcService(opts) {
    const { config, logger, store } = opts;
    const emitter = new node_events_1.EventEmitter();
    const client = new client_1.ModbusClient({
        host: config.plc.host,
        port: config.plc.port,
        unitId: config.plc.unitId,
        connectTimeoutMs: config.plc.connectTimeoutMs,
        requestTimeoutMs: config.plc.requestTimeoutMs,
        logger,
    });
    let stopped = false;
    let digitalTimer = null;
    let analogTimer = null;
    let reconnectTimer = null;
    let digitalBusy = false;
    let analogBusy = false;
    // De-dupes warn-level error logs during long outages: when the same error
    // (same source + error code/message) repeats, log it at debug instead so a
    // 1-hour outage doesn't produce 720 identical warn lines. Reset on reconnect.
    let lastErrorKey = null;
    const offset = config.plc.addressOffset;
    const scale = config.plc.temperatureScale;
    const emitData = () => emitter.emit('data', store.get());
    const emitStatus = () => emitter.emit('status', store.get().connection);
    const emitError = (source, err) => {
        const message = err instanceof Error ? err.message : String(err);
        const code = err instanceof Error ? err.code : undefined;
        const key = `${source}:${code ?? message}`;
        store.setLastError(`${source}: ${message}`);
        if (key === lastErrorKey) {
            logger.debug({ source, code, err }, 'PLC error (repeating)');
        }
        else {
            logger.warn({ source, code, err }, 'PLC error');
            lastErrorKey = key;
        }
        emitter.emit('error', { source, message });
    };
    async function connectLoop() {
        if (stopped)
            return;
        try {
            await client.connect();
            store.setConnected();
            lastErrorKey = null;
            emitStatus();
            logger.info('PLC online; starting pollers');
            // Kick an immediate poll so the dashboard fills in fast, then schedule.
            void pollDigital();
            void pollAnalog();
            schedulePolling();
        }
        catch (err) {
            emitError('connect', err);
            store.setDisconnected(err instanceof Error ? err.message : String(err));
            emitStatus();
            scheduleReconnect();
        }
    }
    function schedulePolling() {
        clearPollers();
        digitalTimer = setInterval(() => {
            void pollDigital();
        }, config.plc.digitalPollIntervalMs);
        analogTimer = setInterval(() => {
            void pollAnalog();
        }, config.plc.analogPollIntervalMs);
    }
    function clearPollers() {
        if (digitalTimer) {
            clearInterval(digitalTimer);
            digitalTimer = null;
        }
        if (analogTimer) {
            clearInterval(analogTimer);
            analogTimer = null;
        }
    }
    function scheduleReconnect() {
        if (stopped || reconnectTimer)
            return;
        clearPollers();
        logger.debug({ inMs: config.plc.reconnectIntervalMs }, 'PLC reconnect scheduled');
        reconnectTimer = setTimeout(() => {
            reconnectTimer = null;
            void connectLoop();
        }, config.plc.reconnectIntervalMs);
    }
    function handleTransportFailure(source, err) {
        const wasOnline = store.get().connection.connected;
        emitError(source, err);
        if (!client.isConnected()) {
            if (wasOnline) {
                logger.warn('PLC went offline; pollers stopped, reconnect scheduled');
            }
            store.setDisconnected(err instanceof Error ? err.message : String(err));
            emitStatus();
            scheduleReconnect();
        }
    }
    async function pollDigital() {
        if (digitalBusy || !client.isConnected())
            return;
        digitalBusy = true;
        try {
            // Discrete inputs (FC2)
            const inputs = await client.readDiscreteInputs(registers_1.digitalInputRange.start + offset, registers_1.digitalInputRange.length);
            const inputValues = {};
            for (const reg of registers_1.digitalInputRegisters) {
                const idx = reg.address - registers_1.digitalInputRange.start;
                const value = inputs[idx];
                if (value !== undefined)
                    inputValues[reg.tag] = value;
            }
            store.setDigitalInputs(inputValues);
            // Coils / alarms (FC1)
            const coils = await client.readCoils(registers_1.alarmRange.start + offset, registers_1.alarmRange.length);
            const alarmValues = {};
            for (const reg of registers_1.alarmRegisters) {
                const idx = reg.address - registers_1.alarmRange.start;
                const value = coils[idx];
                if (value !== undefined)
                    alarmValues[reg.tag] = value;
            }
            store.setAlarms(alarmValues);
            emitData();
        }
        catch (err) {
            handleTransportFailure('digital-poll', err);
        }
        finally {
            digitalBusy = false;
        }
    }
    async function pollAnalog() {
        if (analogBusy || !client.isConnected())
            return;
        analogBusy = true;
        try {
            const regs = await client.readHoldingRegisters(registers_1.analogRange.start + offset, registers_1.analogRange.length);
            const analogValues = {};
            for (const reg of registers_1.analogRegisters) {
                const idx = reg.address - registers_1.analogRange.start;
                const raw = regs[idx];
                analogValues[reg.tag] = raw === undefined ? null : toSignedInt16(raw) * scale;
            }
            store.setAnalog(analogValues);
            emitData();
        }
        catch (err) {
            handleTransportFailure('analog-poll', err);
        }
        finally {
            analogBusy = false;
        }
    }
    return {
        start() {
            if (stopped)
                throw new Error('cannot restart a stopped PlcService');
            void connectLoop();
        },
        async stop() {
            stopped = true;
            clearPollers();
            if (reconnectTimer) {
                clearTimeout(reconnectTimer);
                reconnectTimer = null;
            }
            try {
                await client.close();
            }
            catch (err) {
                logger.warn({ err }, 'error closing modbus client');
            }
            store.setDisconnected('shutdown');
        },
        getState() {
            return store.get();
        },
        on(event, listener) {
            emitter.on(event, listener);
            return this;
        },
        off(event, listener) {
            emitter.off(event, listener);
            return this;
        },
    };
}
// Holding registers come back as uint16; Siemens analog values are typically
// signed (e.g. negative freezer temps). Reinterpret the raw 16-bit word.
function toSignedInt16(raw) {
    return raw > 0x7fff ? raw - 0x10000 : raw;
}
//# sourceMappingURL=plcService.js.map