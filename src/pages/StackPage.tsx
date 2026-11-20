import { FormEvent, useEffect, useRef, useState } from 'react';
import CaseStudyHeader from '../components/CaseStudyHeader';
import ParkingLotDashboard from '../components/ParkingLotDashboard';
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
  const [departingCar, setDepartingCar] = useState<{
    car: StackCar;
    slotIndex: number;
    fromTemporary?: boolean;
  } | null>(null);
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

  useEffect(() => () => clearTimers(), []);

  const appendLog = (entry: Omit<StackLogEntry, 'id' | 'timestamp'>) => {
    setLogs((previous) => [
      {
        ...entry,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: formatTimestamp(),
      },
      ...previous,
    ]);
  };

  const playSteps = (steps: ReturnType<typeof enterStackCar>['steps'], finalSlots: StackCar[]) => {
    if (!animated) {
      setSlots(finalSlots);
      setHoldingBay([]);
      setDepartingCar(null);
      setActiveCarId(null);
      steps.forEach((step) => appendLog(step.log));
      return;
    }

    const activeCarId = steps[steps.length - 1]?.activeCarId;
    const isNewArrival = finalSlots.some(
      (car) => car.id === activeCarId && car.entries === 1 && car.exits === 0
    );
    const arrivalDuration = isNewArrival
      ? finalSlots.length <= 5
        ? (4000 - (finalSlots.length - 1) * 150) / 1.5
        : (1000 + (10 - finalSlots.length) * 350) / 1.5
      : 350 / 1.5;

    clearTimers();
    setIsAnimating(true);
    let previousSlots = slots;
    let previousHolding = holdingBay;
    steps.forEach((step, index) => {
      const timerId = window.setTimeout(() => {
        const previousIndex = step.activeCarId === null
          ? -1
          : previousSlots.findIndex((car) => car.id === step.activeCarId);
        const previousTemporaryIndex = step.activeCarId === null
          ? -1
          : previousHolding.findIndex((car) => car.id === step.activeCarId);
        const activeCar = previousIndex >= 0
          ? previousSlots[previousIndex]
          : previousTemporaryIndex >= 0
            ? previousHolding[previousTemporaryIndex]
            : undefined;
        const stillParked = activeCar
          && (step.slots.some((car) => car.id === activeCar.id)
            || step.holdingBay.some((car) => car.id === activeCar.id));
        const movingOut = activeCar && !stillParked
          ? {
              car: activeCar,
              slotIndex: previousIndex >= 0 ? previousIndex : previousTemporaryIndex,
              fromTemporary: previousIndex < 0,
            }
          : null;
        previousSlots = step.slots;
        previousHolding = step.holdingBay;

        setDepartingCar(movingOut);
        setSlots(step.slots);
        setHoldingBay(step.holdingBay);
        setActiveCarId(step.activeCarId);
        appendLog(step.log);
        if (index === steps.length - 1) {
          const departureColumn = movingOut
            ? movingOut.slotIndex < 5
              ? movingOut.slotIndex
              : 9 - movingOut.slotIndex
            : 0;
          const finishDelay = movingOut
            ? movingOut.fromTemporary
              ? 800
              : (1200 + departureColumn * 200) / 1.5
            : steps.length === 1
              ? arrivalDuration
              : 350 / 1.5;
          const doneTimer = window.setTimeout(() => {
            setActiveCarId(null);
            setHoldingBay([]);
            setDepartingCar(null);
            setIsAnimating(false);
          }, finishDelay);
          timersRef.current.push(doneTimer);
        }
      }, index * 347);
      timersRef.current.push(timerId);
    });
  };

  const handleEnter = (event: FormEvent) => {
    event.preventDefault();
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
    setSlots(createAutoFillStack());
    setHoldingBay([]);
    setDepartingCar(null);
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
    setDepartingCar(null);
    setActiveCarId(null);
    setErrorMsg(null);
    setCarInput('');
    appendLog({ type: 'SYSTEM', message: '[RESET] Cleared all 10 parking slots.' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <CaseStudyHeader
        kicker="CASE STUDY #1 • STACK LIFO LOGIC"
        title="Parking Lot (Stack - Up to 10 Slots)"
      />
      <ParkingLotDashboard
        structure="stack"
        capacity={STACK_MAX_CAPACITY}
        slots={slots}
        holding={holdingBay}
        departingCar={departingCar}
        activeCarId={activeCarId}
        carInput={carInput}
        setCarInput={(value) => {
          setCarInput(value);
          if (errorMsg) setErrorMsg(null);
        }}
        animated={animated}
        setAnimated={setAnimated}
        isAnimating={isAnimating}
        errorMsg={errorMsg}
        logs={logs}
        onEnter={handleEnter}
        onExit={handleExit}
        onAutoFill={handleAutoFill}
        onClear={handleClear}
        onSelectCar={(carId) => {
          if (!isAnimating) {
            setCarInput(String(carId));
            setErrorMsg(null);
          }
        }}
      />
    </div>
  );
}
