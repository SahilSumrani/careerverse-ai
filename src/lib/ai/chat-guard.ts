/** Copilot input / quota limits — keep cheap checks before any LLM call. */

export const DAILY_CHAT_CAP = 40;
export const CHAT_INPUT_MAX_CHARS = 300;
/** Lower than general AI_MAX_TOKENS so chat can't burn the shared budget. */
export const CHAT_MAX_OUTPUT_TOKENS = Number(process.env.AI_CHAT_MAX_TOKENS || 400);

const CAREER_HINT =
  /\b(career|job|jobs|resume|cv|interview|skill|skills|gap|gaps|internship|intern|apply|application|applications|mentor|roadmap|profile|portfolio|linkedin|github|offer|salary|role|roles|hiring|ats|cover\s*letter|network|networking|opportunity|opportunities|work|employer|recruiter|experience|goal|goals|onboarding|copilot|hire|hired|promotion|layoff|freelance|startup|college|degree|project|projects|leetcode|dsa|system\s*design|behavioral|star\s*stor|prepare|prep|placement|campus)\b/;

const OFF_TOPIC =
  /\b(capital of|weather|recipe|movie|lyrics|joke|homework|math problem|translate|news today|write (me )?a (poem|story|essay)|solve this|code for me|leetcode solution only|who won|sports score|crypto price|stock tip)\b/;

function norm(s: string) {
  return s.toLowerCase().trim();
}

/** Cheap heuristic — true means refuse without calling the LLM. */
export function isCareerChatOffTopic(message: string): boolean {
  const q = norm(message);
  if (!q) return true;
  const careerHit = CAREER_HINT.test(q);
  const pureDefn = /^(what\s+is|who\s+is|define|explain|tell\s+me\s+about)\b/.test(q) && !careerHit;
  if (OFF_TOPIC.test(q) || pureDefn) return true;
  // Long free-form with zero career signal → refuse (saves tokens)
  if (q.length >= 80 && !careerHit) return true;
  return false;
}

export const OFF_TOPIC_REPLY = [
  "I’m CareerVerse Copilot — I only help with careers, resumes, skills, interviews, and job search.",
  "Ask about skill gaps, target roles, resume bullets, interview prep, or what to do this week.",
].join(" ");
