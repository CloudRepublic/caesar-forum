import type { Speaker, Attendee } from "@shared/schema";

function getLocalPart(email: string): string {
  const parts = email.toLowerCase().split("@");
  return parts.length === 2 ? parts[0] : email.toLowerCase();
}

export function isEmailInAttendees(email: string, attendees: Attendee[]): boolean {
  const userLocalPart = getLocalPart(email);
  return attendees.some((attendee) => getLocalPart(attendee.email) === userLocalPart);
}

export function isSpeaker(email: string, speakers: Speaker[]): boolean {
  const userLocalPart = getLocalPart(email);
  return speakers.some((speaker) => getLocalPart(speaker.email) === userLocalPart);
}
