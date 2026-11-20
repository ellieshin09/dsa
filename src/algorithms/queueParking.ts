export const QUEUE_MAX_CAPACITY = 10;

export interface QueueCar {
  id: number;
  entries: number;
  exits: number;
}

export interface QueueLogEntry {
  id: string;
  timestamp: string;
  type: 'ENTER' | 'TEMP_EXIT' | 'PERM_EXIT' | 'RE_ENTER' | 'SHIFT' | 'SYSTEM';
  message: string;
}

export interface QueueStepSnapshot {
  slots: QueueCar[];
  holdingLane: QueueCar[];
  activeCarId: number | null;
  log: Omit<QueueLogEntry, 'id' | 'timestamp'>;
}

export interface QueueOperationResult {
  ok: boolean;
  error?: string;
  steps: QueueStepSnapshot[];
  finalSlots: QueueCar[];
  departedCar?: QueueCar;
}

export function validateQueueCarInput(raw: string): { ok: true; carId: number } | { ok: false; error: string } {
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
 * Queue (FIFO) Enter Operation:
 * Enqueues a vehicle at the rear of the parking lot (next available slot).
 */
export function enterQueueCar(currentSlots: QueueCar[], carId: number): QueueOperationResult {
  if (currentSlots.length >= QUEUE_MAX_CAPACITY) {
    return {
      ok: false,
      error: `Parking lot is full (${QUEUE_MAX_CAPACITY}/${QUEUE_MAX_CAPACITY} slots occupied). Exit a car first.`,
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

  const nextCar: QueueCar = { id: carId, entries: 1, exits: 0 };
  const nextSlots = [...currentSlots, nextCar];
  const slotNum = nextSlots.length;

  return {
    ok: true,
    steps: [
      {
        slots: nextSlots.map((c) => ({ ...c })),
        holdingLane: [],
        activeCarId: carId,
        log: {
          type: 'ENTER',
          message: `[ENTER] Car #${carId} enqueued at rear Parking Slot #${slotNum} (Entries: 1, Exits: 0).`,
        },
      },
    ],
    finalSlots: nextSlots,
  };
}

/**
 * Queue (FIFO) Exit Operation:
 * - If target is at Slot #1 (front): exits permanently; trailing cars shift forward internally WITHOUT crossing boundary (no entry/exit increment).
 * - If target is an inner car (Slot #2..#10): all cars ahead exit the lot into holding lane (exits++),
 *   target exits permanently (exits++), ahead cars re-enter into slots #1..(targetIdx) (entries++),
 *   and trailing cars shift forward internally without leaving the lot.
 */
export function exitQueueCar(currentSlots: QueueCar[], carId: number): QueueOperationResult {
  const targetIdx = currentSlots.findIndex((c) => c.id === carId);
  if (targetIdx === -1) {
    return {
      ok: false,
      error: `Car #${carId} is not currently parked in the Queue lot.`,
      steps: [],
      finalSlots: currentSlots,
    };
  }

  const steps: QueueStepSnapshot[] = [];
  const aheadCars = currentSlots.slice(0, targetIdx).map((c) => ({ ...c }));
  const targetCar = { ...currentSlots[targetIdx] };
  const trailingCars = currentSlots.slice(targetIdx + 1).map((c) => ({ ...c }));

  // Case A: Front car leaves directly
  if (targetIdx === 0) {
    targetCar.exits += 1;

    steps.push({
      slots: trailingCars.map((c) => ({ ...c })),
      holdingLane: [],
      activeCarId: targetCar.id,
      log: {
        type: 'PERM_EXIT',
        message: `[PERM EXIT] Front Car #${targetCar.id} exited from Slot #1 (Total: ${targetCar.entries} entries, ${targetCar.exits} exits).`,
      },
    });

    if (trailingCars.length > 0) {
      steps.push({
        slots: trailingCars.map((c) => ({ ...c })),
        holdingLane: [],
        activeCarId: null,
        log: {
          type: 'SHIFT',
          message: `[SHIFT] ${trailingCars.length} trailing vehicle(s) moved forward internally (no boundary crossing).`,
        },
      });
    }

    return {
      ok: true,
      steps,
      finalSlots: trailingCars,
      departedCar: targetCar,
    };
  }

  // Case B: Inner car exits -> cars ahead must exit temporarily first
  const holdingLane: QueueCar[] = [];
  const remainingAhead = [...aheadCars];

  while (remainingAhead.length > 0) {
    const frontCar = remainingAhead.shift()!;
    frontCar.exits += 1;
    holdingLane.push({ ...frontCar });

    steps.push({
      slots: [...remainingAhead, targetCar, ...trailingCars].map((c) => ({ ...c })),
      holdingLane: holdingLane.map((c) => ({ ...c })),
      activeCarId: frontCar.id,
      log: {
        type: 'TEMP_EXIT',
        message: `[TEMP EXIT] Car #${frontCar.id} exited front to clear path for Car #${targetCar.id} (Exits: ${frontCar.exits}).`,
      },
    });
  }

  // Target car exits permanently
  targetCar.exits += 1;
  steps.push({
    slots: trailingCars.map((c) => ({ ...c })),
    holdingLane: holdingLane.map((c) => ({ ...c })),
    activeCarId: targetCar.id,
    log: {
      type: 'PERM_EXIT',
      message: `[PERM EXIT] Car #${targetCar.id} permanently left the lot (Total: ${targetCar.entries} entries, ${targetCar.exits} exits).`,
    },
  });

  // Ahead cars re-enter in original order into slots #1..#targetIdx
  const reEntered: QueueCar[] = [];
  while (holdingLane.length > 0) {
    const returning = holdingLane.shift()!;
    returning.entries += 1;
    reEntered.push({ ...returning });
    const assignedSlot = reEntered.length;

    steps.push({
      slots: [...reEntered, ...trailingCars].map((c) => ({ ...c })),
      holdingLane: holdingLane.map((c) => ({ ...c })),
      activeCarId: returning.id,
      log: {
        type: 'RE_ENTER',
        message: `[RE-ENTER] Car #${returning.id} returned to Slot #${assignedSlot} (Entries: ${returning.entries}, Exits: ${returning.exits}).`,
      },
    });
  }

  if (trailingCars.length > 0) {
    steps.push({
      slots: [...reEntered, ...trailingCars].map((c) => ({ ...c })),
      holdingLane: [],
      activeCarId: null,
      log: {
        type: 'SHIFT',
        message: `[SHIFT] Trailing vehicles shifted internally into Slots #${reEntered.length + 1}–#${reEntered.length + trailingCars.length}.`,
      },
    });
  }

  return {
    ok: true,
    steps,
    finalSlots: [...reEntered, ...trailingCars],
    departedCar: targetCar,
  };
}

export function createAutoFillQueue(): QueueCar[] {
  return Array.from({ length: QUEUE_MAX_CAPACITY }, (_, i) => ({
    id: i + 1,
    entries: 1,
    exits: 0,
  }));
}
