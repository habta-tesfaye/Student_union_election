
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuthContext } from "../../../context/AuthContext";
import { api } from "../../../services/api";

interface Student {
  _id: string;
  studentId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender?: string;
  region?: string;
  disability?: string;
  department?: string;
  yearSection?: string;
  status?: string;
  gpa?: number;
}

interface StudentsResponse {
  success: boolean;
  message: string;
  data: {
    students: Student[];
    count?: number;
  };
}

interface StudentResponse {
  success: boolean;
  message: string;
  data: {
    student: Student;
  };
}

interface StudentFormData {
  studentId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  region: string;
  disability: string;
  department: string;
  yearSection: string;
  status: string;
  gpa: string;
  password: string;
}

interface ImportError {
  row: number;
  studentId?: string;
  message: string;
}

interface StudentImportResult {
  imported: number;
  skipped: number;
  invalid: number;
  totalRecords: number;
  errors: ImportError[];
}

interface StudentImportResponse {
  success: boolean;
  message: string;
  data: StudentImportResult;
}

const emptyForm: StudentFormData = {
  studentId: "",
  firstName: "",
  middleName: "",
  lastName: "",
  gender: "",
  region: "",
  disability: "",
  department: "",
  yearSection: "",
  status: "",
  gpa: "",
  password: "",
};

