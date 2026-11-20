export interface BinaryTreeNode {
  id: string;
  value: string;
  left: BinaryTreeNode | null;
  right: BinaryTreeNode | null;
}

export interface PositionedTreeNode {
  id: string;
  value: string;
  x: number;
  y: number;
  depth: number;
  isPlaceholder: boolean;
  parentId: string | null;
  side: 'left' | 'right' | 'root';
}

export interface TreeEdge {
  fromId: string;
  toId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isPlaceholder: boolean;
}

export interface TreeLayoutResult {
  nodes: PositionedTreeNode[];
  edges: TreeEdge[];
  width: number;
  height: number;
}

let nodeUidCounter = 0;
export function nextTreeNodeId(prefix = 'bt'): string {
  nodeUidCounter += 1;
  return `${prefix}-${nodeUidCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

export function cloneBinaryTree(node: BinaryTreeNode | null): BinaryTreeNode | null {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    left: cloneBinaryTree(node.left),
    right: cloneBinaryTree(node.right),
  };
}

export function countBinaryTreeNodes(node: BinaryTreeNode | null): number {
  if (!node) return 0;
  return 1 + countBinaryTreeNodes(node.left) + countBinaryTreeNodes(node.right);
}

export function listBinaryTreeNodes(
  node: BinaryTreeNode | null,
  path = 'Root'
): Array<{ id: string; value: string; path: string; hasLeft: boolean; hasRight: boolean }> {
  if (!node) return [];
  return [
    {
      id: node.id,
      value: node.value,
      path,
      hasLeft: node.left !== null,
      hasRight: node.right !== null,
    },
    ...listBinaryTreeNodes(node.left, `${path} → L`),
    ...listBinaryTreeNodes(node.right, `${path} → R`),
  ];
}

export function tokenizeBulkInput(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Builds a binary tree from level-order tokens (BFS queue), respecting maxNodes limit and emptySymbol.
 */
export function buildBinaryTreeFromLevelOrder(
  tokens: string[],
  emptySymbol: string,
  maxNodes: number
): { root: BinaryTreeNode | null; insertedCount: number; warning?: string } {
  const normEmpty = emptySymbol.trim().toLowerCase();
  if (tokens.length === 0) {
    return { root: null, insertedCount: 0, warning: 'Enter at least one node token.' };
  }

  const first = tokens[0];
  if (first.toLowerCase() === normEmpty) {
    return { root: null, insertedCount: 0, warning: `Root cannot be the empty symbol ("${emptySymbol}").` };
  }

  const root: BinaryTreeNode = {
    id: nextTreeNodeId(),
    value: first,
    left: null,
    right: null,
  };

  let insertedCount = 1;
  const queue: BinaryTreeNode[] = [root];
  let idx = 1;
  let truncated = false;

  while (queue.length > 0 && idx < tokens.length) {
    const current = queue.shift()!;

    // Left child
    if (idx < tokens.length) {
      const tok = tokens[idx++];
      if (tok.toLowerCase() !== normEmpty) {
        if (insertedCount < maxNodes) {
          const leftNode: BinaryTreeNode = {
            id: nextTreeNodeId(),
            value: tok,
            left: null,
            right: null,
          };
          current.left = leftNode;
          queue.push(leftNode);
          insertedCount += 1;
        } else {
          truncated = true;
        }
      }
    }

    // Right child
    if (idx < tokens.length) {
      const tok = tokens[idx++];
      if (tok.toLowerCase() !== normEmpty) {
        if (insertedCount < maxNodes) {
          const rightNode: BinaryTreeNode = {
            id: nextTreeNodeId(),
            value: tok,
            left: null,
            right: null,
          };
          current.right = rightNode;
          queue.push(rightNode);
          insertedCount += 1;
        } else {
          truncated = true;
        }
      }
    }
  }

  return {
    root,
    insertedCount,
    warning: truncated
      ? `Reached configured limit of ${maxNodes} non-empty nodes; extra tokens were omitted.`
      : undefined,
  };
}

export function insertChildIntoBinaryTree(
  root: BinaryTreeNode | null,
  parentId: string | null,
  side: 'left' | 'right',
  value: string,
  maxNodes: number
): { ok: true; root: BinaryTreeNode; newNodeId: string } | { ok: false; error: string } {
  const trimmed = value.trim();
  if (!trimmed) {
    return { ok: false, error: 'Node value cannot be empty.' };
  }

  if (!root) {
    const newRoot: BinaryTreeNode = {
      id: nextTreeNodeId(),
      value: trimmed,
      left: null,
      right: null,
    };
    return { ok: true, root: newRoot, newNodeId: newRoot.id };
  }

  const currentCount = countBinaryTreeNodes(root);
  const cloned = cloneBinaryTree(root)!;

  function findNode(node: BinaryTreeNode | null): BinaryTreeNode | null {
    if (!node) return null;
    if (node.id === parentId) return node;
    return findNode(node.left) || findNode(node.right);
  }

  const targetParent = findNode(cloned);
  if (!targetParent) {
    return { ok: false, error: 'Select a valid parent node on the tree canvas or dropdown.' };
  }

  const existingChild = side === 'left' ? targetParent.left : targetParent.right;
  if (existingChild) {
    existingChild.value = trimmed;
    return { ok: true, root: cloned, newNodeId: existingChild.id };
  }

  if (currentCount >= maxNodes) {
    return {
      ok: false,
      error: `Node limit reached (${currentCount}/${maxNodes}). Increase Total Nodes (N) to add more.`,
    };
  }

  const created: BinaryTreeNode = {
    id: nextTreeNodeId(),
    value: trimmed,
    left: null,
    right: null,
  };
  if (side === 'left') {
    targetParent.left = created;
  } else {
    targetParent.right = created;
  }

  return { ok: true, root: cloned, newNodeId: created.id };
}

export interface TraversalStep {
  id: string;
  value: string;
}

export function traverseInOrder(node: BinaryTreeNode | null): TraversalStep[] {
  if (!node) return [];
  return [
    ...traverseInOrder(node.left),
    { id: node.id, value: node.value },
    ...traverseInOrder(node.right),
  ];
}

export function traversePreOrder(node: BinaryTreeNode | null): TraversalStep[] {
  if (!node) return [];
  return [
    { id: node.id, value: node.value },
    ...traversePreOrder(node.left),
    ...traversePreOrder(node.right),
  ];
}

export function traversePostOrder(node: BinaryTreeNode | null): TraversalStep[] {
  if (!node) return [];
  return [
    ...traversePostOrder(node.left),
    ...traversePostOrder(node.right),
    { id: node.id, value: node.value },
  ];
}

/**
 * Computes non-overlapping SVG coordinates using in-order x-slot assignment.
 * Optionally renders ghosted empty/null placeholders for missing child slots of existing nodes.
 */
export function computeBinaryTreeLayout(
  root: BinaryTreeNode | null,
  options: { showPlaceholders?: boolean; emptySymbol?: string } = {}
): TreeLayoutResult {
  const { showPlaceholders = false, emptySymbol = 'null' } = options;

  if (!root) {
    return { nodes: [], edges: [], width: 760, height: 320 };
  }

  interface LayoutNode {
    id: string;
    value: string;
    depth: number;
    isPlaceholder: boolean;
    parentId: string | null;
    side: 'left' | 'right' | 'root';
    left: LayoutNode | null;
    right: LayoutNode | null;
    orderX: number;
  }

  function expand(
    node: BinaryTreeNode | null,
    depth: number,
    parentId: string | null,
    side: 'left' | 'right' | 'root'
  ): LayoutNode | null {
    if (!node) {
      if (showPlaceholders && parentId !== null) {
        return {
          id: `ghost-${parentId}-${side}`,
          value: emptySymbol,
          depth,
          isPlaceholder: true,
          parentId,
          side,
          left: null,
          right: null,
          orderX: 0,
        };
      }
      return null;
    }

    const hasAnyChild = node.left !== null || node.right !== null;
    const expandChildPlaceholders = showPlaceholders && hasAnyChild;

    return {
      id: node.id,
      value: node.value,
      depth,
      isPlaceholder: false,
      parentId,
      side,
      left:
        node.left || expandChildPlaceholders
          ? expand(node.left, depth + 1, node.id, 'left')
          : null,
      right:
        node.right || expandChildPlaceholders
          ? expand(node.right, depth + 1, node.id, 'right')
          : null,
      orderX: 0,
    };
  }

  const expandedRoot = expand(root, 0, null, 'root');
  if (!expandedRoot) {
    return { nodes: [], edges: [], width: 760, height: 320 };
  }

  let cursorX = 0;
  let maxDepth = 0;

  function assignInOrderX(n: LayoutNode | null): void {
    if (!n) return;
    assignInOrderX(n.left);
    n.orderX = cursorX;
    cursorX += 1;
    if (n.depth > maxDepth) maxDepth = n.depth;
    assignInOrderX(n.right);
  }

  assignInOrderX(expandedRoot);

  const count = Math.max(cursorX, 1);
  const horizontalGap = count > 12 ? 58 : count > 8 ? 68 : 84;
  const paddingX = 64;
  const paddingY = 54;
  const levelHeight = 84;

  const naturalWidth = Math.max(720, (count - 1) * horizontalGap + paddingX * 2);
  const height = Math.max(320, maxDepth * levelHeight + paddingY * 2 + 20);

  // Center tree horizontally when node count is small
  const spanWidth = (count - 1) * horizontalGap;
  const startX = (naturalWidth - spanWidth) / 2;

  const coordMap = new Map<string, PositionedTreeNode>();
  const nodes: PositionedTreeNode[] = [];
  const edges: TreeEdge[] = [];

  function collect(n: LayoutNode | null): void {
    if (!n) return;
    const pos: PositionedTreeNode = {
      id: n.id,
      value: n.value,
      x: startX + n.orderX * horizontalGap,
      y: paddingY + n.depth * levelHeight,
      depth: n.depth,
      isPlaceholder: n.isPlaceholder,
      parentId: n.parentId,
      side: n.side,
    };
    coordMap.set(n.id, pos);
    nodes.push(pos);
    collect(n.left);
    collect(n.right);
  }

  collect(expandedRoot);

  for (const node of nodes) {
    if (node.parentId) {
      const parent = coordMap.get(node.parentId);
      if (parent) {
        edges.push({
          fromId: parent.id,
          toId: node.id,
          x1: parent.x,
          y1: parent.y,
          x2: node.x,
          y2: node.y,
          isPlaceholder: node.isPlaceholder,
        });
      }
    }
  }

  return { nodes, edges, width: naturalWidth, height };
}
