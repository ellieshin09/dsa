import Parking from './parking-reference';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  createInitialPegs,
  getOptimalHanoiMoveCount,
  isValidHanoiMove,
  solveTowerOfHanoi,
} from './algorithms/towerOfHanoi';
import type { HanoiMove } from './algorithms/towerOfHanoi';

type Notice = { text: string; error?: boolean };
type TreeNode = { value: string | number; left: TreeNode | null; right: TreeNode | null };
type TraversalOrder = 'in' | 'pre' | 'post';
type TraversalRow = { node: TreeNode; depth: number };
type PendingTreeNode = [TreeNode | null, number, boolean];
type TreeResult = {
  root: TreeNode | null;
  values: Record<TraversalOrder, Array<string | number>>;
};
type ExitStep = { cars: number[]; event: 'Exit' | 'Re-enter'; detail: string };
type MovingDisk = {
  disk: number;
  fromPeg: number;
  toPeg: number;
  startX: number;
  startY: number;
  moveX: number;
  moveY: number;
  liftY: number;
  width: number;
  height: number;
};
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { accent?: boolean };
type FieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  onEnter?: () => void;
};
type BulkFieldProps = Pick<FieldProps, 'label' | 'value' | 'onChange' | 'placeholder'>;

const positiveInteger = (raw: string) => {
  const value = Number(raw);
  return /^\d+$/.test(raw.trim()) && Number.isSafeInteger(value) && value > 0 ? value : null;
};

function Button({children, accent = false, ...props}: ButtonProps) {
  return <button type="button" className={'dsa-button' + (accent ? ' accent' : '')} {...props}>{children}</button>;
}

function Feedback({notice, fallback = ''}: { notice: Notice | null; fallback?: string }) {
  return <p role="status" className={'dsa-feedback' + (notice?.error ? ' error' : '')}>{notice?.text || fallback}</p>;
}

function Field({label, value, onChange, placeholder, inputMode, onEnter}: FieldProps) {
  return <label className="dsa-form-row">
    <span className="dsa-label">{label}</span>
    <input className="dsa-input" value={value} placeholder={placeholder} inputMode={inputMode}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={onEnter ? (event) => { if (event.key === 'Enter') { event.preventDefault(); onEnter(); } } : undefined} />
  </label>;
}

function BulkField({label, value, onChange, placeholder}: BulkFieldProps) {
  const id = useId();
  return <>
    <label className="dsa-label" htmlFor={id}>{label}</label>
    <textarea id={id} className="dsa-bulk" rows={1} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
  </>;
}

function parkingExitSteps(cars: number[], target: number, isStack: boolean): ExitStep[] {
  const index = cars.indexOf(target);
  const temporarilyOut = isStack ? cars.slice(index + 1).reverse() : cars.slice(0, index);
  let parked = [...cars];
  const leaving = [...temporarilyOut, target];
  const steps: ExitStep[] = leaving.map((car): ExitStep => {
    parked = isStack ? parked.slice(0, -1) : parked.slice(1);
    return {cars:parked, event:'Exit', detail:'Car #' + car + (car === target ? ' left the lot' : ' moved out temporarily')};
  });
  const returning = isStack ? temporarilyOut.filter((car) => car !== target).reverse() : temporarilyOut;
  for (const car of returning) {
    parked = [...parked, car];
    steps.push({cars:parked, event:'Re-enter', detail:'Car #' + car + ' returned'});
  }
  return steps;
}


