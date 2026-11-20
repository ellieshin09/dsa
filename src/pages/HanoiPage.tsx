import { useEffect, useMemo, useRef, useState } from 'react';
import CaseStudyHeader from '../components/CaseStudyHeader';
import {
  createInitialPegs,
  getOptimalHanoiMoveCount,
  isValidHanoiMove,
  solveTowerOfHanoi,
} from '../algorithms/towerOfHanoi';

const PEG_LABELS = ['PEG A (START)', 'PEG B', 'PEG C', 'PEG D', 'PEG E'];

const DISK_COLORS = [
  '#D9531E', // Disk 1 (smallest)
  '#1E2640', // Disk 2
  '#2E5A44', // Disk 3
  '#8C3B2B', // Disk 4
  '#3A4A6B', // Disk 5
  '#A66E1E', // Disk 6
  '#4A4A4A', // Disk 7
  '#121212', // Disk 8 (largest)
];

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export default function HanoiPage() {
  const [diskCount, setDiskCount] = useState(4);
  const [pegCount, setPegCount] = useState(3);
  const [board, setBoard] = useState<number[][]>(() => createInitialPegs(4, 3));

  const [selectedPeg, setSelectedPeg] = useState<number | null>(null);
  const [dragFromPeg, setDragFromPeg] = useState<number | null>(null);
  const [shakePeg, setShakePeg] = useState<number | null>(null);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  const [movesTaken, setMovesTaken] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  // Auto-solve state
  const [isAutoSolving, setIsAutoSolving] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speedMs, setSpeedMs] = useState(420);
  const autoMovesRef = useRef<ReturnType<typeof solveTowerOfHanoi>>([]);
  const autoIndexRef = useRef(0);

  const optimalMoves = useMemo(
    () => getOptimalHanoiMoveCount(diskCount, pegCount),
    [diskCount, pegCount]
  );

  const targetPegIdx = pegCount - 1;
  const isVictory = board[targetPegIdx]?.length === diskCount;

  // Elapsed timer
  useEffect(() => {
    if (!timerActive || isVictory) return;
    const id = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerActive, isVictory]);

  // Auto-solve step scheduler
  useEffect(() => {
    if (!isAutoSolving || isPaused) return;

    const timer = window.setTimeout(() => {
      const idx = autoIndexRef.current;
      const move = autoMovesRef.current[idx];
      if (!move) {
        setIsAutoSolving(false);
        setTimerActive(false);
        return;
      }

      setBoard((prev) => {
        const next = prev.map((peg) => [...peg]);
        const popped = next[move.from].pop();
        if (popped !== undefined) {
          next[move.to].push(popped);
        }
        return next;
      });
      setMovesTaken((m) => m + 1);
      autoIndexRef.current = idx + 1;

      if (idx + 1 >= autoMovesRef.current.length) {
        setIsAutoSolving(false);
        setTimerActive(false);
      }
    }, speedMs);

    return () => window.clearTimeout(timer);
  }, [isAutoSolving, isPaused, movesTaken, speedMs]);

  const resetGame = (nextDisks = diskCount, nextPegs = pegCount) => {
    setIsAutoSolving(false);
    setIsPaused(false);
    autoMovesRef.current = [];
    autoIndexRef.current = 0;

    setBoard(createInitialPegs(nextDisks, nextPegs));
    setSelectedPeg(null);
    setDragFromPeg(null);
    setShakePeg(null);
    setWarningMsg(null);
    setMovesTaken(0);
    setElapsedSeconds(0);
    setTimerActive(false);
  };

  const triggerShake = (pegIdx: number, message: string) => {
    setShakePeg(pegIdx);
    setWarningMsg(message);
    window.setTimeout(() => {
      setShakePeg((cur) => (cur === pegIdx ? null : cur));
    }, 360);
  };

  const attemptMove = (fromPeg: number, toPeg: number) => {
    if (isAutoSolving || isVictory) return;

    if (fromPeg === toPeg) {
      setSelectedPeg(null);
      return;
    }

    const check = isValidHanoiMove(board, fromPeg, toPeg);
    if (!check.valid) {
      triggerShake(toPeg, check.reason ?? 'Illegal move.');
      setSelectedPeg(null);
      return;
    }

    const next = board.map((peg) => [...peg]);
    const disk = next[fromPeg].pop()!;
    next[toPeg].push(disk);

    setBoard(next);
    setMovesTaken((m) => m + 1);
    setSelectedPeg(null);
    setWarningMsg(null);
    if (!timerActive) setTimerActive(true);
  };

  const handlePegClick = (pegIdx: number) => {
    if (isAutoSolving || isVictory) return;

    if (selectedPeg === null) {
      if (board[pegIdx].length === 0) {
        setWarningMsg(`Peg ${String.fromCharCode(65 + pegIdx)} is empty. Select a peg with a disk.`);
        return;
      }
      setSelectedPeg(pegIdx);
      setWarningMsg(null);
      return;
    }

    attemptMove(selectedPeg, pegIdx);
  };

  const handleAutoSolve = () => {
    if (isAutoSolving) {
      setIsPaused((p) => !p);
      return;
    }

    // Start optimal solution cleanly from initial state
    const freshBoard = createInitialPegs(diskCount, pegCount);
    setBoard(freshBoard);
    setSelectedPeg(null);
    setWarningMsg(null);
    setMovesTaken(0);
    setElapsedSeconds(0);
    setTimerActive(true);

    autoMovesRef.current = solveTowerOfHanoi(diskCount, pegCount);
    autoIndexRef.current = 0;
    setIsPaused(false);
    setIsAutoSolving(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <CaseStudyHeader
        kicker="CASE STUDY #5 • RECURSIVE PUZZLE"
        title="Tower of Hanoi Interactive Solver"
        description="Click or drag the top disk of any peg to move it. Larger disks may never rest on smaller disks. Supports 3–8 disks across 3–5 pegs using classic recursion (3 pegs) and the Frame-Stewart algorithm (4–5 pegs)."
      />

      {/* Top Settings & Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6">
        {/* GAME SETTING Panel */}
        <section className="lg:col-span-8 border border-[#121212] bg-[#D9D9D9] p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-[#121212]">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111]">
              GAME SETTING
            </h2>
            <span className="font-mono text-[11px] font-semibold uppercase text-[#1E2640]">
              ALGORITHM: {pegCount === 3 ? 'CLASSIC RECURSION (2ⁿ - 1)' : `FRAME–STEWART (${pegCount} PEGS)`}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label
                htmlFor="hanoi-disks"
                className="inline-block bg-[#1E2640] text-white font-mono text-[11px] font-semibold uppercase px-2 py-0.5 mb-1.5"
              >
                DISK COUNT (3–8)
              </label>
              <select
                id="hanoi-disks"
                value={diskCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setDiskCount(val);
                  resetGame(val, pegCount);
                }}
                className="w-full bg-white border border-[#121212] px-3 py-2 font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
              >
                {[3, 4, 5, 6, 7, 8].map((n) => (
                  <option key={n} value={n}>
                    {n} Disks
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="hanoi-pegs"
                className="inline-block bg-[#1E2640] text-white font-mono text-[11px] font-semibold uppercase px-2 py-0.5 mb-1.5"
              >
                PEG COUNT (3–5)
              </label>
              <select
                id="hanoi-pegs"
                value={pegCount}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setPegCount(val);
                  resetGame(diskCount, val);
                }}
                className="w-full bg-white border border-[#121212] px-3 py-2 font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
              >
                {[3, 4, 5].map((p) => (
                  <option key={p} value={p}>
                    {p} Pegs
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="hanoi-speed"
                className="inline-block bg-[#1E2640] text-white font-mono text-[11px] font-semibold uppercase px-2 py-0.5 mb-1.5"
              >
                SOLVER SPEED
              </label>
              <select
                id="hanoi-speed"
                value={speedMs}
                onChange={(e) => setSpeedMs(Number(e.target.value))}
                className="w-full bg-white border border-[#121212] px-3 py-2 font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
              >
                <option value={700}>Slow (700ms)</option>
                <option value={420}>Normal (420ms)</option>
                <option value={160}>Fast (160ms)</option>
              </select>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#9E9E9E] flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleAutoSolve}
              className="bg-[#D9531E] text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-5 hover:bg-[#b84315] transition-colors cursor-pointer"
            >
              {isAutoSolving ? (isPaused ? 'RESUME SOLVE' : 'PAUSE SOLVE') : 'AUTO SOLVE'}
            </button>
            <button
              type="button"
              onClick={() => resetGame(diskCount, pegCount)}
              className="bg-[#121212] text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-5 hover:bg-[#1E2640] transition-colors cursor-pointer"
            >
              RESET THE SETTING
            </button>
          </div>
        </section>

        {/* STATS Panel */}
        <aside className="lg:col-span-4 border border-[#121212] bg-[#D9D9D9] p-5 flex flex-col justify-between">
          <div className="pb-3 mb-4 border-b border-[#121212]">
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111]">
              STATS:
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-[#F5F0E6] border border-[#121212] px-3.5 py-2.5">
              <span className="font-mono text-xs font-semibold uppercase text-[#111111]">
                MOVES TAKEN
              </span>
              <span className="font-mono text-base font-bold text-[#111111] tabular-nums">
                {movesTaken}
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#F5F0E6] border border-[#121212] px-3.5 py-2.5">
              <span className="font-mono text-xs font-semibold uppercase text-[#111111]">
                OPTIMAL MINIMUM MOVES
              </span>
              <span className="font-mono text-base font-bold text-[#D9531E] tabular-nums">
                {optimalMoves}
              </span>
            </div>

            <div className="flex items-center justify-between bg-[#F5F0E6] border border-[#121212] px-3.5 py-2.5">
              <span className="font-mono text-xs font-semibold uppercase text-[#111111]">
                ELAPSED TIME
              </span>
              <span className="font-mono text-base font-bold text-[#1E2640] tabular-nums">
                {formatElapsed(elapsedSeconds)}
              </span>
            </div>
          </div>
        </aside>
      </div>

      {/* Inline Warnings & Victory Banner */}
      {warningMsg && (
        <div
          role="alert"
          className="mb-5 bg-[#F5F0E6] border-2 border-[#D9531E] px-4 py-3 font-mono text-xs font-bold text-[#D9531E]"
        >
          {warningMsg}
        </div>
      )}

      {isVictory && (
        <div
          role="status"
          className="mb-5 bg-[#1E2640] text-white border border-[#121212] px-5 py-4 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-[#D9531E]">
              PUZZLE SOLVED
            </p>
            <p className="font-display text-lg sm:text-xl mt-0.5">
              All {diskCount} disks stacked on {PEG_LABELS[targetPegIdx]} in {movesTaken} moves
              {movesTaken === optimalMoves ? ' (Optimal Minimum!)' : ` (Optimal: ${optimalMoves})`}.
            </p>
          </div>
          <button
            type="button"
            onClick={() => resetGame(diskCount, pegCount)}
            className="bg-[#D9531E] text-white font-mono text-xs font-bold uppercase tracking-wider px-4 py-2.5 hover:bg-[#b84315] cursor-pointer"
          >
            PLAY AGAIN
          </button>
        </div>
      )}

      {/* Interactive Peg Stage */}
      <section
        aria-label="Tower of Hanoi Peg Stage"
        className="border border-[#121212] bg-[#D9D9D9] p-4 sm:p-6"
      >
        <div
          className={`grid gap-4 ${
            pegCount === 3
              ? 'grid-cols-1 md:grid-cols-3'
              : pegCount === 4
                ? 'grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-2 lg:grid-cols-5'
          }`}
        >
          {board.map((pegStack, pegIdx) => {
            const isSelectedSource = selectedPeg === pegIdx;
            const isTarget = pegIdx === targetPegIdx;
            const isShaking = shakePeg === pegIdx;
            const label =
              isTarget && pegIdx > 0
                ? `PEG ${String.fromCharCode(65 + pegIdx)} (TARGET)`
                : PEG_LABELS[pegIdx] ?? `PEG ${String.fromCharCode(65 + pegIdx)}`;

            return (
              <div
                key={pegIdx}
                onClick={() => handlePegClick(pegIdx)}
                onDragOver={(e) => {
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragFromPeg !== null) {
                    attemptMove(dragFromPeg, pegIdx);
                    setDragFromPeg(null);
                  }
                }}
                className={`border bg-[#F5F0E6] p-3 flex flex-col justify-between min-h-[290px] cursor-pointer transition-colors select-none ${
                  isShaking ? 'animate-shake border-[#D9531E] ring-2 ring-[#D9531E]' : ''
                } ${
                  isSelectedSource
                    ? 'border-[#D9531E] ring-2 ring-[#D9531E]'
                    : 'border-[#121212] hover:border-[#D9531E]'
                }`}
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#9E9E9E]">
                  <span
                    className={`font-mono text-[11px] font-bold uppercase tracking-wider ${
                      isTarget ? 'text-[#D9531E]' : 'text-[#111111]'
                    }`}
                  >
                    {label}
                  </span>
                  <span className="font-mono text-[11px] text-[#6B6B6B] tabular-nums">
                    {pegStack.length}
                  </span>
                </div>

                {/* Peg Visual Area */}
                <div className="relative flex-1 flex flex-col justify-end items-center pt-8 pb-2">
                  {/* Vertical Rod */}
                  <div
                    className="absolute bottom-2 w-2.5 bg-[#121212] rounded-t-sm"
                    style={{ height: '190px' }}
                    aria-hidden="true"
                  />

                  {/* Stacked Disks (bottom index 0 -> top last index) */}
                  <div className="relative z-10 w-full flex flex-col-reverse items-center gap-1">
                    {pegStack.map((diskSize, stackIdx) => {
                      const isTopDisk = stackIdx === pegStack.length - 1;
                      const isLifted = isSelectedSource && isTopDisk;
                      const widthPercent = 28 + (diskSize / diskCount) * 66;
                      const bg = DISK_COLORS[(diskSize - 1) % DISK_COLORS.length];

                      return (
                        <div
                          key={diskSize}
                          draggable={isTopDisk && !isAutoSolving && !isVictory}
                          onDragStart={(e) => {
                            e.stopPropagation();
                            setDragFromPeg(pegIdx);
                            setSelectedPeg(pegIdx);
                          }}
                          onDragEnd={() => setDragFromPeg(null)}
                          style={{
                            width: `${widthPercent}%`,
                            backgroundColor: bg,
                          }}
                          className={`h-6 border border-[#121212] flex items-center justify-center font-mono text-[11px] font-bold text-white transition-transform duration-150 ${
                            isLifted ? '-translate-y-4 ring-2 ring-[#D9531E]' : ''
                          } ${isTopDisk && !isAutoSolving ? 'cursor-grab active:cursor-grabbing' : ''}`}
                        >
                          D{diskSize}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Peg Base */}
                <div className="h-3 bg-[#121212] w-full" aria-hidden="true" />
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
