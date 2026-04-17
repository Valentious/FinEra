/**
 * Payload for POST /user/complete-profile after onboarding (no country/city/university — captured at registration).
 * National ID, student/employer ID (not staff), and address formats are enforced client- and server-side.
 */
export interface CompleteProfilePayload {
  title: string;
  nationalIdNumber: string;
  /** Empty for staff accounts; required format for student and alumni. */
  studentStaffId: string;
  salaryRange?: string | null;
  addressLine1: string;
  addressLine2?: string;
}
