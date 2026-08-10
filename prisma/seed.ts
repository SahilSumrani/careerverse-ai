import { PrismaClient, RoleName, OpportunityType, WorkMode, OpportunityStatus, EventType, EventMode, EventStatus, PostCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function ensureRoles() {
  for (const name of Object.values(RoleName)) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name, description: `${name} role` },
    });
  }
}

async function upsertSkill(name: string, category?: string) {
  return prisma.skill.upsert({
    where: { name },
    update: { isDemo: true, category },
    create: { name, category, isDemo: true },
  });
}

async function main() {
  console.log("Seeding CareerVerse demo data...");
  await ensureRoles();

  const skillNames = [
    ["product management", "product"],
    ["communication", "soft"],
    ["python", "engineering"],
    ["javascript", "engineering"],
    ["typescript", "engineering"],
    ["react", "engineering"],
    ["sql", "data"],
    ["analytics", "data"],
    ["machine learning", "ai"],
    ["figma", "design"],
    ["user research", "design"],
    ["leadership", "soft"],
    ["seo", "marketing"],
    ["content", "marketing"],
  ] as const;

  const skills = [];
  for (const [name, category] of skillNames) {
    skills.push(await upsertSkill(name, category));
  }

  const interests = ["AI", "Product", "Startups", "Data", "Design", "Business", "Technology", "HR"];
  for (const name of interests) {
    await prisma.interest.upsert({
      where: { name },
      update: { isDemo: true },
      create: { name, isDemo: true },
    });
  }

  const careers = [
    {
      slug: "ai-product-manager",
      title: "AI Product Manager",
      summary: "Own AI-powered product outcomes across discovery, delivery, and measurement.",
      description:
        "AI Product Managers connect user problems, model capabilities, and business outcomes. Demo roadmap included.",
      skillKeys: ["product management", "communication", "machine learning", "analytics", "user research"],
    },
    {
      slug: "product-manager",
      title: "Product Manager",
      summary: "Prioritize roadmaps and ship products that create measurable value.",
      description: "Core product craft spanning discovery, delivery, and stakeholder alignment.",
      skillKeys: ["product management", "communication", "analytics", "user research", "leadership"],
    },
    {
      slug: "data-analyst",
      title: "Data Analyst",
      summary: "Turn data into decisions with SQL, visualization, and clear storytelling.",
      description: "Analytical career path for students and early professionals.",
      skillKeys: ["sql", "python", "analytics"],
    },
    {
      slug: "software-developer",
      title: "Software Developer",
      summary: "Build reliable software products with modern web technologies.",
      description: "Engineering foundation across frontend and backend fundamentals.",
      skillKeys: ["javascript", "typescript", "react"],
    },
    {
      slug: "ui-ux-designer",
      title: "UI/UX Designer",
      summary: "Design usable, elegant product experiences grounded in research.",
      description: "Design systems, research, and prototyping craft.",
      skillKeys: ["figma", "user research", "communication"],
    },
  ];

  for (const c of careers) {
    const career = await prisma.career.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        summary: c.summary,
        description: c.description,
        isDemo: true,
      },
      create: {
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        description: c.description,
        isDemo: true,
        category: "demo",
      },
    });
    for (const key of c.skillKeys) {
      const skill = skills.find((s) => s.name === key);
      if (!skill) continue;
      await prisma.careerSkill.upsert({
        where: { careerId_skillId: { careerId: career.id, skillId: skill.id } },
        update: {},
        create: { careerId: career.id, skillId: skill.id, importance: 4 },
      });
    }
    await prisma.roadmap.deleteMany({ where: { careerId: career.id } });
    await prisma.roadmap.create({
      data: {
        careerId: career.id,
        title: `${c.title} roadmap (demo)`,
        isDemo: true,
        stagesJson: JSON.stringify([
          { key: "skills", title: "Skills", items: c.skillKeys },
          { key: "learning", title: "Learning", items: ["Fundamentals course track", "Weekly practice"] },
          { key: "projects", title: "Projects", items: ["Ship one portfolio case study"] },
          { key: "experience", title: "Experience", items: ["Internship or scoped freelance"] },
          { key: "opportunities", title: "Opportunities", items: ["Apply to high-match roles"] },
          { key: "interview", title: "Interview", items: ["Behavioral + role drills"] },
          { key: "growth", title: "Career growth", items: ["Mentorship + network"] },
        ]),
      },
    });
  }

  const org = await prisma.organization.upsert({
    where: { id: "demo-org-careerverse" },
    update: { name: "Demo Opportunities Org", verified: true, isDemo: true },
    create: {
      id: "demo-org-careerverse",
      name: "Demo Opportunities Org",
      type: "company",
      verified: true,
      isDemo: true,
      website: "https://example.com",
    },
  });

  await prisma.opportunity.deleteMany({ where: { isDemo: true } });
  const demoOpps = [
    {
      title: "Product Intern — AI Tools (Demo)",
      type: OpportunityType.INTERNSHIP,
      description:
        "Demo internship for students exploring AI product work. Requires communication, curiosity about AI, and basic analytics.",
      skills: ["product management", "communication", "analytics"],
      location: "Remote",
      workMode: WorkMode.REMOTE,
      salaryStipend: "Demo stipend — not a real offer",
    },
    {
      title: "Junior Software Developer (Demo)",
      type: OpportunityType.JOB,
      description: "Demo role focused on TypeScript/React fundamentals and collaborative delivery.",
      skills: ["typescript", "react", "javascript"],
      location: "Bengaluru",
      workMode: WorkMode.HYBRID,
      salaryStipend: "Demo compensation band",
    },
    {
      title: "Data Analyst Apprenticeship (Demo)",
      type: OpportunityType.APPRENTICESHIP,
      description: "Demo apprenticeship emphasizing SQL, analytics storytelling, and business questions.",
      skills: ["sql", "analytics", "communication"],
      location: "Hyderabad",
      workMode: WorkMode.ONSITE,
    },
    {
      title: "Campus Hackathon — Career OS (Demo)",
      type: OpportunityType.HACKATHON,
      description: "Demo hackathon prompt: build tools that help students navigate careers with AI.",
      skills: ["javascript", "product management", "communication"],
      location: "Online",
      workMode: WorkMode.REMOTE,
    },
    {
      title: "Scholarship for Career Tech Learners (Demo)",
      type: OpportunityType.SCHOLARSHIP,
      description: "Demo scholarship listing for students building career-tech projects. Not a real award.",
      skills: ["leadership", "communication"],
      location: "India",
      workMode: WorkMode.REMOTE,
    },
  ];

  for (const o of demoOpps) {
    const opp = await prisma.opportunity.create({
      data: {
        title: o.title,
        organizationId: org.id,
        organizationName: org.name,
        type: o.type,
        description: o.description,
        skillsJson: JSON.stringify(o.skills),
        eligibility: "Demo eligibility — for development only",
        location: o.location,
        workMode: o.workMode,
        salaryStipend: o.salaryStipend,
        deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
        source: "seed",
        externalUrl: "https://example.com",
        status: OpportunityStatus.PUBLISHED,
        isDemo: true,
      },
    });
    for (const s of o.skills) {
      const skill = skills.find((x) => x.name === s);
      if (!skill) continue;
      await prisma.opportunitySkill.create({
        data: { opportunityId: opp.id, skillId: skill.id },
      });
    }
  }

  const passwordHash = await bcrypt.hash("DemoPass123!", 10);
  const demoStudent = await prisma.user.upsert({
    where: { email: "demo.student@careerverse.local" },
    update: { name: "Demo Student", passwordHash, isDemo: true },
    create: {
      email: "demo.student@careerverse.local",
      name: "Demo Student",
      passwordHash,
      isDemo: true,
    },
  });
  const studentRole = await prisma.role.findUniqueOrThrow({ where: { name: "STUDENT" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: demoStudent.id, roleId: studentRole.id } },
    update: {},
    create: { userId: demoStudent.id, roleId: studentRole.id },
  });
  await prisma.profile.upsert({
    where: { userId: demoStudent.id },
    update: {
      education: "Bachelor's",
      degree: "Computer Science",
      college: "Demo College",
      graduationYear: 2026,
      careerGoals: "Become an AI Product Manager and ship useful career tools.",
      experienceSummary: "Built campus products, led workshops, and explored AI product thinking.",
      preferredIndustries: JSON.stringify(["SaaS", "EdTech"]),
      preferredLocations: JSON.stringify(["Remote", "Bengaluru"]),
      workPreference: "INTERNSHIP",
      careerStage: "STUDENT",
      onboardingComplete: true,
      profileCompleteness: 78,
      careerScore: 72,
      careerAnalysisJson: JSON.stringify({
        disclaimer: "AI-generated estimate based on the information you provided—not an objective measure of your potential or hiring probability.",
        careerScore: 72,
        breakdown: {
          skills: 70,
          experience: 55,
          resume: 40,
          projects: 60,
          careerAlignment: 80,
          profileCompleteness: 78,
        },
        strengths: ["Skill signal: communication", "Skill signal: product management", "Clear direction articulated in goals"],
        interests: ["AI", "Product"],
        suitablePaths: [
          {
            title: "AI Product Manager",
            score: 86,
            why: ["Relevant skills already on your profile", "Interest overlap with ai & product"],
            alreadyHave: ["communication", "product management"],
            missing: ["analytics", "user research"],
            nextActions: ["Build evidence in analytics through a focused project"],
          },
        ],
        skillGaps: ["analytics", "user research", "sql"],
        recommendedActions: ["Close your top skill gap: analytics", "Upload a resume for ATS-oriented feedback"],
      }),
      analysisUpdatedAt: new Date(),
    },
    create: {
      userId: demoStudent.id,
      education: "Bachelor's",
      degree: "Computer Science",
      college: "Demo College",
      graduationYear: 2026,
      careerGoals: "Become an AI Product Manager and ship useful career tools.",
      experienceSummary: "Built campus products, led workshops, and explored AI product thinking.",
      preferredIndustries: JSON.stringify(["SaaS", "EdTech"]),
      preferredLocations: JSON.stringify(["Remote", "Bengaluru"]),
      workPreference: "INTERNSHIP",
      careerStage: "STUDENT",
      onboardingComplete: true,
      profileCompleteness: 78,
      careerScore: 72,
    },
  });
  const studentProfile = await prisma.profile.findUniqueOrThrow({ where: { userId: demoStudent.id } });
  for (const skillName of ["communication", "product management", "python"]) {
    const skill = skills.find((s) => s.name === skillName) || (await upsertSkill(skillName));
    await prisma.userSkill.upsert({
      where: { profileId_skillId: { profileId: studentProfile.id, skillId: skill.id } },
      update: {},
      create: { profileId: studentProfile.id, skillId: skill.id, level: 3 },
    });
  }
  for (const interestName of ["AI", "Product"]) {
    const interest = await prisma.interest.upsert({
      where: { name: interestName },
      update: { isDemo: true },
      create: { name: interestName, isDemo: true },
    });
    await prisma.userInterest.upsert({
      where: { profileId_interestId: { profileId: studentProfile.id, interestId: interest.id } },
      update: {},
      create: { profileId: studentProfile.id, interestId: interest.id },
    });
  }

  const admin = await prisma.user.upsert({
    where: { email: "admin@careerverse.local" },
    update: { name: "Platform Admin", passwordHash, isDemo: true },
    create: {
      email: "admin@careerverse.local",
      name: "Platform Admin",
      passwordHash,
      isDemo: true,
    },
  });
  const adminRole = await prisma.role.findUniqueOrThrow({ where: { name: "PLATFORM_ADMIN" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: adminRole.id } },
    update: {},
    create: { userId: admin.id, roleId: adminRole.id },
  });

  const mentorUser = await prisma.user.upsert({
    where: { email: "demo.mentor@careerverse.local" },
    update: { name: "Demo Mentor", passwordHash, isDemo: true },
    create: {
      email: "demo.mentor@careerverse.local",
      name: "Demo Mentor",
      passwordHash,
      isDemo: true,
    },
  });
  const mentorRole = await prisma.role.findUniqueOrThrow({ where: { name: "MENTOR" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: mentorUser.id, roleId: mentorRole.id } },
    update: {},
    create: { userId: mentorUser.id, roleId: mentorRole.id },
  });
  await prisma.profile.upsert({
    where: { userId: mentorUser.id },
    update: {
      headline: "Product mentor (demo)",
      about: "Demo mentor profile for networking and events. Not a real person endorsement.",
      onboardingComplete: true,
      profileCompleteness: 80,
    },
    create: {
      userId: mentorUser.id,
      headline: "Product mentor (demo)",
      about: "Demo mentor profile for networking and events. Not a real person endorsement.",
      onboardingComplete: true,
      profileCompleteness: 80,
      education: "Demo Education",
      degree: "MBA",
      college: "Demo College",
      graduationYear: 2018,
      careerGoals: "Help students navigate product careers",
      careerStage: "SENIOR",
    },
  });
  await prisma.mentorProfile.upsert({
    where: { userId: mentorUser.id },
    update: {
      expertise: "Product Management, AI Product",
      industry: "Technology",
      experienceYears: 8,
      mentoringTopics: "Career switching, PM interviews, portfolio",
      availability: "Limited demo availability",
      preferredAudience: "Students and early career",
      isDemo: true,
    },
    create: {
      userId: mentorUser.id,
      expertise: "Product Management, AI Product",
      industry: "Technology",
      experienceYears: 8,
      mentoringTopics: "Career switching, PM interviews, portfolio",
      availability: "Limited demo availability",
      preferredAudience: "Students and early career",
      isDemo: true,
    },
  });

  const speakerUser = await prisma.user.upsert({
    where: { email: "demo.speaker@careerverse.local" },
    update: { name: "Demo Speaker", passwordHash, isDemo: true },
    create: {
      email: "demo.speaker@careerverse.local",
      name: "Demo Speaker",
      passwordHash,
      isDemo: true,
    },
  });
  const speakerRole = await prisma.role.findUniqueOrThrow({ where: { name: "SPEAKER" } });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: speakerUser.id, roleId: speakerRole.id } },
    update: {},
    create: { userId: speakerUser.id, roleId: speakerRole.id },
  });
  const speaker = await prisma.speakerProfile.upsert({
    where: { userId: speakerUser.id },
    update: {
      title: "Founder-in-residence (demo)",
      organization: "Demo Ventures",
      expertise: "Startups, career storytelling",
      bio: "Demo speaker used for event pages. Not a real public figure.",
      isDemo: true,
    },
    create: {
      userId: speakerUser.id,
      title: "Founder-in-residence (demo)",
      organization: "Demo Ventures",
      expertise: "Startups, career storytelling",
      bio: "Demo speaker used for event pages. Not a real public figure.",
      isDemo: true,
    },
  });

  await prisma.event.deleteMany({ where: { isDemo: true } });
  const event = await prisma.event.create({
    data: {
      title: "AI Careers Masterclass (Demo)",
      description: "Demo event: how to evaluate AI career paths without hype. For development only.",
      type: EventType.MASTERCLASS,
      date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14),
      mode: EventMode.ONLINE,
      location: "Online",
      capacity: 200,
      status: EventStatus.PUBLISHED,
      organizationId: org.id,
      isDemo: true,
      resourcesJson: JSON.stringify([{ title: "Demo slides", url: "https://example.com" }]),
    },
  });
  await prisma.eventSpeaker.create({
    data: { eventId: event.id, speakerId: speaker.id, role: "Keynote" },
  });

  await prisma.post.deleteMany({ where: { isDemo: true } });
  await prisma.post.create({
    data: {
      authorId: mentorUser.id,
      title: "How to choose between PM and BA (demo discussion)",
      content:
        "Demo community post. Compare decision criteria: problem type you enjoy, evidence you can build this month, and people you can learn from—not job board volume.",
      category: PostCategory.CAREER,
      isDemo: true,
    },
  });

  const institutionOrg = await prisma.organization.upsert({
    where: { id: "demo-college-org" },
    update: { name: "Demo College", type: "college", verified: true, isDemo: true },
    create: {
      id: "demo-college-org",
      name: "Demo College",
      type: "college",
      verified: true,
      isDemo: true,
    },
  });
  await prisma.institution.upsert({
    where: { organizationId: institutionOrg.id },
    update: { departmentsJson: JSON.stringify(["CSE", "Business", "Design"]), isDemo: true },
    create: {
      organizationId: institutionOrg.id,
      departmentsJson: JSON.stringify(["CSE", "Business", "Design"]),
      isDemo: true,
    },
  });

  console.log("Seed complete.");
  console.log("Demo student: demo.student@careerverse.local / DemoPass123!");
  console.log("Demo admin:   admin@careerverse.local / DemoPass123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
