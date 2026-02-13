import { useState, useRef } from "react";
import { readFileAsDataUrl } from "../lib/fabricUtils";

export function useImageUpload() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setError(null);
      const dataUrl = await readFileAsDataUrl(file);
      setImageUrl(dataUrl);
    } catch (err) {
      setError("Failed to read image file");
      setImageUrl(null);
    }
  };

  const clearImage = () => {
    setImageUrl(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const triggerUpload = () => {
    inputRef.current?.click();
  };

  return {
    imageUrl,
    error,
    inputRef,
    handleFileChange,
    clearImage,
    triggerUpload,
  };
}
