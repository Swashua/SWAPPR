const crypto = require("crypto");

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_HASH_PREFIX = "otp-scrypt";

function hashOtp(otp) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(String(otp), salt, 64).toString("hex");
  return `${OTP_HASH_PREFIX}$${salt}$${derivedKey}`;
}

function verifyOtpHash(otp, storedHash) {
  if (!storedHash || !storedHash.startsWith(`${OTP_HASH_PREFIX}$`)) {
    return false;
  }

  const [, salt, expectedHash] = storedHash.split("$");
  if (!salt || !expectedHash) return false;

  const actualHash = crypto.scryptSync(String(otp), salt, 64).toString("hex");
  return crypto.timingSafeEqual(
    Buffer.from(expectedHash, "hex"),
    Buffer.from(actualHash, "hex"),
  );
}

function secondsUntilResend(record, now = Date.now()) {
  if (!record?.resendAvailableAt) return 0;
  return Math.max(0, Math.ceil((record.resendAvailableAt - now) / 1000));
}

module.exports = {
  OTP_HASH_PREFIX,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_TTL_MS,
  hashOtp,
  secondsUntilResend,
  verifyOtpHash,
};
