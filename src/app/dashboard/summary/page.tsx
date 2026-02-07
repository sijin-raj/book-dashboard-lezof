"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";

type AppointmentListResponse = {
  success: boolean;
  data: {
    total: number;
  };
};

type ComplaintReport = {
  total: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
  byChannel: Record<string, number>;
  byDepartment: Record<string, number>;
  avgResolutionTime: string | number;
  improvementCount: number;
};

type ComplaintReportResponse = {
  success: boolean;
  data: ComplaintReport;
};

export default function SummaryPage() {
  const [error, setError] = useState<string | null>(null);
  const [totalAppointments, setTotalAppointments] = useState<number | null>(
    null
  );
  const [pendingAppointments, setPendingAppointments] = useState<number | null>(
    null
  );
  const [complaintsReport, setComplaintsReport] =
    useState<ComplaintReport | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchCounts = async () => {
      try {
        const [totalResponse, pendingResponse, reportResponse] =
          await Promise.all([
          apiFetch<AppointmentListResponse>(
            "/api/dashboard/appointments?page=1&pageSize=1"
          ),
          apiFetch<AppointmentListResponse>(
            "/api/dashboard/appointments?page=1&pageSize=1&status=PENDING"
          ),
          apiFetch<ComplaintReportResponse>("/api/dashboard/complaints/report"),
        ]);
        if (isMounted) {
          setTotalAppointments(totalResponse.data.total);
          setPendingAppointments(pendingResponse.data.total);
          setComplaintsReport(reportResponse.data);
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

      <div className="card" style={{ marginTop: 18 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 18 }}>Periodic Report</h2>
          <span className="tag">Auto summary</span>
        </div>
        <div className="cards-grid" style={{ marginTop: 12 }}>
          <div className="card" style={{ padding: 14 }}>
            <p className="muted" style={{ margin: 0 }}>
              Total complaints
            </p>
            <h3 style={{ margin: "6px 0 0" }}>
              {complaintsReport ? complaintsReport.total : "-"}
            </h3>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <p className="muted" style={{ margin: 0 }}>
              Open / In Progress
            </p>
            <h3 style={{ margin: "6px 0 0" }}>
              {complaintsReport?.byStatus?.Open ?? 0} /{" "}
              {complaintsReport?.byStatus?.["In Progress"] ?? 0}
            </h3>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <p className="muted" style={{ margin: 0 }}>
              Closed
            </p>
            <h3 style={{ margin: "6px 0 0" }}>
              {complaintsReport?.byStatus?.Closed ?? 0}
            </h3>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <p className="muted" style={{ margin: 0 }}>
              Avg resolution time
            </p>
            <h3 style={{ margin: "6px 0 0" }}>
              {complaintsReport ? complaintsReport.avgResolutionTime : "-"}
            </h3>
          </div>
          <div className="card" style={{ padding: 14 }}>
            <p className="muted" style={{ margin: 0 }}>
              Improvement opportunities
            </p>
            <h3 style={{ margin: "6px 0 0" }}>
              {complaintsReport?.improvementCount ?? 0}
            </h3>
          </div>
        </div>

        <div className="cards-grid" style={{ marginTop: 18 }}>
          <div className="card" style={{ padding: 14 }}>
            <p style={{ marginTop: 0, fontWeight: 600 }}>By complaint type</p>
            {complaintsReport &&
            Object.entries(complaintsReport.byType || {}).length ? (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {Object.entries(complaintsReport.byType).map(([type, count]) => (
                  <li key={type}>
                    {type}: {count}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No data</p>
            )}
          </div>
          <div className="card" style={{ padding: 14 }}>
            <p style={{ marginTop: 0, fontWeight: 600 }}>By receiving channel</p>
            {complaintsReport &&
            Object.entries(complaintsReport.byChannel || {}).length ? (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {Object.entries(complaintsReport.byChannel).map(
                  ([channel, count]) => (
                    <li key={channel}>
                      {channel}: {count}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="muted">No data</p>
            )}
          </div>
          <div className="card" style={{ padding: 14 }}>
            <p style={{ marginTop: 0, fontWeight: 600 }}>By department</p>
            {complaintsReport &&
            Object.entries(complaintsReport.byDepartment || {}).length ? (
              <ul style={{ margin: 0, paddingLeft: 16 }}>
                {Object.entries(complaintsReport.byDepartment).map(
                  ([department, count]) => (
                    <li key={department}>
                      {department}: {count}
                    </li>
                  )
                )}
              </ul>
            ) : (
              <p className="muted">No data</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
