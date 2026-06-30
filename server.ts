import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { getPersonaInstruction, BASE_CATEGORY_RULES, BASE_JSON_SCHEMA } from "./src/lib/personaRules";

dotenv.config({ path: ".env.local" });

// Initialize Gemini safely and lazily to prevent server crash if key is missing
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set correctly. Gemini features will run in sandbox/mock mode.");
      throw new Error("GEMINI_API_KEY is not configured.");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

const app = express();
const PORT = process.env.PORT || 3000;

// Apply JSON body size limit
app.use(express.json({ limit: "50mb" }));

// Rate limiting middleware for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests, please try again later." }
});

app.use("/api/", apiLimiter);

// API: Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV });
});

// API: Categorize raw task dumps using Gemini AI
app.post("/api/gemini/categorize", async (req, res) => {
  const { rawInput, image, persona } = req.body;
  if (!rawInput && !image) {
    return res.status(400).json({ error: "Input text or image is required" });
  }

  try {
    const ai = getGeminiClient();
    const personaRules = getPersonaInstruction(persona);
    
    const prompt = `You are an expert time-management coach and task organizer.
Analyze the following unstructured input (which could be a raw brain dump, voice transcription, or a description of a photo listing tasks):
"${rawInput}"

CRITICAL INSTRUCTIONS FOR MULTIPLE TASKS & REPETITIVE TASKS:
1. Deeply analyze the input. If the user mentions MULTIPLE distinct tasks (e.g., "urgent meeting at 7 and feed the dog"), you MUST split them and generate a separate JSON task object for EACH one. Never combine distinct tasks into one.
2. If the user mentions a repetitive task (e.g., "drink water 3 times today" or "take medicine twice"), you MUST generate multiple separate task objects for each occurrence and intelligently space out their 'suggestedTimeline' (e.g., Morning, Afternoon, Evening).

${BASE_CATEGORY_RULES}

${personaRules}

${BASE_JSON_SCHEMA}`;

    let contents: any[] = [];
    if (image && image.inlineData && image.inlineData.data) {
      contents.push({
        inlineData: {
          data: image.inlineData.data,
          mimeType: image.inlineData.mimeType
        }
      });
    }
    contents.push(prompt);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "[]";
    const parsedTasks = JSON.parse(responseText.trim());
    res.json({ success: true, tasks: parsedTasks });
  } catch (error: any) {
    console.error("Gemini categorization error:", error);
    
    // Graceful fallback when API key is missing or calls fail
    const fallbackTasks = generateFallbackTasks(rawInput, persona);
    res.status(500).json({
      success: false,
      isMock: true,
      tasks: fallbackTasks,
      error: "Failed to call Gemini API, used offline fast parser."
    });
  }
});

