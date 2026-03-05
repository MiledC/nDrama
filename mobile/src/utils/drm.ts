import { Platform } from "react-native";

export type DRMType = "widevine" | "fairplay" | "none";

export interface DRMConfig {
  type: DRMType;
  licenseServer?: string;
  certificateUrl?: string;
  headers?: Record<string, string>;
}

export function getDRMType(): DRMType {
  if (Platform.OS === "android") return "widevine";
  if (Platform.OS === "ios") return "fairplay";
  return "none";
}

export function buildDRMConfig(params: {
  licenseUrl?: string | null;
  certificateUrl?: string | null;
  sessionToken: string;
}): DRMConfig | undefined {
  const type = getDRMType();

  if (type === "none" || !params.licenseUrl) {
    return undefined;
  }

  const config: DRMConfig = {
    type,
    licenseServer: params.licenseUrl,
    headers: {
      "X-Session-Token": params.sessionToken,
    },
  };

  if (type === "fairplay" && params.certificateUrl) {
    config.certificateUrl = params.certificateUrl;
  }

  return config;
}

export function isFreeEpisode(episode: { is_free: boolean; coin_cost: number }): boolean {
  return episode.is_free || episode.coin_cost === 0;
}
