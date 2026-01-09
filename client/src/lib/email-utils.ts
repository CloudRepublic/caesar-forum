function getLocalPart(email: string): string {
  const parts = email.toLowerCase().split("@");
  return parts.length === 2 ? parts[0] : email.toLowerCase();
}

export function isEmailInList(email: string, list: string[]): boolean {
  const userLocalPart = getLocalPart(email);
  return list.some((listEmail) => getLocalPart(listEmail) === userLocalPart);
}
