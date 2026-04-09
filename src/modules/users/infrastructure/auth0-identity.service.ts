import {
  IdentityVerificationService,
  IdentityVerificationResult,
} from '../../../domain/contracts';
import { validarCorreoConGoogle, validarTokenAuth0 } from '../../../utils/registro.util';

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

    try {
      return await validarTokenAuth0(googleIdToken, correo);
    } catch (auth0Error) {
      try {
        return await validarCorreoConGoogle(googleIdToken, correo);
      } catch (googleError) {
        const detalleAuth0 =
          auth0Error instanceof Error ? auth0Error.message : 'Error desconocido al validar con Auth0';
        const detalleGoogle =
          googleError instanceof Error ? googleError.message : 'Error desconocido al validar con Google';

        throw new Error(`${detalleAuth0} ${detalleGoogle}`.trim());
      }
    }
  }
}