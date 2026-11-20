import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import CaseStudyHeader from '../components/CaseStudyHeader';

const MENU_CARDS = [
  {
    kicker: 'STACK (LIFO)',
    title: 'PARKING LOT (STACK)',
    description:
      'Single-opening 10-slot ascending LIFO garage with temporary holding bay exits, re-entry tracking, and live activity logs.',
    to: '/stack',
    action: 'LAUNCH MODULE',
  },
  {
    kicker: 'BINARY SEARCH',
    title: 'BINARY SEARCH TREE',
    description:
      'Strict numeric BST construction with fixed node count enforcement, dynamic SVG branching, and sorted in-order output.',
    to: '/search',
    action: 'LAUNCH MODULE',
  },
  {
    kicker: 'QUEUE (FIFO)',
    title: 'PARKING LOT (QUEUE)',
    description:
      'Single-opening 10-slot FIFO garage demonstrating front-car internal shifts versus inner-car boundary exit cascades.',
    to: '/queue',
    action: 'LAUNCH MODULE',
  },
  {
    kicker: 'RECURSION',
    title: 'TOWER OF HANOI',
    description:
      'Playable 3–8 disk puzzle across 3–5 pegs with drag/click controls and optimal Frame-Stewart automated playback.',
    to: '/hanoi',
    action: 'LAUNCH MODULE',
  },
  {
    kicker: 'BINARY TREE',
    title: 'CUSTOM BINARY TREE',
    description:
      'Build arbitrary value or expression trees via bulk level-order input or left/right placement, with animated traversals.',
    to: '/tree',
    action: 'LAUNCH MODULE',
  },
  {
    kicker: 'TEAM',
    title: 'BEHIND THE SCENE',
    description:
      'Meet the project contributors behind the UI/UX design, algorithmic engines, and interactive state architecture.',
    to: '/members',
    action: 'VIEW TEAM',
  },
];

export default function MenuPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <CaseStudyHeader
        kicker="PROGRAM DIRECTORY • 6 INTERACTIVE MODULES"
        title="Case Studies Menu"
        description="Select a program to launch the interactive visualization module or test your skills in the Challenge Zone."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {MENU_CARDS.map((item, idx) => (
          <Link
            key={item.to}
            to={item.to}
            className="group bg-[#D9D9D9] border border-[#121212] flex flex-col justify-between hover:border-[#D9531E] transition-colors"
          >
            <div>
              <div className="bg-[#1E2640] text-white px-4 py-2.5 flex items-center justify-between border-b border-[#121212]">
                <span className="font-mono text-xs font-bold uppercase tracking-widest">
                  {item.kicker}
                </span>
                <span className="font-mono text-xs text-neutral-300 tabular-nums">
                  0{idx + 1}
                </span>
              </div>

              <div className="p-6">
                <h2 className="font-display text-xl tracking-tight text-[#111111]">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm text-[#111111]/80 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </div>

            <div className="px-6 py-4 bg-[#CFCBC2] border-t border-[#9E9E9E] flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-[#111111] group-hover:bg-[#121212] group-hover:text-white transition-colors">
              <span>{item.action}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
