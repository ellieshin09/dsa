export interface HanoiMove {
  disk: number;
  from: number;
  to: number;
}

/**
 * Computes the Frame-Stewart optimal minimum move count and optimal k split table
 * for n disks across r pegs (supporting r = 3, 4, 5).
 */
function buildFrameStewartTable(maxDisks: number, maxPegs: number): {
  dp: number[][];
  split: number[][];
} {
  const dp: number[][] = Array.from({ length: maxDisks + 1 }, () => Array(maxPegs + 1).fill(Infinity));
  const split: number[][] = Array.from({ length: maxDisks + 1 }, () => Array(maxPegs + 1).fill(1));

  for (let r = 2; r <= maxPegs; r++) {
    dp[0][r] = 0;
    if (maxDisks >= 1) dp[1][r] = 1;
  }

  for (let n = 1; n <= maxDisks; n++) {
    dp[n][3] = Math.pow(2, n) - 1;
    split[n][3] = Math.max(1, n - 1);
  }

  for (let r = 4; r <= maxPegs; r++) {
    for (let n = 2; n <= maxDisks; n++) {
      let best = Infinity;
      let bestK = 1;
      for (let k = 1; k < n; k++) {
        const cost = 2 * dp[k][r] + dp[n - k][r - 1];
        if (cost < best) {
          best = cost;
          bestK = k;
        }
      }
      dp[n][r] = best;
      split[n][r] = bestK;
    }
  }

  return { dp, split };
}

export function getOptimalHanoiMoveCount(disks: number, pegs: number): number {
  const { dp } = buildFrameStewartTable(disks, pegs);
  return dp[disks][pegs];
}

/**
 * Generates the exact optimal sequence of moves from Peg 0 to Peg (pegs - 1)
 * using classic recursion for 3 pegs and the Frame-Stewart algorithm for 4 or 5 pegs.
 */
export function solveTowerOfHanoi(disks: number, pegs: number): HanoiMove[] {
  const { split } = buildFrameStewartTable(disks, pegs);
  const moves: HanoiMove[] = [];

  // Disks array sorted from largest (bottom) to smallest (top): [disks, disks-1, ..., 1]
  const initialDisks = Array.from({ length: disks }, (_, i) => disks - i);
  const srcPeg = 0;
  const dstPeg = pegs - 1;
  const auxPegs = Array.from({ length: pegs - 2 }, (_, i) => i + 1);

  function moveThreePegs(diskList: number[], from: number, to: number, aux: number): void {
    const n = diskList.length;
    if (n === 0) return;
    if (n === 1) {
      moves.push({ disk: diskList[0], from, to });
      return;
    }
    const topPart = diskList.slice(1); // n-1 smaller disks
    const largest = diskList[0];
    moveThreePegs(topPart, from, aux, to);
    moves.push({ disk: largest, from, to });
    moveThreePegs(topPart, aux, to, from);
  }

  function moveFrameStewart(diskList: number[], from: number, to: number, others: number[]): void {
    const n = diskList.length;
    if (n === 0) return;
    if (n === 1) {
      moves.push({ disk: diskList[0], from, to });
      return;
    }

    const r = 2 + others.length;
    if (r === 3) {
      moveThreePegs(diskList, from, to, others[0]);
      return;
    }

    const k = split[n][r];
    // diskList is largest -> smallest. Top k smallest are at the end: slice(n - k)
    const bottomNMinusK = diskList.slice(0, n - k);
    const topK = diskList.slice(n - k);

    const aux = others[0];
    const remainingOthers = others.slice(1);

    // 1. Move top k smallest disks from `from` to `aux` using all r pegs
    moveFrameStewart(topK, from, aux, [to, ...remainingOthers]);

    // 2. Move bottom n-k largest disks from `from` to `to` using r-1 pegs (excluding `aux`)
    moveFrameStewart(bottomNMinusK, from, to, remainingOthers);

    // 3. Move top k smallest disks from `aux` to `to` using all r pegs
    moveFrameStewart(topK, aux, to, [from, ...remainingOthers]);
  }

  moveFrameStewart(initialDisks, srcPeg, dstPeg, auxPegs);
  return moves;
}

export function createInitialPegs(disks: number, pegs: number): number[][] {
  const board: number[][] = Array.from({ length: pegs }, () => []);
  // Bottom of peg is index 0 (largest disk), top of peg is last element (smallest disk = 1)
  board[0] = Array.from({ length: disks }, (_, i) => disks - i);
  return board;
}

export function isValidHanoiMove(board: number[][], fromPeg: number, toPeg: number): {
  valid: boolean;
  reason?: string;
} {
  if (fromPeg === toPeg) {
    return { valid: false, reason: 'Select a different destination peg.' };
  }
  const sourceStack = board[fromPeg];
  const targetStack = board[toPeg];

  if (!sourceStack || sourceStack.length === 0) {
    return { valid: false, reason: 'Source peg has no disks to move.' };
  }

  const movingDisk = sourceStack[sourceStack.length - 1];
  const topTargetDisk = targetStack[targetStack.length - 1];

  if (topTargetDisk !== undefined && movingDisk > topTargetDisk) {
    return {
      valid: false,
      reason: `Illegal Move: Cannot place Disk #${movingDisk} onto smaller Disk #${topTargetDisk}.`,
    };
  }

  return { valid: true };
}
