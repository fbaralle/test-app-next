import { NextResponse } from "next/server";

// Keywords that indicate sensitive env vars - these will be hidden
const SENSITIVE_KEYWORDS = [
  "SECRET",
  "KEY",
  "TOKEN",
  "PASSWORD",
  "CREDENTIAL",
  "PRIVATE",
  "AUTH",
  "API_KEY",
  "APIKEY",
  "ACCESS",
  "BEARER",
  "JWT",
  "CERT",
  "PEM",
  "RSA",
];

function isSensitive(name: string): boolean {
  const upper = name.toUpperCase();
  return SENSITIVE_KEYWORDS.some((keyword) => upper.includes(keyword));
}

export async function GET() {
  const allEnvNames = Object.keys(process.env).sort();

  // Filter out sensitive env vars and only return names
  const safeEnvNames = allEnvNames.filter((name) => !isSensitive(name));
  const hiddenCount = allEnvNames.length - safeEnvNames.length;

  return NextResponse.json({
    envVars: safeEnvNames,
    totalCount: allEnvNames.length,
    hiddenCount,
    timestamp: new Date().toISOString(),
  });
}
