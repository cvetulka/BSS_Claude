"use strict";
// Register map per plc_full_documentation.md.
// Addresses are taken verbatim from the docs; an optional offset is applied
// at read time (see config.plc.addressOffset) to accommodate 0-based PLCs.
Object.defineProperty(exports, "__esModule", { value: true });
exports.alarmRange = exports.digitalInputRange = exports.analogRange = exports.alarmRegisters = exports.digitalInputRegisters = exports.analogRegisters = void 0;
exports.analogRegisters = [
    { tag: 'freezerTemperature', address: 512 },
    { tag: 'chamberTemperature', address: 513 },
];
exports.digitalInputRegisters = [
    { tag: 'freezerDoorToCooler', address: 1 },
    { tag: 'freezerLoadingDoor', address: 2 },
    { tag: 'unit1', address: 3 },
    { tag: 'unit2', address: 4 },
    { tag: 'danfoss1', address: 5 },
    { tag: 'danfoss2', address: 6 },
];
exports.alarmRegisters = [
    { tag: 'freezerHighTemperature', address: 8193 },
    { tag: 'doorForgotten', address: 8194 },
    { tag: 'unitsAndDanfoss', address: 8195 },
    { tag: 'chamberHighTemperature', address: 8196 },
];
// Convenience: contiguous read ranges. Computed once so the poller can issue
// a single Modbus request per group instead of N round-trips.
const range = (items) => {
    const sorted = [...items].sort((a, b) => a.address - b.address);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    if (!first || !last) {
        return { start: 0, length: 0 };
    }
    return { start: first.address, length: last.address - first.address + 1 };
};
exports.analogRange = range(exports.analogRegisters);
exports.digitalInputRange = range(exports.digitalInputRegisters);
exports.alarmRange = range(exports.alarmRegisters);
//# sourceMappingURL=registers.js.map