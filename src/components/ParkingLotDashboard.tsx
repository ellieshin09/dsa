import { FormEvent } from 'react';
import ParkingLotDiagram from './ParkingLotDiagram';

interface ParkingCar {
  id: number;
  entries: number;
  exits: number;
}

interface ParkingLogEntry {
  id: string;
  timestamp: string;
  type: string;
  message: string;
}

interface ParkingLotDashboardProps {
  structure: 'stack' | 'queue';
  capacity: number;
  slots: ParkingCar[];
  holding: ParkingCar[];
  departingCar: { car: ParkingCar; slotIndex: number; fromTemporary?: boolean } | null;
  activeCarId: number | null;
  carInput: string;
  setCarInput: (value: string) => void;
  animated: boolean;
  setAnimated: (value: boolean) => void;
  isAnimating: boolean;
  errorMsg: string | null;
  logs: ParkingLogEntry[];
  onEnter: (event: FormEvent) => void;
  onExit: () => void;
  onAutoFill: () => void;
  onClear: () => void;
  onSelectCar: (carId: number) => void;
}

export default function ParkingLotDashboard({
  structure,
  capacity,
  slots,
  holding,
  departingCar,
  activeCarId,
  carInput,
  setCarInput,
  animated,
  setAnimated,
  isAnimating,
  errorMsg,
  logs,
  onEnter,
  onExit,
  onAutoFill,
  onClear,
  onSelectCar,
}: ParkingLotDashboardProps) {
  const availableSlots = capacity - slots.length;

  return (
    <>
      <ParkingLotDiagram
        cars={slots}
        holding={holding}
        departingCar={departingCar}
        activeCarId={activeCarId}
        capacity={capacity}
        structure={structure}
        animateCars={animated}
        onSelectCar={onSelectCar}
      />

      <div className="mt-5 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <section className="lg:col-span-6" aria-label="Parking monitor">
          <h2 className="mb-2 text-center font-display text-base uppercase tracking-wide text-[#222]">
            PARKING MONITOR
          </h2>
          <form onSubmit={onEnter} className="space-y-2">
            <div className="grid grid-cols-[minmax(120px,0.8fr)_1fr] items-center gap-2 rounded-xl bg-[#454545] p-2">
              <label
                htmlFor={`${structure}-car-input`}
                className="px-1 font-display text-[11px] font-bold uppercase text-[#F5F0E6] sm:px-2 sm:text-xs"
              >
                CAR NUMBER
              </label>
              <input
                id={`${structure}-car-input`}
                type="text"
                inputMode="numeric"
                value={carInput}
                onChange={(event) => setCarInput(event.target.value)}
                placeholder="Enter car number"
                disabled={isAnimating}
                className="min-w-0 rounded-lg bg-[#D9D9D9] px-3 py-2 font-mono text-sm text-[#111] placeholder:text-[#777] focus:outline-none focus:ring-2 focus:ring-[#F05A24] disabled:opacity-60"
              />
            </div>

            <div className="grid grid-cols-[minmax(120px,0.8fr)_1fr] items-center gap-2 rounded-xl bg-[#454545] p-2">
              <span className="px-1 font-display text-[11px] font-bold uppercase text-[#F5F0E6] sm:px-2 sm:text-xs">
                AVAILABLE SLOTS
              </span>
              <span
                aria-live="polite"
                className="rounded-lg bg-[#D9D9D9] px-3 py-2 font-mono text-sm font-bold tabular-nums text-[#111]"
              >
                {availableSlots} <span className="font-normal text-[#555]">/ {capacity}</span>
              </span>
            </div>

            {errorMsg && (
              <div
                role="alert"
                className="rounded-md border border-[#D9531E] bg-[#F5F0E6] px-3 py-2 font-mono text-xs font-semibold text-[#B84315]"
              >
                {errorMsg}
              </div>
            )}

            <div className="flex justify-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isAnimating}
                className="rounded-lg bg-[#293253] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#1E2640] disabled:opacity-50"
              >
                ENTER CAR
              </button>
              <button
                type="button"
                onClick={onExit}
                disabled={isAnimating}
                className="rounded-lg border border-[#888] bg-[#D9D9D9] px-4 py-2 font-mono text-xs font-bold uppercase tracking-wide text-[#444] transition-colors hover:bg-white disabled:opacity-50"
              >
                EXIT CAR
              </button>
            </div>

            <details className="pt-1 font-mono text-[10px] text-[#555]">
              <summary className="cursor-pointer font-bold uppercase tracking-wide">
                More controls
              </summary>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={onAutoFill}
                  disabled={isAnimating}
                  className="rounded border border-[#293253] px-2 py-1 font-bold uppercase text-[#293253] hover:bg-[#293253] hover:text-white disabled:opacity-50"
                >
                  Auto-fill 10
                </button>
                <button
                  type="button"
                  onClick={onClear}
                  className="rounded border border-[#888] px-2 py-1 font-bold uppercase hover:bg-white"
                >
                  Clear
                </button>
                <span className="ml-auto">Playback:</span>
                <button
                  type="button"
                  onClick={() => setAnimated(true)}
                  disabled={isAnimating}
                  aria-pressed={animated}
                  className={`rounded px-2 py-1 font-bold uppercase ${animated ? 'bg-[#293253] text-white' : 'border border-[#888]'}`}
                >
                  Animated
                </button>
                <button
                  type="button"
                  onClick={() => setAnimated(false)}
                  disabled={isAnimating}
                  aria-pressed={!animated}
                  className={`rounded px-2 py-1 font-bold uppercase ${!animated ? 'bg-[#293253] text-white' : 'border border-[#888]'}`}
                >
                  Instant
                </button>
              </div>
            </details>
          </form>
        </section>

        <section className="rounded-xl bg-[#454545] p-2.5 lg:col-span-6" aria-label="Activity log">
          <div className="mb-2 flex items-center justify-between px-1 text-[#F5F0E6]">
            <h2 className="font-display text-xs font-bold uppercase tracking-wide">ACTIVITY LOG</h2>
            <span className="font-mono text-[10px] tabular-nums">{logs.length} EVENTS</span>
          </div>
          <div className="h-44 overflow-y-auto rounded-lg bg-[#D9D9D9] p-2.5 sm:h-48">
            {logs.length === 0 ? (
              <p className="font-mono text-xs text-[#666]">No activity yet.</p>
            ) : (
              <ol className="space-y-1.5">
                {logs.map((entry) => (
                  <li
                    key={entry.id}
                    className={`border-b border-[#B8B8B8] pb-1.5 font-mono text-[10px] leading-relaxed ${
                      entry.type === 'PERM_EXIT'
                        ? 'font-bold text-[#B84315]'
                        : entry.type === 'TEMP_EXIT'
                          ? 'font-semibold text-[#293253]'
                          : 'text-[#222]'
                    }`}
                  >
                    <span className="mr-1.5 text-[#666]">[{entry.timestamp}]</span>
                    {entry.message}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>
      </div>
    </>
  );
}
