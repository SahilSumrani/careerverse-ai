export interface EducationItem {
  institution: string;
  degree: string;
  startDate: string;
  endDate: string;
  score: string;
  location?: string;
}

export interface ExperienceItem {
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  location?: string;
  description: string[];
}

export interface ProjectItem {
  name: string;
  description: string[];
  technologies: string[];
  link?: string;
}

export interface SkillsState {
  languages: string[];
  frameworks: string[];
  tools: string[];
}

export interface CourseItem {
  name: string;
  issuer: string;
  year?: string;
  durationYears?: string;
}

export interface AchievementItem {
  title: string;
  description?: string;
}

export interface PersonalInfo {
  fullName: string;
  headline?: string;
  email: string;
  phone: string;
  location?: string;
  linkedin: string;
  github: string;
}

export interface ResumeData {
  templateId?: "executive" | "classic";
  personalInfo: PersonalInfo;
  professionalSummary?: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: SkillsState;
  languages?: string[];
  trainingCourses?: CourseItem[];
  keyAchievements?: AchievementItem[];
}

export type ActiveTab =
  | "summary"
  | "experience"
  | "projects"
  | "education"
  | "skills"
  | "achievements"
  | "courses";
