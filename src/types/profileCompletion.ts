/**
 * Payload for POST /user/complete-profile after onboarding (no country/city/institution here — not collected at registration).
 * National ID, student ID (students only), and address formats are enforced client- and server-side.
 */
export interface CompleteProfilePayload {
  title: string;
  nationalIdNumber: string;
  /** Student ID for students; empty for staff and alumni. */
  studentStaffId: string;
  salaryRange?: string | null;
  addressLine1: string;
  addressLine2?: string;
}
