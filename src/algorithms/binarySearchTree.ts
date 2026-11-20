import { BinaryTreeNode, nextTreeNodeId } from './binaryTree';

export interface BSTNode {
  id: string;
  value: number;
  left: BSTNode | null;
  right: BSTNode | null;
}

export function validateStrictNumber(raw: string): { ok: true; value: number } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: 'Please enter a numeric value.' };
  }
  if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return {
      ok: false,
      error: `Invalid input "${trimmed}": Only numbers are accepted in Binary Search Tree mode (no letters or symbols).`,
    };
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num)) {
    return { ok: false, error: 'Number is out of finite range.' };
  }
  return { ok: true, value: num };
}

export function parseBulkNumbers(raw: string): { ok: true; values: number[] } | { ok: false; error: string } {
  const tokens = raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  if (tokens.length === 0) {
    return { ok: false, error: 'Enter at least one number separated by spaces or commas.' };
  }

  const parsed: number[] = [];
  for (const tok of tokens) {
    const check = validateStrictNumber(tok);
    if (!check.ok) {
      return { ok: false, error: check.error };
    }
    parsed.push(check.value);
  }
  return { ok: true, values: parsed };
}

export function cloneBST(node: BSTNode | null): BSTNode | null {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    left: cloneBST(node.left),
    right: cloneBST(node.right),
  };
}

/**
 * Standard BST insertion: value < node.value goes Left; value >= node.value goes Right.
 */
export function insertIntoBST(
  root: BSTNode | null,
  value: number
): { root: BSTNode; insertedId: string; pathIds: string[] } {
  const pathIds: string[] = [];
  const newNode: BSTNode = {
    id: nextTreeNodeId('bst'),
    value,
    left: null,
    right: null,
  };

  if (!root) {
    return { root: newNode, insertedId: newNode.id, pathIds: [newNode.id] };
  }

  const cloned = cloneBST(root)!;
  let current: BSTNode | null = cloned;

  while (current) {
    pathIds.push(current.id);
    if (value < current.value) {
      if (!current.left) {
        current.left = newNode;
        pathIds.push(newNode.id);
        break;
      }
      current = current.left;
    } else {
      if (!current.right) {
        current.right = newNode;
        pathIds.push(newNode.id);
        break;
      }
      current = current.right;
    }
  }

  return { root: cloned, insertedId: newNode.id, pathIds };
}

export function bstInOrderTraversal(node: BSTNode | null): Array<{ id: string; value: number }> {
  if (!node) return [];
  return [
    ...bstInOrderTraversal(node.left),
    { id: node.id, value: node.value },
    ...bstInOrderTraversal(node.right),
  ];
}

export function bstToDisplayTree(node: BSTNode | null): BinaryTreeNode | null {
  if (!node) return null;
  return {
    id: node.id,
    value: String(node.value),
    left: bstToDisplayTree(node.left),
    right: bstToDisplayTree(node.right),
  };
}

export function generateRandomBSTNumbers(count: number): number[] {
  const pool = new Set<number>();
  const maxPool = Math.max(99, count * 4);
  while (pool.size < count) {
    pool.add(Math.floor(Math.random() * maxPool) + 1);
  }
  return Array.from(pool);
}
