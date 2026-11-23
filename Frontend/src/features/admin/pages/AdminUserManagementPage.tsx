
import { useEffect, useState } from "react";
import { api } from "../../../services/api";
import "./AdminUserManagementPage.css";

type StaffRole = "admin" | "head" | "registrar" | "director";

const DEPARTMENTS = [
  "Computer Science",
  "Economics",
  "Management",
  "Accounting",
];

interface Staff {
  _id: string;
  staffId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  role: StaffRole;
  department?: string;
}

interface StaffResponse {
  success: boolean;
  message: string;
  data: {
    staff: Staff[];
    count?: number;
  };
}

interface StaffForm {
  staffId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  password: string;
  role: StaffRole;
  department: string;
}

const emptyForm: StaffForm = {
  staffId: "",
  firstName: "",
  middleName: "",
  lastName: "",
  password: "",
  role: "registrar",
  department: "",
};

export default function AdminUserManagementPage() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [form, setForm] = useState<StaffForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");

  async function loadStaff() {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const response = await api.get<StaffResponse>("/staff");

      if (!response.success) {
        throw new Error(response.message);
      }

      setStaff(response.data.staff);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load staff members."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStaff();
  }, []);

  function updateField(field: keyof StaffForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleRoleChange(role: StaffRole) {
    setForm((current) => ({
      ...current,
      role,
      department: role === "head" ? current.department : "",
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingId(null);
  }

  function startEditing(member: Staff) {
    setEditingId(member.staffId);

    setForm({
      staffId: member.staffId,
      firstName: member.firstName,
      middleName: member.middleName,
      lastName: member.lastName,
      password: "",
      role: member.role,
      department: member.department || "",
    });

    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (
      !form.staffId.trim() ||
      !form.firstName.trim() ||
      !form.middleName.trim() ||
      !form.lastName.trim()
    ) {
      setErrorMessage("Please complete all required fields.");
      return;
    }

    if (form.role === "head" && !form.department) {
      setErrorMessage(
        "Please select a department for the Department Head."
      );
      return;
    }

    if (!editingId && form.password.length < 8) {
      setErrorMessage("Password must contain at least 8 characters.");
      return;
    }

    try {
      setIsSaving(true);

      const department =
        form.role === "head" ? form.department : undefined;

      if (editingId) {
        const { staffId, password, ...updateData } = form;

        await api.patch(
          `/staff/${encodeURIComponent(editingId)}`,
          {
            ...updateData,
            department,
          }
        );

        setSuccessMessage("Staff member updated successfully.");
      } else {
        await api.post("/staff", {
          ...form,
          staffId: form.staffId.trim(),
          firstName: form.firstName.trim(),
          middleName: form.middleName.trim(),
          lastName: form.lastName.trim(),
          department,
        });

        setSuccessMessage("Staff member created successfully.");
      }

      resetForm();
      await loadStaff();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save staff information."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(member: Staff) {
    const confirmed = window.confirm(
      `Are you sure you want to delete staff account ${member.staffId}?`
    );

    if (!confirmed) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      await api.delete(
        `/staff/${encodeURIComponent(member.staffId)}`
      );

      setSuccessMessage("Staff account deleted successfully.");

      if (editingId === member.staffId) {
        resetForm();
      }

      await loadStaff();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to delete staff account."
      );
    }
  }

  const filteredStaff = staff.filter((member) => {
    const searchText = search.toLowerCase();

    return [
      member.staffId,
      member.firstName,
      member.middleName,
      member.lastName,
      member.role,
      member.department || "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(searchText);
  });

  return (
    <div className="admin-users-page">
      <div className="admin-users-heading">
        <div>
          <h1>Staff Management</h1>
          <p>Create, view, update, and manage staff accounts.</p>
        </div>

        <div className="admin-users-total">
          <strong>{staff.length}</strong>
          <span>Total Staff</span>
        </div>
      </div>

      {errorMessage && (
        <div className="admin-users-alert error">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="admin-users-alert success">
          {successMessage}
        </div>
      )}

      <section className="admin-users-form-card">
        <h2>
          {editingId ? "Update Staff Account" : "Register New Staff"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="admin-users-form-grid">
            <label>
              Staff ID *
              <input
                value={form.staffId}
                onChange={(event) =>
                  updateField("staffId", event.target.value)
                }
                disabled={Boolean(editingId)}
                required
              />
            </label>

            <label>
              First Name *
              <input
                value={form.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                required
              />
            </label>

            <label>
              Middle Name *
              <input
                value={form.middleName}
                onChange={(event) =>
                  updateField("middleName", event.target.value)
                }
                required
              />
            </label>

            <label>
              Last Name *
              <input
                value={form.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                required
              />
            </label>

            {!editingId && (
              <label>
                Initial Password *
                <input
                  type="password"
                  value={form.password}
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  minLength={8}
                  required
                />
              </label>
            )}

            <label>
              Staff Role *
              <select
                value={form.role}
                onChange={(event) =>
                  handleRoleChange(event.target.value as StaffRole)
                }
                required
              >
                <option value="admin">Administrator</option>
                <option value="head">Department Head</option>
                <option value="registrar">Registrar</option>
                <option value="director">Director</option>
              </select>
            </label>

            {form.role === "head" && (
              <label className="admin-users-full-width">
                Department *
                <select
                  value={form.department}
                  onChange={(event) =>
                    updateField("department", event.target.value)
                  }
                  required
                >
                  <option value="">Select Department</option>

                  {DEPARTMENTS.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="admin-users-form-actions">
            <button
              type="submit"
              disabled={isSaving}
              className="admin-users-primary-button"
            >
              {isSaving
                ? "Saving..."
                : editingId
                  ? "Update Staff"
                  : "Create Staff"}
            </button>

            {editingId && (
              <button
                type="button"
                className="admin-users-cancel-button"
                onClick={resetForm}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="admin-users-table-card">
        <div className="admin-users-table-heading">
          <div>
            <h2>Staff Accounts</h2>
            <p>Manage registered university staff members.</p>
          </div>

          <input
            className="admin-users-search"
            placeholder="Search staff..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        {isLoading ? (
          <p className="admin-users-message">
            Loading staff accounts...
          </p>
        ) : filteredStaff.length === 0 ? (
          <p className="admin-users-message">
            No staff accounts found.
          </p>
        ) : (
          <div className="admin-users-table-wrapper">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>Staff ID</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredStaff.map((member) => (
                  <tr key={member._id}>
                    <td>{member.staffId}</td>

                    <td>
                      {member.firstName} {member.middleName}{" "}
                      {member.lastName}
                    </td>

                    <td>
                      <span className="admin-users-role">
                        {member.role === "head"
                          ? "Department Head"
                          : member.role}
                      </span>
                    </td>

                    <td>{member.department || "—"}</td>

                    <td>
                      <div className="admin-users-row-actions">
                        <button
                          type="button"
                          onClick={() => startEditing(member)}
                          className="admin-users-edit-button"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => void handleDelete(member)}
                          className="admin-users-delete-button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
