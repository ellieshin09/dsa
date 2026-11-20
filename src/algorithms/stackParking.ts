export const STACK_MAX_CAPACITY = 10;

export interface StackCar {
  id: number;
  entries: number;
  exits: number;
}

export interface StackLogEntry {
  id: string;
  timestamp: string;
  type: 'ENTER' | 'TEMP_EXIT' | 'PERM_EXIT' | 'RE_ENTER' | 'SYSTEM';
  message: string;
}

export interface StackStepSnapshot {
  slots: StackCar[];
  holdingBay: StackCar[];
  activeCarId: number | null;
  log: Omit<StackLogEntry, 'id' | 'timestamp'>;
}

export interface StackOperationResult {
  ok: boolean;
  error?: string;
  steps: StackStepSnapshot[];
  finalSlots: StackCar[];
  departedCar?: StackCar;
}

export function formatTimestamp(date = new Date()): string {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function validateStackCarInput(raw: string): { ok: true; carId: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: 'Please enter a valid positive car number (e.g., 1, 2, 3).' };
  }
  if (!/^\d+$/.test(trimmed)) {
    return { ok: false, error: 'Car number must be a positive integer (digits only).' };
  }
  const carId = Number.parseInt(trimmed, 10);
  if (!Number.isSafeInteger(carId) || carId < 1) {
    return { ok: false, error: 'Car number must be at least 1.' };
  }
  return { ok: true, carId };
}

/**
 * Stack (LIFO) Enter Operation:
 * Enforces capacity (10), uniqueness, and strictly ascending order from Slot #1 (bottom) to Slot #10 (top).
 */
export function enterStackCar(currentSlots: StackCar[], carId: number): StackOperationResult {
  if (currentSlots.length >= STACK_MAX_CAPACITY) {
    return {
      ok: false,
      error: `Parking lot is full (${STACK_MAX_CAPACITY}/${STACK_MAX_CAPACITY} slots occupied). Exit a car first.`,
      steps: [],
      finalSlots: currentSlots,
    };
  }

  if (currentSlots.some((c) => c.id === carId)) {
    return {
      ok: false,
      error: `Car #${carId} is already parked inside the lot.`,
      steps: [],
      finalSlots: currentSlots,
    };
  }

  if (currentSlots.length > 0) {
    const topCar = currentSlots[currentSlots.length - 1];
    if (carId <= topCar.id) {
      return {
        ok: false,
        error: `Ascending order rule: Car #${carId} cannot stack above Car #${topCar.id}. Enter a car number > ${topCar.id}.`,
        steps: [],
        finalSlots: currentSlots,
      };
    }
  }

  const nextCar: StackCar = { id: carId, entries: 1, exits: 0 };
  const nextSlots = [...currentSlots, nextCar];
  const slotNum = nextSlots.length;

  return {
    ok: true,
    steps: [
      {
        slots: nextSlots.map((c) => ({ ...c })),
        holdingBay: [],
        activeCarId: carId,
        log: {
          type: 'ENTER',
          message: `[ENTER] Car #${carId} pushed into Parking Slot #${slotNum} (Entries: 1, Exits: 0).`,
        },
      },
    ],
    finalSlots: nextSlots,
  };
}

/**
 * Stack (LIFO) Exit Operation:
 * Pops every car stacked above the target car into a temporary holding bay (incrementing exits),
 * removes the target car permanently (incrementing its exits),
 * and pushes held cars back in reverse order (incrementing entries) to preserve ascending order.
 */
export function exitStackCar(currentSlots: StackCar[], carId: number): StackOperationResult {
  const targetIdx = currentSlots.findIndex((c) => c.id === carId);
  if (targetIdx === -1) {
    return {
      ok: false,
      error: `Car #${carId} is not currently parked in the Stack lot.`,
      steps: [],
      finalSlots: currentSlots,
    };
  }

  const workingSlots = currentSlots.map((c) => ({ ...c }));
  const holdingBay: StackCar[] = [];
  const steps: StackStepSnapshot[] = [];

  // 1. Pop vehicles stacked above the target car one by one into holding bay
  while (workingSlots.length - 1 > targetIdx) {
    const fromSlot = workingSlots.length;
    const popped = workingSlots.pop()!;
    popped.exits += 1;
    holdingBay.push({ ...popped });

    steps.push({
      slots: workingSlots.map((c) => ({ ...c })),
      holdingBay: holdingBay.map((c) => ({ ...c })),
      activeCarId: popped.id,
      log: {
        type: 'TEMP_EXIT',
        message: `[TEMP EXIT] Car #${popped.id} popped from Slot #${fromSlot} to holding bay (Exits: ${popped.exits}).`,
      },
    });
  }

  // 2. Target car exits permanently
  const targetSlotNum = workingSlots.length;
  const targetCar = workingSlots.pop()!;
  targetCar.exits += 1;

  steps.push({
    slots: workingSlots.map((c) => ({ ...c })),
    holdingBay: holdingBay.map((c) => ({ ...c })),
    activeCarId: targetCar.id,
    log: {
      type: 'PERM_EXIT',
      message: `[PERM EXIT] Car #${targetCar.id} left permanently from Slot #${targetSlotNum} (Total: ${targetCar.entries} entries, ${targetCar.exits} exits).`,
    },
  });

  // 3. Push temporarily popped vehicles back in reverse order (LIFO from holding bay)
  while (holdingBay.length > 0) {
    const returning = holdingBay.pop()!;
    returning.entries += 1;
    workingSlots.push({ ...returning });
    const newSlot = workingSlots.length;

    steps.push({
      slots: workingSlots.map((c) => ({ ...c })),
      holdingBay: holdingBay.map((c) => ({ ...c })),
      activeCarId: returning.id,
      log: {
        type: 'RE_ENTER',
        message: `[RE-ENTER] Car #${returning.id} returned to Slot #${newSlot} (Entries: ${returning.entries}, Exits: ${returning.exits}).`,
      },
    });
  }

  return {
    ok: true,
    steps,
    finalSlots: workingSlots,
    departedCar: targetCar,
  };
}

export function createAutoFillStack(): StackCar[] {
  return Array.from({ length: STACK_MAX_CAPACITY }, (_, i) => ({
    id: i + 1,
    entries: 1,
    exits: 0,
  }));
}
