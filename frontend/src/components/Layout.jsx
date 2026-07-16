import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { MENU } from "../config/menu.js";
import { useAuth } from "../context/AuthContext.jsx";
import useUserBranch from "../hooks/useUserBranch.js";
import ActiveBranchSelect from "./ActiveBranchSelect.jsx";
import VoiceAssistant from "./VoiceAssistant.jsx";

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const { branchName } = useUserBranch();
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname, location.search]);

  const currentPath = `${location.pathname}${location.search || ""}`;
  const current = MENU.find((m) => {
    if (!m.path) return false;
    if (m.path.includes("?")) return m.path === currentPath;
    return m.path === location.pathname && !location.search;
  }) || MENU.find((m) => m.path === location.pathname);
  const roleLabel = (user?.role || "dental-admin").replace("-", " ");
  const visibleMenu = MENU.filter((item) => {
    if (item.accountTypes && !item.accountTypes.includes(user?.accountType || "clinic")) return false;
    if (item.section) return true;
    if (item.roles && !item.roles.includes(user?.role)) return false;
    return true;
  });
  // drop section headers that end up with no visible items under them
  const menu = visibleMenu.filter((item, i) => {
    if (!item.section) return true;
    for (let j = i + 1; j < visibleMenu.length; j++) {
      if (visibleMenu[j].section) return false;
      return true;
    }
    return false;
  });

  function navIsActive(itemPath, isActive) {
    if (itemPath.includes("?")) {
      return currentPath === itemPath;
    }
    // Prefer the query-string sibling when it matches (e.g. Billing vs Billed)
    const querySiblingActive = MENU.some(
      (m) => m.path?.startsWith(`${itemPath}?`) && m.path === currentPath
    );
    if (querySiblingActive) return false;
    return isActive;
  }

  return (
    <div className="app-shell">
      {drawerOpen && (
        <div className="drawer-overlay" onClick={() => setDrawerOpen(false)} />
      )}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${drawerOpen ? "mobile-open" : ""}`}>
        <div className="brand">
          <div className="tooth-mark">
            <span className="pulse"></span>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2C9.5 2 8 3.2 6.5 3.2C4.5 3.2 3 5 3 7.8C3 10.5 4 13 4.6 16C5.1 18.5 5.6 21 7.2 21C8.7 21 8.8 18 9.5 15.5C10 13.7 10.6 12.5 12 12.5C13.4 12.5 14 13.7 14.5 15.5C15.2 18 15.3 21 16.8 21C18.4 21 18.9 18.5 19.4 16C20 13 21 10.5 21 7.8C21 5 19.5 3.2 17.5 3.2C16 3.2 14.5 2 12 2Z" fill="#1E90FF" />
            </svg>
          </div>
          <div className="brand-text">
            <div className="name">Denta Cloud</div>
            <div className="sub">CLINIC OS · v3.2</div>
          </div>
        </div>

        {branchName && (
          <div className="branch-pill" title="Your clinic">
            <span className="lbl"><span className="dot"></span>{branchName}</span>
          </div>
        )}

        <nav className="nav-scroll">
          {menu.map((item, i) =>
            item.section ? (
              <div className="nav-section-label" key={`s-${i}`}>{item.section}</div>
            ) : (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === "/" || item.path.includes("?")}
                className={({ isActive }) => `nav-item ${navIsActive(item.path, isActive) ? "active" : ""}`}
                title={item.label}
                onClick={() => setDrawerOpen(false)}
              >
                <span className="ic">{item.icon}</span>
                <span className="lbl">{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <div className="sidebar-foot">
          <div className="collapse-btn" onClick={() => setCollapsed((c) => !c)}>
            <span className="arrow">⟨⟨</span>
            <span className="txt">Collapse</span>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="hamburger"
              aria-label="Open menu"
              onClick={() => setDrawerOpen((o) => !o)}
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
            <div className="title-block">
              <div className="eyebrow">{current?.section || (current?.path === "/" ? "OVERVIEW" : "MANAGEMENT")}</div>
              <h1>{current?.label || "Dashboard"}</h1>
            </div>
          </div>
          <div className="topbar-right">
            <ActiveBranchSelect />
            <div className="search-box">
              <span>🔍</span>
              <input type="text" placeholder="Search patients, doctors, invoices..." />
            </div>
            <div className="icon-btn">🔔<span className="badge">6</span></div>
            <div className="icon-btn mail">✉️<span className="badge">2</span></div>
            <div className="user-menu">
              <div className="avatar" onClick={() => setMenuOpen((o) => !o)}>
                {initials(user?.name) || "AD"}
              </div>
              {menuOpen && (
                <div className="user-dropdown">
                  <div className="u-head">
                    <div className="n">{user?.name}</div>
                    <div className="e">{user?.email}</div>
                    <span className="badge-pill badge-green" style={{ marginTop: 8, textTransform: "capitalize" }}>{roleLabel}</span>
                  </div>
                  <div className="u-item" onClick={logout}>🚪 Logout</div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
        <VoiceAssistant />
      </div>
    </div>
  );
}