const styles = "\n@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Noto+Serif+Gujarati:wght@500;700&display=swap');\n.dsa { --paper:#f3eee3; --panel:#d9d9d9; --navy:#293152; --accent:#d9541e; --dark:#444; color:#111; width:100%; min-height:100%; font:500 18px/1.4 'Noto Serif Gujarati',Arial,sans-serif; }\n.dsa *, .dsa *::before, .dsa *::after { box-sizing:border-box; }\n.dsa button, .dsa input, .dsa textarea { font:inherit; }\n.dsa h2, .dsa h3, .dsa p { margin:0; }\n.dsa .dsa-label, .dsa .dsa-button, .dsa .dsa-events li strong, .dsa .dsa-peg-label { font:400 24px/1.15 'Bebas Neue','Arial Narrow',sans-serif; letter-spacing:.045em; }\n.dsa .dsa-label { display:block; color:var(--navy); }\n.dsa .dsa-button { min-height:44px; min-width:154px; padding:7px 14px; border:1px solid transparent; border-radius:15px; color:var(--paper); background:var(--navy); cursor:pointer; white-space:nowrap; }\n.dsa .dsa-button.accent { background:var(--accent); color:#111; }\n.dsa .dsa-button:disabled { border-color:var(--dark); background:var(--panel); color:var(--dark); cursor:default; }\n.dsa :is(button,input,textarea):focus-visible { outline:3px solid var(--accent); outline-offset:3px; }\n.dsa .dsa-actions { display:flex; flex-wrap:wrap; gap:14px; align-items:center; }\n.dsa .dsa-input, .dsa .dsa-value, .dsa .dsa-bulk { min-width:0; width:100%; padding:6px 12px; border:1px solid var(--navy); border-radius:10px; background:var(--paper); color:#111; }\n.dsa .dsa-input, .dsa .dsa-value { height:42px; }\n.dsa .dsa-value { display:flex; align-items:center; }\n.dsa .dsa-bulk { resize:vertical; min-height:52px; max-height:144px; border-color:var(--accent); }\n.dsa .dsa-feedback { min-height:30px; overflow-wrap:anywhere; }\n.dsa .dsa-feedback.error { color:#9a2d0c; font-weight:700; }\n.dsa .dsa-monitor { min-width:0; }\n.dsa .dsa-monitor h2, .dsa .dsa-log h2 { font-size:25px; font-weight:700; }\n.dsa .dsa-monitor h2 { margin-bottom:12px; text-align:center; }\n.dsa .dsa-control, .dsa .dsa-log { display:grid; gap:10px; background:var(--dark); color:var(--paper); border-radius:15px; padding:16px; }\n.dsa .dsa-control .dsa-actions { justify-content:center; }\n.dsa .dsa-control .dsa-feedback { font-size:16px; }\n.dsa .dsa-control .dsa-feedback.error { color:#ffd1ba; }\n.dsa .dsa-monitor-row { display:grid; align-items:center; grid-template-columns:minmax(115px,1fr) minmax(100px,210px); gap:12px; font-size:22px; font-weight:700; }\n.dsa .dsa-monitor-row :is(input,output) { font-size:18px; font-weight:500; }\n.dsa .dsa-log { grid-template-rows:36px minmax(0,1fr); min-height:0; }\n.dsa .dsa-log-title { display:flex; justify-content:space-between; align-items:center; }\n.dsa .dsa-log-title .dsa-label { color:var(--paper); }\n.dsa .dsa-events { overflow:auto; margin:0; padding:10px; list-style:none; border-radius:11px; background:var(--panel); color:#111; }\n.dsa .dsa-events li { display:grid; grid-template-columns:88px minmax(0,1fr); align-items:start; padding:3px 0; font-size:17px; }\n.dsa .dsa-events li strong { color:var(--navy); font-size:19px; }\n.dsa .dsa-stack { display:grid; grid-template-columns:minmax(0,571fr) clamp(14px,3.68vw,53px) 2px clamp(16px,6.87vw,99px) minmax(0,496fr); align-items:start; padding:18px 8.89% 0 6.32%; }\n.dsa .dsa-stack .dsa-lane-divider { grid-column:3; align-self:stretch; margin:28px 0 58px; background:var(--accent); }\n.dsa .dsa-stack .dsa-parking-controls { grid-column:5; padding-top:8px; }\n.dsa .dsa-stack .dsa-log { height:330px; margin-top:21px; }\n.dsa .dsa-queue { padding:25px 2.15% 0; }\n.dsa .dsa-queue .dsa-parking-controls { margin:42px 8.7% 0; display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); align-items:start; gap:clamp(20px,7.56vw,109px); }\n.dsa .dsa-queue .dsa-log { height:340px; }\n.dsa .dsa-workspace { display:grid; align-items:start; }\n.dsa .dsa-tree { padding:51px 4.17% 0 5.35%; grid-template-columns:minmax(0,496fr) minmax(0,781fr); gap:26px; }\n.dsa .dsa-search { margin:25px 4.58% 0 6.53%; padding:35px 44px; grid-template-columns:minmax(0,460fr) minmax(0,671fr); gap:56px; min-height:665px; border-radius:15px; background:var(--panel); }\n.dsa .dsa-hanoi { padding:98px 4.17% 0 5.21%; grid-template-columns:minmax(0,496fr) minmax(0,781fr); gap:28px; }\n.dsa .dsa-panel { background:var(--panel); border-radius:15px; padding:26px; min-width:0; }\n.dsa .dsa-tree .dsa-panel { min-height:641px; }\n.dsa .dsa-form { display:grid; gap:11px; align-content:start; min-width:0; }\n.dsa .dsa-form-row { display:grid; grid-template-columns:minmax(120px,180px) minmax(90px,210px); gap:14px; align-items:center; }\n.dsa .dsa-form-row span { background:var(--navy); color:var(--paper); padding:7px 10px; min-height:42px; display:flex; align-items:center; }\n.dsa .dsa-help { font-size:17px; color:var(--dark); }\n.dsa .dsa-rule { width:100%; height:2px; border:0; margin:0; background:var(--accent); }\n.dsa .dsa-results { display:grid; gap:29px; align-content:start; }\n.dsa .dsa-diagram { position:relative; overflow:auto; display:grid; place-items:center; width:100%; height:480px; border:1px solid var(--navy); }\n.dsa .dsa-graph { position:relative; margin:auto; min-width:100%; min-height:100%; }\n.dsa .dsa-graph svg { position:absolute; inset:0; }\n.dsa .dsa-graph-node { display:flex; justify-content:center; align-items:center; position:absolute; transform:translate(-50%,-50%); width:90px; height:46px; padding:5px; background:var(--navy); border-radius:12px; color:white; text-align:center; overflow:hidden; }\n.dsa .dsa-graph-node span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }\n.dsa .dsa-traversals { display:grid; grid-template-columns:repeat(var(--outputs,1),minmax(0,1fr)); border:1px solid var(--accent); min-height:86px; }\n.dsa .dsa-traversals div { padding:10px 12px; min-width:0; }\n.dsa .dsa-traversals div + div { border-left:1px solid var(--accent); }\n.dsa .dsa-traversals strong { font-size:17px; }\n.dsa .dsa-traversals p { margin-top:3px; overflow-wrap:anywhere; max-height:90px; overflow:auto; }\n.dsa .dsa-hanoi .dsa-form { margin-top:14px; min-height:523px; }\n.dsa .dsa-hanoi .dsa-title-bar { padding:9px; text-align:center; color:var(--paper); background:#000; }\n.dsa .dsa-hanoi .dsa-rule { background:var(--paper); }\n.dsa .dsa-stats { border-radius:15px; background:var(--paper); padding:10px 14px; min-height:102px; }\n.dsa .dsa-hanoi-board { min-height:568px; padding:39px 29px 30px; }\n.dsa .dsa-pegs-wrap { border:1px solid var(--navy); min-height:494px; padding:30px 18px 24px; text-align:center; }\n.dsa .dsa-pegs { display:grid; grid-template-columns:repeat(var(--peg-count),minmax(0,1fr)); align-items:end; gap:12px; height:319px; }\n.dsa .dsa-peg { position:relative; min-height:263px; min-width:0; width:100%; border:2px solid transparent; border-radius:8px; color:var(--navy); padding:0; background:transparent; cursor:pointer; }\n.dsa .dsa-peg:disabled { cursor:default; }\n.dsa .dsa-stem { width:4px; height:205px; position:absolute; bottom:39px; left:50%; transform:translateX(-50%); background:var(--navy); }\n.dsa .dsa-base { position:absolute; width:78%; max-width:164px; bottom:35px; height:4px; left:50%; transform:translateX(-50%); background:var(--navy); }\n.dsa .dsa-disks { position:absolute; bottom:39px; left:4%; width:92%; display:flex; flex-direction:column-reverse; align-items:center; gap:2px; }\n.dsa .dsa-disk { display:grid; place-items:center; max-width:150px; line-height:1; font-size:15px; color:white; background:var(--navy); border-radius:7px; }\n.dsa .dsa-disk.active { background:var(--accent); color:#111; }\n.dsa .dsa-peg-label { position:absolute; bottom:2px; width:100%; left:0; font-size:21px; }\n.dsa .dsa-pegs-wrap .dsa-feedback { margin-top:19px; }\n@media(max-width:900px) {\n  .dsa .dsa-stack,.dsa .dsa-queue .dsa-parking-controls,.dsa .dsa-workspace { display:flex; flex-direction:column; gap:20px; padding-left:16px; padding-right:16px; margin-left:0; margin-right:0; }\n  .dsa .dsa-stack > *,.dsa .dsa-queue .dsa-parking-controls > *,.dsa .dsa-workspace > * { width:100%; }\n  .dsa .dsa-stack .dsa-lane-divider { display:none; }\n}\n";