// API: Conversational Gemini Assistant Bar with Chain of Thought and Calendar Context
app.post("/api/gemini/chat", async (req, res) => {
  const { query, taskContext, calendarContext, learningsContext, patternContext, image, persona } = req.body;
  if (!query && !image) {
    return res.status(400).json({ error: "Query or image is required" });
  }

  try {
    const ai = getGeminiClient();
    const tasksString = JSON.stringify(taskContext || []);
    const calendarString = JSON.stringify(calendarContext || []);
    const learningsString = JSON.stringify(learningsContext || []);
    const patternString = JSON.stringify(patternContext || {});
    const personaRules = getPersonaInstruction(persona);
    
    const prompt = `You are "Gemini", an integrated conversational time-management assistant built into the task and productivity app.

The user's current / historical task list is:
${tasksString}

The user's Google Calendar events metadata is:
${calendarString}

The user's behavioral patterns and completion statistics compiled dynamically:
Learnings Insights: ${learningsString}
Pattern Stats: ${patternString}

The user's query / prompt is: "${query}"

You must utilize a Multi-Step Chain of Thought reasoning process before outputting the final JSON:
1. MULTIPLE TASK PARSING: Deeply analyze the user's input (whether text, voice transcript, or image). If the user mentions MULTIPLE distinct tasks (e.g., "urgent meeting at 7 and feed the dog"), you MUST split them and generate a separate JSON task object for EACH distinct action. Never combine them.
2. Classify each identified task into one of the four Eisenhower Matrix quadrants (and other app-supported categories) based strictly on the user's persona.
3. Analyze the user's focus persona rules:
${personaRules}
4. Analyze the user's behavioral patterns, Google Calendar events, and current task list. Specifically, learn from context cues like "morning deep work bias".
5. REPETITIVE TASK AUTO-SCHEDULING MAX LEVEL: If the user asks to schedule a repetitive or recurring task (e.g. "feed dog thrice a day" or "drink water every 4 hours" or "stretch twice"), you MUST:
   - Generate MULTIPLE separate task objects in your JSON output (exactly one for each occurrence requested).
   - Intelligently space them out across the day (e.g. "08:00 AM", "01:00 PM", "08:00 PM").
   - Avoid their existing calendar conflicts when spacing them out.
6. Provide an autonomous scheduling recommendation for each identified task, placing it in a logical, smart gap in their schedule.

Assign points based on category:
- "Urgent & Important" -> 40
- "Important Not Urgent" -> 40
- "Urgent Not Important" -> 20
- "Not Urgent / Important" -> 10
- "Ikigai" -> 75
- "Personal Notes" -> 5

Provide your response strictly as a JSON object with two fields:
{
  "reply": "A concise, motivating, and friendly conversational response (maximum 3 sentences) explaining what tasks you have autonomously classified, scheduled, and why, referencing any identified calendar patterns and how it fits their active persona.",
  "tasks": [
    {
      "title": "Clean, concise task title",
      "category": "Must be exactly one of the six categories above",
      "priority": "High" or "Medium" or "Low",
      "suggestedTimeline": "Specific time, e.g., '09:30 AM', '02:00 PM', or 'Today'",
      "explanation": "Brief 1-sentence reasoning including the Chain of Thought quadrant classification",
      "points": number
    }
  ]
}
Do not wrap your output in markdown code blocks. Just output raw JSON.`;

    let contents: any[] = [];
    if (image && image.inlineData && image.inlineData.data) {
      contents.push({
        inlineData: {
          data: image.inlineData.data,
          mimeType: image.inlineData.mimeType
        }
      });
    }
    contents.push(prompt);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "{}";
    const result = JSON.parse(responseText.trim());
    res.json({
      success: true,
      reply: result.reply || "I am here to guide your focus!",
      tasks: result.tasks || []
    });
  } catch (error: any) {
    console.error("Gemini Assistant Chat error:", error);
    
    // Check if query contains tasks/commitments to schedule
    const queryLower = (query || "").toLowerCase();
    const hasTasks = queryLower.includes("need to") || queryLower.includes("have to") || queryLower.includes("schedule") || queryLower.includes("todo") || queryLower.includes("yoga") || queryLower.includes("meet") || queryLower.includes("client") || queryLower.includes("feed") || queryLower.includes("dog") || queryLower.includes("pomo") || queryLower.includes("gym") || queryLower.includes("study");
    
    let fallbackTasks: any[] = [];
    let customReply = "";
    
    if (hasTasks) {
      fallbackTasks = generateFallbackTasks(query || "", persona);
      const titles = fallbackTasks.map(t => `"${t.title}" (${t.category})`).join(", ");
      customReply = `I have analyzed your request offline and automatically scheduled ${fallbackTasks.length} tasks matching your focus profile: ${titles}. Let's make today highly focused!`;
    } else {
      customReply = getOfflineChatReply(query || "", taskContext || []);
    }

    res.status(500).json({
      success: false,
      isMock: true,
      reply: customReply,
      tasks: fallbackTasks,
      error: "Using offline assistant. " + (error.message || "")
    });
  }
});

