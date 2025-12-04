const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

export const callGemini = async (prompt: string): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return "Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file.";
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate insight at this time.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI Service Unavailable. Please check your connection and API key.";
  }
};

