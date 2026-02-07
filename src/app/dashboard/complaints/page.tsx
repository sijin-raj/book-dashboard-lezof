"use client";

import { useCallback, useEffect, useState } from "react";
import { FaEye } from "react-icons/fa";

import { apiFetch } from "@/lib/api";
import { emitToast } from "@/lib/toast";

type ReceivingChannel = "WhatsApp" | "Call" | "Walk-in" | "Other";
type ComplaintType =
  | "Service Quality"
  | "Delay"
  | "Pricing"
  | "Staff Behavior"
  | "Technician Behavior";
type ComplaintStatus = "Open" | "In Progress" | "Closed";

type ComplaintRecord = {
  id: string | number;
  complaintNumber: string;
  complaintDate: string;
  receivingChannel: ReceivingChannel;
  customerName: string;
  contactNumber: string;
  complaintDescription: string;
  complaintType: ComplaintType;
  responsibleDepartment: string;
  actionTaken: string;
  resolutionTimeHours: number | "";
  complaintStatus: ComplaintStatus;
  resolutionOutcome: string;
  improvementOpportunity: string;
  notes: string;
};

type ApiComplaintRecord = Omit<
  ComplaintRecord,
  "receivingChannel" | "complaintType" | "complaintStatus" | "complaintDate"
> & {
  receivingChannel: "WHATSAPP" | "CALL" | "WALK_IN" | "OTHER";
  complaintType:
    | "SERVICE_QUALITY"
    | "DELAY"
    | "PRICING"
    | "STAFF_BEHAVIOR"
    | "TECHNICIAN_BEHAVIOR";
  complaintStatus: "OPEN" | "IN_PROGRESS" | "CLOSED";
  complaintDate: string;
};

const CHANNELS: ReceivingChannel[] = [
  "WhatsApp",
  "Call",
  "Walk-in",
  "Other",
];

const COMPLAINT_TYPES: ComplaintType[] = [
  "Service Quality",
  "Delay",
  "Pricing",
  "Staff Behavior",
  "Technician Behavior",
];

const STATUSES: ComplaintStatus[] = ["Open", "In Progress", "Closed"];

const toApiEnum = {
  channel: (value: ReceivingChannel) => {
    switch (value) {
      case "WhatsApp":
        return "WHATSAPP";
      case "Call":
        return "CALL";
      case "Walk-in":
        return "WALK_IN";
      case "Other":
        return "OTHER";
      default:
        return "OTHER";
    }
  },
  type: (value: ComplaintType) => {
    switch (value) {
      case "Service Quality":
        return "SERVICE_QUALITY";
      case "Delay":
        return "DELAY";
      case "Pricing":
        return "PRICING";
      case "Staff Behavior":
        return "STAFF_BEHAVIOR";
      case "Technician Behavior":
        return "TECHNICIAN_BEHAVIOR";
      default:
        return "SERVICE_QUALITY";
    }
  },
  status: (value: ComplaintStatus) => {
    switch (value) {
      case "Open":
        return "OPEN";
      case "In Progress":
        return "IN_PROGRESS";
      case "Closed":
        return "CLOSED";
      default:
        return "OPEN";
    }
  },
};

const fromApiEnum = {
  channel: (value: string): ReceivingChannel => {
    switch (value) {
      case "WHATSAPP":
        return "WhatsApp";
      case "CALL":
        return "Call";
      case "WALK_IN":
        return "Walk-in";
      case "OTHER":
        return "Other";
      default:
        return "Other";
    }
  },
  type: (value: string): ComplaintType => {
    switch (value) {
      case "SERVICE_QUALITY":
        return "Service Quality";
      case "DELAY":
        return "Delay";
      case "PRICING":
        return "Pricing";
      case "STAFF_BEHAVIOR":
        return "Staff Behavior";
      case "TECHNICIAN_BEHAVIOR":
        return "Technician Behavior";
      default:
        return "Service Quality";
    }
  },
  status: (value: string): ComplaintStatus => {
    switch (value) {
      case "OPEN":
        return "Open";
      case "IN_PROGRESS":
        return "In Progress";
      case "CLOSED":
        return "Closed";
      default:
        return "Open";
    }
  },
};

const generateComplaintNumber = () => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const random = Math.floor(1000 + Math.random() * 9000);
  return `CMP-${date}-${random}`;
};

