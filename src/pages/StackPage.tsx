import { FormEvent, useEffect, useRef, useState } from 'react';
import CaseStudyHeader from '../components/CaseStudyHeader';
import {
  STACK_MAX_CAPACITY,
  StackCar,
  StackLogEntry,
  createAutoFillStack,
  enterStackCar,
  exitStackCar,
  formatTimestamp,
  validateStackCarInput,
} from '../algorithms/stackParking';

export default function StackPage() {
  const [slots, setSlots] = useState<StackCar[]>([]);
  const [holdingBay, setHoldingBay] = useState<StackCar[]>([]);
  const [activeCarId, setActiveCarId] = useState<number | null>(null);
  const [carInput, setCarInput] = useState('');
  const [animated, setAnimated] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [logs, setLogs] = useState<StackLogEntry[]>([
    {
      id: 'init',
      timestamp: formatTimestamp(),
      type: 'SYSTEM',
      message: '[READY] Stack (LIFO) Parking Lot initialized. Enter cars in ascending order (e.g., #1, #2, #3).',
    },
  ]);

  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const appendLog = (entry: Omit<StackLogEntry, 'id' | 'timestamp'>) => {
    setLogs((prev) => [
      {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: formatTimestamp(),
      },
      ...prev,
    ]);
  };

  const playSteps = (
    steps: ReturnType<typeof enterStackCar>['steps'],
    finalSlots: StackCar[]
  ) => {
    if (!animated || steps.length <= 1) {
      setSlots(finalSlots);
      setHoldingBay([]);
      setActiveCarId(null);
      steps.forEach((s) => appendLog(s.log));
      return;
    }

    clearTimers();
    setIsAnimating(true);

    steps.forEach((step, idx) => {
      const timerId = window.setTimeout(() => {
        setSlots(step.slots);
        setHoldingBay(step.holdingBay);
        setActiveCarId(step.activeCarId);
        appendLog(step.log);

        if (idx === steps.length - 1) {
          const doneTimer = window.setTimeout(() => {
            setActiveCarId(null);
            setHoldingBay([]);
            setIsAnimating(false);
          }, 350);
          timersRef.current.push(doneTimer);
        }
      }, idx * 520);
      timersRef.current.push(timerId);
    });
  };

  const handleEnter = (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (isAnimating) return;

    const parsed = validateStackCarInput(carInput);
    if (!parsed.ok) {
      setErrorMsg(parsed.error);
      return;
    }

    const result = enterStackCar(slots, parsed.carId);
    if (!result.ok) {
      setErrorMsg(result.error ?? 'Unable to park vehicle.');
      return;
    }

    setErrorMsg(null);
    setCarInput('');
    playSteps(result.steps, result.finalSlots);
  };

  const handleExit = () => {
    if (isAnimating) return;

    const parsed = validateStackCarInput(carInput);
    if (!parsed.ok) {
      setErrorMsg(parsed.error);
      return;
    }

    const result = exitStackCar(slots, parsed.carId);
    if (!result.ok) {
      setErrorMsg(result.error ?? 'Unable to exit vehicle.');
      return;
    }

    setErrorMsg(null);
    setCarInput('');
    playSteps(result.steps, result.finalSlots);
  };

  const handleAutoFill = () => {
    if (isAnimating) return;
    clearTimers();
    const filled = createAutoFillStack();
    setSlots(filled);
    setHoldingBay([]);
    setActiveCarId(null);
    setErrorMsg(null);
    appendLog({
      type: 'SYSTEM',
      message: '[AUTO-FILL] Populated Slots #1–#10 with Cars #1 through #10 in ascending order.',
    });
  };

  const handleClear = () => {
    clearTimers();
    setIsAnimating(false);
    setSlots([]);
    setHoldingBay([]);
    setActiveCarId(null);
    setErrorMsg(null);
    setCarInput('');
    appendLog({
      type: 'SYSTEM',
      message: '[RESET] Cleared all 10 parking slots.',
    });
  };

  const availableSlots = STACK_MAX_CAPACITY - slots.length;
  const nextSuggestedId = slots.length > 0 ? slots[slots.length - 1].id + 1 : 1;

  const renderSlotCard = (slotIndex: number) => {
    const slotNumber = slotIndex + 1;
    const car = slots[slotIndex];
    const isActive = car && activeCarId === car.id;
    const isEntranceSlot = slotNumber === STACK_MAX_CAPACITY;

    return (
      <div
        key={slotNumber}
        onClick={() => {
          if (car && !isAnimating) {
            setCarInput(String(car.id));
            setErrorMsg(null);
          }
        }}
        className={`border p-3.5 transition-colors flex items-center justify-between gap-3 ${
          isActive
            ? 'bg-[#F5F0E6] border-[#D9531E] ring-2 ring-[#D9531E]'
            : car
              ? 'bg-[#D9D9D9] border-[#121212] cursor-pointer hover:bg-[#E4E1DA]'
              : 'bg-[#D9D9D9] border-[#9E9E9E]'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#111111] tabular-nums">
              PARKING SLOT #{slotNumber}
            </span>
            {slotNumber === 1 && (
              <span className="font-mono text-[10px] text-[#6B6B6B] uppercase">
                / BOTTOM
              </span>
            )}
            {isEntranceSlot && (
              <span className="font-mono text-[10px] text-[#D9531E] font-bold uppercase">
                / ENTRANCE
              </span>
            )}
          </div>

          {car ? (
            <div className="mt-1.5 flex items-center gap-3">
              <span className="bg-[#121212] text-white font-mono text-xs font-bold px-2.5 py-1 uppercase tabular-nums">
                CAR #{car.id}
              </span>
              <span className="font-mono text-xs text-[#111111] tabular-nums">
                Entries: <strong>{car.entries}</strong> · Exits: <strong>{car.exits}</strong>
              </span>
            </div>
          ) : (
            <p className="mt-1.5 font-mono text-xs font-semibold uppercase tracking-widest text-[#6B6B6B]">
              AVAILABLE
            </p>
          )}
        </div>

        <div className="font-mono text-[11px] text-[#6B6B6B] uppercase shrink-0">
          {car ? 'SELECT' : 'EMPTY'}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <CaseStudyHeader
        kicker="CASE STUDY #1 • STACK LIFO LOGIC"
        title="Parking Lot (Stack - Up to 10 Slots)"
        description="Single-opening LIFO stack garage. Vehicles must park in ascending numerical order from Slot #1 (bottom) to Slot #10 (entrance). Extracting an inner car temporarily pops all vehicles above it into a holding bay before restoring order."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 10-Slot Two-Column Parking Bay */}
        <section className="lg:col-span-7 space-y-5" aria-label="Stack Parking Slots">
          <div className="border border-[#121212] bg-[#ECE7DC] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#121212]">
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111]">
                GARAGE STACK BAY (10 SLOTS)
              </h2>
              <span className="font-mono text-xs text-[#1E2640] font-semibold tabular-nums">
                OCCUPIED: {slots.length} / {STACK_MAX_CAPACITY}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-3">
                {[0, 1, 2, 3, 4].map((idx) => renderSlotCard(idx))}
              </div>
              <div className="space-y-3">
                {[5, 6, 7, 8, 9].map((idx) => renderSlotCard(idx))}
              </div>
            </div>
          </div>

          {/* Temporary Holding Bay */}
          <div className="border border-[#121212] bg-[#D9D9D9] p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[#1E2640]">
                TEMPORARY HOLDING BAY (LIFO BUFFER)
              </h3>
              <span className="font-mono text-xs text-[#6B6B6B] tabular-nums">
                HELD: {holdingBay.length}
              </span>
            </div>
            {holdingBay.length === 0 ? (
              <p className="font-mono text-xs text-[#6B6B6B]">
                Empty — vehicles temporarily popped during an inner exit appear here in reverse stack order.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {holdingBay.map((car) => (
                  <div
                    key={car.id}
                    className="bg-[#1E2640] text-white px-3 py-1.5 font-mono text-xs font-bold tabular-nums border border-[#121212]"
                  >
                    CAR #{car.id} (E:{car.entries} / X:{car.exits})
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Right: Parking Monitor & Activity Log */}
        <aside className="lg:col-span-5 space-y-6">
          <div className="border border-[#121212] bg-[#D9D9D9] p-5">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#121212]">
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111]">
                PARKING MONITOR
              </h2>
              <div className="font-mono text-xs font-bold uppercase text-[#111111] tabular-nums">
                AVAILABLE SLOT: <span className="text-[#D9531E]">{availableSlots}</span>
              </div>
            </div>

            <form onSubmit={handleEnter} className="space-y-4">
              <div>
                <label
                  htmlFor="stack-car-input"
                  className="inline-block bg-[#1E2640] text-white font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 mb-1.5"
                >
                  CAR NUMBER
                </label>
                <div className="flex gap-2">
                  <input
                    id="stack-car-input"
                    type="text"
                    inputMode="numeric"
                    value={carInput}
                    onChange={(e) => {
                      setCarInput(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder={`Next ascending: ${nextSuggestedId}`}
                    disabled={isAnimating}
                    className="flex-1 bg-white border border-[#121212] px-3 py-2.5 font-mono text-sm text-[#111111] focus:outline-none focus:ring-2 focus:ring-[#D9531E] disabled:opacity-60"
                  />
                </div>
                <p className="mt-1.5 font-mono text-[11px] text-[#6B6B6B]">
                  Click any parked car slot to select it for exit, or enter a number &gt; top car.
                </p>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="bg-[#F5F0E6] border border-[#D9531E] px-3 py-2 font-mono text-xs font-semibold text-[#D9531E]"
                >
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="submit"
                  disabled={isAnimating}
                  className="bg-[#121212] text-white font-mono text-xs font-bold uppercase tracking-wider py-3 px-4 hover:bg-[#1E2640] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  ENTER
                </button>
                <button
                  type="button"
                  onClick={handleExit}
                  disabled={isAnimating}
                  className="bg-[#D9531E] text-white font-mono text-xs font-bold uppercase tracking-wider py-3 px-4 hover:bg-[#b84315] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  EXIT
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#9E9E9E]">
                <button
                  type="button"
                  onClick={handleAutoFill}
                  disabled={isAnimating}
                  className="bg-[#1E2640] text-white font-mono text-xs font-semibold uppercase tracking-wider py-2.5 px-3 hover:bg-[#121212] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  AUTO-FILL 10
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="bg-[#F5F0E6] text-[#111111] border border-[#121212] font-mono text-xs font-semibold uppercase tracking-wider py-2.5 px-3 hover:bg-[#121212] hover:text-white transition-colors cursor-pointer"
                >
                  CLEAR
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="font-mono text-[11px] font-semibold uppercase text-[#111111]">
                  PLAYBACK MODE
                </span>
                <div className="inline-flex border border-[#121212] bg-[#F5F0E6]">
                  <button
                    type="button"
                    onClick={() => setAnimated(true)}
                    disabled={isAnimating}
                    className={`px-2.5 py-1 font-mono text-[11px] font-semibold uppercase cursor-pointer ${
                      animated ? 'bg-[#121212] text-white' : 'text-[#111111]'
                    }`}
                  >
                    ANIMATED
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnimated(false)}
                    disabled={isAnimating}
                    className={`px-2.5 py-1 font-mono text-[11px] font-semibold uppercase cursor-pointer ${
                      !animated ? 'bg-[#121212] text-white' : 'text-[#111111]'
                    }`}
                  >
                    INSTANT
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Activity Log */}
          <div className="border border-[#121212] bg-[#D9D9D9]">
            <div className="bg-[#121212] text-white px-4 py-2.5 flex items-center justify-between">
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest">
                ACTIVITY LOG
              </h2>
              <span className="font-mono text-[11px] text-neutral-300 tabular-nums">
                {logs.length} EVENTS
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto divide-y divide-[#9E9E9E] bg-[#F5F0E6]">
              {logs.map((entry) => (
                <div key={entry.id} className="px-4 py-2.5 font-mono text-xs leading-relaxed">
                  <span className="text-[#6B6B6B] mr-2 tabular-nums">[{entry.timestamp}]</span>
                  <span
                    className={
                      entry.type === 'PERM_EXIT'
                        ? 'text-[#D9531E] font-bold'
                        : entry.type === 'TEMP_EXIT'
                          ? 'text-[#1E2640] font-semibold'
                          : 'text-[#111111]'
                    }
                  >
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
