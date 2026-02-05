"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

type AppointmentListResponse = {
  success: boolean;
  data: {
    total: number;
  };
};

export default function SummaryPage() {
  const [error, setError] = useState<string | null>(null);
  const [totalAppointments, setTotalAppointments] = useState<number | null>(
    null
  );
  const [pendingAppointments, setPendingAppointments] = useState<number | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      try {
        const [totalResponse, pendingResponse] = await Promise.all([
          apiFetch<AppointmentListResponse>(
            "/api/dashboard/appointments?page=1&pageSize=1"
          ),
          apiFetch<AppointmentListResponse>(
            "/api/dashboard/appointments?page=1&pageSize=1&status=PENDING"
          ),
        ]);
        if (isMounted) {
          setTotalAppointments(totalResponse.data.total);
          setPendingAppointments(pendingResponse.data.total);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      }
    };

    fetchCounts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section>
      <h1 className="section-title">Dashboard</h1>
      {error ? <p className="error">{error}</p> : null}
      <div className="cards-grid" style={{ marginTop: 18 }}>
        <div className="card">
          <p className="muted">Total appointments</p>
          <h2 style={{ marginTop: 6 }}>
            {totalAppointments === null ? "Loading..." : totalAppointments}
          </h2>
          <p className="muted" style={{ marginTop: 8 }}>
            All appointments across statuses.
          </p>
        </div>
        <div className="card">
          <p className="muted">Pending appointments</p>
          <h2 style={{ marginTop: 6 }}>
            {pendingAppointments === null ? "Loading..." : pendingAppointments}
          </h2>
          <p className="muted" style={{ marginTop: 8 }}>
            Awaiting confirmation or action.
          </p>
        </div>
      </div>
    </section>
  );
}
