import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

import { AuthenticatedUser, TokenService } from '../../../domain/contracts';

export class JwtTokenService implements TokenService {
  sign(payload: AuthenticatedUser) {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET no configurado en .env');
    }

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: (process.env.JWT_EXPIRES_IN ?? '30d') as SignOptions['expiresIn'],
    });
  }

  decodeExpiration(token: string) {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    return decoded?.exp ?? null;
  }
}