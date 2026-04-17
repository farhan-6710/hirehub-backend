import { disconnectDB, prisma } from '../config/db';
import { CORE_EMPLOYER, MY_JOB_SEEDS } from './seedData';
import { attachSkillsToJob } from './helpers';

const main = async () => {
  const user = await prisma.user.findUnique({
    where: { email: CORE_EMPLOYER.email.toLowerCase() },
    select: { id: true },
  });

  if (!user) {
    throw new Error('Core employer user not found. Run seed:user first.');
  }

  const profile = await prisma.employerProfile.findUnique({
    where: { userId: user.id },
    select: { id: true, companyName: true },
  });

  if (!profile) {
    throw new Error(
      'Employer profile not found. Run seed:employer-profile first.',
    );
  }

  for (const seed of MY_JOB_SEEDS) {
    const existing = await prisma.job.findFirst({
      where: {
        title: seed.title,
        postedByUserId: user.id,
      },
      select: { id: true },
    });

    const job = existing
      ? await prisma.job.update({
          where: { id: existing.id },
          data: {
            companyName: profile.companyName,
            location: seed.location,
            workplaceType: seed.workplaceType,
            jobType: seed.jobType,
            minSalary: seed.minSalary,
            maxSalary: seed.maxSalary,
            currency: seed.currency,
            experienceLevel: seed.experienceLevel,
            description: seed.description,
            requirements: seed.requirements,
            responsibilities: seed.responsibilities,
            applicationDeadline: new Date(seed.applicationDeadline),
            status: seed.status,
            employerProfileId: profile.id,
          },
        })
      : await prisma.job.create({
          data: {
            postedByUserId: user.id,
            employerProfileId: profile.id,
            title: seed.title,
            companyName: profile.companyName,
            location: seed.location,
            workplaceType: seed.workplaceType,
            jobType: seed.jobType,
            minSalary: seed.minSalary,
            maxSalary: seed.maxSalary,
            currency: seed.currency,
            experienceLevel: seed.experienceLevel,
            description: seed.description,
            requirements: seed.requirements,
            responsibilities: seed.responsibilities,
            applicationDeadline: new Date(seed.applicationDeadline),
            status: seed.status,
          },
        });

    await attachSkillsToJob(job.id, seed.skills);
  }

  console.log('seedMyJobs complete:', { count: MY_JOB_SEEDS.length });
};

main()
  .catch((error) => {
    console.error('seedMyJobs failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });
