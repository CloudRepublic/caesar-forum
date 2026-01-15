import type { Session } from "@shared/schema";

export interface OverlapPair {
  session1: Session;
  session2: Session;
}

export function sessionsOverlap(session1: Session, session2: Session): boolean {
  const start1 = new Date(session1.startTime).getTime();
  const end1 = new Date(session1.endTime).getTime();
  const start2 = new Date(session2.startTime).getTime();
  const end2 = new Date(session2.endTime).getTime();

  return start1 < end2 && start2 < end1;
}

export function findOverlappingSessions(sessions: Session[]): OverlapPair[] {
  const overlaps: OverlapPair[] = [];
  
  for (let i = 0; i < sessions.length; i++) {
    for (let j = i + 1; j < sessions.length; j++) {
      if (sessionsOverlap(sessions[i], sessions[j])) {
        overlaps.push({
          session1: sessions[i],
          session2: sessions[j],
        });
      }
    }
  }
  
  return overlaps;
}

export function findOverlapsWithSession(
  targetSession: Session,
  registeredSessions: Session[]
): Session[] {
  return registeredSessions.filter(
    (s) => s.id !== targetSession.id && sessionsOverlap(targetSession, s)
  );
}
