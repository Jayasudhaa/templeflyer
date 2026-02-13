import { FieldValues, Template, Language } from "./types";

// Canvas dimensions
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1080;

// Default field values
export const DEFAULT_FIELDS: FieldValues = {
  event_name: "Magha Shivaratri",
  date: "Feb 15, 2026",
  timings: "2 PM, 4 PM, 6 PM, 8 PM, 10 PM • Lingodbhava Darshanam 12 AM",
  description: "Night-long Abhishekam & Archana",
  sponsorship: "Sponsorship: Abhishekam $51 • Kalyanam $116",
};

// Available templates
export const TEMPLATES: Template[] = [
  { id: "svt", name: "SVT Standard", path: "/templates/svt-1080.png" },
  { id: "custom", name: "Custom Upload", path: "" },
];

// System prompt for AI image generation (not editable by user)
export const AI_SYSTEM_PROMPT = `You are an expert at creating beautiful, culturally appropriate images for Hindu temple events and festivals. 

Generate vibrant, respectful imagery that captures the essence of the festival while being suitable for temple event flyers. 

Key requirements:
- Use traditional Hindu iconography and colors
- Maintain cultural authenticity and respect
- Create visually appealing compositions suitable for 1080x1080 flyers
- Include symbolic elements relevant to the specific festival
- Use warm, inviting color palettes
- Avoid any inappropriate or disrespectful imagery`;

// Default user prompt template
export const DEFAULT_USER_PROMPT = `Create a beautiful background image for {festival} celebration at a Hindu temple. 

Style: Traditional Indian art style with vibrant colors
Elements: Include symbolic imagery related to {festival}
Mood: Festive, spiritual, welcoming
Colors: Use traditional colors associated with this festival`;

// Language translations for UI labels
export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    event_name: "Event Name",
    date: "Date",
    timings: "Timings",
    description: "Description",
    sponsorship: "Sponsorship",
    generate_ai: "Generate AI Image",
    upload_logo: "Upload Logo",
    upload_banner: "Upload Banner",
    export_png: "Export PNG",
    share_whatsapp: "Share on WhatsApp",
    share_facebook: "Share on Facebook",
    share_instagram: "Share on Instagram",
    copy_link: "Copy Link",
  },
  hi: {
    event_name: "कार्यक्रम का नाम",
    date: "तारीख",
    timings: "समय",
    description: "विवरण",
    sponsorship: "प्रायोजन",
    generate_ai: "एआई छवि उत्पन्न करें",
    upload_logo: "लोगो अपलोड करें",
    upload_banner: "बैनर अपलोड करें",
    export_png: "पीएनजी निर्यात करें",
    share_whatsapp: "व्हाट्सएप पर साझा करें",
    share_facebook: "फेसबुक पर साझा करें",
    share_instagram: "इंस्टाग्राम पर साझा करें",
    copy_link: "लिंक कॉपी करें",
  },
  ta: {
    event_name: "நிகழ்வு பெயர்",
    date: "தேதி",
    timings: "நேரம்",
    description: "விவரம்",
    sponsorship: "ஸ்பான்சர்ஷிப்",
    generate_ai: "AI படம் உருவாக்கவும்",
    upload_logo: "லோகோவைப் பதிவேற்றவும்",
    upload_banner: "பேனரைப் பதிவேற்றவும்",
    export_png: "PNG ஏற்றுமதி செய்க",
    share_whatsapp: "வாட்ஸ்அப்பில் பகிரவும்",
    share_facebook: "பேஸ்புக்கில் பகிரவும்",
    share_instagram: "இன்ஸ்டாகிராமில் பகிரவும்",
    copy_link: "இணைப்பை நகலெடுக்கவும்",
  },
  te: {
    event_name: "ఈవెంట్ పేరు",
    date: "తేదీ",
    timings: "సమయం",
    description: "వివరణ",
    sponsorship: "స్పాన్సర్‌షిప్",
    generate_ai: "AI చిత్రాన్ని రూపొందించండి",
    upload_logo: "లోగోను అప్‌లోడ్ చేయండి",
    upload_banner: "బ్యానర్‌ను అప్‌లోడ్ చేయండి",
    export_png: "PNG ఎగుమతి చేయండి",
    share_whatsapp: "WhatsApp లో షేర్ చేయండి",
    share_facebook: "Facebook లో షేర్ చేయండి",
    share_instagram: "Instagram లో షేర్ చేయండి",
    copy_link: "లింక్ కాపీ చేయండి",
  },
  kn: {
    event_name: "ಕಾರ್ಯಕ್ರಮದ ಹೆಸರು",
    date: "ದಿನಾಂಕ",
    timings: "ಸಮಯ",
    description: "ವಿವರಣೆ",
    sponsorship: "ಪ್ರಾಯೋಜಕತ್ವ",
    generate_ai: "AI ಚಿತ್ರವನ್ನು ರಚಿಸಿ",
    upload_logo: "ಲೋಗೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    upload_banner: "ಬ್ಯಾನರ್ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ",
    export_png: "PNG ರಫ್ತು ಮಾಡಿ",
    share_whatsapp: "WhatsApp ನಲ್ಲಿ ಹಂಚಿ",
    share_facebook: "Facebook ನಲ್ಲಿ ಹಂಚಿ",
    share_instagram: "Instagram ನಲ್ಲಿ ಹಂಚಿ",
    copy_link: "ಲಿಂಕ್ ನಕಲಿಸಿ",
  },
};

// Language options
export const LANGUAGES: { code: Language; name: string; nativeName: string }[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
];