const shellStyles = `
  .dsa { display:flex; flex:1; flex-direction:column; width:100%; min-height:100vh; background:var(--paper); text-align:left; }
  .dsa select { font:inherit; }
  .dsa .dsa-peg[aria-pressed='true'] { border-color:var(--accent); background:rgba(255,255,255,.55); }
  .dsa .dsa-peg { height:100%; align-self:stretch; touch-action:manipulation; transition:background .16s ease,border-color .16s ease,box-shadow .16s ease; }
  .dsa .dsa-peg:not(:disabled):hover { border-color:var(--accent); background:rgba(217,84,30,.18); box-shadow:0 0 0 3px rgba(217,84,30,.18),0 0 16px rgba(217,84,30,.55); }
  .dsa .dsa-pegs { position:relative; }
  .dsa .dsa-disk { max-width:none; }
  .dsa .dsa-disk.is-moving { visibility:hidden; }
  .dsa .dsa-moving-disk { position:absolute; z-index:5; pointer-events:none; animation:dsa-disk-transfer 520ms cubic-bezier(.22,.72,.24,1) forwards; }
  @keyframes dsa-disk-transfer {
    0% { transform:translate(0,0); }
    35% { transform:translate(0,var(--lift-y)); }
    70% { transform:translate(var(--move-x),var(--lift-y)); }
    100% { transform:translate(var(--move-x),var(--move-y)); }
  }
  @media(prefers-reduced-motion:reduce) { .dsa .dsa-moving-disk { animation-duration:1ms; } }
  .dsa .dsa-peg.shake { animation:dsa-shake .36s ease-in-out; }
  .dsa .dsa-disk.active { color:#fff; box-shadow:0 0 0 3px var(--accent); }
  .dsa .dsa-disk[draggable='true'] { cursor:grab; }
  .dsa .dsa-disk[draggable='true']:active { cursor:grabbing; }
  .dsa .dsa-stats p { display:flex; justify-content:space-between; gap:8px; padding:4px 0; font-size:14px; }
  .dsa .dsa-stats p strong { font-variant-numeric:tabular-nums; }
  @keyframes dsa-shake { 25% { transform:translateX(-5px); } 75% { transform:translateX(5px); } }
  .dsa-app-nav { position:sticky; top:0; z-index:20; display:flex; justify-content:center; gap:clamp(12px,4vw,62px); padding:15px 20px; background:#111; color:var(--paper); overflow-x:auto; }
  .dsa-app-nav button { flex:none; border:0; padding:0; color:inherit; background:none; font:700 clamp(14px,1.6vw,22px)/1.2 'Noto Serif Gujarati',Georgia,serif; text-decoration:underline; text-underline-offset:3px; cursor:pointer; }
  .dsa-app-nav button[aria-current='page'] { color:#fff; text-decoration-thickness:3px; }
  .dsa-page { flex:1; width:100%; max-width:1440px; margin-inline:auto; padding:28px clamp(16px,4vw,58px) 48px; }
  .dsa-page-heading { margin:0 0 22px; text-align:center; }
  .dsa-page-kicker { color:var(--navy); font:400 19px/1.1 'Bebas Neue','Arial Narrow',sans-serif; letter-spacing:.08em; }
  .dsa-page-heading h1 { margin:8px 0 4px; color:#111; font:400 clamp(34px,4vw,52px)/1 'Bebas Neue','Arial Narrow',sans-serif; letter-spacing:.015em; }
  .dsa-page-heading p { max-width:900px; margin-inline:auto; font-size:16px; color:var(--dark); }
  .dsa-home { display:flex; flex:1; flex-direction:column; width:100%; max-width:1440px; margin-inline:auto; padding:clamp(30px,5vw,72px) clamp(18px,4.2vw,60px); }
  .dsa-home-hero { padding:0 0 clamp(42px,6vw,78px); border-radius:0; background:transparent; text-align:center; }
  .dsa-home-hero .dsa-page-kicker { display:none; }
  .dsa-home-hero h1 { max-width:none; margin:16px auto 0; color:#111; font:400 clamp(38px,7vw,92px)/1 'Bebas Neue','Arial Narrow',sans-serif; letter-spacing:.045em; text-shadow:3px 4px 0 rgba(0,0,0,.18); }
  .dsa-home-hero h2 { margin:12px auto 22px; color:var(--accent); font:400 clamp(38px,6vw,74px)/1 'Bebas Neue','Arial Narrow',sans-serif; letter-spacing:.035em; text-shadow:2px 3px 0 rgba(0,0,0,.16); }
  .dsa-home-hero p { max-width:850px; margin:0 auto 34px; color:#111; font-size:clamp(17px,2vw,23px); line-height:1.5; }
  .dsa-home-actions { display:flex; flex-wrap:wrap; justify-content:center; gap:clamp(18px,6vw,90px); }
  .dsa-home-cta { position:relative; min-height:88px; min-width:min(330px,100%); padding:12px 42px; border:0; border-radius:7px; color:white; background:var(--accent); font:700 clamp(19px,2.2vw,29px)/1.2 'Noto Serif Gujarati',Georgia,serif; text-decoration:underline; cursor:pointer; }
  .dsa-home-cta::before, .dsa-home-cta::after { content:''; position:absolute; top:16px; bottom:16px; width:2px; background:rgba(255,255,255,.82); }
  .dsa-home-cta::before { left:18px; }
  .dsa-home-cta::after { right:18px; }
  .dsa-home-cta.secondary { background:#111; }
  .dsa-home-cta:hover { filter:brightness(.92); }
  .dsa-home-modules { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:clamp(14px,3vw,36px); margin-top:0; }
  .dsa-home-card { min-height:190px; display:flex; flex-direction:column; align-items:flex-start; justify-content:flex-start; gap:13px; padding:24px; border:2px solid var(--accent); border-radius:13px; background:#111; color:var(--paper); text-align:left; cursor:pointer; transition:transform .18s ease, box-shadow .18s ease; }
  .dsa-home-card:hover { transform:translateY(-4px); box-shadow:0 8px 20px rgba(0,0,0,.2); }
  .dsa-home-card span { color:var(--accent); font:400 16px/1 'Bebas Neue','Arial Narrow',sans-serif; letter-spacing:.08em; }
  .dsa-home-card strong { color:white; font:400 27px/1 'Bebas Neue','Arial Narrow',sans-serif; }
  .dsa-home-card small { color:var(--paper); font-size:14px; line-height:1.4; }
  .dsa-menu-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); grid-auto-rows:1fr; gap:3px; width:min(100%,1200px); margin:30px auto 0; background:var(--accent); }
  .dsa-menu-item { min-height:175px; display:grid; grid-template-rows:auto auto 1fr; gap:10px; padding:24px; border:0; background:var(--panel); text-align:left; cursor:pointer; }
  .dsa-menu-item:hover { background:#e4e1da; }
  .dsa-menu-item span { justify-self:start; padding:7px 13px; border-radius:10px; color:white; background:#111; font:400 20px/1 'Bebas Neue','Arial Narrow',sans-serif; }
  .dsa-menu-item strong { color:var(--accent); font:700 26px/1.1 'Noto Serif Gujarati',Georgia,serif; }
  .dsa-menu-item small { color:#111; font:500 16px/1.4 'Noto Serif Gujarati',Georgia,serif; }
  .dsa-team-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px 1.7vw; width:min(74.3vw,100%); margin:30px 0 0 calc(50% - 33.4vw); }
  .dsa-team-card { display:grid; grid-template-columns:minmax(0,180px) minmax(0,1fr); gap:12px; align-items:start; min-height:180px; padding:0; background:transparent; }
  .dsa-team-avatar { width:100%; aspect-ratio:1; border-radius:8px; background:var(--dark); }
  .dsa-team-details { min-width:0; padding-top:8px; }
  .dsa-team-card h2 { margin:0 0 5px; color:#111; font:700 clamp(15px,1.5vw,18px)/1.2 Arial,sans-serif; }
  .dsa-team-card ul { margin:0; padding:0; color:var(--dark); font:700 clamp(15px,1.5vw,18px)/1.25 Arial,sans-serif; list-style:none; }
  .dsa-team-card li::before { content:'> '; }
  .dsa-team-page .dsa-page-heading { width:min(100%,92vw); margin-inline:auto; padding-bottom:14px; border-bottom:2px solid var(--accent); }
  .dsa-team-page .dsa-page-heading h1 { margin:4px 0; font:700 clamp(28px,5.2vw,42px)/1.05 Arial,sans-serif; }
  .dsa-team-page .dsa-page-heading p { max-width:450px; font:clamp(12px,1.6vw,16px)/1.3 Arial,sans-serif; }
  @media(max-width:900px) { .dsa-home-modules { grid-template-columns:repeat(2,minmax(0,1fr)); } .dsa-app-nav { justify-content:flex-start; } }
  @media(max-width:560px) { .dsa-home-modules,.dsa-menu-grid,.dsa-team-grid { grid-template-columns:1fr; } .dsa-home-cta { min-width:100%; min-height:70px; } }
  @media(max-width:900px) { .dsa-app-nav { justify-content:flex-start; } }
  @media(max-height:900px) and (min-width:560px) and (orientation:landscape) {
    .dsa-page { padding:clamp(12px,3.5vh,24px) clamp(16px,3.8vw,28px) 14px; }
    .dsa-page-heading { margin-bottom:8px; }
    .dsa-page-kicker { font-size:13px; }
    .dsa-page-heading h1 { margin:2px 0; font-size:clamp(22px,2.4vw,30px); }
    .dsa-page-heading p { font-size:12px; line-height:1.2; }
  }
  @media(max-height:900px) and (min-width:560px) and (orientation:landscape) {
    .dsa { font-size:clamp(14px,1.2vw,16px); }
    .dsa-app-nav { justify-content:space-around; gap:8px; padding:8px 12px; }
    .dsa-app-nav button { font-size:clamp(12px,1.2vw,16px); }
    .dsa-page-kicker { font-size:clamp(12px,1.1vw,14px); }
    .dsa-page-heading p { font-size:clamp(12px,1.1vw,14px); }
    .dsa-home { padding:clamp(28px,4vh,34px) clamp(20px,3.8vw,30px) 10px; }
    .dsa-home-hero { padding-bottom:clamp(22px,4.7vw,34px); }
    .dsa-home-hero h1 { margin:4px auto 0; font-size:clamp(34px,5.8vw,52px); }
    .dsa-home-hero h2 { margin:4px auto 8px; font-size:clamp(30px,4.8vw,40px); }
    .dsa-home-hero p { max-width:440px; margin:0 auto 10px; font:clamp(15px,1.5vw,17px)/1.2 Arial,sans-serif; }
    .dsa-home-actions { gap:clamp(16px,5vw,36px); }
    .dsa-home-cta { min-height:56px; min-width:clamp(180px,26vw,260px); padding:6px 22px; font-size:clamp(15px,1.6vw,18px); line-height:1.15; }
    .dsa-home-cta::before,.dsa-home-cta::after { top:10px; bottom:10px; }
    .dsa-home-modules { grid-template-columns:repeat(4,minmax(0,1fr)); gap:clamp(12px,2.4vw,18px); }
    .dsa-home-card { min-height:180px; gap:12px; padding:20px; }
    .dsa-home-card span { color:var(--paper); font-size:clamp(15px,1.5vw,18px); }
    .dsa-home-card strong { font-size:clamp(20px,2.1vw,25px); }
    .dsa-home-card small { font-size:clamp(16px,1.6vw,19px); }
    .dsa-menu-grid { grid-template-columns:repeat(3,minmax(0,1fr)); grid-auto-rows:1fr; gap:3px; width:min(100%,1200px); margin:12px auto 0; }
    .dsa-menu-item { min-height:145px; gap:8px; padding:16px; }
    .dsa-menu-item span { padding:5px 9px; font-size:clamp(15px,1.6vw,18px); }
    .dsa-menu-item strong { font-size:clamp(20px,2.1vw,25px); }
    .dsa-menu-item small { font-size:clamp(15px,1.5vw,18px); }
    .dsa-menu-page .dsa-page-heading h1 { font-size:clamp(34px,4vw,48px); }
    .dsa-menu-page .dsa-page-heading p { font-size:clamp(17px,1.8vw,21px); }
    .dsa-team-grid { grid-template-columns:repeat(2,minmax(0,1fr)); gap:24px 1.7vw; width:min(74.3vw,100%); margin:16px 0 0 calc(50% - 33.4vw); }
    .dsa-team-card { grid-template-columns:minmax(0,180px) minmax(0,1fr); gap:12px; min-height:180px; padding:0; }
    .dsa-team-details { padding-top:8px; }
    .dsa-team-card h2 { margin-bottom:5px; font-size:clamp(15px,1.5vw,18px); }
    .dsa-team-card ul { font-size:clamp(15px,1.5vw,18px); }
    .dsa-team-page .dsa-page-heading { margin-bottom:0; padding-bottom:12px; }
    .dsa-team-page .dsa-page-heading h1 { font-size:clamp(28px,5.2vw,42px); }
    .dsa .dsa-workspace { display:grid; gap:12px; margin:0; padding:0; }
    .dsa-study-page { padding-top:clamp(12px,3.5vh,24px); }
    .dsa-study-page .dsa-page-heading { margin-bottom:16px; text-align:center; }
    .dsa-study-page .dsa-page-kicker { font-size:clamp(15px,1.4vw,18px); }
    .dsa-study-page .dsa-page-heading h1 { margin:6px 0 4px; font-size:clamp(34px,4vw,50px); }
    .dsa-study-page .dsa-page-heading p { display:none; }
    .dsa .dsa-tree { grid-template-columns:minmax(0,.64fr) minmax(0,1fr); align-items:stretch; gap:12px; margin-inline:8px; padding:0; }
    .dsa .dsa-search { grid-template-columns:minmax(0,.64fr) minmax(0,1fr); align-items:stretch; gap:12px; min-height:0; margin:0 8px; padding:0; background:transparent; }
    .dsa .dsa-search .dsa-form,.dsa .dsa-search .dsa-results { min-width:0; padding:10px; border-radius:15px; background:var(--panel); }
    .dsa .dsa-hanoi { grid-template-columns:minmax(0,.64fr) minmax(0,1fr); gap:12px; margin-inline:8px; padding:0; }
    .dsa .dsa-search-entry { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px; align-items:end; }
    .dsa .dsa-search-entry .dsa-form-row { grid-template-columns:minmax(55px,42%) minmax(0,1fr); gap:4px; }
    .dsa .dsa-search-entry .dsa-button { min-width:0; min-height:30px; padding:4px 8px; }
    .dsa .dsa-tree .dsa-panel { min-height:0; }
    .dsa .dsa-panel { padding:10px; }
    .dsa .dsa-form { gap:6px; }
    .dsa .dsa-form-row { grid-template-columns:minmax(75px,42%) minmax(0,1fr); gap:6px; }
    .dsa .dsa-form-row span { min-height:30px; padding:4px 6px; font-size:clamp(13px,1.4vw,16px); }
    .dsa .dsa-label { font-size:clamp(14px,1.5vw,18px); }
    .dsa .dsa-button { min-width:0; min-height:32px; padding:4px 8px; font-size:clamp(12px,1.2vw,15px); }
    .dsa .dsa-actions { gap:6px; }
    .dsa .dsa-input,.dsa .dsa-value { height:30px; padding:4px 8px; font-size:clamp(12px,1.2vw,14px); }
    .dsa .dsa-bulk { min-height:36px; max-height:64px; padding:4px 8px; font-size:clamp(12px,1.2vw,14px); }
    .dsa .dsa-help { font-size:clamp(12px,1.1vw,14px); line-height:1.2; }
    .dsa .dsa-feedback { min-height:0; font-size:clamp(11px,1vw,13px); }
    .dsa .dsa-results { gap:6px; }
    .dsa .dsa-results-header { display:flex; align-items:center; justify-content:space-between; gap:8px; min-height:28px; }
    .dsa .dsa-results-header > strong { font:700 clamp(12px,1vw,14px)/1.2 Arial,sans-serif; }
    .dsa .dsa-results-header .dsa-button { min-width:0; min-height:28px; padding:4px 10px; font-size:clamp(11px,1vw,13px); }
    .dsa .dsa-diagram { height:min(42vh,360px); }
    .dsa .dsa-traversals { min-height:42px; }
    .dsa .dsa-traversals div { padding:4px 6px; }
    .dsa .dsa-traversals strong,.dsa .dsa-traversals p { font-size:clamp(11px,1.1vw,13px); }
    .dsa .dsa-traversals p { max-height:48px; }
    .dsa .dsa-hanoi .dsa-form { min-height:0; margin-top:0; }
    .dsa .dsa-hanoi-board { min-height:0; padding:8px; }
    .dsa .dsa-pegs-wrap { min-height:0; padding:8px; }
    .dsa .dsa-pegs { height:min(37vh,280px); gap:4px; }
    .dsa .dsa-peg { min-height:0; }
    .dsa .dsa-stem { height:min(26vh,170px); bottom:30px; }
    .dsa .dsa-base { bottom:26px; }
    .dsa .dsa-disks { bottom:30px; }
    .dsa .dsa-disk { font-size:clamp(9px,1.2vw,13px); }
    .dsa .dsa-peg-label { font-size:clamp(10px,1.2vw,14px); white-space:nowrap; }
    .dsa .dsa-stats { min-height:0; padding:6px 8px; }
    .dsa .dsa-stats p { padding:2px 0; font-size:clamp(10px,1vw,12px); }
  }
  @media(max-height:520px) and (min-width:560px) and (orientation:landscape) {
    .dsa .dsa-tree .dsa-form { gap:4px; }
    .dsa .dsa-tree .dsa-panel { padding:8px; }
    .dsa .dsa-tree .dsa-form-row span { min-height:28px; padding:3px 6px; }
    .dsa .dsa-tree .dsa-input,.dsa .dsa-tree .dsa-value { height:28px; }
    .dsa .dsa-tree .dsa-bulk { min-height:32px; max-height:48px; }
    .dsa .dsa-tree .dsa-button { min-height:30px; }
    .dsa .dsa-tree .dsa-help { line-height:1.1; }
  }
  @media(max-width:560px) {
    .dsa-team-grid { width:100%; }
    .dsa-team-card { grid-template-columns:minmax(0,110px) minmax(0,1fr); min-height:110px; }
  }
  @media(max-width:1000px) {
    .dsa-team-grid { grid-template-columns:1fr; width:min(100%,600px); margin:16px auto 0; }
  }
`;

