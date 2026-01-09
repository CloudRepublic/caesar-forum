const EMAIL_ALIASES: Record<string, string[]> = {
  "caesar.nl": ["cloudrepublic.nl", "cloudrepublic.com"],
};

function getEmailVariants(email: string): string[] {
  const lowered = email.toLowerCase();
  const parts = lowered.split("@");
  if (parts.length !== 2) return [lowered];
  
  const [localPart, domain] = parts;
  const variants = [lowered];
  
  for (const [primaryDomain, aliasDomains] of Object.entries(EMAIL_ALIASES)) {
    if (domain === primaryDomain) {
      aliasDomains.forEach((alias) => {
        variants.push(`${localPart}@${alias}`);
      });
    } else if (aliasDomains.includes(domain)) {
      variants.push(`${localPart}@${primaryDomain}`);
      aliasDomains.forEach((alias) => {
        if (alias !== domain) {
          variants.push(`${localPart}@${alias}`);
        }
      });
    }
  }
  
  return variants;
}

export function isEmailInList(email: string, list: string[]): boolean {
  const variants = getEmailVariants(email);
  const loweredList = list.map((e) => e.toLowerCase());
  return variants.some((v) => loweredList.includes(v));
}
