/**
 * Parliament member information.
 *
 * This interface represents student details displayed
 * alongside their Phase 3 Parliament evaluation record.
 *
 * The actual evaluation record is stored separately
 * in the phase3_parliament collection.
 */
export interface ParliamentMember {
  studentId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  department?: string;
  yearSection?: string;
  gpa?: number;
  photo?: string;
}