// API: Dedicated task classification (Eisenhower Matrix quadrants)
app.post("/api/gemini/classify", async (req, res) => {
  const { title, persona } = req.body;
  if (!title) {
    return res.status(400).json({ error: "Title is required" });
  }

  try {
    const ai = getGeminiClient();
    const personaRules = getPersonaInstruction(persona);
    
    const prompt = `You are an expert AI productivity coach that specializes in the Eisenhower Matrix.
You must classify the following task title by walking through a robust, step-by-step Chain of Thought before assigning the final category.

For the task title: "${title}"

You MUST output your step-by-step reasoning in the JSON structure first:
1. Identify the core action or commitment.
2. Assess its urgency: Is there a strict immediate time constraint, external pressure, or critical consequence of delay?
3. Assess its importance: Does this contribute directly to long-term health, safety, work outcomes, or life goals?
4. Select exactly one of the four Eisenhower quadrants based on the active persona rules.

${personaRules}

Then, assign the final output:
{
  "reasoning_step_1_core_action": "...",
  "reasoning_step_2_urgency": "...",
  "reasoning_step_3_importance": "...",
  "reasoning_step_4_quadrant_selection": "...",
  "final_classification": {
    "category": "...",
    "priority": "...",
    "points": 10,
    "suggestedTimeline": "...",
    "notes": "..."
  }
}
Provide your response strictly as a JSON object matching this schema. Do not wrap your output in markdown code blocks. Just output raw JSON.`;

    let contents: any[] = [];
    contents.push(prompt);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json"
      }
    });

    const responseText = response.text || "{}";
    const result = JSON.parse(responseText.trim());
    res.json({
      success: true,
      category: result.category || "Personal Notes",
      priority: result.priority || "Medium",
      points: result.points || 5,
      suggestedTimeline: result.suggestedTimeline || "Today",
      notes: result.notes || "Auto-categorized by Gemini."
    });
  } catch (error: any) {
    console.error("Gemini Classify error:", error);
    // Local offline fast rule-based fallback
    let category: any = "Personal Notes";
    let priority: any = "Medium";
    let points = 5;
    let suggestedTimeline = "Today";
    let notes = "Auto-categorized offline based on persona.";

    const titleLower = title.toLowerCase();
    const pLower = (persona || "").toLowerCase();

    // Universal Ikigai Baseline — MUST run first, highest priority
    if (titleLower.includes("yoga") || titleLower.includes("gym") || titleLower.includes("exercise") || titleLower.includes("stretch") || titleLower.includes("meditat") || titleLower.includes("journal") || titleLower.includes("therapy") || titleLower.includes("family") || titleLower.includes("parent") || titleLower.includes("pet") || titleLower.includes("dog") || titleLower.includes("cat") || titleLower.includes("feed pet") || titleLower.includes("walk dog") || titleLower.includes("run") || titleLower.includes("sport") || titleLower.includes("hobby") || titleLower.includes("music") || titleLower.includes("art") || titleLower.includes("cook") || titleLower.includes("dance") || titleLower.includes("paint")) {
      category = "Ikigai";
      priority = "Medium";
      points = 75;
      suggestedTimeline = "Today";
      notes = "Life purpose and well-being task (Ikigai) — always worth 75 points.";
    } 
    // Student Rules
    else if (pLower.includes("student") || pLower.includes("learner")) {
      if (titleLower.includes("exam") || titleLower.includes("cram") || titleLower.includes("assignment") || titleLower.includes("deadline") || titleLower.includes("homework") || titleLower.includes("repair")) {
        category = "Urgent & Important";
        priority = "High";
        points = 40;
      } else if (titleLower.includes("study") || titleLower.includes("lecture") || titleLower.includes("course") || titleLower.includes("programming") || titleLower.includes("internship") || titleLower.includes("learn")) {
        category = "Important Not Urgent";
        priority = "Medium";
        points = 40;
      } else if (titleLower.includes("group chat") || titleLower.includes("campus") || titleLower.includes("club") || titleLower.includes("social")) {
        category = "Urgent Not Important";
        priority = "Medium";
        points = 20;
      } else if (titleLower.includes("game") || titleLower.includes("surf") || titleLower.includes("binge") || titleLower.includes("tv") || titleLower.includes("play")) {
        category = "Not Urgent / Important";
        priority = "Low";
        points = 10;
      }
    } 
    // Business Owner Rules
    else if (pLower.includes("business") || pLower.includes("owner") || pLower.includes("entrepreneur")) {
      if (titleLower.includes("escalation") || titleLower.includes("tax") || titleLower.includes("payroll") || titleLower.includes("contract") || titleLower.includes("crisis") || titleLower.includes("blocker")) {
        category = "Urgent & Important";
        priority = "High";
        points = 40;
      } else if (titleLower.includes("strategy") || titleLower.includes("planning") || titleLower.includes("hiring") || titleLower.includes("business model") || titleLower.includes("growth")) {
        category = "Important Not Urgent";
        priority = "Medium";
        points = 40;
      } else if (titleLower.includes("customer") || titleLower.includes("flight") || titleLower.includes("booking") || titleLower.includes("supplies") || titleLower.includes("admin")) {
        category = "Urgent Not Important";
        priority = "Medium";
        points = 20;
      } else if (titleLower.includes("linkedin") || titleLower.includes("micromanage") || titleLower.includes("doom") || titleLower.includes("agenda")) {
        category = "Not Urgent / Important";
        priority = "Low";
        points = 10;
      }
    }
    // Tech Analyst Rules
    else if (pLower.includes("analyst") || pLower.includes("tech") || pLower.includes("developer") || pLower.includes("professional")) {
      if (titleLower.includes("pipeline") || titleLower.includes("query") || titleLower.includes("anomaly") || titleLower.includes("sheet") || titleLower.includes("outage") || titleLower.includes("bug")) {
        category = "Urgent & Important";
        priority = "High";
        points = 40;
      } else if (titleLower.includes("dashboard") || titleLower.includes("algorithm") || titleLower.includes("python") || titleLower.includes("architecture") || titleLower.includes("library") || titleLower.includes("code")) {
        category = "Important Not Urgent";
        priority = "Medium";
        points = 40;
      } else if (titleLower.includes("formatting") || titleLower.includes("cleaning") || titleLower.includes("routine") || titleLower.includes("standup") || titleLower.includes("meeting")) {
        category = "Urgent Not Important";
        priority = "Medium";
        points = 20;
      } else if (titleLower.includes("tweaking") || titleLower.includes("color") || titleLower.includes("drama") || titleLower.includes("social")) {
        category = "Not Urgent / Important";
        priority = "Low";
        points = 10;
      }
    }
    // Retired Rules
    else if (pLower.includes("retired")) {
      if (titleLower.includes("doctor") || titleLower.includes("appointment") || titleLower.includes("medical") || titleLower.includes("bill") || titleLower.includes("leak") || titleLower.includes("repair")) {
        category = "Urgent & Important";
        priority = "High";
        points = 40;
      } else if (titleLower.includes("memoir") || titleLower.includes("travel") || titleLower.includes("estate") || titleLower.includes("hobby") || titleLower.includes("garden") || titleLower.includes("paint") || titleLower.includes("grandkid")) {
        category = "Important Not Urgent";
        priority = "Medium";
        points = 40;
      } else if (titleLower.includes("telemarketer") || titleLower.includes("annoyance") || titleLower.includes("errand")) {
        category = "Urgent Not Important";
        priority = "Medium";
        points = 20;
      } else if (titleLower.includes("news") || titleLower.includes("gossip") || titleLower.includes("sensationalist") || titleLower.includes("worry")) {
        category = "Not Urgent / Important";
        priority = "Low";
        points = 10;
      }
    }
    // Default keywords fallback if none matched above
    else {
      if (titleLower.includes("urgent") || titleLower.includes("asap") || titleLower.includes("client") || titleLower.includes("meet") || titleLower.includes("meeting")) {
        category = "Urgent & Important";
        priority = "High";
        points = 40;
      } else if (titleLower.includes("learn") || titleLower.includes("study") || titleLower.includes("gym") || titleLower.includes("exercise") || titleLower.includes("read")) {
        category = "Important Not Urgent";
        priority = "Medium";
        points = 40;
      } else if (titleLower.includes("email") || titleLower.includes("slack") || titleLower.includes("call")) {
        category = "Urgent Not Important";
        priority = "Medium";
        points = 20;
      } else if (titleLower.includes("passion") || titleLower.includes("coding") || titleLower.includes("project") || titleLower.includes("design")) {
        category = "Ikigai";
        priority = "Medium";
        points = 75;
      }
    }

    res.json({
      success: true,
      category,
      priority,
      points,
      suggestedTimeline,
      notes,
      isMock: true
    });
  }
});

