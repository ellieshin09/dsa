import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import CaseStudyHeader from '../components/CaseStudyHeader';
import TreeSvgCanvas from '../components/TreeSvgCanvas';
import {
  BinaryTreeNode,
  buildBinaryTreeFromLevelOrder,
  computeBinaryTreeLayout,
  countBinaryTreeNodes,
  insertChildIntoBinaryTree,
  listBinaryTreeNodes,
  tokenizeBulkInput,
  traverseInOrder,
  traversePostOrder,
  traversePreOrder,
} from '../algorithms/binaryTree';

type TraversalType = 'inorder' | 'preorder' | 'postorder';

export default function TreePage() {
  const [totalNodesLimit, setTotalNodesLimit] = useState(7);
  const [emptySymbol, setEmptySymbol] = useState('null');
  const [showPlaceholders, setShowPlaceholders] = useState(true);

  const [root, setRoot] = useState<BinaryTreeNode | null>(() => {
    const res = buildBinaryTreeFromLevelOrder(['+', '*', '-', 'A', 'B', '10', '2'], 'null', 7);
    return res.root;
  });

  const [bulkInput, setBulkInput] = useState('+ * - A B 10 2');
  const [singleValue, setSingleValue] = useState('');
  const [position, setPosition] = useState<'left' | 'right'>('left');
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'info'; message: string } | null>(null);

  // Traversal animation state
  const [activeTraversal, setActiveTraversal] = useState<TraversalType>('inorder');
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [visitedNodeIds, setVisitedNodeIds] = useState<Set<string>>(new Set());

  const timersRef = useRef<number[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  const nodeOptions = useMemo(() => listBinaryTreeNodes(root), [root]);
  const currentNodeCount = useMemo(() => countBinaryTreeNodes(root), [root]);

  useEffect(() => {
    if (!root) {
      setSelectedParentId(null);
      return;
    }
    if (!selectedParentId || !nodeOptions.some((n) => n.id === selectedParentId)) {
      setSelectedParentId(root.id);
    }
  }, [root, nodeOptions, selectedParentId]);

  const layout = useMemo(
    () =>
      computeBinaryTreeLayout(root, {
        showPlaceholders,
        emptySymbol: emptySymbol.trim() || 'null',
      }),
    [root, showPlaceholders, emptySymbol]
  );

  const inOrder = useMemo(() => traverseInOrder(root), [root]);
  const preOrder = useMemo(() => traversePreOrder(root), [root]);
  const postOrder = useMemo(() => traversePostOrder(root), [root]);

  const stopAnimation = () => {
    clearTimers();
    setIsAnimating(false);
    setActiveNodeId(null);
    setVisitedNodeIds(new Set());
  };

  const handleBulkGenerate = (e?: FormEvent) => {
    if (e) e.preventDefault();
    stopAnimation();
    const tokens = tokenizeBulkInput(bulkInput);
    const sym = emptySymbol.trim() || 'null';
    const result = buildBinaryTreeFromLevelOrder(tokens, sym, totalNodesLimit);

    if (!result.root) {
      setFeedback({
        type: 'error',
        message: result.warning ?? 'Could not construct tree from input.',
      });
      return;
    }

    setRoot(result.root);
    setSelectedParentId(result.root.id);
    setFeedback(
      result.warning
        ? { type: 'info', message: result.warning }
        : {
            type: 'info',
            message: `Constructed Binary Tree with ${result.insertedCount} node(s).`,
          }
    );
  };

  const handleInsertSingle = (e: FormEvent) => {
    e.preventDefault();
    stopAnimation();

    const result = insertChildIntoBinaryTree(
      root,
      selectedParentId,
      position,
      singleValue,
      totalNodesLimit
    );

    if (!result.ok) {
      setFeedback({ type: 'error', message: result.error });
      return;
    }

    setRoot(result.root);
    setSingleValue('');
    setFeedback({
      type: 'info',
      message: root
        ? `Inserted "${singleValue.trim()}" at ${position.toUpperCase()} branch.`
        : `Created Root node "${singleValue.trim()}".`,
    });
  };

  const handlePreset = (tokensStr: string, limit: number) => {
    stopAnimation();
    setTotalNodesLimit(limit);
    setBulkInput(tokensStr);
    const sym = emptySymbol.trim() || 'null';
    const res = buildBinaryTreeFromLevelOrder(tokenizeBulkInput(tokensStr), sym, limit);
    setRoot(res.root);
    setSelectedParentId(res.root ? res.root.id : null);
    setFeedback({ type: 'info', message: 'Loaded sample tree preset.' });
  };

  const handleAnimateTraversal = (kind: TraversalType) => {
    const sequence =
      kind === 'inorder' ? inOrder : kind === 'preorder' ? preOrder : postOrder;

    if (sequence.length === 0) return;

    clearTimers();
    setActiveTraversal(kind);
    setIsAnimating(true);
    setActiveNodeId(null);
    setVisitedNodeIds(new Set());

    const visited = new Set<string>();

    sequence.forEach((step, idx) => {
      const t = window.setTimeout(() => {
        visited.add(step.id);
        setActiveNodeId(step.id);
        setVisitedNodeIds(new Set(visited));

        if (idx === sequence.length - 1) {
          const endTimer = window.setTimeout(() => {
            setActiveNodeId(null);
            setIsAnimating(false);
          }, 550);
          timersRef.current.push(endTimer);
        }
      }, idx * 550);
      timersRef.current.push(t);
    });
  };

  const handleClear = () => {
    stopAnimation();
    setRoot(null);
    setSelectedParentId(null);
    setFeedback({ type: 'info', message: 'Tree cleared. Insert a Root node or use Bulk Nodes.' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <CaseStudyHeader
        kicker="CASE STUDY #3 • BINARY TREE TRAVERSAL"
        title="Binary Tree & Traversals Maker"
        description="Build custom binary trees using any token type—letters, numbers, or mathematical operators—and inspect In-Order (LTR), Pre-Order (TLR), and Post-Order (LRT) traversal sequences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Control Column */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Tree Configuration */}
          <div className="border border-[#121212] bg-[#D9D9D9] p-5 space-y-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#121212]">
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111]">
                TREE SETTINGS
              </h2>
              <span className="font-mono text-xs font-semibold text-[#1E2640] tabular-nums">
                NODES: {currentNodeCount} / {totalNodesLimit}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="bt-node-limit"
                  className="inline-block bg-[#1E2640] text-white font-mono text-[11px] font-semibold uppercase px-2 py-0.5 mb-1.5"
                >
                  TOTAL NODES (N)
                </label>
                <input
                  id="bt-node-limit"
                  type="number"
                  min={1}
                  max={31}
                  value={totalNodesLimit}
                  onChange={(e) => {
                    const val = Math.max(1, Math.min(31, Number(e.target.value) || 1));
                    setTotalNodesLimit(val);
                  }}
                  className="w-full bg-white border border-[#121212] px-2.5 py-2 font-mono text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                />
              </div>

              <div>
                <label
                  htmlFor="bt-empty-sym"
                  className="inline-block bg-[#1E2640] text-white font-mono text-[11px] font-semibold uppercase px-2 py-0.5 mb-1.5"
                >
                  EMPTY SYMBOL
                </label>
                <input
                  id="bt-empty-sym"
                  type="text"
                  value={emptySymbol}
                  onChange={(e) => setEmptySymbol(e.target.value)}
                  placeholder="null"
                  className="w-full bg-white border border-[#121212] px-2.5 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={showPlaceholders}
                onChange={(e) => setShowPlaceholders(e.target.checked)}
                className="w-4 h-4 accent-[#D9531E]"
              />
              <span className="font-mono text-xs font-semibold text-[#111111]">
                Show ghosted empty/null node slots
              </span>
            </label>
          </div>

          {/* Bulk Level-Order Builder */}
          <form
            onSubmit={handleBulkGenerate}
            className="border border-[#121212] bg-[#D9D9D9] p-5 space-y-3"
          >
            <label
              htmlFor="bt-bulk-input"
              className="inline-block bg-[#1E2640] text-white font-mono text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1"
            >
              BULK NODES (LEVEL-ORDER)
            </label>
            <textarea
              id="bt-bulk-input"
              rows={2}
              value={bulkInput}
              onChange={(e) => setBulkInput(e.target.value)}
              placeholder={`e.g. A B C D ${emptySymbol || 'null'} E F`}
              className="w-full bg-white border border-[#121212] px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
            />
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="submit"
                className="bg-[#121212] text-white font-mono text-xs font-bold uppercase tracking-wider py-2.5 px-3 hover:bg-[#D9531E] transition-colors cursor-pointer"
              >
                GENERATE
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="bg-[#F5F0E6] text-[#111111] border border-[#121212] font-mono text-xs font-semibold uppercase tracking-wider py-2.5 px-3 hover:bg-[#121212] hover:text-white transition-colors cursor-pointer"
              >
                CLEAR TREE
              </button>
            </div>

            <div className="pt-2 border-t border-[#9E9E9E] flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handlePreset('+ * - A B 10 2', 7)}
                className="font-mono text-[11px] underline text-[#1E2640] hover:text-[#D9531E] cursor-pointer"
              >
                Preset: Expression
              </button>
              <span className="text-[#6B6B6B]">·</span>
              <button
                type="button"
                onClick={() =>
                  handlePreset(`A B C D ${emptySymbol || 'null'} E G`, 7)
                }
                className="font-mono text-[11px] underline text-[#1E2640] hover:text-[#D9531E] cursor-pointer"
              >
                Preset: Letters w/ Null
              </button>
            </div>
          </form>

          {/* Interactive Single-Node Builder */}
          <form
            onSubmit={handleInsertSingle}
            className="border border-[#121212] bg-[#D9D9D9] p-5 space-y-3.5"
          >
            <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111] pb-2 border-b border-[#121212]">
              INTERACTIVE NODE BUILDER
            </h2>

            {root && (
              <div>
                <label
                  htmlFor="bt-parent-select"
                  className="inline-block bg-[#1E2640] text-white font-mono text-[11px] font-semibold uppercase px-2 py-0.5 mb-1.5"
                >
                  PARENT NODE (OR CLICK CANVAS)
                </label>
                <select
                  id="bt-parent-select"
                  value={selectedParentId ?? ''}
                  onChange={(e) => setSelectedParentId(e.target.value)}
                  className="w-full bg-white border border-[#121212] px-2.5 py-2 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
                >
                  {nodeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.value} ({opt.path})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label
                htmlFor="bt-single-value"
                className="inline-block bg-[#1E2640] text-white font-mono text-[11px] font-semibold uppercase px-2 py-0.5 mb-1.5"
              >
                INPUT NODE VALUE
              </label>
              <input
                id="bt-single-value"
                type="text"
                value={singleValue}
                onChange={(e) => setSingleValue(e.target.value)}
                placeholder="Letter, number, or operator (+, A+B)"
                className="w-full bg-white border border-[#121212] px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#D9531E]"
              />
            </div>

            {/* Burnt-Orange Highlight Box for Position of Node */}
            <div className="bg-[#D9531E] border border-[#121212] p-3">
              <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-white mb-2">
                POSITION OF NODE
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPosition('left')}
                  className={`py-2 font-mono text-xs font-bold uppercase border border-[#121212] cursor-pointer transition-colors ${
                    position === 'left'
                      ? 'bg-[#121212] text-white'
                      : 'bg-white text-[#111111] hover:bg-[#F5F0E6]'
                  }`}
                >
                  LEFT
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('right')}
                  className={`py-2 font-mono text-xs font-bold uppercase border border-[#121212] cursor-pointer transition-colors ${
                    position === 'right'
                      ? 'bg-[#121212] text-white'
                      : 'bg-white text-[#111111] hover:bg-[#F5F0E6]'
                  }`}
                >
                  RIGHT
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-[#121212] text-white font-mono text-xs font-bold uppercase tracking-wider py-3 px-4 hover:bg-[#1E2640] transition-colors cursor-pointer"
            >
              INSERT THE NODES
            </button>

            {feedback && (
              <div
                role="status"
                className={`border px-3 py-2 font-mono text-xs font-semibold ${
                  feedback.type === 'error'
                    ? 'bg-[#F5F0E6] border-[#D9531E] text-[#D9531E]'
                    : 'bg-[#F5F0E6] border-[#121212] text-[#111111]'
                }`}
              >
                {feedback.message}
              </div>
            )}
          </form>
        </aside>

        {/* Right Canvas & Orders Box */}
        <section className="lg:col-span-8 space-y-5" aria-label="Binary Tree Visualization">
          <TreeSvgCanvas
            layout={layout}
            activeNodeId={activeNodeId}
            visitedNodeIds={visitedNodeIds}
            selectedNodeId={selectedParentId}
            onSelectNode={(id) => setSelectedParentId(id)}
          />

          {/* ORDERS Output Box */}
          <div className="border border-[#121212] bg-[#D9D9D9]">
            <div className="bg-[#121212] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-mono text-xs font-bold uppercase tracking-widest">
                ORDERS
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                {(['inorder', 'preorder', 'postorder'] as TraversalType[]).map((kind) => (
                  <button
                    key={kind}
                    type="button"
                    disabled={!root}
                    onClick={() => handleAnimateTraversal(kind)}
                    className={`px-3 py-1.5 font-mono text-[11px] font-bold uppercase border cursor-pointer disabled:opacity-40 ${
                      isAnimating && activeTraversal === kind
                        ? 'bg-[#D9531E] border-[#D9531E] text-white'
                        : 'bg-[#1E2640] border-white/30 text-white hover:bg-[#D9531E]'
                    }`}
                  >
                    ANIMATE {kind === 'inorder' ? 'IN-ORDER' : kind === 'preorder' ? 'PRE-ORDER' : 'POST-ORDER'}
                  </button>
                ))}
                {isAnimating && (
                  <button
                    type="button"
                    onClick={stopAnimation}
                    className="px-2.5 py-1.5 bg-white text-[#111111] font-mono text-[11px] font-bold uppercase cursor-pointer"
                  >
                    STOP
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4 bg-[#F5F0E6]">
              {[
                { key: 'inorder', label: 'In-Order (LTR)', steps: inOrder },
                { key: 'preorder', label: 'Pre-Order (TLR)', steps: preOrder },
                { key: 'postorder', label: 'Post-Order (LRT)', steps: postOrder },
              ].map((row) => (
                <div key={row.key} className="border border-[#9E9E9E] bg-[#D9D9D9] p-3">
                  <p className="font-mono text-[11px] font-bold uppercase tracking-wider text-[#1E2640] mb-2">
                    {row.label}
                  </p>
                  {row.steps.length === 0 ? (
                    <p className="font-mono text-xs text-[#6B6B6B]">—</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {row.steps.map((step, i) => {
                        const highlighted =
                          activeTraversal === row.key && activeNodeId === step.id;
                        const visited =
                          activeTraversal === row.key && visitedNodeIds.has(step.id);
                        return (
                          <span
                            key={`${step.id}-${i}`}
                            className={`px-2 py-1 font-mono text-xs font-bold border ${
                              highlighted
                                ? 'bg-[#D9531E] text-white border-[#121212]'
                                : visited
                                  ? 'bg-[#1E2640] text-white border-[#121212]'
                                  : 'bg-white text-[#111111] border-[#121212]'
                            }`}
                          >
                            {step.value}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
