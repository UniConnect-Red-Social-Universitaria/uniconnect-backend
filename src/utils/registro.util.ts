import { OAuth2Client } from "google-auth-library";

const DEFAULT_DOMAIN = "ucaldas.edu.co";

const googleClient = new OAuth2Client();

const institutionalDomains = (
  process.env.INSTITUTIONAL_EMAIL_DOMAINS ?? DEFAULT_DOMAIN
)
  .split(",")
  .map((domain) => domain.trim().toLowerCase())
  .filter(Boolean);

export function esCorreoInstitucional(correo: string): boolean {
  const normalizedEmail = correo.trim().toLowerCase();
  const domain = normalizedEmail.split("@")[1] ?? "";
  return institutionalDomains.includes(domain);
}

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
