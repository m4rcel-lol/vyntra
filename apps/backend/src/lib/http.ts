import type { FastifyRequest } from "fastify";
import UAParser from "ua-parser-js";
import { hashVisitor } from "./crypto.js";

export function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    const [first] = forwarded.split(",");
    return first?.trim() || request.ip;
  }
  return request.ip;
}

export function getCountryFromHeaders(request: FastifyRequest): string {
  const country =
    request.headers["cf-ipcountry"] ??
    request.headers["x-vercel-ip-country"] ??
    request.headers["x-country-code"];
  return typeof country === "string" ? country.slice(0, 2).toUpperCase() : "";
}

export function getReferrer(request: FastifyRequest): string {
  const ref = request.headers.referer ?? request.headers.referrer;
  if (typeof ref !== "string") return "";
  try {
    const url = new URL(ref);
    return url.hostname.slice(0, 120);
  } catch {
    return ref.slice(0, 120);
  }
}

export function parseUserAgent(request: FastifyRequest): { browser: string; device: string } {
  const ua = request.headers["user-agent"] ?? "";
  const parsed = new UAParser(ua).getResult();
  const browser = parsed.browser.name ?? "Unknown";
  const device = parsed.device.type ?? "desktop";
  return { browser, device };
}

export function getVisitorHash(request: FastifyRequest): string {
  const visitorCookie = request.cookies.vyntra_visitor;
  const ua = request.headers["user-agent"] ?? "";
  return hashVisitor(visitorCookie ? `${visitorCookie}:${ua}` : `${getClientIp(request)}:${ua}`);
}
