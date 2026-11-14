import type { RoomMemberProfile } from '../types/chat';

export interface MemberNameSource {
  id: string;
  displayName: string;
}

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
 * Normalizes any legacy display name to a stable member ID.
 * Example: 'Meera' -> 'user-meera', 'user-meera' -> 'user-meera'.
 */
export function normalizeMemberId(idOrName: string | null | undefined): string | null {
  if (!idOrName) return null;
  return NAME_TO_MEMBER_ID[idOrName] || idOrName;
}

/**
 * Builds a name resolver for read receipts. Read receipts carry real user ids,
 * so they are resolved against the room roster and the signed-in user.
 */
export function createMemberNameResolver(
  members: MemberNameSource[] | undefined,
  currentUserId?: string
): (id: string | null | undefined) => string {
  const names = new Map((members ?? []).map((member) => [member.id, member.displayName]));

  return (id) => {
    if (!id) return 'Someone';
    if (currentUserId && id === currentUserId) return 'You';
    return names.get(id) ?? KNOWN_MEMBER_NAMES[id] ?? id ?? 'Someone';
  };
}

export function getMemberDisplayName(
  memberIdOrName: string | null | undefined,
  members?: RoomMemberProfile[],
  currentUserId?: string
): string {
  return createMemberNameResolver(members, currentUserId)(memberIdOrName);
}
