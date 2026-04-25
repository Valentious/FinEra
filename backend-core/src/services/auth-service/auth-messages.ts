/**
 * Public-facing copy for auth errors — do not reveal which account type an email is tied to
 * (enumeration / privacy). Server logs (see auth.audit) keep structured details.
 *
 * OAuth/social: when added, resolve identity to the same User row and apply the same account-line rules.
 */

/** Shown for wrong account type on login, or different type on re-registration attempt. */
export const AUTH_MSG_EMAIL_ACCOUNT_IN_USE = `This email is already associated with an existing account. Please log in or use a different email.`;

/** Shown when the same email+account type is already registered (suggest sign-in; does not confirm another type). */
export const AUTH_MSG_SIGN_IN_INSTEAD = `This email is already in use. Sign in if you already have an account.`;