const STUDIES = [
  { mode: 'stack', number: '1', navLabel: 'STACK', label: 'STACK LIFO LOGIC', title: 'Parking Lot (Stack - Up to 10 Slots)', description: 'Stack LIFO parking with a temporary holding bay and live activity log.' },
  { mode: 'queue', number: '2', navLabel: 'QUEUE', label: 'QUEUE FIFO LOGIC', title: 'Parking Lot (Queue - Up to 10 Slots)', description: 'Queue FIFO parking with a holding lane and live activity log.' },
  { mode: 'tree', number: '3', navLabel: 'TREE', label: 'BINARY TREE TRAVERSAL', title: 'Binary Tree & Traversals Maker', description: 'Build a tree and see in-order, pre-order, and post-order traversals.' },
  { mode: 'search', number: '4', navLabel: 'SEARCH', label: 'BINARY SEARCH TREE', title: 'Binary Search Tree Construction', description: 'Enter numeric values and inspect the resulting search tree.' },
  { mode: 'hanoi', number: '5', navLabel: 'HANOI', label: 'RECURSIVE PUZZLE', title: 'Tower of Hanoi Interactive Solver', description: 'Move disks across three to five pegs and solve the puzzle.' },
];

function HomePage({ onSelect }: { onSelect: (mode: string) => void }) {
  return (
    <main className="dsa-home">
      <section className="dsa-home-hero">
        <h1>DATA STRUCTURES &amp; ALGORITHMS</h1>
        <h2>CASE STUDIES</h2>
        <p>An intuitive web application designed to demonstrate Stacks (LIFO), Queues (FIFO), Binary Tree traversals, Binary Search Trees, and the classic Tower of Hanoi.</p>
        <div className="dsa-home-actions">
          <button type="button" className="dsa-home-cta" onClick={() => onSelect('menu')}>EXPLORE MENU<br />&amp; CASE STUDIES</button>
          <button type="button" className="dsa-home-cta secondary" onClick={() => onSelect('members')}>MEET<br />MEMBERS</button>
        </div>
      </section>
      <section className="dsa-home-modules" aria-label="Quick launch case studies">
        {[
          { title: 'PARKING LOT', description: 'Stack LIFO and queue FIFO parking with a live activity log.', mode: 'stack' },
          { title: 'BINARY TREE', description: 'Build a tree and see in-order, pre-order, and post-order traversals.', mode: 'tree' },
          { title: 'BINARY SEARCH', description: 'Enter numeric values and inspect the resulting search tree.', mode: 'search' },
          { title: 'TOWER OF HANOI', description: 'Move disks across three to five pegs and solve the puzzle.', mode: 'hanoi' },
        ].map((item, index) => (
            <button
              type="button"
              key={item.mode}
              className="dsa-home-card"
              onClick={() => onSelect(item.mode)}
            >
              <span>CASE STUDY 0{index + 1}</span>
              <strong>{item.title}</strong>
              <small>{item.description}</small>
            </button>
          ))}
      </section>
    </main>
  );
}

