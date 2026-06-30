export function getPersonaInstruction(persona?: string): string {
  const defaultInstruction = `Determine the user's focus persona. If none specified, use a general balance where work/personal tasks are classified based on standard urgency.`;
  if (!persona) return defaultInstruction;

  const pLower = persona.toLowerCase();
  
  let matrixRules = "";
  if (pLower.includes("student") || pLower.includes("learner")) {
    matrixRules = `
[Active Persona: Student / Learner]
- Quadrant I (Urgent & Important): Strict academic deadlines (e.g. tomorrow), cramming for imminent exams, submitting critical assignments, emergency laptop repairs.
- Quadrant II (Important Not Urgent): Proactive deep learning, studying ahead, career preparation, course review, coding projects, internship applications, portfolio building, thesis writing.
- Quadrant III (Urgent Not Important): Social pressure, administrative campus chores, replying to non-urgent class group chats.
- Quadrant IV (Not Urgent / Important): Procrastination, TV bingeing, aimless web surfing, gaming until late, mindless scrolling.
`;
  } else if (pLower.includes("business") || pLower.includes("owner") || pLower.includes("entrepreneur")) {
    matrixRules = `
[Active Persona: Business Owner / Entrepreneur]
- Quadrant I (Urgent & Important): Business crises, severe client escalations, deadline day tax filing, payroll system crashes, signing urgent vendor contracts, immediate sales meetings.
- Quadrant II (Important Not Urgent): Long-term business strategy, financial growth planning, proactive hiring, market trend research, building systems and processes, learning new leadership skills.
- Quadrant III (Urgent Not Important): Low-value administrative duties, minor customer emails, booking flights, ordering office supplies, non-critical meetings.
- Quadrant IV (Not Urgent / Important): Time wasters, doom-scrolling professional networks without purpose, meetings without agendas, micromanaging trivial details.
`;
  } else if (pLower.includes("analyst") || pLower.includes("tech") || pLower.includes("developer") || pLower.includes("professional")) {
    matrixRules = `
[Active Persona: Data Analyst / Tech Professional]
- Quadrant I (Urgent & Important): Broken production pipelines, failing SQL queries, client-facing system anomalies, critical P0 bugs, urgent ad-hoc data pulls.
- Quadrant II (Important Not Urgent): Skill acquisition (learning Rust, Python, etc.), building comprehensive dashboards, tuning ML models, studying libraries, system architecture planning, refactoring technical debt.
- Quadrant III (Urgent Not Important): Routine data queries, basic formatting, minor data cleaning, attending non-technical daily standups, replying to low-priority Slack threads.
- Quadrant IV (Not Urgent / Important): Endlessly tweaking visual colors on charts, tech drama, distractions during work hours, aimless browsing.
`;
  } else if (pLower.includes("retired")) {
    matrixRules = `
[Active Persona: Retired Individual]
- Quadrant I (Urgent & Important): Health emergencies, scheduled doctor's appointments, final utility bill notices, time-sensitive home leak repairs.
- Quadrant II (Important Not Urgent): Writing memoirs, planning travels, estate planning, learning new lifelong skills, deep community involvement.
- Quadrant III (Urgent Not Important): Minor home annoyances, dealing with telemarketers, minor errands, trivial appointments.
- Quadrant IV (Not Urgent / Important): Sensationalist 24/7 news channels, engaging in local gossip, worrying about things out of control.
`;
  } else {
    matrixRules = `
[Active Custom Persona: ${persona}]
- Apply the Universal Baseline (always Q2 for long-term health, mental wellness, social connection).
- For professional/daily tasks, deeply analyze how they fit the responsibilities and values of a ${persona}. Focus Q1 on critical path deadlines/outages, Q2 on strategy/growth/skill building, Q3 on interruptions/minor tasks, and Q4 on distractions.
`;
  }

  return `
You must adapt your classification and reasoning to the user's active persona on a micro-level:
${matrixRules}

CRITICAL RULE — Ikigai Classification (NEVER override this, highest priority rule):
The following task types are ALWAYS classified as "Ikigai" (75 points) regardless of persona:
- Physical wellness: yoga, gym, exercise, running, cycling, swimming, sports, stretching, fitness, workout
- Mental wellness: meditation, mindfulness, journaling, therapy, breathing exercises, self-care
- Social & family: family dinner, date night, spending time with kids, calling parents, friends hangout, family time
- Creative hobbies: music, painting, art, writing for fun, dancing, cooking for pleasure, gardening
- Personal joy: reading for fun, travel, exploring new places, photography
- Pet care: feeding pet, feeding dog, feeding cat, walking dog, grooming cat, vet visit for pet, caring for animals

CRITICAL: NEVER classify yoga, gym, meditation, family time, or pet care as "Not Urgent / Important" (Q4).
CRITICAL: NEVER classify yoga, gym, or meditation as "Urgent & Important" (Q1) unless there is a health crisis.
These activities are LIFE PURPOSE tasks and always worth 75 points.

Apply these rules strictly to determine the 'category', 'priority', and 'points' of the task.`;
}

