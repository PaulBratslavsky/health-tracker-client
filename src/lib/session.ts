import { useSession } from '@tanstack/react-start/server';

export type SessionData = {
  jwt?: string;
  userId?: number;
};

const SESSION_COOKIE_NAME = 'health_session';

export function useAppSession() {
  return useSession<SessionData>({
    name: SESSION_COOKIE_NAME,
    password: process.env.SESSION_SECRET ?? '',
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    },
  });
}
