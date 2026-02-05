"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AuthGuard from "@/components/AuthGuard";
import ToastProvider from "@/components/ToastProvider";
import { clearToken } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [locale, setLocale] = useState<"en" | "ar">(() => {
    if (typeof window === "undefined") return "en";
    const stored = window.localStorage.getItem("locale");
    return stored === "ar" || stored === "en" ? stored : "en";
  });

  useEffect(() => {
    if (typeof document === "undefined") return;
    const direction = locale === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = locale;
    document.documentElement.dir = direction;
    window.localStorage.setItem("locale", locale);
  }, [locale]);

  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };

  return (
    <AuthGuard>
      <ToastProvider>
        <div className="dashboard-shell">
          <aside className="sidebar">
            <div className="sidebar-header">
              <img
                src="/lezof-dashboard-logo.svg"
                alt="Lezof"
                className="brand-logo"
              />
              <span className="muted">≡</span>
            </div>
            <nav className="nav-links">
              <Link
                href="/dashboard/summary"
                className={`nav-link ${
                  pathname?.includes("/summary") ? "active" : ""
                }`}
              >
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M3 13h6V3H3v10Zm0 8h6v-6H3v6Zm12 0h6V11h-6v10Zm0-18v6h6V3h-6Z"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Summary
              </Link>
              <Link
                href="/dashboard/appointments"
                className={`nav-link ${
                  pathname?.includes("/appointments") ? "active" : ""
                }`}
              >
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M7 2v3M17 2v3M4 7h16M6 11h4m-4 4h8"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="17"
                      rx="2"
                      strokeWidth="1.6"
                    />
                  </svg>
                </span>
                Appointments
              </Link>
              <Link
                href="/dashboard/calendar"
                className={`nav-link ${
                  pathname?.includes("/calendar") ? "active" : ""
                }`}
              >
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect
                      x="3"
                      y="4"
                      width="18"
                      height="17"
                      rx="2"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M7 2v3M17 2v3M3 9h18"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                Calendar
              </Link>
              <Link
                href="/dashboard/offers"
                className={`nav-link ${
                  pathname?.includes("/offers") ? "active" : ""
                }`}
              >
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M4 5h16v14H4z"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="m8 13 2.5 2.5 4-4 3.5 3.5"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <circle cx="9" cy="9" r="1.5" strokeWidth="1.6" />
                  </svg>
                </span>
                Offer Images
              </Link>
              <Link
                href="/dashboard/users"
                className={`nav-link ${
                  pathname?.includes("/users") ? "active" : ""
                }`}
              >
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M16 11a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M4 20a8 8 0 0 1 16 0"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                Users
              </Link>
              <Link
                href="/dashboard/customers"
                className={`nav-link ${
                  pathname?.includes("/customers") ? "active" : ""
                }`}
              >
                <span className="nav-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      d="M8.5 10a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0Z"
                      strokeWidth="1.6"
                    />
                    <path
                      d="M2 20a7 7 0 0 1 14 0"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M17 14a4 4 0 0 1 5 6"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                Customers
              </Link>
            </nav>
            <div className="sidebar-footer">
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Profile</p>
              <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                Secure your account and access.
              </p>
              <button type="button" className="button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </aside>
          <div className="main-content">
            <header className="topbar">
              <input className="search-input" placeholder="Search anything..." />
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() =>
                    setLocale((prev) => (prev === "ar" ? "en" : "ar"))
                  }
                >
                  {locale === "ar" ? "English" : "العربية"}
                </button>
                <span className="tag">Admin</span>
              </div>
            </header>
            <main>{children}</main>
          </div>
        </div>
      </ToastProvider>
    </AuthGuard>
  );
}
