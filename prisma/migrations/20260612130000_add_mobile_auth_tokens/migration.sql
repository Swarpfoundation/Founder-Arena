-- Mobile Auth Token Exchange
-- Supports native iOS ASWebAuthenticationSession without exposing OAuth
-- provider secrets to the app. Codes and bearer tokens are stored hashed.

CREATE TABLE "mobile_auth_attempts" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "stateHash" TEXT NOT NULL,
    "codeChallenge" TEXT,
    "codeChallengeMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "mobile_auth_attempts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mobile_auth_codes" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "stateHash" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "codeChallenge" TEXT,
    "codeChallengeMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),

    CONSTRAINT "mobile_auth_codes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mobile_auth_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "deviceName" TEXT,
    "appVersion" TEXT,
    "userAgent" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "mobile_auth_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "mobile_auth_codes_codeHash_key" ON "mobile_auth_codes"("codeHash");
CREATE UNIQUE INDEX "mobile_auth_tokens_tokenHash_key" ON "mobile_auth_tokens"("tokenHash");

CREATE INDEX "mobile_auth_attempts_expiresAt_idx" ON "mobile_auth_attempts"("expiresAt");
CREATE INDEX "mobile_auth_attempts_consumedAt_idx" ON "mobile_auth_attempts"("consumedAt");
CREATE INDEX "mobile_auth_codes_userId_idx" ON "mobile_auth_codes"("userId");
CREATE INDEX "mobile_auth_codes_expiresAt_idx" ON "mobile_auth_codes"("expiresAt");
CREATE INDEX "mobile_auth_codes_usedAt_idx" ON "mobile_auth_codes"("usedAt");
CREATE INDEX "mobile_auth_tokens_userId_idx" ON "mobile_auth_tokens"("userId");
CREATE INDEX "mobile_auth_tokens_expiresAt_idx" ON "mobile_auth_tokens"("expiresAt");
CREATE INDEX "mobile_auth_tokens_revokedAt_idx" ON "mobile_auth_tokens"("revokedAt");

ALTER TABLE "mobile_auth_codes"
ADD CONSTRAINT "mobile_auth_codes_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "mobile_auth_tokens"
ADD CONSTRAINT "mobile_auth_tokens_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
