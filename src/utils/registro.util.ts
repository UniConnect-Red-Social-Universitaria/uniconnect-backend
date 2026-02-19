import { OAuth2Client } from 'google-auth-library';

const DEFAULT_DOMAIN = 'ucaldas.edu.co';
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const institutionalDomains = (process.env.INSTITUTIONAL_EMAIL_DOMAINS ?? DEFAULT_DOMAIN)
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

export function esCorreoInstitucional(correo: string): boolean {
    const normalizedEmail = correo.trim().toLowerCase();
    const domain = normalizedEmail.split('@')[1] ?? '';
    return institutionalDomains.includes(domain);
}

export async function validarCorreoConGoogle(idToken: string, correo: string) {
    if (!process.env.GOOGLE_CLIENT_ID) {
        throw new Error('Falta configurar GOOGLE_CLIENT_ID en el servidor');
    }

    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    if (!payload?.email || !payload.email_verified || !payload.sub) {
        throw new Error('No se pudo verificar la cuenta de Google');
    }

    const emailToken = payload.email.toLowerCase();
    const emailBody = correo.trim().toLowerCase();

    if (emailToken !== emailBody) {
        throw new Error('El correo de Google no coincide con el correo del registro');
    }

    if (!esCorreoInstitucional(emailBody)) {
        throw new Error('Solo se permiten correos institucionales');
    }

    return {
        correoVerificado: true,
        googleSub: payload.sub
    };
}
