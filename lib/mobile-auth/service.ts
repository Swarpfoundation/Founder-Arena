import "server-only";

import { db } from "@/lib/db";
import {
  buildExpiryDate,
  buildTokenExpiryDate,
  createOpaqueMobileSecret,
  evaluateMobileTokenStatus,
  getMobileAuthCodeTtlSeconds,
  getMobileAuthTokenTtlDays,
  hashMobileSecret,
  sanitizeMobileMetadata,
  verifyPkceChallenge,
  type MobileAuthProvider,
} from "./core";

export type MobileSafeUser = {
  id: string;
  email: string | null;
  name: string | null;
};

export type MobileTokenUser = MobileSafeUser & {
  tokenId: string;
};

export async function createMobileAuthAttempt(input: {
  provider: MobileAuthProvider;
  redirectUri: string;
  state: string;
  codeChallenge?: string | null;
  codeChallengeMethod?: string | null;
}) {
  const now = new Date();
  return db.mobileAuthAttempt.create({
    data: {
      provider: input.provider,
      redirectUri: input.redirectUri,
      stateHash: hashMobileSecret(input.state),
      codeChallenge: input.codeChallenge ?? null,
      codeChallengeMethod: input.codeChallenge ? input.codeChallengeMethod ?? "S256" : null,
      expiresAt: buildExpiryDate(now, getMobileAuthCodeTtlSeconds()),
    },
  });
}

export async function consumeMobileAuthAttempt(input: {
  attemptId: string;
  state: string;
}) {
  const now = new Date();
  const attempt = await db.mobileAuthAttempt.findUnique({ where: { id: input.attemptId } });
  if (!attempt || attempt.consumedAt || attempt.expiresAt.getTime() <= now.getTime()) return null;
  if (attempt.stateHash !== hashMobileSecret(input.state)) return null;

  return db.mobileAuthAttempt.update({
    where: { id: attempt.id },
    data: { consumedAt: now },
  });
}

export async function createMobileExchangeCode(input: {
  userId: string;
  redirectUri: string;
  state: string;
  codeChallenge?: string | null;
  codeChallengeMethod?: string | null;
}): Promise<{ code: string; expiresAt: Date }> {
  const code = createOpaqueMobileSecret(32);
  const now = new Date();
  const expiresAt = buildExpiryDate(now, getMobileAuthCodeTtlSeconds());
  await db.mobileAuthCode.create({
    data: {
      userId: input.userId,
      codeHash: hashMobileSecret(code),
      stateHash: hashMobileSecret(input.state),
      redirectUri: input.redirectUri,
      codeChallenge: input.codeChallenge ?? null,
      codeChallengeMethod: input.codeChallenge ? input.codeChallengeMethod ?? "S256" : null,
      expiresAt,
    },
  });
  return { code, expiresAt };
}

export async function exchangeMobileCodeForToken(input: {
  code: string;
  state: string;
  codeVerifier?: string | null;
  deviceName?: unknown;
  appVersion?: unknown;
  userAgent?: string | null;
  ipAddress?: string | null;
}): Promise<
  | {
      ok: true;
      accessToken: string;
      expiresAt: Date;
      user: MobileSafeUser;
    }
  | { ok: false; status: number; error: string }
> {
  const now = new Date();
  const codeHash = hashMobileSecret(input.code);
  const codeRecord = await db.mobileAuthCode.findUnique({
    where: { codeHash },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!codeRecord || codeRecord.expiresAt.getTime() <= now.getTime()) {
    return { ok: false, status: 400, error: "Invalid or expired mobile auth code." };
  }
  if (codeRecord.usedAt) {
    return { ok: false, status: 400, error: "Mobile auth code was already used." };
  }
  if (codeRecord.stateHash !== hashMobileSecret(input.state)) {
    return { ok: false, status: 400, error: "Invalid mobile auth state." };
  }
  if (!verifyPkceChallenge({
    codeChallenge: codeRecord.codeChallenge,
    codeChallengeMethod: codeRecord.codeChallengeMethod,
    codeVerifier: input.codeVerifier ?? null,
  })) {
    return { ok: false, status: 400, error: "Invalid mobile PKCE verifier." };
  }

  const accessToken = createOpaqueMobileSecret(48);
  const expiresAt = buildTokenExpiryDate(now, getMobileAuthTokenTtlDays());
  const userAgent = sanitizeMobileMetadata(input.userAgent, 240);
  const ipHash = input.ipAddress ? hashMobileSecret(input.ipAddress) : null;

  await db.$transaction([
    db.mobileAuthCode.update({
      where: { id: codeRecord.id },
      data: { usedAt: now },
    }),
    db.mobileAuthToken.create({
      data: {
        userId: codeRecord.userId,
        tokenHash: hashMobileSecret(accessToken),
        deviceName: sanitizeMobileMetadata(input.deviceName, 120),
        appVersion: sanitizeMobileMetadata(input.appVersion, 80),
        userAgent,
        ipHash,
        expiresAt,
        lastUsedAt: now,
      },
    }),
  ]);

  return {
    ok: true,
    accessToken,
    expiresAt,
    user: {
      id: codeRecord.user.id,
      email: codeRecord.user.email,
      name: codeRecord.user.name,
    },
  };
}

export async function validateMobileBearerToken(token: string): Promise<MobileTokenUser | null> {
  const now = new Date();
  const tokenRecord = await db.mobileAuthToken.findUnique({
    where: { tokenHash: hashMobileSecret(token) },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
  const status = evaluateMobileTokenStatus({
    found: Boolean(tokenRecord),
    expiresAt: tokenRecord?.expiresAt ?? null,
    revokedAt: tokenRecord?.revokedAt ?? null,
    now,
  });
  if (!status.valid || !tokenRecord) return null;

  await db.mobileAuthToken.update({
    where: { id: tokenRecord.id },
    data: { lastUsedAt: now },
  });

  return {
    id: tokenRecord.user.id,
    email: tokenRecord.user.email,
    name: tokenRecord.user.name,
    tokenId: tokenRecord.id,
  };
}

export async function revokeMobileBearerToken(token: string): Promise<boolean> {
  const tokenRecord = await db.mobileAuthToken.findUnique({
    where: { tokenHash: hashMobileSecret(token) },
    select: { id: true, revokedAt: true },
  });
  if (!tokenRecord || tokenRecord.revokedAt) return false;

  await db.mobileAuthToken.update({
    where: { id: tokenRecord.id },
    data: { revokedAt: new Date() },
  });
  return true;
}
