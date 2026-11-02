// The password rule, the same as the Auth settings in supabase/config.toml (minimum_password_length,
// password_requirements = "lower_upper_letters_digits"). Checking it in the form gives a clear message
// before Supabase refuses the password.
export const PASSWORD_MIN_LENGTH = 12

export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, with upper and lower case letters and a digit.`

/** What is wrong with a new password, or null when it meets the rule. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) return `Use at least ${PASSWORD_MIN_LENGTH} characters.`
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Use upper and lower case letters and at least one digit.'
  }
  return null
}
