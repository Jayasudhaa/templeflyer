// Shared TypeScript types for the flyer editor

export type FieldKey =
  | "event_name"
  | "date"
  | "timings"
  | "description"
  | "sponsorship";

export type Language = "en" | "hi" | "ta" | "te" | "kn";

export interface FieldValues {
  event_name: string;
  date: string;
  timings: string;
  description: string;
  sponsorship: string;
}

export interface Template {
  id: string;
  name: string;
  path: string;
}

export interface AIImageConfig {
  systemPrompt: string;
  userPrompt: string;
  festival: string;
}

export interface SocialShareUrls {
  whatsapp: string;
  facebook: string;
  instagram: string;
  copyLink: string;
}
