import { TokenBlacklistService } from '../../../domain/contracts';
import { revokeToken } from '../../../lib/token-blacklist';

export class InMemoryTokenBlacklistService implements TokenBlacklistService {
  revoke(token: string, expSeconds: number) {
    revokeToken(token, expSeconds);
  }
}