// Simple same-origin validation
export function validateRequest(request: Request): {
  isValid: boolean;
  error?: string;
} {
  // Check if request has origin (cross-origin) or is same-origin
  const origin = request.headers.get("origin");

  // If no origin, it's a same-origin request (good)
  if (!origin) {
    return { isValid: true };
  }

  // If origin exists, check if it's from our domain
  const host = request.headers.get("host");
  if (!host) {
    return { isValid: false, error: "No host header" };
  }

  // Allow localhost for development
  if (host.includes("localhost") || host.includes("127.0.0.1")) {
    return { isValid: true };
  }

  // For production, origin should match host
  const expectedOrigin = `https://${host}`;
  if (origin !== expectedOrigin) {
    return { isValid: false, error: "Cross-origin request not allowed" };
  }

  return { isValid: true };
}

// Data sanitization
export function sanitizeString(
  input: string | null | undefined,
  maxLength: number = 255
): string | null {
  if (!input || typeof input !== "string") return null;

  // Remove HTML tags and dangerous characters
  let sanitized = input
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/[<>'"&]/g, "") // Remove dangerous characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized || null;
}