function MenuPage({ onSelect }: { onSelect: (mode: string) => void }) {
  const menuStudies = [
    { mode: 'stack', kicker: 'STACK (LIFO)', title: 'PARKING LOT (STACK)', description: 'Park cars through one opening and follow every exit and return in the live log.' },
    { mode: 'search', kicker: 'BINARY SEARCH', title: 'BINARY SEARCH TREE', description: 'Enter numeric values to build a binary search tree and view its sorted output.' },
    { mode: 'queue', kicker: 'QUEUE (FIFO)', title: 'PARKING LOT (QUEUE)', description: 'Watch the queue advance and follow each physical entry or exit.' },
    { mode: 'hanoi', kicker: 'RECURSION', title: 'TOWER OF HANOI', description: 'Play the disk-moving puzzle or watch the solver move disks across the pegs.' },
    { mode: 'tree', kicker: 'BINARY TREE', title: 'CUSTOM BINARY TREE', description: 'Set node positions or mark them empty, then inspect all three traversals.' },
    { mode: 'members', kicker: 'TEAM', title: 'BEHIND THE SCENE', description: 'Meet the contributors behind this data structures and algorithms project.' },
  ];
  return (
    <main className="dsa-page dsa-menu-page">
      <header className="dsa-page-heading">
        <h1>Case Studies Menu</h1>
        <p>Select a case study to open its interactive simulation.</p>
      </header>
      <section className="dsa-menu-grid" aria-label="Case studies menu">
        {menuStudies.map((item) => (
          <button type="button" className="dsa-menu-item" key={item.mode} onClick={() => onSelect(item.mode)}>
            <span>{item.kicker}</span><strong>{item.title}</strong><small>{item.description}</small>
          </button>
        ))}
      </section>
    </main>
  );
}

