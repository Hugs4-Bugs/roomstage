import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard', icon: '01' },
  { to: '/clients', label: 'Clients', icon: '02' },
  { to: '/jobs', label: 'Jobs', icon: '03' },
  { to: '/projects', label: 'Projects', icon: '04' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Compact top bar on mobile only -- the full sidebar below would push
          all page content below the fold on a phone otherwise. */}
      <div className="md:hidden flex items-center justify-between bg-ink text-paper px-4 py-3">
        <span className="font-display font-semibold text-lg">Roomstage</span>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="font-mono text-xs px-3 py-2 border border-paper/30 rounded-sm"
          aria-label="Toggle menu"
        >
          {mobileOpen ? 'Close ✕' : 'Menu ☰'}
        </button>
      </div>

      <aside
        className={`${mobileOpen ? 'flex' : 'hidden'} md:flex md:w-64 shrink-0 bg-ink text-paper grid-texture flex-col justify-between`}
      >
        <div>
          <div className="p-6 hidden md:block">
            <h1 className="font-display font-semibold text-xl">Roomstage</h1>
            <p className="font-mono text-xs text-paper/60 mt-1">v1.0 — client + job tracker</p>
          </div>
          <nav className="px-3 pt-3 md:pt-0">
            {navItems.map((item) => {
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-3 py-3 md:py-2.5 rounded-sm mb-1 transition-colors ${
                    active ? 'bg-accent text-white' : 'hover:bg-white/10'
                  }`}
                >
                  <span className="font-mono text-xs opacity-60">{item.icon}</span>
                  <span className="font-body text-sm">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="p-6 text-sm">
          <p className="font-body">{user?.name}</p>
          <p className="text-paper/60 text-xs">{user?.email}</p>
          <button onClick={logout} className="mt-3 font-mono text-xs text-paper/70 hover:text-white">
            log out →
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6 md:p-10 max-w-5xl">{children}</main>
    </div>
  );
}
