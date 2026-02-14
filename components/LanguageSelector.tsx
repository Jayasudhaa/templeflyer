"use client";

import { useId, ChangeEvent } from "react";
import { Language } from "@/lib/types";
import { LANGUAGES } from "@/lib/constants";

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export default function LanguageSelector({
  currentLanguage,
  onLanguageChange,
}: LanguageSelectorProps) {
  const selectId = useId();

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as Language;

    // Guard: ensure value exists in LANGUAGES
    const exists = LANGUAGES.some((l) => l.code === value);
    if (exists) {
      onLanguageChange(value);
    } else {
      console.warn("Invalid language selected:", value);
    }
  };

  return (
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor={selectId}
        style={{
          display: "block",
          marginBottom: 6,
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        Language / भाषा / தமிழ் / తెలుగు / ಕನ್ನಡ
      </label>

      <select
        id={selectId}
        value={currentLanguage}
        onChange={handleChange}
        aria-label="Select language"
        style={{
          width: "100%",
          padding: 10,
          borderRadius: 8,
          border: "1px solid #ddd",
          fontSize: 14,
          backgroundColor: "white",
          cursor: "pointer",
        }}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.nativeName} ({lang.name})
          </option>
        ))}
      </select>
    </div>
  );
}
