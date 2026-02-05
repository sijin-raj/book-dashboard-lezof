"use client";

import { useEffect, useState } from "react";

import { apiFetch } from "@/lib/api";
import { emitToast } from "@/lib/toast";

type CreateUserResponse = {
  success: boolean;
  data: {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
};

type ListUsersResponse = {
  success: boolean;
  data: Array<{
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
};

type UpdateUserResponse = {
  success: boolean;
  data: {
    id: number;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  };
};

type UserRow = ListUsersResponse["data"][number];

export default function UsersPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<CreateUserResponse["data"] | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<ListUsersResponse["data"]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    role: string;
  }>({ name: "", email: "", role: "USER" });

  const fetchUsers = async () => {
    setListError(null);
    try {
      const response = await apiFetch<ListUsersResponse>("/api/dashboard/users");
      setUsers(response.data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to load users");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await apiFetch<CreateUserResponse>("/api/dashboard/users",
        {
          method: "POST",
          body: JSON.stringify({ name, email, password, role }),
        }
      );
      setSuccess(response.data);
      emitToast({ message: "User created successfully.", variant: "success" });
      fetchUsers();
      setName("");
      setEmail("");
      setPassword("");
      setRole("USER");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user: UserRow) => {
    setEditingId(user.id);
    setEditForm({ name: user.name, email: user.email, role: user.role });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({ name: "", email: "", role: "USER" });
  };

  const handleUpdateUser = async (userId: number) => {
    setListError(null);
    const payload = {
      name: editForm.name.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
    };
    if (!payload.name || !payload.email || !payload.role) {
      setListError("Name, email, and role are required.");
      return;
    }
    try {
      await apiFetch<UpdateUserResponse>(`/api/dashboard/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      await fetchUsers();
      cancelEdit();
      emitToast({ message: "User updated successfully.", variant: "success" });
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to update user");
    }
  };

  const handleDeleteUser = async (userId: number) => {
    const confirmed = window.confirm("Delete this user?");
    if (!confirmed) return;
    setListError(null);
    try {
      await apiFetch<{ success: boolean }>(`/api/dashboard/users/${userId}`, {
        method: "DELETE",
      });
      await fetchUsers();
      emitToast({ message: "User deleted successfully.", variant: "success" });
    } catch (err) {
      setListError(err instanceof Error ? err.message : "Failed to delete user");
    }
  };

  return (
    <section>
      <h1 className="section-title">Users</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 18,
          marginTop: 18,
        }}
      >
        <div className="card">
          <h2 style={{ marginBottom: 12 }}>Create User</h2>
          <form onSubmit={handleSubmit}>
            <label style={{ display: "block", marginBottom: 16 }}>
              Name
              <input
                className="input"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </label>
            <label style={{ display: "block", marginBottom: 16 }}>
              Email
              <input
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>
            <label style={{ display: "block", marginBottom: 16 }}>
              Password
              <input
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </label>
            <label style={{ display: "block", marginBottom: 16 }}>
              Role
              <select
                className="select"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                <option value="USER">Member</option>
                <option value="ADMIN">Admin</option>
              </select>
            </label>
            {error ? <p className="error">{error}</p> : null}
            {success ? (
              <p className="muted">
                Created {success.name} ({success.role}) — {success.email}
              </p>
            ) : null}
            <button
              type="submit"
              className="button"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? "Creating..." : "Create user"}
            </button>
          </form>
        </div>
        <div className="card">
          <h2 style={{ marginBottom: 12 }}>All Users</h2>
          {listError ? <p className="error">{listError}</p> : null}
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className="tag">{user.role}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => startEdit(user)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="button button-outline"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {editingId !== null ? (
                <tr>
                  <td colSpan={5}>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                        gap: 12,
                        alignItems: "end",
                        padding: "12px 0",
                      }}
                    >
                      <label>
                        Name
                        <input
                          className="input"
                          value={editForm.name}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Email
                        <input
                          className="input"
                          type="email"
                          value={editForm.email}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              email: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        Role
                        <select
                          className="select"
                          value={editForm.role}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              role: event.target.value,
                            }))
                          }
                        >
                          <option value="USER">Member</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="button"
                          onClick={() => handleUpdateUser(editingId)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="button button-outline"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
