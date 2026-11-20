import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import CaseStudyHeader from '../components/CaseStudyHeader';
import TreeSvgCanvas from '../components/TreeSvgCanvas';
import {
  BSTNode,
  bstInOrderTraversal,
  bstToDisplayTree,
  generateRandomBSTNumbers,
  insertIntoBST,
  parseBulkNumbers,
  validateStrictNumber,
} from '../algorithms/binarySearchTree';
import { computeBinaryTreeLayout } from '../algorithms/binaryTree';

export default function SearchPage() {
  const [targetCount, setTargetCount] = useState(7);
  const [enteredNumbers, setEnteredNumbers] = useState<number[]>([]);
  const [root, setRoot] = useState<BSTNode | null>(null);

  const [singleInput, setSingleInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Animation states
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [visitedNodeIds, setVisitedNodeIds] = useState<Set<string>>(new Set());
  const [isAnimating, setIsAnimating] = useState(false);

  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const isLocked = enteredNumbers.length >= targetCount;

  const displayTree = useMemo(() => bstToDisplayTree(root), [root]);
  const layout = useMemo(
    () => computeBinaryTreeLayout(displayTree, { showPlaceholders: false }),
    [displayTree]
  );
  const sortedInOrder = useMemo(() => bstInOrderTraversal(root), [root]);

  const stopAnimation = () => {
    clearTimers();
    setIsAnimating(false);
    setActiveNodeId(null);
    setVisitedNodeIds(new Set());
  };

  const handleTargetCountChange = (nextN: number) => {
    const clamped = Math.max(1, Math.min(31, nextN));
    stopAnimation();
    setTargetCount(clamped);
    // If shrinking below already entered count, reset cleanly so count invariant stays exact
    if (enteredNumbers.length > clamped) {
      setRoot(null);
      setEnteredNumbers([]);
      setErrorMsg(`Node count changed to ${clamped}. Tree reset so you can enter exactly ${clamped} numbers.`);
    } else {
      setErrorMsg(null);
    }
  };

  const handleInsertSingle = (e: FormEvent) => {
    e.preventDefault();
    if (isLocked) {
      setErrorMsg(`Input locked: All ${targetCount} numbers have been entered.`);
      return;
    }

    const check = validateStrictNumber(singleInput);
    if (!check.ok) {
      setErrorMsg(check.error);
      return;
    }

    stopAnimation();
    const { root: nextRoot, insertedId } = insertIntoBST(root, check.value);
    setRoot(nextRoot);
    setEnteredNumbers((prev) => [...prev, check.value]);
    setSingleInput('');
    setErrorMsg(null);
    setActiveNodeId(insertedId);
  };

  const handleBulkInsert = () => {
    if (isLocked) {
      setErrorMsg(`Input locked: All ${targetCount} numbers have been entered.`);
      return;
    }

    const parsed = parseBulkNumbers(bulkInput);
    if (!parsed.ok) {
      setErrorMsg(parsed.error);
      return;
    }

    const remaining = targetCount - enteredNumbers.length;
    if (parsed.values.length > remaining) {
      setErrorMsg(
        `Count enforcement: You entered ${parsed.values.length} numbers, but only ${remaining} slot(s) remain out of ${targetCount}.`
      );
      return;
    }

    stopAnimation();
    let workingRoot = root;
    let lastId: string | null = null;
    for (const num of parsed.values) {
      const res = insertIntoBST(workingRoot, num);
      workingRoot = res.root;
      lastId = res.insertedId;
    }

    setRoot(workingRoot);
    setEnteredNumbers((prev) => [...prev, ...parsed.values]);
    setBulkInput('');
    setErrorMsg(null);
    setActiveNodeId(lastId);
  };

  const handleGenerate = () => {
    stopAnimation();

    if (bulkInput.trim().length > 0) {
      const parsed = parseBulkNumbers(bulkInput);
      if (!parsed.ok) {
        setErrorMsg(parsed.error);
        return;
      }
      if (parsed.values.length !== targetCount) {
        setErrorMsg(
          `Strict count enforcement: Expected exactly ${targetCount} numbers for GENERATE, received ${parsed.values.length}.`
        );
        return;
      }

      let freshRoot: BSTNode | null = null;
      for (const num of parsed.values) {
        freshRoot = insertIntoBST(freshRoot, num).root;
      }
      setRoot(freshRoot);
      setEnteredNumbers(parsed.values);
      setBulkInput('');
      setErrorMsg(null);
      return;
    }

    // Empty bulk input -> auto-generate N random distinct numbers
    const randomNums = generateRandomBSTNumbers(targetCount);
    let freshRoot: BSTNode | null = null;
    for (const num of randomNums) {
      freshRoot = insertIntoBST(freshRoot, num).root;
    }
    setRoot(freshRoot);
    setEnteredNumbers(randomNums);
    setErrorMsg(null);
  };

  const handleReset = () => {
    stopAnimation();
    setRoot(null);
    setEnteredNumbers([]);
    setSingleInput('');
    setBulkInput('');
    setErrorMsg(null);
  };

  const handleAnimateInOrder = () => {
    if (sortedInOrder.length === 0) return;
    clearTimers();
    setIsAnimating(true);
    setActiveNodeId(null);
    setVisitedNodeIds(new Set());

    const visited = new Set<string>();
    sortedInOrder.forEach((item, idx) => {
      const t = window.setTimeout(() => {
        visited.add(item.id);
        setActiveNodeId(item.id);
        setVisitedNodeIds(new Set(visited));

        if (idx === sortedInOrder.length - 1) {
          const endTimer = window.setTimeout(() => {
            setActiveNodeId(null);
            setIsAnimating(false);
          }, 500);
          timersRef.current.push(endTimer);
        }
      }, idx * 480);
      timersRef.current.push(t);
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <CaseStudyHeader
        kicker="CASE STUDY #4 • BINARY SEARCH TREE"
        title="Binary Search Tree Construction"
        description="Specify the exact number of nodes (N), then insert strictly numeric values. Left branches store strictly smaller values (<); right branches store equal or larger values (≥). Input locks once N numbers are entered."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Column */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Node Count & Lock Status */}
          <div className="border border-[#121212] bg-[#D9D9D9] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#121212]">
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111]">
                BST CONFIGURATION
              </h2>
              <span
                className={`font-mono text-xs font-bold tabular-nums ${
                  isLocked ? 'text-[#D9531E]' : 'text-[#1E2640]'
                }`}
              >
                {enteredNumbers.length} / {targetCount} ENTERED
              </span>
            </div>

            <div>
              <label
                htmlFor="bst-node-count"
                className="inline-block bg-[#1E2640] text-white font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 mb-1.5"
              >
                HOW MANY NODES (N)
              </label>
              <input
                id="bst-node-count"
                type="number"
                min={1}
                max={31}
                value={targetCount}
                onChange={(e) => handleTargetCountChange(Number(e.target.value) || 1)}
                className="w-full bg-white border border-[#121212] px-3 py-2 font-mono text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
              />
            </div>

            {/* Progress bar */}
            <div>
              <div className="w-full h-2.5 bg-[#F5F0E6] border border-[#121212] overflow-hidden">
                <div
                  className="h-full bg-[#D9531E] transition-all duration-200"
                  style={{ width: `${Math.min(100, (enteredNumbers.length / targetCount) * 100)}%` }}
                />
              </div>
              <p className="mt-1.5 font-mono text-[11px] font-semibold text-[#111111]">
                {isLocked
                  ? `LOCKED: All ${targetCount} numbers entered. Reset to build a new BST.`
                  : `${targetCount - enteredNumbers.length} more numeric value(s) required.`}
              </p>
            </div>
          </div>

          {/* Single Value Input */}
          <form
            onSubmit={handleInsertSingle}
            className="border border-[#121212] bg-[#D9D9D9] p-5 space-y-3"
          >
            <label
              htmlFor="bst-single-input"
              className="inline-block bg-[#1E2640] text-white font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1"
            >
              INPUT VALUE (NUMBERS ONLY)
            </label>
            <div className="flex gap-2">
              <input
                id="bst-single-input"
                type="text"
                value={singleInput}
                onChange={(e) => {
                  setSingleInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                disabled={isLocked}
                placeholder={isLocked ? 'INPUT LOCKED' : 'e.g. 42, -10, 3.5'}
                className="flex-1 bg-white border border-[#121212] px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E] disabled:bg-[#ECE7DC] disabled:text-[#6B6B6B]"
              />
              <button
                type="submit"
                disabled={isLocked}
                className="bg-[#121212] text-white font-mono text-xs font-bold uppercase tracking-wider px-4 hover:bg-[#D9531E] transition-colors disabled:opacity-45 cursor-pointer"
              >
                INSERT
              </button>
            </div>
          </form>

          {/* Bulk Values Input */}
          <div className="border border-[#121212] bg-[#D9D9D9] p-5 space-y-3">
            <label
              htmlFor="bst-bulk-input"
              className="inline-block bg-[#1E2640] text-white font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1"
            >
              INPUT BULK VALUES
            </label>
            <textarea
              id="bst-bulk-input"
              rows={2}
              value={bulkInput}
              onChange={(e) => {
                setBulkInput(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder={`Enter space/comma numbers (or leave blank & click GENERATE for ${targetCount} random)`}
              className="w-full bg-white border border-[#121212] px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
            />

            {errorMsg && (
              <div
                role="alert"
                className="bg-[#F5F0E6] border border-[#D9531E] px-3 py-2 font-mono text-xs font-semibold text-[#D9531E]"
              >
                {errorMsg}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleBulkInsert}
                disabled={isLocked}
                className="bg-[#121212] text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-3 hover:bg-[#1E2640] transition-colors disabled:opacity-45 cursor-pointer"
              >
                INSERT
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                className="bg-[#D9531E] text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-3 hover:bg-[#b84315] transition-colors cursor-pointer"
              >
                GENERATE
              </button>
            </div>

            <button
              type="button"
              onClick={handleReset}
              className="w-full bg-[#F5F0E6] text-[#111111] border border-[#121212] font-mono text-xs font-semibold uppercase tracking-wider py-2.5 px-3 hover:bg-[#121212] hover:text-white transition-colors cursor-pointer"
            >
              RESET TREE
            </button>
          </div>
        </aside>

        {/* Right Visualization & Sorted Output */}
        <section className="lg:col-span-8 space-y-5" aria-label="BST Visualization">
          <TreeSvgCanvas
            layout={layout}
            activeNodeId={activeNodeId}
            visitedNodeIds={visitedNodeIds}
            emptyTitle="NO BST NUMBERS INSERTED"
            emptySubtitle={`Set N (currently ${targetCount}) and insert numbers individually, in bulk, or click GENERATE to populate ${targetCount} random numbers.`}
          />

          {/* Insertion sequence & Sorted In-Order Output */}
          <div className="border border-[#121212] bg-[#D9D9D9]">
            <div className="bg-[#121212] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest">
                SORTED IN-ORDER OUTPUT (LEFT → ROOT → RIGHT)
              </h2>
              <button
                type="button"
                disabled={sortedInOrder.length === 0 || isAnimating}
                onClick={handleAnimateInOrder}
                className="px-3 py-1.5 bg-[#D9531E] text-white font-mono text-[11px] font-bold uppercase tracking-wider hover:bg-[#b84315] disabled:opacity-45 cursor-pointer"
              >
                {isAnimating ? 'ANIMATING...' : 'ANIMATE SORTED WALK'}
              </button>
            </div>

            <div className="p-5 bg-[#F5F0E6] space-y-4">
              <div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#6B6B6B] mb-2">
                  INSERTION ORDER ({enteredNumbers.length}/{targetCount})
                </p>
                {enteredNumbers.length === 0 ? (
                  <p className="font-mono text-xs text-[#6B6B6B]">No values entered yet.</p>
                ) : (
                  <p className="font-mono text-xs text-[#111111] tabular-nums">
                    {enteredNumbers.join(' → ')}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[#9E9E9E]">
                <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#1E2640] mb-2">
                  ASCENDING IN-ORDER TRAVERSAL
                </p>
                {sortedInOrder.length === 0 ? (
                  <p className="font-mono text-xs text-[#6B6B6B]">—</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {sortedInOrder.map((item) => {
                      const isActive = activeNodeId === item.id;
                      const isVisited = visitedNodeIds.has(item.id);
                      return (
                        <span
                          key={item.id}
                          className={`px-2.5 py-1 font-mono text-xs font-bold border tabular-nums ${
                            isActive
                              ? 'bg-[#D9531E] text-white border-[#121212]'
                              : isVisited
                                ? 'bg-[#1E2640] text-white border-[#121212]'
                                : 'bg-white text-[#111111] border-[#121212]'
                          }`}
                        >
                          {item.value}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
