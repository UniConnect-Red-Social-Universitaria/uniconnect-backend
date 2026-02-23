type RevokedToken = {
    expMs: number;
};

const revokedTokens = new Map<string, RevokedToken>();

function cleanupExpiredTokens() {
    const now = Date.now();

    for (const [token, payload] of revokedTokens.entries()) {
        if (payload.expMs <= now) {
            revokedTokens.delete(token);
        }
    }
}

export function revokeToken(token: string, expSeconds: number) {
    cleanupExpiredTokens();

    revokedTokens.set(token, {
        expMs: expSeconds * 1000
    });
}

export function isTokenRevoked(token: string): boolean {
    cleanupExpiredTokens();
    return revokedTokens.has(token);
}
