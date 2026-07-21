/** Join given + family name for patients_min.full_name storage. */
export function joinPatientName(firstName: string, lastName: string): string {
  return `${firstName.trim()} ${lastName.trim()}`.replace(/\s+/g, " ").trim();
}
