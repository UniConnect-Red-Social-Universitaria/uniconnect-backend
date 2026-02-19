/**
 * Script para generar un Google ID Token de prueba
 * Úsalo solo en desarrollo
 * 
 * Instalá primero: npm install google-auth-library
 * Ejecutá: node get-google-token.js
 */

const { OAuth2Client } = require('google-auth-library');
const readline = require('readline');

const CLIENT_ID = '196131874719-aeo5ot1rvfaneh4v1kik1g4goi4o5jp6.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

async function getToken() {
    console.log('\n📧 Generador de Google ID Token\n');
    console.log('Pasos:');
    console.log('1. Ve a: https://developers.google.com/oauthplayground/');
    console.log('2. Configura con tu GOOGLE_CLIENT_ID en el engranaje (⚙️)');
    console.log('3. Autoriza (dale permisos a tu cuenta @ucaldas.edu.co)');
    console.log('4. Haz clic en "Exchange authorization code for tokens"');
    console.log('5. Copia el id_token (cadena larga que empieza con eyJ)');
    console.log('6. Pégalo abajo y presiona Enter\n');

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('Pega el id_token y presiona Enter: ', async (idToken) => {
        if (!idToken || idToken.trim().length === 0) {
            console.log('❌ Token vacío');
            rl.close();
            return;
        }

        try {
            const ticket = await client.verifyIdToken({
                idToken: idToken.trim(),
                audience: CLIENT_ID
            });

            const payload = ticket.getPayload();

            console.log('\n✅ Token válido!\n');
            console.log('Datos del token:');
            console.log(`  email: ${payload.email}`);
            console.log(`  name: ${payload.name}`);
            console.log(`  email_verified: ${payload.email_verified}`);
            console.log(`  sub: ${payload.sub}`);
            console.log('\n📋 Para usar en Postman, copia este id_token:');
            console.log('\n' + idToken.trim() + '\n');

            rl.close();
        } catch (error) {
            console.log('\n❌ Token inválido:', error.message, '\n');
            rl.close();
        }
    });
}

getToken();