const createEmptyForm = (): ComplaintRecord => ({
  id: "",
  complaintNumber: generateComplaintNumber(),
  complaintDate: new Date().toISOString().slice(0, 10),
  receivingChannel: "WhatsApp",
  customerName: "",
  contactNumber: "",
  complaintDescription: "",
  complaintType: "Service Quality",
  responsibleDepartment: "",
  actionTaken: "",
  resolutionTimeHours: "",
  complaintStatus: "Open",
  resolutionOutcome: "",
  improvementOpportunity: "",
  notes: "",
});

const toCsv = (rows: ComplaintRecord[]) => {
  const headers = [
    "Complaint Number",
    "Complaint Date",
    "Receiving Channel",
    "Customer Name",
    "Contact Number",
    "Complaint Description",
    "Complaint Type",
    "Responsible Department",
    "Action Taken",
    "Resolution Time (Hours)",
    "Complaint Status",
    "Resolution Outcome",
    "Improvement Opportunity Identified",
    "Notes",
  ];

  const escape = (value: string) =>
    `"${value.replace(/"/g, '""').replace(/\n/g, " ")}"`;

  const lines = rows.map((row) =>
    [
      row.complaintNumber,
      row.complaintDate,
      row.receivingChannel,
      row.customerName,
      row.contactNumber,
      row.complaintDescription,
      row.complaintType,
      row.responsibleDepartment,
      row.actionTaken,
      row.resolutionTimeHours === "" ? "" : String(row.resolutionTimeHours),
      row.complaintStatus,
      row.resolutionOutcome,
      row.improvementOpportunity,
      row.notes,
    ]
      .map(escape)
      .join(",")
  );

  return [headers.map(escape).join(","), ...lines].join("\n");
};

