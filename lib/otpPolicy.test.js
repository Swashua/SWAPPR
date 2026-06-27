// Run: node lib/otpPolicy.test.js
const assert = require("assert");
const {
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  hashOtp,
  secondsUntilResend,
  verifyOtpHash,
} = require("./otpPolicy");

const otp = "123456";
const hash = hashOtp(otp);

assert.notStrictEqual(hash, otp, "OTP hash must not store the raw code");
assert.ok(verifyOtpHash(otp, hash), "correct OTP verifies against hash");
assert.ok(!verifyOtpHash("654321", hash), "wrong OTP fails against hash");

const now = 1_000_000;
assert.strictEqual(
  secondsUntilResend(null, now),
  0,
  "missing OTP record has no resend wait",
);
assert.strictEqual(
  secondsUntilResend({ resendAvailableAt: now + OTP_RESEND_COOLDOWN_MS }, now),
  60,
  "active cooldown reports whole seconds remaining",
);
assert.strictEqual(
  secondsUntilResend({ resendAvailableAt: now - 1 }, now),
  0,
  "expired cooldown allows resend",
);

assert.strictEqual(OTP_MAX_ATTEMPTS, 5, "OTP attempt limit stays explicit");

console.log("otpPolicy.test.js OK");
