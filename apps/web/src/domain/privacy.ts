import type { ISODateTimeString } from "@/domain/common";

export type CloudSyncPreference = "disabled" | "enabled";

export type PrivacySettings = {
  userId: string;
  localFirstStorage: boolean;
  cloudSync: CloudSyncPreference;
  analyticsEnabled: boolean;
  aiInsightsEnabled: boolean;
  dataExportedAt?: ISODateTimeString;
  dataDeletedAt?: ISODateTimeString;
  updatedAt: ISODateTimeString;
};
