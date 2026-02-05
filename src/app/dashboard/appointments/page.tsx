"use client";

import { Fragment, useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

type Appointment = {
  id: number;
  scheduledAt: string;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
  };
  service: {
    id: number;
    name: string;
  };
  appointmentServices?: {
    service: {
      id: number;
      name: string;
    };
  }[];
  car?: {
    model?: string | null;
    make?: string | null;
  } | null;
  vehicle?: {
    model?: string | null;
    make?: string | null;
  } | null;
  carModel?: string | null;
  vehicleModel?: string | null;
  vehicleBrand?: string | null;
  offer?: {
    id: number;
    title: string;
  } | null;
  statusHistory?: AppointmentHistory[];
};

type AppointmentHistory = {
  id: number;
  status: string;
  note: string | null;
  createdAt: string;
};

type ListResponse = {
  success: boolean;
  data: {
    total: number;
    page: number;
    pageSize: number;
    appointments: Appointment[];
  };
};

type HistoryResponse = {
  success: boolean;
  data: AppointmentHistory[];
};

type StatusResponse = {
  success: boolean;
  data: {
    id: number;
    status: string;
    updatedAt: string;
  };
};

const STATUS_OPTIONS = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

const resolveCarLabel = (appointment: Appointment) => {
  const carMake =
    appointment.car?.make ??
    appointment.vehicle?.make ??
    appointment.vehicleBrand ??
    null;
  const carModel =
    appointment.car?.model ??
    appointment.vehicle?.model ??
    appointment.carModel ??
    appointment.vehicleModel ??
    null;
  if (carMake && carModel) {
    return `${carMake} ${carModel}`;
  }
  return carMake ?? carModel ?? "-";
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [includeHistory, setIncludeHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historyMap, setHistoryMap] = useState<
    Record<number, AppointmentHistory[]>
  >({});
  const [statusNote, setStatusNote] = useState<Record<number, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (serviceId) params.set("serviceId", serviceId);
    if (customerId) params.set("customerId", customerId);
    if (search) params.set("search", search);
    if (startDate) params.set("startDate", new Date(startDate).toISOString());
    if (endDate) params.set("endDate", new Date(endDate).toISOString());
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    params.set("includeHistory", includeHistory ? "true" : "false");
    return params.toString();
  }, [
    status,
    serviceId,
    customerId,
    search,
    startDate,
    endDate,
    page,
    pageSize,
    includeHistory,
  ]);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch<ListResponse>(
        `/api/dashboard/appointments?${queryString}`
      );
      setAppointments(response.data.appointments);
      setTotal(response.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  const handleStatusUpdate = async (appointmentId: number, newStatus: string) => {
    try {
      const response = await apiFetch<StatusResponse>(
        `/api/dashboard/appointments/${appointmentId}/status`,
        {
          method: "PATCH",
          body: JSON.stringify({
            status: newStatus,
            note: statusNote[appointmentId] || undefined,
          }),
        }
      );

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === appointmentId
            ? { ...appointment, status: response.data.status }
            : appointment
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const toggleHistory = async (appointmentId: number) => {
    if (historyMap[appointmentId]) {
      setHistoryMap((prev) => {
        const next = { ...prev };
        delete next[appointmentId];
        return next;
      });
      return;
    }

    try {
      const response = await apiFetch<HistoryResponse>(
        `/api/dashboard/appointments/${appointmentId}/history`
      );
      setHistoryMap((prev) => ({
        ...prev,
        [appointmentId]: response.data,
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "History failed");
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const selectedCount = selectedIds.size;
  const allSelected =
    appointments.length > 0 && selectedIds.size === appointments.length;
  const dailyAppointments = useMemo(() => {
    const today = new Date();
    const todayKey = today.toDateString();
    return appointments.filter(
      (appointment) =>
        new Date(appointment.scheduledAt).toDateString() === todayKey
    );
  }, [appointments]);

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allSelected) {
        return new Set();
      }
      return new Set(appointments.map((appointment) => appointment.id));
    });
  };

  const toggleSelectOne = (appointmentId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(appointmentId)) {
        next.delete(appointmentId);
      } else {
        next.add(appointmentId);
      }
      return next;
    });
  };

  const toggleExpanded = (appointmentId: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(appointmentId)) {
        next.delete(appointmentId);
      } else {
        next.add(appointmentId);
      }
      return next;
    });
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U";

  const pageNumbers = (() => {
    const windowSize = 5;
    if (totalPages <= windowSize) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, start + windowSize - 1);
    const adjustedStart = Math.max(1, end - windowSize + 1);
    return Array.from(
      { length: end - adjustedStart + 1 },
      (_, idx) => adjustedStart + idx
    );
  })();

  return (
    <section>
      <h1 className="section-title">Appointments</h1>
      {error ? <p className="error">{error}</p> : null}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="filter-grid">
        <label>
          Status
          <select
            className="select"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All</option>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label>
          Service ID
          <input
            className="input"
            value={serviceId}
            onChange={(event) => {
              setServiceId(event.target.value);
              setPage(1);
            }}
            placeholder="1"
          />
        </label>
        <label>
          Customer ID
          <input
            className="input"
            value={customerId}
            onChange={(event) => {
              setCustomerId(event.target.value);
              setPage(1);
            }}
            placeholder="1"
          />
        </label>
        <label>
          Search
          <input
            className="input"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="name/email/phone"
          />
        </label>
        <label>
          Start date
          <input
            className="input"
            type="date"
            value={startDate}
            onChange={(event) => {
              setStartDate(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          End date
          <input
            className="input"
            type="date"
            value={endDate}
            onChange={(event) => {
              setEndDate(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <label>
          Page size
          <input
            className="input"
            type="number"
            min={1}
            max={100}
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value) || 20);
              setPage(1);
            }}
          />
        </label>
        <label>
          Include history
          <input
            type="checkbox"
            checked={includeHistory}
            onChange={(event) => setIncludeHistory(event.target.checked)}
            style={{ marginLeft: 8 }}
          />
        </label>
        </div>
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Daily appointments</h2>
            <p className="muted" style={{ marginTop: 4 }}>
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <span className="tag">{dailyAppointments.length} total</span>
        </div>
        {dailyAppointments.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {dailyAppointments.map((appointment) => (
              <div
                key={appointment.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: "10px 12px",
                  background: "var(--surface-muted)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>
                    {appointment.customer.name}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {resolveCarLabel(appointment)} ·{" "}
                    {appointment.appointmentServices?.length
                      ? appointment.appointmentServices
                          .map((entry) => entry.service.name)
                          .join(", ")
                      : appointment.service.name}
                  </div>
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {new Date(appointment.scheduledAt).toLocaleTimeString(
                    undefined,
                    { hour: "2-digit", minute: "2-digit" }
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No appointments scheduled for today.</p>
        )}
      </div>
      {loading ? <p>Loading...</p> : null}
      <div className="card" style={{ marginTop: 18 }}>
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <label className="table-checkbox">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleSelectAll}
                aria-label="Select all"
              />
              <span>{selectedCount} Selected</span>
            </label>
            <button type="button" className="table-toolbar-button">
              Share
            </button>
            <button type="button" className="table-toolbar-button">
              Edit
            </button>
            <button
              type="button"
              className="table-toolbar-button table-toolbar-danger"
            >
              Delete
            </button>
          </div>
          <div className="table-toolbar-right">
            <button type="button" className="table-toolbar-button">
              Filter
            </button>
            <button type="button" className="table-toolbar-button">
              Sort by
            </button>
          </div>
        </div>
        <table className="table table-advanced">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </th>
              <th className="table-sortable">ID</th>
              <th className="table-sortable">Customer</th>
              <th className="table-sortable">Car</th>
              <th className="table-sortable">Phone</th>
              <th className="table-sortable">Services</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
          {appointments.map((appointment) => (
            <Fragment key={appointment.id}>
              <tr>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(appointment.id)}
                    onChange={() => toggleSelectOne(appointment.id)}
                    aria-label={`Select appointment ${appointment.id}`}
                  />
                </td>
                <td className="table-id">{appointment.id}</td>
                <td>
                  <div className="table-customer">
                    <div className="table-avatar">
                      {getInitials(appointment.customer.name)}
                    </div>
                    <div>
                      <div className="table-primary">
                        {appointment.customer.name}
                      </div>
                      <div className="table-muted">
                        {appointment.customer.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td>{resolveCarLabel(appointment)}</td>
                <td>{appointment.customer.phone || "-"}</td>
                <td className="table-services">
                  {appointment.appointmentServices?.length
                    ? appointment.appointmentServices
                        .map((entry) => entry.service.name)
                        .join(", ")
                    : appointment.service.name}
                </td>
                <td>
                  <span className={`status-pill status-${appointment.status.toLowerCase()}`}>
                    <span className="status-dot" />
                    {appointment.status}
                  </span>
                </td>
                <td className="table-actions">
                  <button
                    type="button"
                    className="table-icon-button"
                    onClick={() => toggleExpanded(appointment.id)}
                    aria-label="Toggle details"
                  >
                    {expandedIds.has(appointment.id) ? "▴" : "▾"}
                  </button>
                </td>
              </tr>
              {expandedIds.has(appointment.id) ? (
                <tr className="table-expanded-row">
                  <td colSpan={8}>
                    <div className="table-expanded">
                      <div>
                        <div className="table-expanded-title">Scheduled</div>
                        <div>
                          {new Date(appointment.scheduledAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="table-expanded-title">Notes</div>
                        <div>{appointment.notes || "No notes"}</div>
                      </div>
                      <div>
                        <div className="table-expanded-title">Status update</div>
                        <div className="table-expanded-actions">
                          <select
                            className="select"
                            value={appointment.status}
                            onChange={(event) =>
                              handleStatusUpdate(
                                appointment.id,
                                event.target.value
                              )
                            }
                          >
                            {STATUS_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                          <input
                            className="input"
                            placeholder="Note (optional)"
                            value={statusNote[appointment.id] || ""}
                            onChange={(event) =>
                              setStatusNote((prev) => ({
                                ...prev,
                                [appointment.id]: event.target.value,
                              }))
                            }
                          />
                          <button
                            type="button"
                            className="button button-outline"
                            onClick={() => toggleHistory(appointment.id)}
                          >
                            {historyMap[appointment.id]
                              ? "Hide history"
                              : "Show history"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
              {historyMap[appointment.id] ? (
                <tr>
                  <td colSpan={8} style={{ paddingBottom: 12 }}>
                    <div style={{ background: "#f7f7f7", padding: 12 }}>
                      <strong>Status history</strong>
                      <ul>
                        {historyMap[appointment.id]?.map((entry) => (
                          <li key={entry.id}>
                            {entry.status} -{" "}
                            {new Date(entry.createdAt).toLocaleString()}
                            {entry.note ? ` (${entry.note})` : ""}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </td>
                </tr>
              ) : null}
            </Fragment>
          ))}
          </tbody>
        </table>
      </div>
      <div className="table-pagination">
        <div className="table-pagination-left">
          <span className="table-muted">Show</span>
          <select
            className="select table-page-size"
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value) || 20);
              setPage(1);
            }}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div className="table-pagination-center">
          <button
            type="button"
            className="table-page-button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
          >
            ‹
          </button>
          {pageNumbers.map((pageNumber) => (
            <button
              key={pageNumber}
              type="button"
              className={`table-page-button ${
                pageNumber === page ? "is-active" : ""
              }`}
              onClick={() => setPage(pageNumber)}
            >
              {pageNumber}
            </button>
          ))}
          <button
            type="button"
            className="table-page-button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={page >= totalPages}
          >
            ›
          </button>
        </div>
        <div className="table-pagination-right">
          <span className="table-muted">
            Page {page} of {totalPages}
          </span>
        </div>
      </div>
    </section>
  );
}