export default function RegistrarDashboardPage() {
  const { user, signOut } = useAuthContext();

  const [students, setStudents] = useState<Student[]>([]);
  const [form, setForm] = useState<StudentFormData>(emptyForm);
  const [search, setSearch] = useState("");

  const [editingStudentId, setEditingStudentId] = useState<string | null>(
    null
  );

  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // CSV upload state
  const [selectedCsvFile, setSelectedCsvFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const [importResult, setImportResult] =
    useState<StudentImportResult | null>(null);

  const csvInputRef = useRef<HTMLInputElement>(null);

  /**
   * Retrieve all registered students.
   */
  async function loadStudents() {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await api.get<StudentsResponse>("/students");

      if (!response.success) {
        throw new Error(response.message || "Could not load students.");
      }

      setStudents(response.data.students);
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not load student records."
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadStudents();
  }, []);

  /**
   * Filter students by ID, name, department or year.
   */
  const filteredStudents = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    if (!searchValue) {
      return students;
    }

    return students.filter((student) => {
      const searchableText = [
        student.studentId,
        student.firstName,
        student.middleName,
        student.lastName,
        student.department,
        student.yearSection,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchValue);
    });
  }, [students, search]);

  const displayName = user
    ? [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(" ")
    : "Registrar";

  /**
   * Update registration form fields.
   */
  function updateField(
    field: keyof StudentFormData,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /**
   * Open the new student registration form.
   */
  function openRegistrationForm() {
    setEditingStudentId(null);
    setForm(emptyForm);
    setSuccessMessage("");
    setErrorMessage("");
    setShowForm(true);
  }

  /**
   * Open the student editing form.
   */
  function openEditForm(student: Student) {
    setEditingStudentId(student.studentId);

    setForm({
      studentId: student.studentId,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      gender: student.gender || "",
      region: student.region || "",
      disability: student.disability || "",
      department: student.department || "",
      yearSection: student.yearSection || "",
      status: student.status || "",
      gpa:
        student.gpa === undefined || student.gpa === null
          ? ""
          : String(student.gpa),
      password: "",
    });

    setSuccessMessage("");
    setErrorMessage("");
    setShowForm(true);
  }

  /**
   * Close and reset the student form.
   */
  function closeForm() {
    setShowForm(false);
    setEditingStudentId(null);
    setForm(emptyForm);
  }

  /**
   * Register a new student or update an existing student.
   */
  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setIsSaving(true);
    setErrorMessage("");
    setSuccessMessage("");

    const studentData: Record<string, unknown> = {
      firstName: form.firstName.trim(),
      middleName: form.middleName.trim(),
      lastName: form.lastName.trim(),
      gender: form.gender.trim(),
      region: form.region.trim(),
      disability: form.disability.trim(),
      department: form.department.trim(),
      yearSection: form.yearSection.trim(),
      status: form.status.trim(),
    };

    if (form.gpa.trim() !== "") {
      const gpaValue = Number(form.gpa);

      if (
        !Number.isFinite(gpaValue) ||
        gpaValue < 0 ||
        gpaValue > 4
      ) {
        setErrorMessage("GPA must be a number between 0 and 4.");
        setIsSaving(false);
        return;
      }

      studentData.gpa = gpaValue;
    }

    try {
      if (editingStudentId) {
        await api.patch<StudentResponse>(
          `/students/${encodeURIComponent(editingStudentId)}`,
          studentData
        );

        setSuccessMessage(
          "Student information updated successfully."
        );
      } else {
        if (form.password.length < 8) {
          setErrorMessage(
            "Password must contain at least 8 characters."
          );
          setIsSaving(false);
          return;
        }

        studentData.studentId = form.studentId.trim();
        studentData.password = form.password;

        await api.post<StudentResponse>("/students", studentData);

        setSuccessMessage("Student registered successfully.");
      }

      closeForm();
      await loadStudents();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The student operation could not be completed."
      );
    } finally {
      setIsSaving(false);
    }
  }

  /**
   * Select a CSV file.
   */
  function handleCsvFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0] ?? null;

    setErrorMessage("");
    setSuccessMessage("");
    setImportResult(null);

    if (!file) {
      setSelectedCsvFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setSelectedCsvFile(null);
      event.target.value = "";
      setErrorMessage("Please select a CSV file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSelectedCsvFile(null);
      event.target.value = "";
      setErrorMessage("CSV file must not exceed 5 MB.");
      return;
    }

    setSelectedCsvFile(file);
  }

  /**
   * Upload CSV file to the backend.
   */
  async function handleCsvImport() {
    if (!selectedCsvFile) {
      setErrorMessage("Please select a CSV file first.");
      return;
    }

    setIsImporting(true);
    setErrorMessage("");
    setSuccessMessage("");
    setImportResult(null);

    try {
      const formData = new FormData();

      // Must match upload.single("file") in the backend.
      formData.append("file", selectedCsvFile);

      const response = await api.post<StudentImportResponse>(
        "/students/import",
        formData
      );

      if (!response.success) {
        throw new Error(
          response.message || "Student CSV import failed."
        );
      }

      setImportResult(response.data);
      setSuccessMessage(response.message);

      setSelectedCsvFile(null);

      if (csvInputRef.current) {
        csvInputRef.current.value = "";
      }

      // Refresh the student table after import.
      await loadStudents();
    } catch (error: unknown) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not import students from the CSV file."
      );
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <main className="app">
      <header className="app-header">
        <div className="app-brand">
          <div className="app-logo">DMU</div>

          <div className="app-brand-text">
            <h1>Debre Markos University</h1>
            <p>Bure Campus</p>
          </div>
        </div>

        <span className="app-system-label">
          Student Union Election System
        </span>
      </header>

      <section className="welcome-section">
        <div className="welcome-content">
          <span className="welcome-badge">
            Registrar Dashboard
          </span>

          <h2>Welcome, {displayName || "Registrar"}</h2>

          <p className="welcome-description">
            Register students and manage their academic information.
          </p>

          <button
            className="welcome-login-link"
            type="button"
            onClick={signOut}
          >
            Sign out
          </button>
        </div>
      </section>

      <section className="dashboard-content">
        {/* Student management heading */}
        <div className="registrar-heading">
          <div>
            <h2>Student management</h2>
            <p>
              View, search, register and update student records.
            </p>
          </div>

          <button
            className="registrar-primary-button"
            type="button"
            onClick={openRegistrationForm}
          >
            + Register student
          </button>
        </div>

        {/* Success and error messages */}
        {successMessage && (
          <div className="registrar-success" role="status">
            {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="dashboard-error" role="alert">
            {errorMessage}
          </div>
        )}

        {/* CSV upload section */}
        <section className="dashboard-panel registrar-import-panel">
          <div className="registrar-import-heading">
            <div>
              <h3>Import students from CSV</h3>

              <p>
                Upload a CSV file to register multiple students at once.
              </p>
            </div>
          </div>

          <div className="registrar-import-content">
            <label
              className="registrar-file-label"
              htmlFor="student-csv-file"
            >
              Select CSV file
            </label>

            <input
              ref={csvInputRef}
              id="student-csv-file"
              type="file"
              accept=".csv,text/csv"
              onChange={handleCsvFileChange}
              disabled={isImporting}
            />

            {selectedCsvFile && (
              <p className="registrar-selected-file">
                Selected file: <strong>{selectedCsvFile.name}</strong>
              </p>
            )}

            <button
              className="registrar-primary-button"
              type="button"
              onClick={handleCsvImport}
              disabled={!selectedCsvFile || isImporting}
            >
              {isImporting ? "Importing students..." : "Upload CSV"}
            </button>
          </div>

          <div className="registrar-csv-instructions">
            <h4>Required CSV columns</h4>

            <p>
              Your CSV file must contain these column names:
            </p>

            <code>
              student id, first_name, middle_name, last_name, gender,
              region, disability, department, year/section, cgpa, status
            </code>

            <p>
              The first login password for each imported student will
              be their student ID. The password is securely hashed by
              the backend.
            </p>

            <p>
              Maximum file size: 5 MB. Only CSV files are accepted.
            </p>
          </div>
        </section>

        {/* CSV import result */}
        {importResult && (
          <section className="dashboard-panel registrar-import-results">
            <h3>CSV import results</h3>

            <div className="dashboard-statistics">
              <article className="dashboard-stat">
                <h3>Total CSV records</h3>
                <p>{importResult.totalRecords}</p>
              </article>

              <article className="dashboard-stat">
                <h3>Successfully imported</h3>
                <p>{importResult.imported}</p>
              </article>

              <article className="dashboard-stat">
                <h3>Skipped records</h3>
                <p>{importResult.skipped}</p>
              </article>

              <article className="dashboard-stat">
                <h3>Invalid records</h3>
                <p>{importResult.invalid}</p>
              </article>
            </div>

            {importResult.errors.length > 0 && (
              <div className="registrar-import-error-list">
                <h4>Skipped or invalid record details</h4>

                <div className="dashboard-table-wrapper">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>CSV row</th>
                        <th>Student ID</th>
                        <th>Reason</th>
                      </tr>
                    </thead>

                    <tbody>
                      {importResult.errors.map((item, index) => (
                        <tr key={`${item.row}-${index}`}>
                          <td>{item.row}</td>
                          <td>{item.studentId || "—"}</td>
                          <td>{item.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Student statistics */}
        <div className="dashboard-statistics">
          <article className="dashboard-stat">
            <h3>Total registered students</h3>
            <p>{students.length}</p>
          </article>

          <article className="dashboard-stat">
            <h3>Search results</h3>
            <p>{filteredStudents.length}</p>
          </article>
        </div>

        {/* Student list */}
        <section className="dashboard-panel">
          <div className="registrar-list-heading">
            <h3>Registered students</h3>

            <input
              className="registrar-search"
              type="search"
              placeholder="Search by ID, name or department..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          {isLoading ? (
            <p>Loading student records...</p>
          ) : students.length === 0 ? (
            <p>No student records were found.</p>
          ) : filteredStudents.length === 0 ? (
            <p>No students match your search.</p>
          ) : (
            <div className="dashboard-table-wrapper">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Full name</th>
                    <th>Department</th>
                    <th>Year / Section</th>
                    <th>GPA</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map((student) => (
                    <tr key={student._id}>
                      <td>{student.studentId}</td>

                      <td>
                        {[
                          student.firstName,
                          student.middleName,
                          student.lastName,
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      </td>

                      <td>{student.department || "—"}</td>
                      <td>{student.yearSection || "—"}</td>
                      <td>{student.gpa ?? "—"}</td>
                      <td>{student.status || "—"}</td>

                      <td>
                        <button
                          className="registrar-edit-button"
                          type="button"
                          onClick={() => openEditForm(student)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Registration and editing form */}
        {showForm && (
          <section className="registrar-form-panel">
            <div className="registrar-form-heading">
              <h3>
                {editingStudentId
                  ? "Update student information"
                  : "Register a new student"}
              </h3>

              <button
                className="registrar-close-button"
                type="button"
                onClick={closeForm}
              >
                Close
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="registrar-form-grid">
                <label>
                  Student ID *
                  <input
                    required
                    disabled={Boolean(editingStudentId)}
                    maxLength={50}
                    value={form.studentId}
                    onChange={(event) =>
                      updateField("studentId", event.target.value)
                    }
                  />
                </label>

                <label>
                  First name *
                  <input
                    required
                    maxLength={100}
                    value={form.firstName}
                    onChange={(event) =>
                      updateField("firstName", event.target.value)
                    }
                  />
                </label>

                <label>
                  Middle name *
                  <input
                    required
                    maxLength={100}
                    value={form.middleName}
                    onChange={(event) =>
                      updateField("middleName", event.target.value)
                    }
                  />
                </label>

                <label>
                  Last name *
                  <input
                    required
                    maxLength={100}
                    value={form.lastName}
                    onChange={(event) =>
                      updateField("lastName", event.target.value)
                    }
                  />
                </label>

                <label>
                  Gender
                  <input
                    value={form.gender}
                    onChange={(event) =>
                      updateField("gender", event.target.value)
                    }
                  />
                </label>

                <label>
                  Region
                  <input
                    value={form.region}
                    onChange={(event) =>
                      updateField("region", event.target.value)
                    }
                  />
                </label>

                <label>
                  Disability
                  <input
                    value={form.disability}
                    onChange={(event) =>
                      updateField("disability", event.target.value)
                    }
                  />
                </label>

                <label>
                  Department
                  <input
                    value={form.department}
                    onChange={(event) =>
                      updateField("department", event.target.value)
                    }
                  />
                </label>

                <label>
                  Year / Section
                  <input
                    value={form.yearSection}
                    onChange={(event) =>
                      updateField("yearSection", event.target.value)
                    }
                  />
                </label>

                <label>
                  Status
                  <input
                    value={form.status}
                    onChange={(event) =>
                      updateField("status", event.target.value)
                    }
                  />
                </label>

                <label>
                  GPA (0–4)
                  <input
                    type="number"
                    min="0"
                    max="4"
                    step="0.01"
                    value={form.gpa}
                    onChange={(event) =>
                      updateField("gpa", event.target.value)
                    }
                  />
                </label>

                {!editingStudentId && (
                  <label>
                    Initial password *
                    <input
                      type="password"
                      required
                      minLength={8}
                      maxLength={128}
                      autoComplete="new-password"
                      value={form.password}
                      onChange={(event) =>
                        updateField("password", event.target.value)
                      }
                    />
                  </label>
                )}
              </div>

              <div className="registrar-form-actions">
                <button
                  className="registrar-primary-button"
                  type="submit"
                  disabled={isSaving}
                >
                  {isSaving
                    ? "Saving..."
                    : editingStudentId
                      ? "Save changes"
                      : "Register student"}
                </button>

                <button
                  className="registrar-cancel-button"
                  type="button"
                  onClick={closeForm}
                  disabled={isSaving}
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
      </section>

      <footer className="app-footer">
        <p>
          © {new Date().getFullYear()} Debre Markos University, Bure Campus.
          Student Union Election System.
        </p>
      </footer>
    </main>
  );
}