export const BASE_CATEGORY_RULES = `Categorize each distinct task identified in this input into exactly one of these 6 categories. Use these strict classification rules:
1. "Urgent & Important" (Matrix #1) - Critical tasks requiring immediate attention: scheduled meetings with clients or colleagues, urgent project deadlines, professional commitments with a specific time, anything that must be done TODAY at a specific time.
2. "Important Not Urgent" (Matrix #2) - Strategic, long-term personal growth: deep learning, career preparation, studying, reading books, planning, strategy sessions. (NOT gym or exercise - those go to Ikigai!)
3. "Urgent Not Important" (Matrix #3) - Immediate interruptions or administrative communication: replying to non-priority messages, quick phone calls, minor errands, administrative tasks.
4. "Not Urgent / Important" (Matrix #4) - Also known as Not Urgent Not Important. Low-value distractions: browsing social media, procrastinating activities.
5. "Ikigai" (Matrix #5) - LIFE PURPOSE, WELL-BEING & PASSION: yoga, gym, exercise, running, sports, meditation, mindfulness, family time, spending time with pets (feeding dog/cat, walking pet), cooking for pleasure, music, art, dance, creative hobbies. These are ALWAYS Ikigai - never Q2 or Q4!
6. "Personal Notes" (Matrix #6) - Non-actionable thoughts, brief journals, observations, logs, or quotes.`;

export const BASE_JSON_SCHEMA = `For each task, determine:
- "title": Clean, concise human-readable title.
- "category": Must be exactly one of: "Urgent & Important", "Important Not Urgent", "Urgent Not Important", "Not Urgent / Important", "Ikigai", or "Personal Notes".
- "priority": "High" (for urgent/important), "Medium" (for important not urgent, or urgent not important), or "Low" (for not urgent).
- "suggestedTimeline": Suggested time or duration (e.g. "Today 2:00 PM", "This evening", "1 hour", "Tomorrow").
- "explanation": Brief 1-sentence reasoning for this categorization based on the persona rules.
- "points": Point values assigned based on category rules:
  - "Urgent & Important" -> 40 points
  - "Important Not Urgent" -> 40 points
  - "Urgent Not Important" -> 20 points
  - "Not Urgent / Important" -> 10 points
  - "Ikigai" -> 75 points
  - "Personal Notes" -> 5 points

Respond strictly with a JSON array of objects. Do not wrap the JSON in markdown code blocks or any other text. Follow this schema exactly:
[
  {
    "title": "Task title",
    "category": "Urgent & Important",
    "priority": "High",
    "suggestedTimeline": "09:00 AM - 11:00 AM",
    "explanation": "Explanation here",
    "points": 40
  }
]`;
