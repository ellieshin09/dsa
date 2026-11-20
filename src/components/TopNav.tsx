import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'HOME', to: '/' },
  { label: 'MEMBERS', to: '/members' },
  { label: 'MENU', to: '/menu' },
  { label: 'STACK', to: '/stack' },
  { label: 'QUEUE', to: '/queue' },
  { label: 'TREE', to: '/tree' },
  { label: 'SEARCH', to: '/search' },
  { label: 'HANOI', to: '/hanoi' },
];

export default function TopNav() {
  return (
    <header className="w-full bg-[#121212] text-white border-b border-[#121212] sticky top-0 z-40">
      <nav
        aria-label="Primary Navigation"
        className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-center overflow-x-auto"
      >
        <ul className="flex items-center justify-center gap-4 sm:gap-7 md:gap-9">
          {NAV_ITEMS.map((item) => (
            <li key={item.to} className="shrink-0">
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `font-mono text-xs sm:text-[13px] font-semibold tracking-wider uppercase whitespace-nowrap shrink-0 py-1.5 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D9531E] ${
                    isActive
                      ? 'text-white border-b-2 border-white'
                      : 'text-neutral-300 hover:text-white border-b-2 border-transparent'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
