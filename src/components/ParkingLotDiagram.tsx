import { LayoutGroup, motion } from 'motion/react';

interface ParkingCar {
  id: number;
  entries: number;
  exits: number;
}

interface ParkingLotDiagramProps {
  cars: ParkingCar[];
  holding: ParkingCar[];
  departingCar: { car: ParkingCar; slotIndex: number; fromTemporary?: boolean } | null;
  activeCarId: number | null;
  capacity: number;
  structure: 'stack' | 'queue';
  animateCars: boolean;
  onSelectCar: (carId: number) => void;
}

function CarToken({
  car,
  animate,
  compact = false,
  showId = true,
}: {
  car: ParkingCar;
  animate: boolean;
  compact?: boolean;
  showId?: boolean;
}) {
  return (
    <motion.span
      layoutId={`parking-car-${car.id}`}
      layout={animate}
      initial={false}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        layout: { type: 'spring', stiffness: 250, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 },
      }}
      className="flex shrink-0 flex-col items-center"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 88 48"
        className={compact ? 'h-6 w-10' : 'h-8 w-14 sm:h-9 sm:w-16'}
        fill="none"
      >
        <path d="M8 29 14 18q2-4 7-5l7-1h27l8 3 8 9 6 3q3 1 3 5v5H7v-5q0-2 1-3Z" fill="#FFC928" stroke="#171717" strokeWidth="2" />
        <path d="m22 16-5 10h18V15h-9q-2 0-4 1Z" fill="#293253" />
        <path d="M39 15v11h21l-7-9-5-2Z" fill="#293253" />
        <path d="M8 29h72v5H8z" fill="#171717" />
        <path d="M12 29h7v5h-7zm14 0h7v5h-7zm14 0h7v5h-7zm14 0h7v5h-7zm14 0h7v5h-7z" fill="#F5F0E6" />
        <path d="M34 9h20l-3 5H37z" fill="#F5F0E6" stroke="#171717" strokeWidth="1.5" />
        <text x="44" y="13" textAnchor="middle" fontSize="4" fontWeight="700" fill="#171717">TAXI</text>
        <circle cx="25" cy="36" r="8" fill="#171717" />
        <circle cx="25" cy="36" r="3" fill="#B8B8B8" />
        <circle cx="65" cy="36" r="8" fill="#171717" />
        <circle cx="65" cy="36" r="3" fill="#B8B8B8" />
        <path d="M75 26h3q2 0 3 2v3h-5Z" fill="#FFF2B8" />
      </svg>
      {showId && (
        <span className={`max-w-full truncate text-[8px] font-bold leading-tight sm:text-[9px] ${compact ? 'text-[#111]' : 'text-white'}`}>
          #{car.id}
        </span>
      )}
    </motion.span>
  );
}

