"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateStore = void 0;
class StateStore {
    state;
    constructor(initial) {
        this.state = {
            connection: {
                connected: false,
                host: initial.host,
                port: initial.port,
                unitId: initial.unitId,
                lastConnectedAt: null,
                lastDisconnectedAt: null,
                lastError: null,
            },
            analog: {
                freezerTemperature: null,
                chamberTemperature: null,
                updatedAt: null,
            },
            digitalInputs: {
                freezerDoorToCooler: null,
                freezerLoadingDoor: null,
                unit1: null,
                unit2: null,
                danfoss1: null,
                danfoss2: null,
                updatedAt: null,
            },
            alarms: {
                freezerHighTemperature: null,
                doorForgotten: null,
                unitsAndDanfoss: null,
                chamberHighTemperature: null,
                updatedAt: null,
            },
        };
    }
    get() {
        return this.state;
    }
    setConnected() {
        const now = new Date().toISOString();
        this.state = {
            ...this.state,
            connection: {
                ...this.state.connection,
                connected: true,
                lastConnectedAt: now,
                lastError: null,
            },
        };
    }
    setDisconnected(error) {
        const now = new Date().toISOString();
        this.state = {
            ...this.state,
            connection: {
                ...this.state.connection,
                connected: false,
                lastDisconnectedAt: now,
                lastError: error ?? this.state.connection.lastError,
            },
        };
    }
    setLastError(error) {
        this.state = {
            ...this.state,
            connection: { ...this.state.connection, lastError: error },
        };
    }
    setAnalog(values) {
        this.state = {
            ...this.state,
            analog: { ...this.state.analog, ...values, updatedAt: new Date().toISOString() },
        };
    }
    setDigitalInputs(values) {
        this.state = {
            ...this.state,
            digitalInputs: {
                ...this.state.digitalInputs,
                ...values,
                updatedAt: new Date().toISOString(),
            },
        };
    }
    setAlarms(values) {
        this.state = {
            ...this.state,
            alarms: { ...this.state.alarms, ...values, updatedAt: new Date().toISOString() },
        };
    }
}
exports.StateStore = StateStore;
//# sourceMappingURL=stateStore.js.map