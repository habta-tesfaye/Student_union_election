import { useEffect, useState } from "react";

import { useAuthContext } from "../../../context/AuthContext";

import {
  getHeadDepartmentStudents,
  type HeadDepartmentStudent,
} from "../head-students.api";
import HeadTieResolutionPage from "./HeadTieResolutionPage";
import HeadNoticesPage from "./HeadNoticesPage";
import { getDepartmentNominations } from "../../nominations/services/nomination.api";
import HeadSendToSSDPage from "./HeadSendToSSDPage";
import type { Nomination } from "../../nominations/types/nomination.types";

import HeadSidebar from "../components/HeadSidebar";
import HeadCandidateInformationPage from "./HeadCandidateInformationPage";
import HeadNominationReviewPage from "./HeadNominationReviewPage";

import "./HeadDashboardPage.css";

function HeadDashboardPage() {
  const { user, signOut } = useAuthContext();

  const [nominations, setNominations] = useState<Nomination[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activePage, setActivePage] = useState("dashboard");

  const [departmentStudents, setDepartmentStudents] = useState<
    HeadDepartmentStudent[]
  >([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentsError, setStudentsError] = useState("");
  const [yearSectionFilter, setYearSectionFilter] = useState("all");
  const [studentSearch, setStudentSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const data = await getDepartmentNominations();

        if (isMounted) {
          setNominations(data);
          setErrorMessage("");
        }
      } catch (error: unknown) {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load Department Head dashboard."
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadDepartmentStudents() {
      try {
        const students = await getHeadDepartmentStudents();

        if (isMounted) {
          setDepartmentStudents(students);
          setStudentsError("");
        }
      } catch (error: unknown) {
        if (isMounted) {
          setStudentsError(
            error instanceof Error
              ? error.message
              : "Unable to load department students."
          );
        }
      } finally {
        if (isMounted) {
          setStudentsLoading(false);
        }
      }
    }

    void loadDepartmentStudents();

    return () => {
      isMounted = false;
    };
  }, []);

  const displayName = user
    ? [user.firstName, user.middleName, user.lastName]
        .filter(Boolean)
        .join(" ")
    : "Department Head";

  const pendingCount = nominations.filter(
    (nomination) => nomination.status === "pending"
  ).length;

  const approvedCount = nominations.filter(
    (nomination) => nomination.status === "approved"
  ).length;

  const rejectedCount = nominations.filter(
    (nomination) => nomination.status === "rejected"
  ).length;

  const yearSectionOptions = Array.from(
    new Set(
      departmentStudents
        .map((student) => student.yearSection)
        .filter(Boolean)
    )
  ).sort();

  const filteredDepartmentStudents = departmentStudents.filter(
    (student) => {
      const matchesYearSection =
        yearSectionFilter === "all" ||
        student.yearSection === yearSectionFilter;

      const searchText = studentSearch.trim().toLowerCase();

      const fullName = [
        student.firstName,
        student.middleName,
        student.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !searchText ||
        fullName.includes(searchText) ||
        student.studentId.toLowerCase().includes(searchText);

      return matchesYearSection && matchesSearch;
    }
  );

  if (
    activePage === "nominations" ||
    activePage === "pending" ||
    activePage === "approved" ||
    activePage === "rejected"
  ) {
    return (
      <HeadNominationReviewPage
        onBack={() => setActivePage("dashboard")}
      />
    );
  }

  if (activePage === "candidates") {
    return (
      <HeadCandidateInformationPage
        onBack={() => setActivePage("dashboard")}
      />
    );
  }
if (activePage === "tie-resolution") {
  return (
    <HeadTieResolutionPage
      onBack={() => setActivePage("dashboard")}
    />
  );
}
if (activePage === "notices") {
  return (
    <HeadNoticesPage
      onBack={() => setActivePage("dashboard")}
    />
  );
}
if (activePage === "send-to-ssd") {
  return (
    <HeadSendToSSDPage
      onBack={() => setActivePage("dashboard")}
    />
  );
}
  return (
    <div className="head-dashboard-layout">
      <HeadSidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={signOut}
      />

      <div className="head-dashboard-main">
        <header className="head-dashboard-header">
          <div>
            <h1>Department Head Portal</h1>
            <p>Student Union Election System | DMU Bure Campus</p>
          </div>

          <button
            type="button"
            className="head-dashboard-signout"
            onClick={signOut}
          >
            Sign Out
          </button>
        </header>

        <main className="head-dashboard-content">
          <section className="head-dashboard-welcome">
            <span>Department Head Dashboard</span>

            <h2>Welcome, {displayName || "Department Head"}</h2>

            <p>
              Manage student union nominations and review candidate
              nominations submitted by students in your department.
            </p>
          </section>

          <h2 className="head-dashboard-section-title">
            Department Overview
          </h2>

          <p className="head-dashboard-department">
            Department:{" "}
            <strong>{user?.department || "Not available"}</strong>
          </p>

          {isLoading && (
            <p className="head-dashboard-loading">
              Loading nomination statistics...
            </p>
          )}

          {!isLoading && errorMessage && (
            <div className="head-dashboard-error" role="alert">
              {errorMessage}
            </div>
          )}

          {!isLoading && !errorMessage && (
            <section className="head-dashboard-statistics">
              <article className="head-dashboard-stat">
                <h3>Total Nominations</h3>
                <p>{nominations.length}</p>
              </article>

              <article className="head-dashboard-stat">
                <h3>Pending Review</h3>
                <p>{pendingCount}</p>
              </article>

              <article className="head-dashboard-stat">
                <h3>Approved Nominations</h3>
                <p>{approvedCount}</p>
              </article>

              <article className="head-dashboard-stat">
                <h3>Rejected Nominations</h3>
                <p>{rejectedCount}</p>
              </article>
            </section>
          )}

          <section className="head-dashboard-panel">
            <h3>Department Nomination Management</h3>

            <p>
              Review nominations from your department, check nominee
              information, and approve or reject pending nominations.
            </p>

            <button
              type="button"
              className="head-dashboard-action"
              onClick={() => setActivePage("nominations")}
            >
              Open Nomination Review
            </button>
          </section>

          <section className="head-department-students">
            <div className="head-department-students-heading">
              <div>
                <h2>Department Students</h2>
                <p>
                  Students in {user?.department || "your department"}
                </p>
              </div>

              <span>{departmentStudents.length} students</span>
            </div>

            <div className="head-department-student-filters">
              <label>
                Year / Section
                <select
                  value={yearSectionFilter}
                  onChange={(event) =>
                    setYearSectionFilter(event.target.value)
                  }
                >
                  <option value="all">All years and sections</option>
                  {yearSectionOptions.map((yearSection) => (
                    <option key={yearSection} value={yearSection}>
                      {yearSection}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Name or Student ID
                <input
                  type="search"
                  value={studentSearch}
                  onChange={(event) =>
                    setStudentSearch(event.target.value)
                  }
                  placeholder="Filter the displayed students"
                />
              </label>
            </div>

            {studentsLoading && (
              <p>Loading department students...</p>
            )}

            {!studentsLoading && studentsError && (
              <p role="alert">{studentsError}</p>
            )}

            {!studentsLoading && !studentsError && (
              <div className="head-department-students-table-wrap">
                <table className="head-department-students-table">
                  <thead>
                    <tr>
                      <th>Student ID</th>
                      <th>Student Name</th>
                      <th>Department</th>
                      <th>Year / Section</th>
                      <th>GPA</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredDepartmentStudents.map((student) => (
                      <tr key={student.studentId}>
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
                        <td>{student.department}</td>
                        <td>{student.yearSection}</td>
                        <td>{student.gpa ?? "—"}</td>
                      </tr>
                    ))}

                    {filteredDepartmentStudents.length === 0 && (
                      <tr>
                        <td colSpan={5}>
                          No students match the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>

        <footer className="head-dashboard-footer">
          © {new Date().getFullYear()} Debre Markos University,
          Bure Campus. Student Union Election System.
        </footer>
      </div>
    </div>
  );
}

export default HeadDashboardPage;