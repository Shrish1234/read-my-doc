import { NavLink, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/today', label: 'Today' },
  { to: '/goals', label: 'Goals' },
  { to: '/sessions', label: 'Sessions' },
  { to: '/patterns', label: 'Patterns' },
  { to: '/review', label: 'Review' },
];

export function NavBar() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card" style={{ height: 56 }}>
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-8 md:px-8" style={{ paddingLeft: 32, paddingRight: 32 }}>
        <div className="flex items-center gap-8">
          <NavLink to="/today" className="text-lg font-semibold text-foreground hover:text-foreground">
            FocusOS
          </NavLink>
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `relative px-3 py-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <NavLink to="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
            <Settings size={20} />
          </NavLink>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
            TK
          </div>
        </div>
      </div>
    </header>
  );
}
