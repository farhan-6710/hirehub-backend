import bcrypt from 'bcryptjs';
import { prisma } from '../config/db';

export const ensureUserWithPassword = async (params: {
  name: string;
  email: string;
  password: string;
  picture?: string;
}) => {
  const normalizedEmail = params.email.toLowerCase();
  const hashedPassword = await bcrypt.hash(params.password, 10);

  return prisma.user.upsert({
    where: { email: normalizedEmail },
    update: {
      name: params.name,
      password: hashedPassword,
      picture: params.picture ?? '',
    },
    create: {
      name: params.name,
      email: normalizedEmail,
      password: hashedPassword,
      picture: params.picture ?? '',
    },
  });
};

export const setUserRole = async (
  userId: number,
  role: 'candidate' | 'employer',
) => {
  await prisma.user.update({
    where: { id: userId },
    data: { role },
  });
};

export const attachSkillsToJob = async (jobId: number, skills: string[]) => {
  await prisma.jobSkill.deleteMany({
    where: { jobId },
  });

  for (const rawSkillName of skills) {
    const skillName = rawSkillName.trim().toLowerCase();
    if (!skillName) continue;

    const skill = await prisma.skill.upsert({
      where: { name: skillName },
      update: {},
      create: { name: skillName },
    });

    await prisma.jobSkill.upsert({
      where: {
        jobId_skillId: {
          jobId,
          skillId: skill.id,
        },
      },
      update: {},
      create: {
        jobId,
        skillId: skill.id,
      },
    });
  }
};
