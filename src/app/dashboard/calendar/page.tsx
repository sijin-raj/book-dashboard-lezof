"use client";

import { useEffect, useMemo, useState } from "react";

import { apiFetch } from "@/lib/api";

type Appointment = {
  id: number;
  scheduledAt: string;
  status: string;
  customer: {
    name: string;
  };
  service: {
    name: string;
  };
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

type CalendarDay = {
  date: Date;
  isCurrentMonth: boolean;
  key: string;
};

const MAX_PAGE_SIZE = 100;

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function buildCalendarDays(currentMonth: Date): CalendarDay[] {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  const days: CalendarDay[] = [];

  const startDate = new Date(year, month, 1 - firstWeekday);
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    days.push({
      date,
      isCurrentMonth: date.getMonth() === month,
      key: formatDateKey(date),
    });
  }

  return days;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageWarning, setPageWarning] = useState<string | null>(null);
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const days = useMemo(() => buildCalendarDays(currentMonth), [currentMonth]);

  const monthLabel = currentMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const fetchAppointments = async (monthDate: Date) => {
    setLoading(true);
    setError(null);
    setPageWarning(null);

    const startDate = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth(),
      1,
      0,
      0,
      0
    );
    const endDate = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    try {
      const response = await apiFetch<ListResponse>(
        `/api/dashboard/appointments?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&page=1&pageSize=${MAX_PAGE_SIZE}`
      );
      setAppointments(response.data.appointments);
      if (response.data.total > response.data.pageSize) {
        setPageWarning(
          "Showing first 100 appointments. Use the appointments list for full results."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load calendar");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    const today = new Date();
    const inMonth =
      today.getFullYear() === currentMonth.getFullYear() &&
      today.getMonth() === currentMonth.getMonth();
    setSelectedDayKey(formatDateKey(inMonth ? today : currentMonth));
  }, [currentMonth]);

  const appointmentsByDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const appointment of appointments) {
      const date = new Date(appointment.scheduledAt);
      const key = formatDateKey(date);
      if (!map[key]) {
        map[key] = [];
      }
      map[key].push(appointment);
    }
    return map;
  }, [appointments]);

  const goToPreviousMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  };

  const selectedDay = selectedDayKey
    ? days.find((day) => day.key === selectedDayKey) ?? null
    : null;
  const selectedAppointments = selectedDayKey
    ? appointmentsByDay[selectedDayKey] || []
    : [];

  return (
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 18,
        }}
      >
        <div>
          <h1 className="section-title">Calendar</h1>
          <p className="muted">{monthLabel}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button button-outline" onClick={goToPreviousMonth}>
            Prev
          </button>
          <button className="button" onClick={goToNextMonth}>
            Next
          </button>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {pageWarning ? <p className="muted">{pageWarning}</p> : null}
      {loading ? <p>Loading...</p> : null}

      <div
        className="card"
        style={{ marginTop: 12, maxWidth: 860, marginInline: "auto" }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="muted" style={{ fontSize: 11 }}>
              {day}
            </div>
          ))}
          {days.map((day) => {
            const dayAppointments = appointmentsByDay[day.key] || [];
            const isSelected = day.key === selectedDayKey;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => {
                  setSelectedDayKey(day.key);
                  setIsModalOpen(true);
                }}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  padding: 6,
                  minHeight: 86,
                  background: day.isCurrentMonth ? "#fff" : "#f7f7f7",
                  boxShadow: isSelected
                    ? "0 0 0 2px rgba(79, 70, 229, 0.2)"
                    : "none",
                  textAlign: "left",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: day.isCurrentMonth ? "inherit" : "#9aa0a6",
                    marginBottom: 6,
                  }}
                >
                  {day.date.getDate()}
                </div>
                <div style={{ display: "grid", gap: 6 }}>
                  {dayAppointments.slice(0, 3).map((appointment) => {
                    const time = new Date(
                      appointment.scheduledAt
                    ).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div
                        key={appointment.id}
                        style={{
                          background: "var(--surface-muted)",
                          padding: "4px 6px",
                          borderRadius: 10,
                          fontSize: 10,
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          {time} · {appointment.customer.name}
                        </div>
                        <div className="muted">{appointment.service.name}</div>
                      </div>
                    );
                  })}
                  {dayAppointments.length > 3 ? (
                    <span className="muted" style={{ fontSize: 10 }}>
                      +{dayAppointments.length - 3} more
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {isModalOpen && selectedDay ? (
        <div
          role="presentation"
          onClick={() => setIsModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            zIndex: 50,
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="day-appointments-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(640px, 100%)",
              maxHeight: "80vh",
              overflow: "auto",
              background: "#fff",
              borderRadius: 16,
              padding: 20,
              boxShadow: "0 16px 48px rgba(15, 23, 42, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <h2 id="day-appointments-title" style={{ margin: 0 }}>
                  Appointments
                </h2>
                <p className="muted" style={{ marginTop: 4 }}>
                  {selectedDay.date.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                type="button"
                className="button button-outline"
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div style={{ marginTop: 12 }}>
              <p className="muted" style={{ fontSize: 12 }}>
                {selectedAppointments.length} total
              </p>
              {selectedAppointments.length ? (
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  {selectedAppointments.map((appointment) => {
                    const time = new Date(
                      appointment.scheduledAt
                    ).toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div
                        key={appointment.id}
                        style={{
                          border: "1px solid var(--border)",
                          borderRadius: 12,
                          padding: "8px 12px",
                          background: "var(--surface-muted)",
                        }}
                      >
                        <div style={{ fontWeight: 600 }}>
                          {time} · {appointment.customer.name}
                        </div>
                        <div className="muted">{appointment.service.name}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="muted" style={{ marginTop: 8 }}>
                  No appointments scheduled for this day.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
