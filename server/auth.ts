import { User } from '../types';

const SECRET_KEY = 'SUPER_SECRET_KEY_FOR_DEMO';

// Simulates signing a JWT. In a real app, use a library like 'jsonwebtoken'.
export const sign = (payload: { id: number; role: string }): string => {
  const encodedPayload = btoa(JSON.stringify(payload));
  // In a real scenario, a signature would be created using the secret.
  // Here, we just append a static "signature" for demonstration.
  const signature = btoa(SECRET_KEY);
  return `${encodedPayload}.${signature}`;
};

// Simulates verifying a JWT.
export const verify = (token: string): { id: number; role: string } | null => {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (atob(signature) !== SECRET_KEY) {
      return null; // Invalid signature
    }
    const payload = JSON.parse(atob(encodedPayload));
    return payload;
  } catch (error) {
    return null; // Token is malformed or invalid
  }
};
