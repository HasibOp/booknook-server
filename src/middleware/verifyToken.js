import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';

// BetterAuth (in the Next.js client) signs the JWTs and publishes its public keys
// at /api/auth/jwks. jose downloads them once and caches them, refetching only
// when a token arrives with a key id it hasn't seen.
const JWKS = createRemoteJWKSet(new URL(`${env.clientUrl}/api/auth/jwks`));

export async function verifyToken(req, res, next) {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Unauthorized access' });
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: env.clientUrl,
      audience: env.clientUrl,
    });
    if (!payload.email) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    req.user = {
      id: payload.sub ?? payload.id,
      name: payload.name,
      email: payload.email,
    };
    next();
  } catch (err) {
    // jose errors (bad signature, expired, wrong issuer...) mean the token is bad.
    // Anything else means we couldn't reach the key set, which isn't the user's fault.
    const isTokenProblem =
      err.code?.startsWith('ERR_JW') && err.code !== 'ERR_JWKS_TIMEOUT';
    if (isTokenProblem) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.error('JWT verification unavailable:', err.message);
    return res.status(503).json({
      message: 'Could not verify your login right now. Please try again.',
    });
  }
}