// API: Sync Google Calendar events
app.post("/api/workspace/sync-calendar", async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: "Access token is required" });
  try {
    const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const timeMax = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();
    const calendarRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=50&orderBy=startTime&singleEvents=true&timeMin=${timeMin}&timeMax=${timeMax}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!calendarRes.ok) {
      const errText = await calendarRes.text();
      throw new Error(`Google Calendar API returned status ${calendarRes.status}: ${errText}`);
    }
    const calendarData = await calendarRes.json();
    const events = (calendarData.items || []).map((event: any) => ({
      id: event.id,
      title: event.summary || "Untitled Meeting",
      start: event.start?.dateTime || event.start?.date || new Date().toISOString(),
      end: event.end?.dateTime || event.end?.date || new Date().toISOString(),
      description: event.description || "Synced from Google Calendar"
    }));
    res.json({ success: true, events });
  } catch (error: any) {
    console.error("Calendar sync error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Create event in Google Calendar
app.post("/api/workspace/create-calendar-event", async (req, res) => {
  const { accessToken, title, start, end, description } = req.body;
  if (!accessToken || !title || !start || !end) {
    return res.status(400).json({ error: "Missing required parameters" });
  }
  try {
    const writeRes = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        summary: title,
        start: { dateTime: start },
        end: { dateTime: end },
        description: description || "Auto-scheduled focus block created by AI Coach"
      })
    });
    if (!writeRes.ok) {
      const errText = await writeRes.text();
      throw new Error(`Google Calendar API write failed: ${errText}`);
    }
    const event = await writeRes.json();
    res.json({ success: true, eventId: event.id });
  } catch (error: any) {
    console.error("Create event error:", error);
    res.status(500).json({ error: error.message });
  }
});