function MembersPage() {
  const team = [
    { name: 'NOOL, JAMEELAH ZARRINA', roles: ['UI/UX Designer', 'Frontend Developer'] },
    { name: 'PLAZA, JAMES CLAUDE', roles: ['Python Backend', 'Algorithm Engineer'] },
    { name: 'MAGTUBA, AIO', roles: ['Python Backend', 'Algorithm Engineer'] },
    { name: 'PADAOANG, LOVELY', roles: ['Frontend-Backend Integration', 'State Specialist'] },
  ];
  return (
    <main className="dsa-page dsa-team-page">
      <header className="dsa-page-heading">
        <h1>Project Team Members</h1>
        <p>Group contributors responsible for the design, algorithm development, backend logic, and frontend visual integration.</p>
      </header>
      <section className="dsa-team-grid" aria-label="Project team">
        {team.map((member) => (
          <article className="dsa-team-card" key={member.name}>
            <div className="dsa-team-avatar" aria-hidden="true" />
            <div className="dsa-team-details">
              <h2>{member.name}</h2>
              <ul>
                {member.roles.map((role) => <li key={role}>{role}</li>)}
              </ul>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

function walkTree(root: TreeNode | null, order: TraversalOrder): TraversalRow[] {
  const pending: PendingTreeNode[] = [[root,0,false]];
  const result: TraversalRow[] = [];
  while (pending.length) {
    const next = pending.pop();
    if (!next) continue;
    const [node, depth, emit] = next;
    if (!node) continue;
    if (emit) { result.push({node,depth}); continue; }
    const left: PendingTreeNode = [node.left,depth + 1,false];
    const right: PendingTreeNode = [node.right,depth + 1,false];
    const self: PendingTreeNode = [node,depth,true];
    if (order === 'pre') pending.push(right,left,self);
    else if (order === 'post') pending.push(self,right,left);
    else pending.push(right,self,left);
  }
  return result;
}

function TreeDiagram({root, generated}: { root: TreeNode | null; generated: boolean }) {
  if (!root) return <div className="dsa-diagram"><p className="dsa-help">{generated ? 'The tree is empty.' : 'Your tree will appear here.'}</p></div>;
  const ordered = walkTree(root,'in');
  const width = Math.max(600,ordered.length * 100);
  const depth = ordered.reduce((max,row) => Math.max(max,row.depth),0);
  const height = Math.max(450,110 + depth * 94);
  const positions = new Map<TreeNode,{x:number;y:number}>(ordered.map(({node,depth}, index) => [node,{x:(index + 0.5) * width / ordered.length,y:58 + depth * 94}]));
  return <div className="dsa-diagram" style={{display:'block'}} tabIndex={0} aria-label="Tree diagram">
    <div className="dsa-graph" style={{width,height,minWidth:0,minHeight:0}}>
      <svg width={width} height={height} aria-hidden="true">
        {ordered.flatMap(({node}, index) => [node.left,node.right].map((child, side) => {
          if (!child) return null;
          const from = positions.get(node), to = positions.get(child);
          if (!from || !to) return null;
          return <line key={index + '-' + side} x1={from.x} y1={from.y + 21} x2={to.x} y2={to.y - 21} stroke="#293152" strokeWidth="2" />;
        }))}
      </svg>
      {ordered.map(({node}, index) => {
        const point = positions.get(node);
        if (!point) return null;
        const {x,y} = point;
        return <div className="dsa-graph-node" key={index} style={{left:x,top:y}} title={String(node.value)}><span>{node.value}</span></div>;
      })}
    </div>
  </div>;
}

function TreeResults({result, search = false, canGenerate, onGenerate}: { result: TreeResult | null; search?: boolean; canGenerate: boolean; onGenerate: () => void }) {
  const outputs: Array<[string, TraversalOrder]> = search ? [['Sorted in-order output','in']] : [['In-order','in'],['Pre-order','pre'],['Post-order','post']];
  return <div className={'dsa-results' + (search ? '' : ' dsa-panel')}>
    <div className="dsa-results-header">
      <strong>TREE DIAGRAM</strong>
      <Button disabled={!canGenerate} onClick={onGenerate}>Generate tree</Button>
    </div>
    <TreeDiagram root={result?.root ?? null} generated={!!result} />
    <div className="dsa-traversals" style={{'--outputs':outputs.length} as React.CSSProperties & {'--outputs': number}} aria-live="polite">
      {outputs.map(([name,order]) => <div key={order}><strong>{name.toUpperCase()}</strong>
        <p>{!result ? 'Awaiting tree' : result.values[order].length ? result.values[order].join(', ') : 'Empty'}</p></div>)}
    </div>
  </div>;
}

function resultFor(root: TreeNode | null): TreeResult {
  const values = Object.fromEntries((['in','pre','post'] as TraversalOrder[]).map((order) => [order,walkTree(root,order).map(({node}) => node.value)])) as TreeResult['values'];
  return {root,values};
}

function BinaryTree() {
  const [countText,setCount] = useState('');
  const [positionText,setPosition] = useState('');
  const [value,setValue] = useState('');
  const [bulk,setBulk] = useState('');
  const [slots,setSlots] = useState<Map<number,string | null>>(() => new Map());
  const [result,setResult] = useState<TreeResult | null>(null);
  const [notice,setNotice] = useState<Notice | null>(null);
  const count = positiveInteger(countText);
  const position = positiveInteger(positionText);
  const positionValid = position !== null && count !== null && position <= count;
  const canGenerate = count !== null && slots.size === count;
  const show = (text: string,error = false) => setNotice({text,error});
  function changeCount(input: string) {
    if (positiveInteger(input) !== count) { setSlots(new Map()); setResult(null); setPosition(''); }
    setCount(input);
    setNotice(input.trim() && !positiveInteger(input) ? {text:'Enter a positive whole number of positions.',error:true} : null);
  }
  function save(empty: boolean) {
    if (position === null || count === null || position > count) return show('Choose a position from 1 to ' + (count || 'the node count') + '.',true);
    if (!empty && !value.trim()) return show('Enter a label or mark this position empty.',true);
    setSlots((old) => new Map(old).set(position,empty ? null : value));
    setResult(null);
    show('Position ' + position + (empty ? ' marked empty.' : ' saved.'));
  }
  function applyList() {
    let values: unknown;
    try { values = JSON.parse(bulk); } catch { return show('Enter a JSON array of labels and nulls.',true); }
    if (!Array.isArray(values)) return show('Enter a JSON array of labels and nulls.',true);
    if (values.length !== count) return show('Expected ' + count + ' positions. Received ' + values.length + '.',true);
    if (values.some((entry) => entry !== null && !(typeof entry === 'string' && entry.trim()) && !Number.isFinite(entry))) {
      return show('Use a label or null at each position.',true);
    }
    const nextSlots = new Map<number,string | null>();
    values.forEach((entry: unknown, index: number) => nextSlots.set(index + 1,entry === null ? null : String(entry)));
    setSlots(nextSlots);
    setResult(null);
    show('Set ' + count + ' positions. Generate the tree to view traversals.');
  }
  function generate() {
    if (!canGenerate) return;
    const nodes = new Map<number,TreeNode>();
    for (const [index,label] of slots) {
      if (label !== null) nodes.set(index,{value:label,left:null,right:null});
    }
    for (const [index,node] of nodes) {
      const parent = Math.floor(index / 2);
      if (index > 1 && !nodes.has(parent)) return show('Position ' + index + ' needs a value in position ' + parent + '.',true);
      node.left = nodes.get(index * 2) ?? null;
      node.right = nodes.get(index * 2 + 1) ?? null;
    }
    setResult(resultFor(nodes.get(1) ?? null));
    show('Tree generated.');
  }
  return <div className="dsa-workspace dsa-tree">
    <div className="dsa-form dsa-panel">
      <Field label="Node count" value={countText} onChange={changeCount} placeholder="e.g. 5" inputMode="numeric" />
      <p className="dsa-help">Count empty positions. Root is position 1.<br />For position n, its children are 2n and 2n + 1.</p>
      <Field label="Position" value={positionText} onChange={(raw) => { const index = positiveInteger(raw); setPosition(raw); setValue(index === null ? '' : slots.get(index) || ''); setNotice(null); }} placeholder="e.g. 1" inputMode="numeric" />
      <Field label="Node label" value={value} onChange={setValue} placeholder="e.g. A + B" onEnter={() => save(false)} />
      <div className="dsa-actions"><Button disabled={!positionValid || !value.trim()} onClick={() => save(false)}>Save node</Button><Button disabled={!positionValid} onClick={() => save(true)}>Mark empty</Button></div>
      <hr className="dsa-rule" />
      <BulkField label="Bulk nodes" value={bulk} onChange={setBulk} placeholder={'["A + B", "7", "C", null, "E"]'} />
      <div className="dsa-actions"><Button disabled={!count || !bulk.trim()} onClick={applyList}>Apply list</Button></div>
      <p className="dsa-help">{count ? slots.size + ' of ' + count + ' positions configured' : 'Set the node count to start.'}</p>
      {notice && <Feedback notice={notice} />}
    </div>
    <TreeResults result={result} canGenerate={canGenerate} onGenerate={generate} />
  </div>;
}

function numericValue(raw: string): number | null {
  const value = Number(raw);
  const valid = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(raw.trim());
  return valid && Number.isFinite(value) ? value : null;
}

function SearchTree() {
  const [countText,setCount] = useState('');
  const [number,setNumber] = useState('');
  const [bulk,setBulk] = useState('');
  const [numbers,setNumbers] = useState<number[]>([]);
  const [result,setResult] = useState<TreeResult | null>(null);
  const [notice,setNotice] = useState<Notice | null>(null);
  const count = positiveInteger(countText);
  const show = (text: string,error = false) => setNotice({text,error});
  const canGenerate = count !== null && numbers.length === count;
  function updateCount(input: string) {
    if (positiveInteger(input) !== count) { setNumbers([]); setResult(null); }
    setCount(input);
    setNotice(input.trim() && !positiveInteger(input) ? {text:'Enter a positive whole node count.',error:true} : null);
  }
  function insert() {
    if (!count || numbers.length >= count) return;
    const value = numericValue(number);
    if (value === null) return show('Enter a finite whole number or decimal.',true);
    setNumbers([...numbers,value]);
    setResult(null);
    setNumber('');
    show('Added ' + value + '.');
  }
  function applyList() {
    if (!count) return;
    const parts = bulk.split(',');
    if (parts.some((part) => !part.trim())) return show('Enter a number between commas.',true);
    const parsed: Array<number | null> = parts.flatMap((part) => part.trim().split(/\s+/)).map(numericValue);
    if (parsed.some((value) => value === null)) return show('Enter finite numbers only.',true);
    const next = parsed.filter((value): value is number => value !== null);
    if (next.length !== count) return show('Expected ' + count + ' values. Received ' + next.length + '.',true);
    setNumbers(next);
    setResult(null);
    show('Loaded ' + count + ' values.');
  }
  function generate() {
    if (!canGenerate) return;
    const first = numbers[0];
    if (first === undefined) return;
    const root: TreeNode = {value:first,left:null,right:null};
    for (const value of numbers.slice(1)) {
      let node = root;
      for (;;) {
        const side = value < Number(node.value) ? 'left' : 'right';
        if (!node[side]) { node[side] = {value,left:null,right:null}; break; }
        node = node[side];
      }
    }
    setResult(resultFor(root));
    show('Search tree generated.');
  }
  return <div className="dsa-workspace dsa-search">
    <div className="dsa-form">
      <Field label="Node count" value={countText} onChange={updateCount} placeholder="e.g. 5" inputMode="numeric" />
      <p className="dsa-help">Enter exactly that many numbers.</p>
      <div className="dsa-search-entry">
        <Field label="Input value" value={number} onChange={setNumber} placeholder="e.g. 8" inputMode="decimal" onEnter={insert} />
        <Button disabled={!count || !number.trim() || numbers.length >= count} onClick={insert}>Insert</Button>
      </div>
      <hr className="dsa-rule" />
      <BulkField label="Input bulk values" value={bulk} onChange={setBulk} placeholder="e.g. 8, 3, 10, 1, 6" />
      <div className="dsa-actions"><Button disabled={!count || !bulk.trim()} onClick={applyList}>Apply list</Button></div>
      <p className="dsa-help">{count ? numbers.length + ' of ' + count + ' values entered' : 'Set the node count to start.'}</p>
      {numbers.length > 0 && <p className="dsa-help" style={{maxHeight:80,overflow:'auto',overflowWrap:'anywhere'}}>{numbers.join(', ')}</p>}
      {notice && <Feedback notice={notice} />}
    </div>
    <TreeResults result={result} search canGenerate={canGenerate} onGenerate={generate} />
  </div>;
}

const pegLabel = (index: number) => String.fromCharCode(65 + index);
const diskColors = ['#e63946','#c75100','#9a6700','#2b7a3d','#007f7b','#1565c0','#6a1b9a','#c2185b'];

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return String(mins).padStart(2, '0') + ':' + String(secs).padStart(2, '0');
}

function Hanoi() {
  const [diskText,setDiskText] = useState('4');
  const [pegText,setPegText] = useState('3');
  const [diskCount,setDiskCount] = useState(4);
  const [pegCount,setPegCount] = useState(3);
  const [board,setBoard] = useState<number[][]>(() => createInitialPegs(4,3));
  const [movingDisk,setMovingDisk] = useState<MovingDisk | null>(null);
  const [pegAreaHeight,setPegAreaHeight] = useState(319);
  const [source,setSource] = useState<number | null>(null);
  const [dragFromPeg,setDragFromPeg] = useState<number | null>(null);
  const [shakePeg,setShakePeg] = useState<number | null>(null);
  const [moves,setMoves] = useState(0);
  const [elapsedSeconds,setElapsedSeconds] = useState(0);
  const [timerActive,setTimerActive] = useState(false);
  const [solving,setSolving] = useState(false);
  const [paused,setPaused] = useState(false);
  const [speedMs,setSpeedMs] = useState(420);
  const [notice,setNotice] = useState<Notice | null>(null);
  const autoMovesRef = useRef<HanoiMove[]>([]);
  const autoIndexRef = useRef(0);
  const shakeTimer = useRef<number | null>(null);
  const pegsRef = useRef<HTMLDivElement | null>(null);
  const pegRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const goal = pegCount - 1;
  const won = board[goal]?.length === diskCount;
  const optimalMoves = useMemo(() => getOptimalHanoiMoveCount(diskCount,pegCount),[diskCount,pegCount]);
  const show = (text: string,error = false) => setNotice({text,error});
  useEffect(() => {
    if (!timerActive || won) return;
    const timer = window.setInterval(() => setElapsedSeconds((seconds) => seconds + 1),1000);
    return () => window.clearInterval(timer);
  },[timerActive,won]);
  useEffect(() => {
    const element = pegsRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.height > 0) setPegAreaHeight(entry.contentRect.height);
    });
    observer.observe(element);
    return () => observer.disconnect();
  },[]);
  useEffect(() => {
    if (!solving || paused) return;
    const timer = window.setTimeout(() => {
      const index = autoIndexRef.current;
      const move = autoMovesRef.current[index];
      if (!move) {
        setSolving(false);
        setTimerActive(false);
        return;
      }
      setBoard((current) => {
        const next = current.map((stack) => [...stack]);
        const sourceStack = next[move.from];
        const targetStack = next[move.to];
        const disk = sourceStack?.pop();
        if (disk !== undefined && targetStack) targetStack.push(disk);
        return next;
      });
      setMoves((count) => count + 1);
      autoIndexRef.current = index + 1;
      show('Auto-solve moved disk ' + move.disk + ' to Peg ' + pegLabel(move.to) + '.');
      if (index + 1 >= autoMovesRef.current.length) {
        setSolving(false);
        setTimerActive(false);
      }
    },speedMs);
    return () => window.clearTimeout(timer);
  },[solving,paused,moves,speedMs]);
  useEffect(() => () => {
    if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current);
  },[]);
  function resetGame(nextDisks = diskCount,nextPegs = pegCount) {
    setDiskText(String(nextDisks));
    setPegText(String(nextPegs));
    setDiskCount(nextDisks);
    setPegCount(nextPegs);
    setBoard(createInitialPegs(nextDisks,nextPegs));
    setMovingDisk(null);
    setSource(null);
    setDragFromPeg(null);
    setShakePeg(null);
    setNotice(null);
    setSolving(false);
    setPaused(false);
    autoMovesRef.current = [];
    autoIndexRef.current = 0;
    setMoves(0);
    setElapsedSeconds(0);
    setTimerActive(false);
  }
  function triggerShake(peg: number,message: string) {
    setShakePeg(peg);
    show(message,true);
    if (shakeTimer.current !== null) window.clearTimeout(shakeTimer.current);
    shakeTimer.current = window.setTimeout(() => setShakePeg((current) => current === peg ? null : current),360);
  }
  function attemptMove(fromPeg: number,toPeg: number) {
    if (solving || won || movingDisk) return;
    const check = isValidHanoiMove(board,fromPeg,toPeg);
    if (!check.valid) {
      triggerShake(toPeg,check.reason ?? 'Illegal move.');
      setSource(null);
      return;
    }
    const sourceStack = board[fromPeg];
    const disk = sourceStack?.[sourceStack.length - 1];
    const pegs = pegsRef.current;
    const sourcePeg = pegRefs.current[fromPeg];
    const targetPeg = pegRefs.current[toPeg];
    const sourceDisk = sourcePeg?.querySelector<HTMLElement>(`[data-disk="${disk}"]`);
    const targetDisks = targetPeg?.querySelector<HTMLElement>('.dsa-disks');
    if (disk === undefined || !pegs || !sourceDisk || !targetDisks)
      return show('Could not start the disk move. Try again.',true);
    const pegsRect = pegs.getBoundingClientRect();
    const sourceRect = sourceDisk.getBoundingClientRect();
    const targetDisksRect = targetDisks.getBoundingClientRect();
    const targetStackLength = board[toPeg]?.length ?? 0;
    const gap = Number.parseFloat(window.getComputedStyle(targetDisks).rowGap) || 0;
    const startX = sourceRect.left - pegsRect.left;
    const startY = sourceRect.top - pegsRect.top;
    const endX = targetDisksRect.left + (targetDisksRect.width - sourceRect.width) / 2 - pegsRect.left;
    const endY = targetDisksRect.bottom - pegsRect.top - (targetStackLength + 1) * sourceRect.height - targetStackLength * gap;
    const peakY = Math.max(4,Math.min(startY,endY) - Math.max(20,sourceRect.height * 1.5));
    setMovingDisk({
      disk,
      fromPeg,
      toPeg,
      startX,
      startY,
      moveX:endX - startX,
      moveY:endY - startY,
      liftY:peakY - startY,
      width:sourceRect.width,
      height:sourceRect.height,
    });
    setSource(null);
    setDragFromPeg(null);
    setNotice(null);
  }
  function completeMove() {
    if (!movingDisk) return;
    const next = board.map((stack) => [...stack]);
    const sourceStack = next[movingDisk.fromPeg];
    const targetStack = next[movingDisk.toPeg];
    const disk = sourceStack?.pop();
    if (disk !== movingDisk.disk || !targetStack) {
      setMovingDisk(null);
      return show('The disk could not be placed. Try the move again.',true);
    }
    targetStack.push(disk);
    setBoard(next);
    setMoves((count) => count + 1);
    setSource(null);
    setMovingDisk(null);
    setNotice(null);
    if (!timerActive) setTimerActive(true);
  }
  function pick(peg: number) {
    if (solving || won || movingDisk) return;
    if (source === null) {
      if (!board[peg]?.length) return show('Peg ' + pegLabel(peg) + ' is empty. Select a peg with a disk.',true);
      setSource(peg);
      return show('Peg ' + pegLabel(peg) + ' selected. Choose a destination.');
    }
    if (source === peg) { setSource(null); setNotice(null); return; }
    attemptMove(source,peg);
  }
  function handleAutoSolve() {
    if (movingDisk) return;
    if (solving) { setPaused((current) => !current); return; }
    setBoard(createInitialPegs(diskCount,pegCount));
    setSource(null);
    setNotice(null);
    setMoves(0);
    setElapsedSeconds(0);
    setTimerActive(true);
    autoMovesRef.current = solveTowerOfHanoi(diskCount,pegCount);
    autoIndexRef.current = 0;
    setPaused(false);
    setSolving(true);
  }
  const diskHeight = Math.max(8,Math.min(24,Math.floor((pegAreaHeight - 60 - (diskCount - 1) * 2) / diskCount)));
  const phase = won ? 'Solved' : solving ? (paused ? 'Auto-solve paused' : 'Auto-solve in progress') : 'Ready to play';
  return <div className="dsa-workspace dsa-hanoi">
    <div className="dsa-panel dsa-form">
      <h2 className="dsa-label dsa-title-bar">GAME SETTING</h2>
      <label className="dsa-form-row"><span className="dsa-label">Disk count</span><select className="dsa-input" value={diskText} disabled={solving || movingDisk !== null} onChange={(event) => resetGame(Number(event.target.value),pegCount)}>{[3,4,5,6,7,8].map((count) => <option key={count} value={count}>{count} disks</option>)}</select></label>
      <label className="dsa-form-row"><span className="dsa-label">Peg count</span><select className="dsa-input" value={pegText} disabled={solving || movingDisk !== null} onChange={(event) => resetGame(diskCount,Number(event.target.value))}>{[3,4,5].map((count) => <option key={count} value={count}>{count} pegs</option>)}</select></label>
      <label className="dsa-form-row"><span className="dsa-label">Solver speed</span><select className="dsa-input" value={speedMs} onChange={(event) => setSpeedMs(Number(event.target.value))}><option value={700}>Slow</option><option value={420}>Normal</option><option value={160}>Fast</option></select></label>
      <p className="dsa-help">Algorithm: {pegCount === 3 ? 'Classic recursion' : 'Frame–Stewart'} · Supports 3–8 disks and 3–5 pegs.</p>
      <hr className="dsa-rule" />
      <div className="dsa-actions"><Button disabled={movingDisk !== null} onClick={handleAutoSolve}>{solving ? (paused ? 'Resume solve' : 'Pause solve') : 'Auto solve'}</Button><Button disabled={movingDisk !== null} accent onClick={() => resetGame()}>Reset game</Button></div>
      <hr className="dsa-rule" />
      <div className="dsa-stats" aria-live="polite"><span className="dsa-label">STATS</span><p>MOVES TAKEN <strong>{moves}</strong></p><p>OPTIMAL MINIMUM <strong>{optimalMoves}</strong></p><p>ELAPSED TIME <strong>{formatElapsed(elapsedSeconds)}</strong></p><p>{phase}</p></div>
    </div>
    <div className="dsa-panel dsa-hanoi-board">
      <div className="dsa-pegs-wrap">
        <span className="dsa-label">MOVE ALL DISKS TO PEG {pegLabel(goal)}</span>
        <div className="dsa-pegs" ref={pegsRef} style={{'--peg-count':board.length} as React.CSSProperties & {'--peg-count':number}}>
          {board.map((stack,peg) => <button type="button" key={peg} ref={(element) => { pegRefs.current[peg] = element; }} className={'dsa-peg' + (shakePeg === peg ? ' shake' : '')} aria-label={'Peg ' + pegLabel(peg) + (peg === goal ? ', target' : '')} aria-pressed={source === peg} disabled={solving || won || movingDisk !== null} onClick={() => pick(peg)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => { event.preventDefault(); if (dragFromPeg !== null) { attemptMove(dragFromPeg,peg); setDragFromPeg(null); } }}>
            <span aria-hidden="true" className="dsa-stem" /><span aria-hidden="true" className="dsa-base" />
            <span className="dsa-disks" aria-hidden="true">
              {stack.map((disk,index) => {
                const isTop = index === stack.length - 1;
                return <span key={disk} data-disk={disk} draggable={isTop && !solving && !won && movingDisk === null} onDragStart={(event) => { event.stopPropagation(); setDragFromPeg(peg); setSource(peg); }} onDragEnd={() => setDragFromPeg(null)} className={'dsa-disk' + (source === peg && isTop ? ' active' : '') + (movingDisk?.disk === disk && movingDisk.fromPeg === peg ? ' is-moving' : '')} style={{height:diskHeight,width:(28 + 66 * disk / diskCount) + '%',backgroundColor:diskColors[(disk - 1) % diskColors.length]}}>{'D' + disk}</span>;
              })}
            </span>
            <span className="dsa-peg-label">PEG {pegLabel(peg)}{peg === 0 ? ' (START)' : peg === goal ? ' (TARGET)' : ''}</span>
          </button>)}
          {movingDisk && <span
            aria-hidden="true"
            className="dsa-disk dsa-moving-disk"
            onAnimationEnd={completeMove}
            style={{
              left:movingDisk.startX,
              top:movingDisk.startY,
              width:movingDisk.width,
              height:movingDisk.height,
              backgroundColor:diskColors[(movingDisk.disk - 1) % diskColors.length],
              '--move-x':movingDisk.moveX + 'px',
              '--move-y':movingDisk.moveY + 'px',
              '--lift-y':movingDisk.liftY + 'px',
            } as React.CSSProperties & {'--move-x': string; '--move-y': string; '--lift-y': string}}
          >
            {'D' + movingDisk.disk}
          </span>}
        </div>
        {won && <p role="status" className="dsa-feedback">Puzzle solved in {moves} moves{moves === optimalMoves ? ' (optimal minimum)' : ' · optimal: ' + optimalMoves}.</p>}
        {!won && <Feedback notice={notice} fallback="Click anywhere on a peg with a disk, then the destination peg. You can also drag the top disk." />}
      </div>
    </div>
  </div>;
}

