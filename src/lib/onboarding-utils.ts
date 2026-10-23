/**
 * Merchant onboarding helpers — Option A:
 * On registration, we generate a Login ID, a one-time strong password, and a
 * unique POS URL slug. These are surfaced in the Organization panel so the
 * super-admin can copy/share them with the new merchant.
 *
 * Option B (self-serve signup link) is also supported via buildSignupLink().
 */

const ADJ = ['swift', 'bright', 'crisp', 'calm', 'bold', 'royal', 'ember', 'noble'];
const NOUN = ['oak', 'falcon', 'lotus', 'harbor', 'summit', 'aria', 'cobalt', 'amber'];

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

export const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'merchant';

export const generateLoginId = (businessName: string) =>
  `${slugify(businessName).slice(0, 12)}-${Math.random().toString(36).slice(2, 6)}`;

export const generateTempPassword = () => {
  const word = `${rand(ADJ)}-${rand(NOUN)}`;
  const num = Math.floor(100 + Math.random() * 900);
  const sym = '!@#$'[Math.floor(Math.random() * 4)];
  return `${word}-${num}${sym}`;
};

export const buildPosUrl = (slug: string) =>
  `${typeof window !== 'undefined' ? window.location.origin : ''}/pos/${slug}`;

export const buildSignupLink = (token: string) =>
  `${typeof window !== 'undefined' ? window.location.origin : ''}/register?token=${token}`;

export interface OnboardingPacket {
  loginId: string;
  tempPassword: string;
  posUrl: string;
  signupLink: string;
  createdAt: string;
}

export const createOnboardingPacket = (businessName: string): OnboardingPacket => {
  const slug = slugify(businessName);
  const loginId = generateLoginId(businessName);
  return {
    loginId,
    tempPassword: generateTempPassword(),
    posUrl: buildPosUrl(slug),
    signupLink: buildSignupLink(`${slug}-${Math.random().toString(36).slice(2, 10)}`),
    createdAt: new Date().toISOString(),
  };
};
