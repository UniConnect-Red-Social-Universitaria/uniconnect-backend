import nodemailer from 'nodemailer';
import { logger } from './logger';

export const mailTransport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

mailTransport.verify().catch((error) => {
    logger.error('[Mailer] Error conectando al servidor SMTP:', error);
});