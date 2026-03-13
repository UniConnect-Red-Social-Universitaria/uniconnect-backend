import {
  IdentityVerificationService,
  IdentityVerificationResult,
} from '../../../domain/contracts';
import { validarTokenAuth0 } from '../../../utils/registro.util';

export class Auth0IdentityVerificationService
  implements IdentityVerificationService
{
  async verifyRegistrationIdentity(
    googleIdToken: string,
    correo: string,
  ): Promise<IdentityVerificationResult> {
    if (process.env.DEV_MODE === 'true') {
      return {
        correoVerificado: true,
        googleSub: `dev-${Date.now()}`,
      };
    }

    return validarTokenAuth0(googleIdToken, correo);
  }
}