export default function ParkingLotDiagram({
  cars,
  holding,
  departingCar,
  activeCarId,
  capacity,
  structure,
  animateCars,
  onSelectCar,
}: ParkingLotDiagramProps) {
  const rows = [
    Array.from({ length: Math.ceil(capacity / 2) }, (_, index) => index),
    Array.from({ length: Math.floor(capacity / 2) }, (_, index) => capacity - 1 - index),
  ];
  const isQueue = structure === 'queue';
  const enteringCar = animateCars
    ? cars.find((car) => car.id === activeCarId && car.entries === 1 && car.exits === 0)
    : undefined;
  const enteringSlot = enteringCar ? cars.findIndex((car) => car.id === enteringCar.id) + 1 : 0;
  const enteringTopRow = enteringSlot > 0 && enteringSlot <= 5;
  const targetColumn = enteringSlot > 0 && enteringSlot <= 5 ? enteringSlot - 1 : 10 - enteringSlot;
  const targetX = `${19 + (81 * (targetColumn + 0.5)) / 5}%`;
  const drivePoints: [number, number][] = enteringTopRow
    ? [
        [19, 75],
        [90, 75],
        [93, 74],
        [95, 70],
        [96, 63],
        [96, 50],
        [96, 37],
        [95, 30],
        [93, 26],
        [90, 25],
        [Number.parseFloat(targetX), 25],
      ]
    : [
        [19, 75],
        [Number.parseFloat(targetX), 75],
      ];
  const driveLength = drivePoints.slice(1).reduce((length, point, index) => {
    const previous = drivePoints[index];
    return length + Math.hypot(point[0] - previous[0], point[1] - previous[1]);
  }, 0);
  const driveTimes = drivePoints.map((point, index) => {
    const distance = drivePoints.slice(1, index + 1).reduce((length, nextPoint, segmentIndex) => {
      const previous = drivePoints[segmentIndex];
      return length + Math.hypot(nextPoint[0] - previous[0], nextPoint[1] - previous[1]);
    }, 0);
    return distance / driveLength;
  });
  const driveLeft = drivePoints.map(([x]) => `${x}%`);
  const driveTop = drivePoints.map(([, y]) => `${y}%`);
  const driveDuration = enteringTopRow
    ? (3.4 + (4 - targetColumn) * 0.15) / 1.5
    : (1 + targetColumn * 0.35) / 1.5;
  const departingSlot = departingCar ? departingCar.slotIndex + 1 : 0;
  const departingTopRow = departingSlot > 0 && departingSlot <= 5;
  const departingColumn = departingTopRow ? departingSlot - 1 : 10 - departingSlot;
  const departingX = 19 + (81 * (departingColumn + 0.5)) / 5;
  const departingY = departingTopRow ? 25 : 75;
  const departurePoints: [number, number][] = [
    [departingX, departingY],
    [19, departingY],
    [5, departingY],
    [-12, departingY],
  ];
  const departureLength = departurePoints.slice(1).reduce((length, point, index) => {
    const previous = departurePoints[index];
    return length + Math.hypot(point[0] - previous[0], point[1] - previous[1]);
  }, 0);
  const departureTimes = departurePoints.map((point, index) => {
    const distance = departurePoints.slice(1, index + 1).reduce((length, nextPoint, segmentIndex) => {
      const previous = departurePoints[segmentIndex];
      return length + Math.hypot(nextPoint[0] - previous[0], nextPoint[1] - previous[1]);
    }, 0);
    return distance / departureLength;
  });
  const departureLeft = departurePoints.map(([x]) => `${x}%`);
  const departureTop = departurePoints.map(([, y]) => `${y}%`);
  const departureDuration = (1.2 + departingColumn * 0.2) / 1.5;

  return (
    <LayoutGroup id={`parking-${structure}`}>
    <section aria-label={`${structure} parking lot`} className="space-y-2">
      <div className="relative overflow-hidden rounded-lg bg-[#D9D9D9] p-3 sm:p-5">
        <div
          aria-hidden="true"
          className="absolute inset-y-5 left-[19%] right-3 rounded-r-full bg-[#293253] sm:inset-y-6 sm:left-[19%] sm:right-4"
        />
        <div className="relative grid min-h-[148px] grid-cols-[19%_1fr] grid-rows-2 sm:min-h-[164px]">
          <div className="row-span-2 flex flex-col justify-around border-y border-[#B3B3B3] pr-2 text-center font-mono text-[10px] font-bold leading-tight text-[#293253] sm:text-xs">
            <div>
              <span className="block">{isQueue ? 'FRONT · EXIT' : 'STACK · EXIT'}</span>
              <span aria-hidden="true" className="mt-1 block text-lg leading-none">←</span>
            </div>
            <div>
              <span className="block">{isQueue ? 'REAR · ENTER' : 'STACK · ENTER'}</span>
              <span aria-hidden="true" className="mt-1 block text-lg leading-none">→</span>
            </div>
          </div>
          {rows.map((row, rowIndex) => (
            <div
              key={rowIndex}
              className={`grid grid-cols-5 ${rowIndex === 0 ? 'border-b border-[#CFD1D8]' : ''}`}
            >
              {row.map((slotIndex) => {
                const slotNumber = slotIndex + 1;
                const car = cars[slotIndex];
                const isActive = car?.id === activeCarId;

                return (
                  <button
                    key={slotNumber}
                    type="button"
                    onClick={() => car && onSelectCar(car.id)}
                    disabled={!car}
                    aria-label={`Slot ${slotNumber}${car ? `, car ${car.id}` : ', empty'}`}
                    className={`relative z-10 flex min-h-[72px] min-w-0 flex-col items-center justify-center border-l border-[#9DA3B5] px-1.5 py-1.5 text-center font-mono text-[9px] leading-tight text-white transition-colors sm:px-2.5 sm:py-2 sm:text-[10px] ${
                      car ? 'cursor-pointer hover:bg-white/10' : 'cursor-default'
                    } ${isActive ? 'bg-[#D9531E] ring-2 ring-inset ring-white' : ''}`}
                  >
                    <span className="absolute left-1 top-1 font-bold uppercase sm:left-2 sm:top-1.5">
                      SLOT {String(slotNumber).padStart(2, '0')}
                    </span>
                    <span className="flex w-full items-center justify-center">
                      {car && !(car.id === activeCarId && car.entries === 1 && car.exits === 0) ? (
                        <CarToken car={car} animate={animateCars} />
                      ) : car ? (
                        <span className="h-8 sm:h-9" aria-hidden="true" />
                      ) : (
                        <span className="font-mono text-[8px] font-semibold text-white/60 sm:text-[9px]">
                          EMPTY
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
          {enteringCar && (
            <motion.span
              aria-hidden="true"
              initial={{ left: '19%', top: '75%' }}
              animate={{ left: driveLeft, top: driveTop }}
              transition={{ duration: driveDuration, ease: 'linear', times: driveTimes }}
              className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
            >
              <CarToken car={enteringCar} animate />
            </motion.span>
          )}
          {animateCars && departingCar && !departingCar.fromTemporary && (
            <motion.span
              aria-hidden="true"
              initial={{ left: `${departingX}%`, top: `${departingY}%` }}
              animate={{ left: departureLeft, top: departureTop }}
              transition={{ duration: departureDuration, ease: 'linear', times: departureTimes }}
              className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2"
            >
              <CarToken car={departingCar.car} animate />
            </motion.span>
          )}
        </div>
        <div
          aria-hidden="true"
          className="absolute bottom-1/2 left-[19%] right-[9%] z-20 h-1 -translate-y-1/2 rounded-full bg-[#B3B3B3] sm:right-[10%]"
        />
      </div>

      <div className="relative ml-[8%] overflow-hidden rounded-b-xl border-2 border-t-0 border-[#F05A24] bg-[#E4E1DA] px-3 pb-2 pt-1.5 sm:ml-[8%] sm:px-4">
        <div className="flex items-center justify-between gap-2 font-mono text-[9px] font-bold uppercase text-[#293253] sm:text-[10px]">
          <span>TEMPORARY PARKING SLOTS</span>
          <span>{holding.length} / {capacity - 1} held</span>
        </div>
        <div className="mt-2 grid auto-cols-[112px] grid-flow-col gap-1.5 overflow-x-auto pb-1">
          {Array.from({ length: capacity - 1 }, (_, index) => {
            const car = holding[index];
            return (
              <div
                key={index}
                className="relative flex min-h-[58px] items-center justify-center gap-1 rounded-md border border-dashed border-[#F05A24] bg-[#F5F0E6] px-1.5 py-1 font-mono text-[10px] font-bold text-[#293253]"
              >
                {car ? (
                  <>
                    <CarToken car={car} animate={animateCars} compact showId={false} />
                    <span className="flex flex-col">
                      <span className="text-[8px] uppercase text-white/70">TEMP SLOT {index + 1}</span>
                      <span>CAR #{car.id}</span>
                    </span>
                  </>
                ) : departingCar?.fromTemporary && departingCar.slotIndex === index ? (
                  <motion.span
                    aria-hidden="true"
                    initial={{ x: 0 }}
                    animate={{ x: `-${(index + 1) * 300}%` }}
                    transition={{ duration: 0.8, ease: 'linear' }}
                    className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                  >
                    <CarToken car={departingCar.car} animate />
                  </motion.span>
                ) : (
                  <span className="text-[8px] font-semibold uppercase text-[#6B6B6B]">
                    TEMP SLOT {index + 1} · EMPTY
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
    </LayoutGroup>
  );
}
