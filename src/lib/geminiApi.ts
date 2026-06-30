export async function fetchCategorizedTasks(rawInput: string, persona: string, imagePayload?: { data: string; mimeType: string }) {
  const response = await fetch("/api/gemini/categorize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      rawInput, 
      persona,
      image: imagePayload ? { inlineData: imagePayload } : undefined
    }),
  });
  return response.json();
}

export async function fetchGeminiChat(
  query: string, 
  taskContext: any[], 
  calendarContext: any[], 
  learningsContext: any[], 
  patternContext: any, 
  persona: string, 
  imagePayload?: { data: string; mimeType: string }
) {
  const response = await fetch("/api/gemini/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      query, 
      taskContext,
      calendarContext,
      learningsContext,
      patternContext,
      persona,
      image: imagePayload ? { inlineData: imagePayload } : undefined
    }),
  });
  return response.json();
}

export async function fetchTaskClassification(title: string, persona: string) {
  const response = await fetch("/api/gemini/classify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, persona }),
  });
  return response.json();
}
