import crypto from "crypto";

/**
 * Verify HMAC signature for inbound webhook requests
 * 
 * @param body - Raw request body as string
 * @param signature - HMAC signature from request header (hex string)
 * @param secret - Shared secret (N8N_WEBHOOK_SECRET)
 * @returns true if signature is valid, false otherwise
 */
export function verifyHmacSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  try {
    // Compute HMAC-SHA256 of the body using the secret
    const computedSignature = crypto
      .createHmac("sha256", secret)
      .update(body, "utf8")
      .digest("hex");

    // Normalize signatures (remove any whitespace, convert to lowercase for comparison)
    const normalizedComputed = computedSignature.toLowerCase().trim();
    const normalizedReceived = signature.toLowerCase().trim();

    // Compare signatures using constant-time comparison to prevent timing attacks
    // Both should be hex strings, so we compare as buffers
    if (normalizedComputed.length !== normalizedReceived.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(normalizedComputed, "hex"),
      Buffer.from(normalizedReceived, "hex")
    );
  } catch (error) {
    console.error("Error verifying HMAC signature:", error);
    return false;
  }
}

