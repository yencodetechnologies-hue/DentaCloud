import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { MENU } from "../config/menu.js";
import { useAuth } from "../context/AuthContext.jsx";

function initials(name = "") {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const current = MENU.find((m) => m.path === location.pathname);
  const roleLabel = (user?.role || "dental-admin").replace("-", " ");

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
              <path d="M12 2C9.5 2 8 3.2 6.5 3.2C4.5 3.2 3 5 3 7.8C3 10.5 4 13 4.6 16C5.1 18.5 5.6 21 7.2 21C8.7 21 8.8 18 9.5 15.5C10 13.7 10.6 12.5 12 12.5C13.4 12.5 14 13.7 14.5 15.5C15.2 18 15.3 21 16.8 21C18.4 21 18.9 18.5 19.4 16C20 13 21 10.5 21 7.8C21 5 19.5 3.2 17.5 3.2C16 3.2 14.5 2 12 2Z" fill="#2FE6C4" />
            </svg>
          </div>
          <div className="brand-text">
            <div className="name">Evident Dental</div>
            <div className="sub">CLINIC OS · v3.2</div>
          </div>
        </div>

        <div className="branch-pill" title="Switch branch">
          <span className="lbl"><span className="dot"></span>Chennai · All Branches</span>
          <span className="chev">▾</span>
        </div>

        <nav className="nav-scroll">
          {MENU.map((item, i) =>
            item.section ? (
              <div className="nav-section-label" key={`s-${i}`}>{item.section}</div>
            ) : (
              <NavLink
                key={item.id}
                to={item.path}
                end={item.path === "/"}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
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
      </div>
    </div>
  );
}
