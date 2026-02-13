import { Language } from "./types";
import { TRANSLATIONS } from "./constants";

/**
 * Get translated text for a key in the specified language (UI Labels)
 */
export function t(key: string, language: Language): string {
  return TRANSLATIONS[language]?.[key] || TRANSLATIONS.en[key] || key;
}

/**
 * UPDATED: Real Translation for Flyer Content
 * Calls our internal API which bridges to Google Translate
 */
export async function translateFields(
  fields: Record<string, string>,
  targetLanguage: Language
): Promise<Record<string, string>> {
  // No need to translate if already English
  if (targetLanguage === "en") return fields;

  try {
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: Object.values(fields), // Send the values as an array to save API quota
        target: targetLanguage,
      }),
    });

    if (!response.ok) throw new Error("Translation request failed");

    const translatedArray: string[] = await response.json();
    
    // Map the translated array back to the original object keys
    const keys = Object.keys(fields);
    const result: any = {};
    keys.forEach((key, index) => {
      result[key] = translatedArray[index];
    });

    return result;
  } catch (error) {
    console.error("Translation error:", error);
    // CRITICAL: Return original fields so the UI doesn't break if API is down
    return fields;
  }
}

/**
 * Generate social sharing URLs - PRESERVED
 */
export function generateShareUrls(flyerUrl: string, eventName: string) {
  const encodedUrl = encodeURIComponent(flyerUrl);
  const encodedText = encodeURIComponent(`Check out ${eventName}!`);

  return {
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    instagram: flyerUrl,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
  };
}

/**
 * Copy text to clipboard - IMPROVED FALLBACK
 */
export async function copyToClipboard(text: string): Promise<void> {
  if (typeof window !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    return await navigator.clipboard.writeText(text);
  } else {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Fallback copy failed", err);
    }
    document.body.removeChild(textarea);
  }
}

/**
 * Download data URL as file - PRESERVED
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * Generate RSVP URL with event details - PRESERVED
 */
// ... existing imports (Language, TRANSLATIONS, etc.)

// Keep all your existing t(), translateFields(), 
// copyToClipboard(), and downloadDataUrl() functions exactly as they are.

/**
 * UPDATED: Generate RSVP URL with stable ID
 */
export function generateRSVPUrl(eventData: {
  eventName: string;
  date: string;
  timings: string;
  description: string;
}): string {
  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/rsvp`
    : 'https://your-temple-domain.com/rsvp';
  
  // Create a stable ID based on the event name so analytics don't duplicate
  const eventSlug = eventData.eventName
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces with hyphens
    .replace(/^-+|-+$/g, ''); // Trim hyphens
  
  const params = new URLSearchParams({
    event: eventData.eventName,
    date: eventData.date,
    time: eventData.timings,
    desc: eventData.description,
    id: eventSlug || 'event-default', // Stable identifier
  });
  
  return `${baseUrl}?${params.toString()}`;
}

// Keep your generateCalendarEvent() below...

/**
 * Create calendar event data - PRESERVED
 */
export function generateCalendarEvent(eventData: {
  eventName: string;
  date: string;
  timings: string;
  description: string;
}) {
  return {
    title: eventData.eventName,
    start: eventData.date,
    description: eventData.description,
    googleCalendarUrl: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventData.eventName)}&details=${encodeURIComponent(eventData.description)}&dates=${encodeURIComponent(eventData.date)}`,
  };
}