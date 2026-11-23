import type { CSSProperties } from "react";
import { KR, AU, CA, GB, US, NZ, DE, JP } from "country-flag-icons/react/3x2";

export type CountryCode = "KR" | "AU" | "CA" | "GB" | "US" | "NZ" | "DE" | "JP";

const FLAG_COMPONENTS: Record<CountryCode, typeof KR> = {
  KR,
  AU,
  CA,
  GB,
  US,
  NZ,
  DE,
  JP,
};

const SLUG_TO_COUNTRY_CODE: Record<string, CountryCode> = {
  "south-korea": "KR",
  "australia": "AU",
  "canada": "CA",
  "uk": "GB",
  "united-kingdom": "GB",
  "usa": "US",
  "united-states": "US",
  "new-zealand": "NZ",
  "germany": "DE",
  "japan": "JP",
};

export function resolveCountryCode(codeOrSlug: string): CountryCode | null {
  const upper = codeOrSlug.toUpperCase() as CountryCode;
  if (upper in FLAG_COMPONENTS) return upper;
  return SLUG_TO_COUNTRY_CODE[codeOrSlug.toLowerCase()] ?? null;
}

interface CountryFlagProps {
  code: string;
  variant?: "inline" | "cover";
  width?: number;
  alt?: string;
  decorative?: boolean;
  className?: string;
  style?: CSSProperties;
}

export default function CountryFlag({
  code,
  variant = "inline",
  width = 76,
  alt,
  decorative = false,
  className,
  style,
}: CountryFlagProps) {
  const resolvedCode = resolveCountryCode(code);
  if (!resolvedCode) return null;

  const FlagSvg = FLAG_COMPONENTS[resolvedCode];

  if (variant === "cover") {
    return (
      <FlagSvg
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : alt ?? `${resolvedCode} flag`}
        aria-hidden={decorative ? true : undefined}
        preserveAspectRatio="xMidYMid slice"
        className={className}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          ...style,
        }}
      />
    );
  }

  return (
    <FlagSvg
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : alt ?? `${resolvedCode} flag`}
      aria-hidden={decorative ? true : undefined}
      className={className}
      style={{
        width,
        maxWidth: "100%",
        height: "auto",
        aspectRatio: "3 / 2",
        display: "block",
        borderRadius: "5px",
        boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.24)",
        flexShrink: 0,
        ...style,
      }}
    />
  );
}
