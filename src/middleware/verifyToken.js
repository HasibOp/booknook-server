import { createRemoteJWKSet, jwtVerify } from 'jose';
import { env } from '../config/env.js';

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
