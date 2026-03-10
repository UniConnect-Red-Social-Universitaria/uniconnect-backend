import { OAuth2Client } from "google-auth-library";
import jwt, { JwtHeader, SigningKeyCallback } from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const DEFAULT_DOMAIN = "ucaldas.edu.co";

const googleClient = new OAuth2Client();

const institutionalDomains = (
  process.env.INSTITUTIONAL_EMAIL_DOMAINS ?? DEFAULT_DOMAIN
)
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

const auth0Domain =
  process.env.AUTH0_DOMAIN || "dev-orxxfhogwtwn2og3.us.auth0.com";

const auth0Client = jwksClient({
  jwksUri: `https://${auth0Domain}/.well-known/jwks.json`,
});

function getAuth0Key(header: JwtHeader, callback: SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error("No se encontró 'kid' en el token"), undefined);
  }

  auth0Client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err, undefined);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export function esCorreoInstitucional(correo: string): boolean {
  const normalizedEmail = correo.trim().toLowerCase();
  const domain = normalizedEmail.split("@")[1] ?? "";
  return institutionalDomains.includes(domain);
}

export const validarTokenAuth0 = (
  token: string,
  correoEsperado: string,
): Promise<{ correoVerificado: boolean; googleSub: string }> => {
  return new Promise((resolve, reject) => {
    jwt.verify(
      token,
      getAuth0Key,
      { algorithms: ["RS256"] },
      (err, decoded: any) => {
        if (err) {
          return reject(new Error("Token de Auth0 inválido o expirado."));
        }

        const emailToken = decoded.email?.toLowerCase();
        const emailBody = correoEsperado.trim().toLowerCase();

        if (emailToken !== emailBody) {
          return reject(
            new Error(
              "El correo verificado no coincide con el correo del registro",
            ),
          );
        }

        if (!esCorreoInstitucional(emailBody)) {
          return reject(new Error("Solo se permiten correos institucionales"));
        }

        resolve({
          correoVerificado: true,
          googleSub: decoded.sub,
        });
      },
    );
  });
};

export async function validarCorreoConGoogle(idToken: string, correo: string) {
  const webClientId = process.env.GOOGLE_CLIENT_ID_WEB;
  const iosClientId = process.env.GOOGLE_CLIENT_ID_IOS;
  const androidClientId = process.env.GOOGLE_CLIENT_ID_ANDROID;

  const allowedAudiences = [webClientId, iosClientId, androidClientId].filter(
    Boolean,
  ) as string[];

  if (allowedAudiences.length === 0) {
    throw new Error("Falta configurar los GOOGLE_CLIENT_IDs en el servidor");
  }

  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: allowedAudiences,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload.email_verified || !payload.sub) {
    throw new Error("No se pudo verificar la cuenta de Google");
  }

  const emailToken = payload.email.toLowerCase();
  const emailBody = correo.trim().toLowerCase();

  if (emailToken !== emailBody) {
    throw new Error(
      "El correo de Google no coincide con el correo del registro",
    );
  }

  if (!esCorreoInstitucional(emailBody)) {
    throw new Error("Solo se permiten correos institucionales");
  }

  return {
    correoVerificado: true,
    googleSub: payload.sub,
  };
}
