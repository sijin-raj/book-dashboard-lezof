"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";

type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
};

type CustomersResponse = {
  success: boolean;
  data: Customer[];
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "xlsx" | null>(null);

  useEffect(() => {
    setLoading(true);
    apiFetch<CustomersResponse>("/api/dashboard/customers")
      .then((response) => setCustomers(response.data))
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load customers")
      )
      .finally(() => setLoading(false));
  }, []);

  const handleExport = async (format: "csv" | "xlsx") => {
    setExporting(format);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000"}/api/dashboard/customers/export?format=${format}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
        }
      );

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Export failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `customers.${format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExporting(null);
    }
  };

  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h1 className="section-title">Customers</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="button button-outline"
            type="button"
            disabled={exporting === "csv"}
            onClick={() => handleExport("csv")}
          >
            {exporting === "csv" ? "Exporting..." : "Export CSV"}
          </button>
          <button
            className="button"
            type="button"
            disabled={exporting === "xlsx"}
            onClick={() => handleExport("xlsx")}
          >
            {exporting === "xlsx" ? "Exporting..." : "Export XLSX"}
          </button>
        </div>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {loading ? <p>Loading...</p> : null}
      <div className="card" style={{ marginTop: 18 }}>
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>{customer.id}</td>
                <td>{customer.name}</td>
                <td>{customer.email}</td>
                <td>{customer.phone || "-"}</td>
                <td>
                  {new Date(customer.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
