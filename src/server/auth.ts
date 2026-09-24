import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from './db';

const SESSION_COOKIE_NAME = 'atelier_session';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, res: Response): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      sessionToken: token,
      userId,
      expiresAt,
    },
  });

  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: expiresAt,
    path: '/',
  });

  return token;
}

export async function destroySession(req: Request, res: Response): Promise<{ deleted: number }> {
  const tokensToDelete = new Set<string>();

  if (req.cookies?.[SESSION_COOKIE_NAME]) {
    tokensToDelete.add(req.cookies[SESSION_COOKIE_NAME]);
  }

  const authHeader = req.headers.authorization || (req.headers.Authorization as string | undefined);
  if (authHeader && authHeader.startsWith('Bearer ')) {
    tokensToDelete.add(authHeader.slice(7).trim());
  }

  // STEP 1: Explicitly invalidate session token in database BEFORE clearing client-side cookie
  let deleted = 0;
  if (tokensToDelete.size > 0) {
    const result = await prisma.session.deleteMany({
      where: { sessionToken: { in: Array.from(tokensToDelete) } },
    }).catch((err) => {
      console.error('[destroySession] Error deleting session from database:', err);
      return { count: 0 };
    });
    deleted = result.count;
    console.log(`[destroySession] Step 1: Explicitly destroyed ${deleted} session record(s) from database.`);
  }

  // STEP 2: Clear client-side session cookie from the browser after DB invalidation
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOpts = {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? 'none' : 'lax') as 'none' | 'lax',
    path: '/',
  };

  // Explicitly clear session cookie across standard configurations
  res.clearCookie(SESSION_COOKIE_NAME, cookieOpts);
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
  res.cookie(SESSION_COOKIE_NAME, '', {
    ...cookieOpts,
    expires: new Date(0),
    maxAge: 0,
  });

  return { deleted };
}

export async function getSessionUser(req: Request) {
  let token = req.cookies?.[SESSION_COOKIE_NAME];
  const authHeader = req.headers.authorization || (req.headers.Authorization as string | undefined);
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  }

  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          address: true,
          city: true,
          country: true,
          postalCode: true,
          createdAt: true,
        },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export interface AuthenticatedRequest extends Request {
  user?: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.user = user;
  next();
}

export async function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = await getSessionUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator privileges required' });
  }
  req.user = user;
  next();
}
