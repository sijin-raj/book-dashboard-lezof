"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AuthGuard from "@/components/AuthGuard";
import LoaderProvider from "@/components/LoaderProvider";
import ToastProvider from "@/components/ToastProvider";
import { clearToken } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
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

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = isSidebarOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSidebarOpen]);

  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };

  return (
    <AuthGuard>
      <ToastProvider>
        <LoaderProvider>
          <div className="dashboard-shell">
          <aside className={`sidebar ${isSidebarOpen ? "is-open" : ""}`}>
            <div className="sidebar-header">
              <img
                src="/lezof-dashboard-logo.svg"
                alt="Lezof"
                className="brand-logo"
              />
              <button
                type="button"
                className="sidebar-toggle"
                onClick={() => setIsSidebarOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>
            <nav className="nav-links">
              <Link
                href="/dashboard/summary"
                className={`nav-link ${
                  pathname?.includes("/summary") ? "active" : ""
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-icon" aria-hidden="true">
                <Image
                  src="/icons/Summary.svg"
                  alt=""
                  width={18}
                  height={18}
                />
                </span>
                Summary
              </Link>
              <Link
                href="/dashboard/appointments"
                className={`nav-link ${
                  pathname?.includes("/appointments") ? "active" : ""
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-icon" aria-hidden="true">
                <Image
                  src="/icons/Appointment.svg"
                  alt=""
                  width={18}
                  height={18}
                />
                </span>
                Appointments
              </Link>
              <Link
                href="/dashboard/calendar"
                className={`nav-link ${
                  pathname?.includes("/calendar") ? "active" : ""
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-icon" aria-hidden="true">
                <Image
                  src="/icons/calendar.svg"
                  alt=""
                  width={18}
                  height={18}
                />
                </span>
                Calendar
              </Link>
              <Link
                href="/dashboard/offers"
                className={`nav-link ${
                  pathname?.includes("/offers") ? "active" : ""
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-icon" aria-hidden="true">
                <Image
                  src="/icons/image.svg"
                  alt=""
                  width={18}
                  height={18}
                />
                </span>
                Offer Images
              </Link>
              <Link
                href="/dashboard/complaints"
                className={`nav-link ${
                  pathname?.includes("/complaints") ? "active" : ""
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-icon" aria-hidden="true">
                <Image
                  src="/icons/Customers.svg"
                  alt=""
                  width={18}
                  height={18}
                />
                </span>
                Complaint Log
              </Link>
              <Link
                href="/dashboard/users"
                className={`nav-link ${
                  pathname?.includes("/users") ? "active" : ""
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-icon" aria-hidden="true">
                <Image
                  src="/icons/Users.svg"
                  alt=""
                  width={18}
                  height={18}
                />
                </span>
                Users
              </Link>
              <Link
                href="/dashboard/customers"
                className={`nav-link ${
                  pathname?.includes("/customers") ? "active" : ""
                }`}
                onClick={() => setIsSidebarOpen(false)}
              >
                <span className="nav-icon" aria-hidden="true">
                <Image
                  src="/icons/Customers.svg"
                  alt=""
                  width={18}
                  height={18}
                />
                </span>
                Customers
              </Link>
            </nav>
            <div className="sidebar-footer">
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Profile</p>
              <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
                Secure your account and access.
              </p>
              <button
                type="button"
                className="button"
                onClick={() => {
                  setIsSidebarOpen(false);
                  handleLogout();
                }}
              >
                Logout
              </button>
            </div>
          </aside>
          <div
            className={`sidebar-backdrop ${isSidebarOpen ? "is-open" : ""}`}
            role="presentation"
            onClick={() => setIsSidebarOpen(false)}
          />
          <div className="main-content">
            <header className="topbar">
              <button
                type="button"
                className="sidebar-trigger"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open menu"
              >
                ☰
              </button>
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
        </LoaderProvider>
      </ToastProvider>
    </AuthGuard>
  );
}
