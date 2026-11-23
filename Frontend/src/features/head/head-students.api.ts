import { api } from "../../services/api";

export interface HeadDepartmentStudent {
  studentId: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  department: string;
  yearSection: string;
  gpa?: number;
}

interface DepartmentStudentsResponse {
  success: boolean;
  message: string;
  data: {
    students: HeadDepartmentStudent[];
    count: number;
  };
}

/**
 * Get all students in the authenticated Head's department.
 * The backend determines the department from the login token.
 */
export async function getHeadDepartmentStudents(): Promise<
  HeadDepartmentStudent[]
> {
  const response =
    await api.get<DepartmentStudentsResponse>("/students/department");

  if (!response.success || !response.data) {
    throw new Error(
      response.message || "Unable to load department students."
    );
  }

  return response.data.students;
}