export default function Layer({simulation = 'stack'}) {
  const [mode, setMode] = useState(String(simulation).trim().toLowerCase());
  useEffect(() => {
    window.scrollTo(0,0);
  },[mode]);
  let view;
  if (mode === 'home' || mode === 'menu' || mode === 'members') view = null;
  else if (mode === 'tree') view = <BinaryTree />;
  else if (mode === 'search') view = <SearchTree />;
  else if (mode === 'hanoi') view = <Hanoi />;
  else view = <Parking key={mode} isStack={mode !== 'queue'} Button={Button} Feedback={Feedback} positiveInteger={positiveInteger} parkingExitSteps={parkingExitSteps} />;
  const currentStudy = STUDIES.find((study) => study.mode === mode);
  const navItems = [
    { mode: 'home', label: 'HOME' },
    { mode: 'members', label: 'MEMBERS' },
    { mode: 'menu', label: 'MENU' },
    ...STUDIES.map((study) => ({ mode: study.mode, label: study.navLabel })),
  ];
  return (
    <div className="dsa">
      <style>{styles}</style>
      <style>{shellStyles}</style>
      <nav className="dsa-app-nav" aria-label="Case study navigation">
        {navItems.map((item) => (
          <button
            type="button"
            key={item.mode}
            aria-current={mode === item.mode ? 'page' : undefined}
            onClick={() => setMode(item.mode)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      {mode === 'home' ? (
        <HomePage onSelect={setMode} />
      ) : mode === 'menu' ? (
        <MenuPage onSelect={setMode} />
      ) : mode === 'members' ? (
        <MembersPage />
      ) : (
        <main className="dsa-page dsa-study-page">
          <header className="dsa-page-heading">
            <span className="dsa-page-kicker">
              CASE STUDY #{currentStudy?.number ?? ''} • {currentStudy?.label ?? mode.toUpperCase()}
            </span>
            <h1>{currentStudy?.title ?? 'Interactive Case Study'}</h1>
            <p>{currentStudy?.description}</p>
          </header>
          {view}
        </main>
      )}
    </div>
  );
}