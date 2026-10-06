/** Set by /auth/confirm after a password-reset link; lets /reset-password skip the current-password check. */
export const RESET_COOKIE = "pw-reset";
/** How long the reset link's session may set a new password without the old one. */
export const RESET_MAX_AGE = 15 * 60;