// API: Analyze Gmail unread messages for Actionable Tasks
app.post("/api/workspace/analyze-gmail", async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: "Access token is required" });
  try {
    const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=8&q=is:unread", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!listRes.ok) {
      throw new Error(`Gmail API returned status ${listRes.status}`);
    }
    const listData = await listRes.json();
    const messages = listData.messages || [];
    
    let emailContents: any[] = [];
    for (const msg of messages) {
      const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (detailRes.ok) {
        const detail = await detailRes.json();
        const headers = detail.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "(No Subject)";
        const from = headers.find((h: any) => h.name === "From")?.value || "Unknown Sender";
        const snippet = detail.snippet || "";
        emailContents.push({ id: msg.id, subject, from, snippet });
      }
    }
    
    if (emailContents.length === 0) {
      return res.json({ success: true, tasks: [], message: "No unread actionable emails found." });
    }
    
    const ai = getGeminiClient();
    const prompt = `Analyze the following unread emails. Extract actionable items, assignments, or events and convert them into structured tasks.
Only return a valid JSON array of objects conforming exactly to this format:
[
  {
    "title": "Concise descriptive title of task",
    "category": "Urgent & Important" | "Important Not Urgent" | "Urgent Not Important" | "Not Urgent / Important" | "Ikigai" | "Personal Notes",
    "priority": "High" | "Medium" | "Low",
    "suggestedTimeline": "Today",
    "points": 25,
    "explanation": "Brief explanation of why this was extracted"
  }
]
Do NOT return any markdown tags or extra characters. Only return pure JSON.

Emails:
${JSON.stringify(emailContents, null, 2)}`;

    try {
      const aiResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const text = aiResponse.text || "[]";
      const tasks = JSON.parse(text.replace(/```json/g, "").replace(/```/g, ""));
      res.json({ success: true, tasks, emailsProcessed: emailContents.length });
    } catch (aiError: any) {
      console.error("Gmail AI extraction failed, returning raw email summaries:", aiError.message);
      // Fallback: Return emails as simple personal note tasks even if AI extraction fails
      const fallbackTasks = emailContents.map(e => ({
        title: e.subject || "Email from " + e.from,
        category: "Personal Notes",
        priority: "Medium",
        suggestedTimeline: "Today",
        points: 5,
        explanation: `Email from ${e.from}: ${e.snippet?.substring(0, 80) || "No preview"}`
      }));
      res.json({ success: true, tasks: fallbackTasks, emailsProcessed: emailContents.length, warning: "AI extraction failed, showing raw emails." });
    }
  } catch (error: any) {
    console.error("Gmail analyze error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ✅ FIX #2: API: Fetch Gmail unread messages for NotificationsView
app.post("/api/workspace/fetch-gmail-messages", async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(400).json({ error: "Access token is required" });
  
  try {
    // Fetch list of unread messages
    const listRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=is:unread", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!listRes.ok) {
      const errText = await listRes.text();
      throw new Error(`Gmail API returned status ${listRes.status}: ${errText}`);
    }
    
    const listData = await listRes.json();
    const messageIds = listData.messages || [];
    
    if (messageIds.length === 0) {
      return res.json({ success: true, messages: [] });
    }
    
    // Fetch full details for each message
    const messages = [];
    for (const msgId of messageIds) {
      try {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msgId.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        
        if (detailRes.ok) {
          const detail = await detailRes.json();
          const headers = detail.payload?.headers || [];
          const subject = headers.find((h: any) => h.name === "Subject")?.value || "(No Subject)";
          const from = headers.find((h: any) => h.name === "From")?.value || "Unknown Sender";
          const snippet = detail.snippet || "";
          const date = new Date().toLocaleDateString();
          
          messages.push({
            id: msgId.id,
            subject,
            from,
            snippet,
            date,
            read: false
          });
        }
      } catch (err) {
        console.error(`Failed to fetch message ${msgId.id}:`, err);
        // Continue with next message
      }
    }
    
    res.json({ success: true, messages });
  } catch (error: any) {
    console.error("Error exchanging OAuth code for tokens:", error.message || error);
    res.status(500).json({ error: error.message });
  }
});

