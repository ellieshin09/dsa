import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import TopNav from './components/TopNav';
import HomePage from './pages/HomePage';
import MembersPage from './pages/MembersPage';
import MenuPage from './pages/MenuPage';
import StackPage from './pages/StackPage';
import QueuePage from './pages/QueuePage';
import TreePage from './pages/TreePage';
import SearchPage from './pages/SearchPage';
import HanoiPage from './pages/HanoiPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-[#F5F0E6] text-[#111111]">
        <TopNav />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/members" element={<MembersPage />} />
            <Route path="/menu" element={<MenuPage />} />
            <Route path="/stack" element={<StackPage />} />
            <Route path="/queue" element={<QueuePage />} />
            <Route path="/tree" element={<TreePage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/hanoi" element={<HanoiPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-[#121212] bg-[#ECE7DC] py-4 px-6 mt-12">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 font-mono text-xs text-[#6B6B6B]">
            <span>DATA STRUCTURES &amp; ALGORITHMS CASE STUDIES</span>
            <span>PURE CLIENT-SIDE INTERACTIVE SIMULATOR</span>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