export default function ComplaintsPage() {
  type FiltersState = {
    search: string;
    status: "All" | ComplaintStatus;
    type: "All" | ComplaintType;
    channel: "All" | ReceivingChannel;
    department: string;
    fromDate: string;
    toDate: string;
  };
  const [complaints, setComplaints] = useState<ComplaintRecord[]>([]);
  const [form, setForm] = useState<ComplaintRecord>(createEmptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewComplaint, setViewComplaint] = useState<ComplaintRecord | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<string | number>>(
    new Set()
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FiltersState>({
    search: "",
    status: "All",
    type: "All",
    channel: "All",
    department: "",
    fromDate: "",
    toDate: "",
  });

  const fetchComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status !== "All")
        params.set("status", toApiEnum.status(filters.status));
      if (filters.type !== "All") params.set("type", toApiEnum.type(filters.type));
      if (filters.channel !== "All")
        params.set("channel", toApiEnum.channel(filters.channel));
      if (filters.department) params.set("department", filters.department);
      if (filters.fromDate) params.set("fromDate", filters.fromDate);
      if (filters.toDate) params.set("toDate", filters.toDate);
      if (filters.search) params.set("search", filters.search);

      const query = params.toString();
      const url = query
        ? `/api/dashboard/complaints?${query}`
        : "/api/dashboard/complaints";

      const response = await apiFetch<{
        success: boolean;
        data: ApiComplaintRecord[];
      }>(url);
      const normalized = response.data.map((complaint) => ({
        ...complaint,
        receivingChannel: fromApiEnum.channel(complaint.receivingChannel),
        complaintType: fromApiEnum.type(complaint.complaintType),
        complaintStatus: fromApiEnum.status(complaint.complaintStatus),
        complaintDate: complaint.complaintDate
          ? complaint.complaintDate.slice(0, 10)
          : "",
      })) as ComplaintRecord[];
      setComplaints(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  const updateField = <K extends keyof ComplaintRecord>(
    key: K,
    value: ComplaintRecord[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setError(null);
    if (!form.complaintNumber.trim()) {
      setError("Complaint number is required.");
      return;
    }
    if (!form.complaintDate) {
      setError("Complaint date is required.");
      return;
    }
    if (!form.customerName.trim()) {
      setError("Customer name is required.");
      return;
    }
    if (!form.contactNumber.trim()) {
      setError("Contact number is required.");
      return;
    }
    if (!form.complaintDescription.trim()) {
      setError("Complaint description is required.");
      return;
    }
    if (!form.responsibleDepartment.trim()) {
      setError("Responsible department is required.");
      return;
    }

    const { resolutionTimeHours, ...rest }: ComplaintRecord = form;

    const payload: Omit<ApiComplaintRecord, "id" | "resolutionTimeHours"> & {
      resolutionTimeHours?: number;
    } = {
      ...rest,
      complaintNumber: form.complaintNumber.trim(),
      complaintDate: new Date(form.complaintDate).toISOString(),
      receivingChannel: toApiEnum.channel(form.receivingChannel),
      complaintType: toApiEnum.type(form.complaintType),
      complaintStatus: toApiEnum.status(form.complaintStatus),
      customerName: form.customerName.trim(),
      contactNumber: form.contactNumber.trim(),
      complaintDescription: form.complaintDescription.trim(),
      responsibleDepartment: form.responsibleDepartment.trim(),
      actionTaken: form.actionTaken.trim(),
      resolutionOutcome: form.resolutionOutcome.trim(),
      improvementOpportunity: form.improvementOpportunity.trim(),
      notes: form.notes.trim(),
      resolutionTimeHours:
        resolutionTimeHours === "" ? undefined : resolutionTimeHours,
    };

    setIsSubmitting(true);
    try {
      await apiFetch<{ success: boolean; data: ComplaintRecord }>(
        "/api/dashboard/complaints",
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );
      await fetchComplaints();
      setForm(createEmptyForm());
      setIsModalOpen(false);
      emitToast({ message: "Complaint logged.", variant: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save complaint");
      emitToast({
        message: err instanceof Error ? err.message : "Failed to save complaint",
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string | number) => {
    const confirmed = window.confirm("Delete this complaint?");
    if (!confirmed) return;
    try {
      await apiFetch<{ success: boolean }>(
        `/api/dashboard/complaints/${id}`,
        {
          method: "DELETE",
        }
      );
      await fetchComplaints();
      emitToast({ message: "Complaint removed.", variant: "info" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete complaint");
      emitToast({
        message:
          err instanceof Error ? err.message : "Failed to delete complaint",
        variant: "error",
      });
    }
  };

  const handleStatusUpdate = async (
    complaintId: string | number,
    status: ComplaintStatus
  ) => {
    setUpdatingIds((prev) => new Set(prev).add(complaintId));
    try {
      await apiFetch<{ success: boolean; data: ComplaintRecord }>(
        `/api/dashboard/complaints/${complaintId}`,
        {
          method: "PUT",
          body: JSON.stringify({
            complaintStatus: toApiEnum.status(status),
          }),
        }
      );
      await fetchComplaints();
      emitToast({ message: "Status updated.", variant: "success" });
    } catch (err) {
      emitToast({
        message: err instanceof Error ? err.message : "Failed to update status",
        variant: "error",
      });
    } finally {
      setUpdatingIds((prev) => {
        const next = new Set(prev);
        next.delete(complaintId);
        return next;
      });
    }
  };

  const handleExport = () => {
    if (!complaints.length) {
      emitToast({ message: "No complaints to export.", variant: "info" });
      return;
    }
    const csv = toCsv(complaints);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `complaints-log-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    emitToast({ message: "Export ready.", variant: "success" });
  };

  return (
    <section className="complaints-page">
      <div className="complaints-header">
        <div>
          <h1 className="section-title">Complaint Log</h1>
          <p className="muted" style={{ marginTop: 6 }}>
            Manage and track customer feedback.
          </p>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button
            className="button button-outline"
            type="button"
            onClick={handleExport}
          >
            <span className="button-icon" aria-hidden="true">
              ⭳
            </span>
            Export CSV
          </button>
          <button
            className="button button-primary"
            type="button"
            onClick={() => {
              setError(null);
              setForm((prev) => ({
                ...prev,
                complaintNumber: prev.complaintNumber || generateComplaintNumber(),
              }));
              setIsModalOpen(true);
            }}
          >
            <span className="button-icon" aria-hidden="true">
              +
            </span>
            New Complaint
          </button>
        </div>
      </div>

      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}
      {isModalOpen ? (
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
            aria-labelledby="complaint-modal-title"
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(980px, 100%)",
              maxHeight: "85vh",
              overflow: "auto",
              background: "#fff",
              borderRadius: 18,
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
                <h2 id="complaint-modal-title" style={{ margin: 0 }}>
                  Create Complaint
                </h2>
                <p className="muted" style={{ marginTop: 6 }}>
                  Capture the complaint details for audit and reporting.
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="button button-outline"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Saving..." : "Save Complaint"}
                </button>
              </div>
            </div>

            {error ? <p className="error">{error}</p> : null}

            <div className="filter-grid" style={{ marginTop: 12 }}>
              <label>
                Complaint Number
                <input
                  className="input"
                  value={form.complaintNumber}
                  onChange={(event) =>
                    updateField("complaintNumber", event.target.value)
                  }
                />
              </label>
              <label>
                Complaint Date
                <input
                  type="date"
                  className="input"
                  value={form.complaintDate}
                  onChange={(event) =>
                    updateField("complaintDate", event.target.value)
                  }
                />
              </label>
              <label>
                Receiving Channel
                <select
                  className="select"
                  value={form.receivingChannel}
                  onChange={(event) =>
                    updateField(
                      "receivingChannel",
                      event.target.value as ReceivingChannel
                    )
                  }
                >
                  {CHANNELS.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Complaint Type
                <select
                  className="select"
                  value={form.complaintType}
                  onChange={(event) =>
                    updateField("complaintType", event.target.value as ComplaintType)
                  }
                >
                  {COMPLAINT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Customer Name
                <input
                  className="input"
                  value={form.customerName}
                  onChange={(event) =>
                    updateField("customerName", event.target.value)
                  }
                />
              </label>
              <label>
                Contact Number
                <input
                  className="input"
                  value={form.contactNumber}
                  onChange={(event) =>
                    updateField("contactNumber", event.target.value)
                  }
                />
              </label>
              <label>
                Responsible Department
                <input
                  className="input"
                  value={form.responsibleDepartment}
                  onChange={(event) =>
                    updateField("responsibleDepartment", event.target.value)
                  }
                />
              </label>
              <label>
                Complaint Status
                <select
                  className="select"
                  value={form.complaintStatus}
                  onChange={(event) =>
                    updateField("complaintStatus", event.target.value as ComplaintStatus)
                  }
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Resolution Time (hours)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  className="input"
                  value={form.resolutionTimeHours}
                  onChange={(event) =>
                    updateField(
                      "resolutionTimeHours",
                      event.target.value === "" ? "" : Number(event.target.value)
                    )
                  }
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Complaint Description
                <textarea
                  className="textarea"
                  rows={3}
                  value={form.complaintDescription}
                  onChange={(event) =>
                    updateField("complaintDescription", event.target.value)
                  }
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Action Taken
                <textarea
                  className="textarea"
                  rows={2}
                  value={form.actionTaken}
                  onChange={(event) => updateField("actionTaken", event.target.value)}
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Resolution Outcome
                <textarea
                  className="textarea"
                  rows={2}
                  value={form.resolutionOutcome}
                  onChange={(event) =>
                    updateField("resolutionOutcome", event.target.value)
                  }
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Improvement Opportunity Identified
                <textarea
                  className="textarea"
                  rows={2}
                  value={form.improvementOpportunity}
                  onChange={(event) =>
                    updateField("improvementOpportunity", event.target.value)
                  }
                />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>
                Notes
                <textarea
                  className="textarea"
                  rows={2}
                  value={form.notes}
                  onChange={(event) => updateField("notes", event.target.value)}
                />
              </label>
            </div>
          </div>
        </div>
      ) : null}

      {viewComplaint ? (
        <div
          role="presentation"
          onClick={() => setViewComplaint(null)}
          className="modal-backdrop"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="complaint-view-title"
            onClick={(event) => event.stopPropagation()}
            className="complaints-modal"
          >
            <div className="complaints-modal-header">
              <div>
                <h2 id="complaint-view-title">{viewComplaint.complaintNumber}</h2>
                <p className="muted">Complaint Details</p>
              </div>
              <div className="complaints-modal-actions">
                <select
                  className="select"
                  value={viewComplaint.complaintStatus}
                  disabled={updatingIds.has(viewComplaint.id)}
                  onChange={(event) => {
                    const nextStatus = event.target.value as ComplaintStatus;
                    setViewComplaint((prev) =>
                      prev ? { ...prev, complaintStatus: nextStatus } : prev
                    );
                  }}
                >
                  {STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="table-icon-button"
                  onClick={() => setViewComplaint(null)}
                  aria-label="Close"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="complaints-modal-grid">
              <div>
                <p className="modal-label">Customer Details</p>
                <p className="modal-value">{viewComplaint.customerName}</p>
                <p className="modal-muted">{viewComplaint.contactNumber}</p>
              </div>
              <div>
                <p className="modal-label">Internal Details</p>
                <p className="modal-muted">
                  Dept: {viewComplaint.responsibleDepartment || "-"}
                </p>
                <p className="modal-muted">
                  Channel: {viewComplaint.receivingChannel}
                </p>
              </div>
              <div>
                <p className="modal-label">Complaint Type</p>
                <p className="modal-value">{viewComplaint.complaintType}</p>
              </div>
              <div>
                <p className="modal-label">Resolution & Action</p>
                <p className="modal-muted">Action Taken</p>
                <p className="modal-value">{viewComplaint.actionTaken || "-"}</p>
                <p className="modal-muted" style={{ marginTop: 10 }}>
                  Outcome
                </p>
                <p className="modal-value">
                  {viewComplaint.resolutionOutcome || "-"}
                </p>
                {viewComplaint.improvementOpportunity ? (
                  <div className="modal-highlight">
                    Improvement Opportunity
                    <div>{viewComplaint.improvementOpportunity}</div>
                  </div>
                ) : null}
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <p className="modal-label">Description</p>
                <div className="modal-box">
                  {viewComplaint.complaintDescription}
                </div>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <p className="modal-muted">
                  Created: {viewComplaint.complaintDate || "-"}
                </p>
              </div>
            </div>

            <div className="complaints-modal-footer">
              <button
                type="button"
                className="button button-outline"
                onClick={() => setViewComplaint(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="button button-outline"
                disabled={updatingIds.has(viewComplaint.id)}
                onClick={() =>
                  handleStatusUpdate(
                    viewComplaint.id,
                    viewComplaint.complaintStatus
                  )
                }
              >
                {updatingIds.has(viewComplaint.id)
                  ? "Updating..."
                  : "Update Status"}
              </button>
              <button
                type="button"
                className="button button-primary"
                onClick={() => {
                  handleDelete(viewComplaint.id);
                  setViewComplaint(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="card complaints-toolbar">
        <label className="complaints-search">
          <span aria-hidden="true">🔍</span>
          <input
            className="input"
            placeholder="Search logs..."
            value={filters.search}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, search: event.target.value }))
            }
          />
        </label>
        <button
          type="button"
          className="button button-outline"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          <span className="button-icon" aria-hidden="true">
            ⛃
          </span>
          Filter
        </button>
      </div>

      {showFilters ? (
        <div className="card" style={{ marginTop: 12 }}>
          <div className="filter-grid">
            <label>
              Status
              <select
                className="select"
                value={filters.status}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    status: event.target.value as "All" | ComplaintStatus,
                  }))
                }
              >
                {["All", ...STATUSES].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Type
              <select
                className="select"
                value={filters.type}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    type: event.target.value as "All" | ComplaintType,
                  }))
                }
              >
                {["All", ...COMPLAINT_TYPES].map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Channel
              <select
                className="select"
                value={filters.channel}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    channel: event.target.value as "All" | ReceivingChannel,
                  }))
                }
              >
                {["All", ...CHANNELS].map((channel) => (
                  <option key={channel} value={channel}>
                    {channel}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Department
              <input
                className="input"
                placeholder="Department name"
                value={filters.department}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    department: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              From
              <input
                type="date"
                className="input"
                value={filters.fromDate}
                onChange={(event) =>
                  setFilters((prev) => ({
                    ...prev,
                    fromDate: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              To
              <input
                type="date"
                className="input"
                value={filters.toDate}
                onChange={(event) =>
                  setFilters((prev) => ({ ...prev, toDate: event.target.value }))
                }
              />
            </label>
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 18 }}>
        <table className="table table-advanced complaints-table">
          <thead>
            <tr>
              <th style={{ width: 120 }}>Complaint ID</th>
              <th>Customer</th>
              <th style={{ width: 160 }}>Type</th>
              <th style={{ width: 140 }}>Status</th>
              <th>Resolution</th>
              <th style={{ width: 80 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {complaints.length ? (
              complaints.map((complaint) => (
                <tr key={complaint.id}>
                  <td className="table-id">{complaint.complaintNumber}</td>
                  <td>
                    <div className="complaints-customer">
                      <div className="table-primary">{complaint.customerName}</div>
                      <div className="table-muted">
                        {complaint.complaintDate}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-neutral">
                      {complaint.complaintType}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge badge-status badge-${complaint.complaintStatus
                        .toLowerCase()
                        .replace(/\s+/g, "-")}`}
                      onClick={() => setViewComplaint(complaint)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") setViewComplaint(complaint);
                      }}
                    >
                      {complaint.complaintStatus}
                    </span>
                  </td>
                  <td className="table-muted">
                    {complaint.resolutionOutcome || "-"}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="table-icon-button"
                      onClick={() => setViewComplaint(complaint)}
                      aria-label="View complaint"
                      title="View"
                    >
                      <FaEye aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <p className="muted" style={{ margin: 0 }}>
                    No complaints match the current filters.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
