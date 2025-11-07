/**
 * Helper function to parse course name from column ID
 * Examples:
 * - "CCW6_CCW6" -> "CCW6"
 * - "CCW6_CCW_E_6" -> "CCW(E)6"
 * - "OTHER_SUBJECTS_TOK" -> "TOK"
 * - "OTHER_SUBJECTS_Community_Service" -> "Community Service"
 */
export function parseCourseNameFromColumnId(columnId: string, groupId: string): string {
  // Remove the group ID prefix (e.g., "OTHER_SUBJECTS_")
  const prefix = `${groupId}_`;
  if (columnId.startsWith(prefix)) {
    const nameWithoutGroup = columnId.substring(prefix.length);
    // Replace underscores with spaces for multi-word names
    return nameWithoutGroup.replace(/_/g, ' ');
  }

  // Fallback to old logic for backward compatibility
  if (!columnId.includes('_')) {
    return columnId;
  }

  const parts = columnId.split('_');
  parts.shift(); // Remove group ID prefix

  if (parts.length === 1) {
    return parts[0]; // Simple case: "CCW6"
  }

  // Complex case: "CCW_E_6" -> "CCW(E)6"
  const base = parts[0]; // "CCW"
  const suffix = parts[parts.length - 1]; // "6"
  const middle = parts.slice(1, -1); // ["E"]

  if (middle.length > 0) {
    return `${base}(${middle.join('')})${suffix}`;
  }

  return `${base}${suffix}`;
}
