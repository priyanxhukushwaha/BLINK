import type { RoomMemberProfile } from '../types/chat';

export interface MemberNameSource {
  id: string;
  displayName: string;
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
    return names.get(id) ?? 'Someone';
  };
}

export function getMemberDisplayName(
  memberIdOrName: string | null | undefined,
  members?: RoomMemberProfile[],
  currentUserId?: string
): string {
  return createMemberNameResolver(members, currentUserId)(memberIdOrName);
}
