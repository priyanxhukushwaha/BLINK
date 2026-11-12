/**
 * EPHEMERAL Member ID & Display Name Mapping Utility
 * Ensures stable member IDs ('user-meera', 'user-kabir', etc.) in the data layer
 * while resolving friendly display names ('Meera', 'Kabir', etc.) for the UI.
 */

export const KNOWN_MEMBER_NAMES: Record<string, string> = {
  'user-me': 'You',
  'user-meera': 'Meera',
  'user-kabir': 'Kabir',
  'user-tanya': 'Tanya',
  'user-aryan': 'Aryan',
  'user-rohan': 'Rohan',
  'user-sneha': 'Sneha',
  'user-zara': 'Zara',
  'user-dev': 'Dev',
  'user-aditi': 'Aditi',
  'user-vikram': 'Vikram',
  'user-ananya': 'Ananya',
};

export const NAME_TO_MEMBER_ID: Record<string, string> = {
  'You': 'user-me',
  'you': 'user-me',
  'Priyanx': 'user-me',
  'Priyanx Kushwaha': 'user-me',
  'Meera': 'user-meera',
  'meera': 'user-meera',
  'Kabir': 'user-kabir',
  'kabir': 'user-kabir',
  'Tanya': 'user-tanya',
  'tanya': 'user-tanya',
  'Aryan': 'user-aryan',
  'aryan': 'user-aryan',
  'Rohan': 'user-rohan',
  'rohan': 'user-rohan',
  'Sneha': 'user-sneha',
  'sneha': 'user-sneha',
  'Zara': 'user-zara',
  'zara': 'user-zara',
  'Dev': 'user-dev',
  'dev': 'user-dev',
  'Aditi': 'user-aditi',
  'aditi': 'user-aditi',
  'Vikram': 'user-vikram',
  'vikram': 'user-vikram',
  'Ananya': 'user-ananya',
  'ananya': 'user-ananya',
};

/**
 * Resolves a member ID to a friendly UI display name.
 * If given a legacy display name or unknown ID, returns an appropriate label.
 */
export function getMemberDisplayName(memberIdOrName: string | null | undefined): string {
  if (!memberIdOrName) return 'Someone';
  return KNOWN_MEMBER_NAMES[memberIdOrName] || memberIdOrName;
}

/**
 * Normalizes any legacy display name to a stable member ID.
 * Example: 'Meera' -> 'user-meera', 'user-meera' -> 'user-meera'.
 */
export function normalizeMemberId(idOrName: string | null | undefined): string | null {
  if (!idOrName) return null;
  return NAME_TO_MEMBER_ID[idOrName] || idOrName;
}

