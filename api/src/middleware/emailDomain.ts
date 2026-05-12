const UNIVERSITY_DOMAIN = process.env.UNIVERSITY_EMAIL_DOMAIN ?? 'university.edu';

export function isUniversityEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  return domain === UNIVERSITY_DOMAIN.toLowerCase();
}

export function assertUniversityEmail(email: string): void {
  if (!isUniversityEmail(email)) {
    const err = new Error(
      `Registration restricted to ${UNIVERSITY_DOMAIN} email addresses`,
    ) as Error & { statusCode: number };
    err.statusCode = 422;
    throw err;
  }
}
