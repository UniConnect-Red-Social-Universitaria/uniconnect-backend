import bcrypt from 'bcryptjs';

import { PasswordService } from '../../../domain/contracts';

export class BcryptPasswordService implements PasswordService {
  async hash(value: string) {
    return bcrypt.hash(value, 10);
  }

  async compare(rawValue: string, hashedValue: string) {
    return bcrypt.compare(rawValue, hashedValue);
  }
}