// API: Autonomous Scheduler (analyzes open spots and schedules blocks based on user stats/behavior)
app.post("/api/workspace/auto-schedule", async (req, res) => {
  const { events, tasks, userStats } = req.body;
  if (!tasks) return res.status(400).json({ error: "Tasks list is required" });
  try {
    const ai = getGeminiClient();
    const prompt = `You are an Autonomous AI Executive Assistant that schedules deep-focus blocks.
Analyze the user's tasks list and existing calendar events.
Identify open time-slots (outside of existing events, between 09:00 AM and 06:00 PM) on June 27, June 28, or June 29, 2026.
Then, schedule 1-3 focus sessions targeting the user's pending, high-priority tasks (not completed, not deleted).

Consider the following behavioral learning profile:
- User peaks in productivity before lunch (schedule hardest tasks between 10:00 AM and 12:00 PM).
- User gets distracted easily on administrative work; group "Urgent Not Important" tasks together.
- Total reward points: ${userStats?.totalPoints || 0}. Current Cognitive Rank: ${userStats?.rank || "Restless Mind"}.

Existing calendar events:
${JSON.stringify(events || [], null, 2)}

Pending Tasks:
${JSON.stringify(tasks.filter((t: any) => !t.completed && !t.deleted), null, 2)}

Only output a valid JSON array of objects matching this format (no markdown code blocks):
[
  {
    "title": "Focus Session: [Task Title]",
    "start": "ISO 8601 string (e.g. 2026-06-27T10:00:00Z)",
    "end": "ISO 8601 string (e.g. 2026-06-27T11:30:00Z)",
    "description": "Autonomously scheduled focus block targeting this high-value task.",
    "pointsValue": 25
  }
]`;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    const text = aiResponse.text || "[]";
    const suggestions = JSON.parse(text.replace(/```json/g, "").replace(/```/g, ""));
    res.json({ success: true, suggestions });
  } catch (error: any) {
    console.error("Auto schedule error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Helper for smart offline fallback categorizations
function generateFallbackTasks(input: string, persona?: string) {
  const lowercase = input.toLowerCase();
  const tasks: any[] = [];
  
  // Smart split of continuous text with natural language connectors, including Hinglish/Hindi and full stops
  let lines: string[] = [];
  if (!input.includes("\n") && !input.includes(";")) {
    lines = input
      .split(/\.\s+|\s+and\s+also\s+|\s+as\s+well\s+as\s+|\s+and\s+need\s+to\s+|\s+i\s+need\s+to\s+|\s+also\s+i\s+need\s+to\s+|\s+then\s+i\s+have\s+to\s+|\s+then\s+|\s+and\s+|\s+aur\s+|\s+phir\s+|\s+fir\s+|\s+uske\s+baad\s+|\s+iske\s+baad\s+|\s+saath\s+hi\s+/i)
      .map(l => l.trim())
      .filter(l => l.length > 2);
  } else {
    lines = input.split(/[\n;•.]+/).map(l => l.trim()).filter(l => l.length > 2);
  }
  
  const pLower = (persona || "").toLowerCase();
  
  for (const line of lines) {
    let cleanedLine = line.replace(/^(please\s+schedule\s+my\s+taks\s+as\s+per\s+|please\s+schedule\s+my\s+tasks\s+as\s+per\s+|i\s+need\s+to\s+|and\s+also\s+i\s+need\s+to\s+)/i, "").trim();
    if (cleanedLine.length < 2) continue;

    cleanedLine = cleanedLine.charAt(0).toUpperCase() + cleanedLine.slice(1);

    let category = "Personal Notes";
    let priority: "High" | "Medium" | "Low" = "Low";
    let suggestedTimeline = "Today";
    let points = 5;
    let explanation = "Classified as Personal Note by fallback engine.";

    const lineLower = cleanedLine.toLowerCase();

    // Universal Well-being rules (ALWAYS Ikigai - never Q2 or Q4!)
    if (lineLower.includes("yoga") || lineLower.includes("gym") || lineLower.includes("exercise") || lineLower.includes("stretch") || lineLower.includes("meditat") || lineLower.includes("journal") || lineLower.includes("therapy") || lineLower.includes("family") || lineLower.includes("parent") || lineLower.includes("run") || lineLower.includes("sport") || lineLower.includes("hobby") || lineLower.includes("cook") || lineLower.includes("music") || lineLower.includes("art") || lineLower.includes("dance") || lineLower.includes("pet") || lineLower.includes("dog") || lineLower.includes("cat") || lineLower.includes("feed pet") || lineLower.includes("walk dog")) {
      category = "Ikigai";
      priority = "Medium";
      points = 75;
      suggestedTimeline = "Today";
      explanation = "Life purpose and well-being task (Ikigai) - essential for balance and long-term health.";
    }
    // Student Rules
    else if (pLower.includes("student") || pLower.includes("learner")) {
      if (lineLower.includes("exam") || lineLower.includes("cram") || lineLower.includes("assignment") || lineLower.includes("deadline") || lineLower.includes("homework") || lineLower.includes("repair") || lineLower.includes("submit")) {
        category = "Urgent & Important";
        priority = "High";
        points = 40;
        suggestedTimeline = "Immediately today";
        explanation = "Academic deadline (Q1) for Student/Learner persona.";
      } else if (lineLower.includes("study") || lineLower.includes("lecture") || lineLower.includes("course") || lineLower.includes("programming") || lineLower.includes("internship") || lineLower.includes("learn")) {
        category = "Important Not Urgent";
        priority = "Medium";
        points = 40;
        suggestedTimeline = "Today afternoon";
        explanation = "Deep learning/career foundation (Q2) for Student/Learner persona.";
      } else if (lineLower.includes("group chat") || lineLower.includes("campus") || lineLower.includes("club") || lineLower.includes("social")) {
        category = "Urgent Not Important";
        priority = "Medium";
        points = 20;
        suggestedTimeline = "Whenever free";
        explanation = "Campus administrative or social distraction (Q3) for Student/Learner persona.";
      } else if (lineLower.includes("game") || lineLower.includes("surf") || lineLower.includes("binge") || lineLower.includes("tv") || lineLower.includes("play")) {
        category = "Not Urgent / Important";
        priority = "Low";
        points = 10;
        suggestedTimeline = "Tonight";
        explanation = "Leisure/procrastination activity (Q4) for Student/Learner persona.";
      }
    } 
    // Business Owner Rules
    else if (pLower.includes("business") || pLower.includes("owner") || pLower.includes("entrepreneur")) {
      if (lineLower.includes("escalation") || lineLower.includes("tax") || lineLower.includes("payroll") || lineLower.includes("contract") || lineLower.includes("crisis") || lineLower.includes("blocker") || lineLower.includes("meeting")) {
        category = "Urgent & Important";
        priority = "High";
        points = 40;
        suggestedTimeline = "Strict priority today";
        explanation = "Business critical path or deadline crisis (Q1) for Business Owner persona.";
      } else if (lineLower.includes("strategy") || lineLower.includes("planning") || lineLower.includes("hiring") || lineLower.includes("business model") || lineLower.includes("growth") || lineLower.includes("trend")) {
        category = "Important Not Urgent";
        priority = "Medium";
        points = 40;
        suggestedTimeline = "This week";
        explanation = "Strategic growth/relationship planning (Q2) for Business Owner persona.";
      } else if (lineLower.includes("customer") || lineLower.includes("flight") || lineLower.includes("booking") || lineLower.includes("supplies") || lineLower.includes("admin")) {
        category = "Urgent Not Important";
        priority = "Medium";
        points = 20;
        suggestedTimeline = "Today";
        explanation = "Minor administrative interruption (Q3) for Business Owner persona.";
      } else if (lineLower.includes("linkedin") || lineLower.includes("micromanage") || lineLower.includes("doom") || lineLower.includes("agenda")) {
        category = "Not Urgent / Important";
        priority = "Low";
        points = 10;
        suggestedTimeline = "Weekend";
        explanation = "Low-yield distraction activity (Q4) for Business Owner persona.";
      }
    }
    // Tech Analyst Rules
    else if (pLower.includes("analyst") || pLower.includes("tech") || pLower.includes("developer") || pLower.includes("professional")) {
      if (lineLower.includes("pipeline") || lineLower.includes("query") || lineLower.includes("anomaly") || lineLower.includes("sheet") || lineLower.includes("outage") || lineLower.includes("bug")) {
        category = "Urgent & Important";
        priority = "High";
        points = 40;
        suggestedTimeline = "ASAP today";
        explanation = "Broken production pipeline or urgent bug (Q1) for Tech Professional.";
      } else if (lineLower.includes("dashboard") || lineLower.includes("algorithm") || lineLower.includes("python") || lineLower.includes("architecture") || lineLower.includes("library") || lineLower.includes("code")) {
        category = "Important Not Urgent";
        priority = "Medium";
        points = 40;
        suggestedTimeline = "Today focus block";
        explanation = "Skill acquisition or system planning (Q2) for Tech Professional.";
      } else if (lineLower.includes("formatting") || lineLower.includes("cleaning") || lineLower.includes("routine") || lineLower.includes("standup")) {
        category = "Urgent Not Important";
        priority = "Medium";
        points = 20;
        suggestedTimeline = "Today";
        explanation = "Routine query or non-technical standup meeting (Q3) for Tech Professional.";
      } else if (lineLower.includes("tweaking") || lineLower.includes("color") || lineLower.includes("drama") || lineLower.includes("social")) {
        category = "Not Urgent / Important";
        priority = "Low";
        points = 10;
        suggestedTimeline = "Later";
        explanation = "Over-engineering or social media distraction (Q4) for Tech Professional.";
      }
    }
    // Retired Rules
    else if (pLower.includes("retired")) {
      if (lineLower.includes("doctor") || lineLower.includes("appointment") || lineLower.includes("medical") || lineLower.includes("bill") || lineLower.includes("leak") || lineLower.includes("repair")) {
        category = "Urgent & Important";
        priority = "High";
        points = 40;
        suggestedTimeline = "Scheduled slot today";
        explanation = "Health emergency or time-sensitive repair (Q1) for Retired persona.";
      } else if (lineLower.includes("memoir") || lineLower.includes("travel") || lineLower.includes("estate") || lineLower.includes("hobby") || lineLower.includes("garden") || lineLower.includes("paint") || lineLower.includes("grandkid")) {
        category = "Important Not Urgent";
        priority = "Medium";
        points = 40;
        suggestedTimeline = "This afternoon";
        explanation = "Legacy hobby or relationship maintenance (Q2) for Retired persona.";
      } else if (lineLower.includes("telemarketer") || lineLower.includes("annoyance") || lineLower.includes("errand")) {
        category = "Urgent Not Important";
        priority = "Medium";
        points = 20;
        suggestedTimeline = "Today";
        explanation = "Minor annoyance or minor errand (Q3) for Retired persona.";
      } else if (lineLower.includes("news") || lineLower.includes("gossip") || lineLower.includes("sensationalist") || lineLower.includes("worry")) {
        category = "Not Urgent / Important";
        priority = "Low";
        points = 10;
        suggestedTimeline = "Defer";
        explanation = "Negative consumption or worry (Q4) for Retired persona.";
      }
    }
    
    // Generic fallback keyword rules if category is still Personal Notes
    if (category === "Personal Notes") {
      if (lineLower.includes("urgent") || lineLower.includes("asap") || lineLower.includes("immediately") || lineLower.includes("crisis") || lineLower.includes("report") || lineLower.includes("meeting") || lineLower.includes("meet") || lineLower.includes("client")) {
        category = "Urgent & Important";
        priority = "High";
        points = 40;
        if (lineLower.includes("2") || lineLower.includes("2pm") || lineLower.includes("2:00")) {
          suggestedTimeline = "02:00 PM";
        } else {
          suggestedTimeline = "Within 2 hours";
        }
        explanation = "Urgent terms or pet care commitments detected. Marked as Urgent & Important.";
      } else if (lineLower.includes("learn") || lineLower.includes("study") || lineLower.includes("gym") || lineLower.includes("health") || lineLower.includes("plan") || lineLower.includes("exercise") || lineLower.includes("read")) {
        category = "Important Not Urgent";
        priority = "Medium";
        points = 40;
        suggestedTimeline = "Today afternoon";
        explanation = "Learning/growth detected. Scheduled for long-term consistency.";
      } else if (lineLower.includes("call") || lineLower.includes("reply") || lineLower.includes("email") || lineLower.includes("slack") || lineLower.includes("booking")) {
        category = "Urgent Not Important";
        priority = "Medium";
        points = 20;
        suggestedTimeline = "As soon as possible";
        explanation = "Communication interruption. High urgency but lower goal-alignment.";
      } else if (lineLower.includes("scrolling") || lineLower.includes("social") || lineLower.includes("game") || lineLower.includes("junk") || lineLower.includes("browse")) {
        category = "Not Urgent / Important";
        priority = "Low";
        points = 10;
        suggestedTimeline = "Weekend";
        explanation = "Distraction activity. Suggested minimizing or deferring.";
      } else if (lineLower.includes("creative") || lineLower.includes("code") || lineLower.includes("design") || lineLower.includes("passion") || lineLower.includes("teach") || lineLower.includes("yoga") || lineLower.includes("meditation") || lineLower.includes("ikigai")) {
        category = "Ikigai";
        priority = "Medium";
        points = 75;
        suggestedTimeline = "Today morning";
        explanation = "Aligns with passion, health and purpose (Ikigai balance).";
      }
    }

    tasks.push({
      title: cleanedLine,
      category,
      priority,
      suggestedTimeline,
      explanation,
      points
    });
  }

  if (tasks.length === 0) {
    tasks.push({
      title: input,
      category: "Personal Notes",
      priority: "Low",
      suggestedTimeline: "Today",
      explanation: "Single input saved under Personal Notes.",
      points: 5
    });
  }

  return tasks;
}

function getOfflineChatReply(query: string, tasks: any[]): string {
  const lowercase = query.toLowerCase();
  
  if (lowercase.includes("summarize") || lowercase.includes("summary")) {
    const pending = tasks.filter(t => !t.completed && !t.deleted);
    if (pending.length === 0) {
      return "All caught up! You have 0 pending tasks right now. Great job!";
    }
    const categoriesCount = pending.reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {});
    const countsStr = Object.entries(categoriesCount).map(([cat, count]) => `${count} in ${cat}`).join(", ");
    return `You have ${pending.length} pending tasks currently: ${countsStr}. I recommend starting with your Urgent & Important tasks!`;
  }
  
  if (lowercase.includes("important") || lowercase.includes("priority")) {
    const high = tasks.filter(t => t.category === "Urgent & Important" && !t.completed && !t.deleted);
    if (high.length > 0) {
      return `Your highest priorities right now are: ${high.slice(0, 2).map(t => t.title).join(", ")}. Focus on these first!`;
    }
    return "You have no pending 'Urgent & Important' tasks! It is an excellent time to invest in your 'Important Not Urgent' long-term planning.";
  }

  return "I'm here offline to help you with your tasks! You can list tasks, ask for your highest priority item, or review your daily stats. Let's make today highly focused!";
}

// Vite integration middleware setup
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const server = app.listen(Number(PORT), "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
