import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const QUICK_LAUNCH_CARDS = [
  {
    code: 'MODULE 01',
    title: 'PARKING LOT',
    subtitle: 'Stack (LIFO) & Queue (FIFO) single-lane vehicle simulation with live movement counters.',
    to: '/stack',
    cta: 'OPEN STACK',
  },
  {
    code: 'MODULE 02',
    title: 'BINARY TREE',
    subtitle: 'Custom node & expression builder with In-Order, Pre-Order, and Post-Order animations.',
    to: '/tree',
    cta: 'OPEN TREE',
  },
  {
    code: 'MODULE 03',
    title: 'BINARY SEARCH',
    subtitle: 'Strict numeric BST construction with step validation and sorted in-order verification.',
    to: '/search',
    cta: 'OPEN SEARCH',
  },
  {
    code: 'MODULE 04',
    title: 'TOWER OF HANOI',
    subtitle: 'Interactive multi-peg puzzle (3–5 pegs) with Frame-Stewart optimal auto-solver.',
    to: '/hanoi',
    cta: 'OPEN HANOI',
  },
];

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      {/* Hero Section */}
      <section className="border border-[#121212] bg-[#D9D9D9] p-6 sm:p-10 md:p-12">
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-block px-2.5 py-1 bg-[#1E2640] text-white font-mono text-xs font-semibold uppercase tracking-widest">
            DSA INTERACTIVE LABORATORY
          </span>
          <span className="h-[2px] flex-1 bg-[#D9531E]" aria-hidden="true" />
        </div>

        <h1 className="font-display text-3xl sm:text-5xl lg:text-[54px] leading-[1.04] tracking-tight text-[#111111] max-w-4xl text-balance">
          DATA STRUCTURES &amp; ALGORITHMS CASE STUDIES
        </h1>

        <p className="mt-5 text-base sm:text-lg text-[#111111]/85 max-w-3xl leading-relaxed">
          An intuitive web application designed to demonstrate Stacks (LIFO), Queues (FIFO),
          Binary Tree traversals, Binary Search Trees, and the classic Tower of Hanoi.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            to="/menu"
            className="inline-flex items-center gap-2.5 bg-[#121212] text-white font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider px-6 py-3.5 border border-[#121212] hover:bg-[#D9531E] hover:border-[#D9531E] transition-colors whitespace-nowrap shrink-0"
          >
            EXPLORE MENU &amp; CASE STUDIES
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Link>

          <Link
            to="/members"
            className="inline-flex items-center gap-2 bg-[#1E2640] text-white font-mono text-xs sm:text-sm font-semibold uppercase tracking-wider px-6 py-3.5 border border-[#1E2640] hover:bg-[#121212] transition-colors whitespace-nowrap shrink-0"
          >
            MEET MEMBERS
          </Link>
        </div>
      </section>

      {/* Bottom 4-Card Quick-Launch Row */}
      <section className="mt-10" aria-label="Quick Launch Modules">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-[#111111]">
            QUICK-LAUNCH CASE STUDIES
          </h2>
          <Link
            to="/queue"
            className="font-mono text-xs font-semibold uppercase tracking-wider text-[#D9531E] hover:underline whitespace-nowrap"
          >
            ALSO VIEW QUEUE (FIFO) →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {QUICK_LAUNCH_CARDS.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className="group bg-[#D9D9D9] border border-[#121212] p-5 flex flex-col justify-between hover:border-[#D9531E] hover:bg-[#E4E1DA] transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#9E9E9E]">
                  <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#1E2640]">
                    {card.code}
                  </span>
                  <span className="w-2.5 h-2.5 bg-[#D9531E]" aria-hidden="true" />
                </div>
                <h3 className="font-display text-xl tracking-tight text-[#111111]">
                  {card.title}
                </h3>
                <p className="mt-2.5 text-sm text-[#111111]/80 leading-relaxed">
                  {card.subtitle}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-[#9E9E9E] flex items-center justify-between font-mono text-xs font-bold uppercase tracking-wider text-[#111111] group-hover:text-[#D9531E]">
                <span>{card.cta}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
