import { disconnectDB, prisma } from '../config/db';
import {
  attachSkillsToJob,
  setUserRole,
  ensureUserWithPassword,
} from './helpers';
import {
  CORE_EMPLOYER,
  CORE_EMPLOYER_PROFILE,
  JOB_LISTING_SEEDS,
} from './seedData';

const ensureEmployerOwner = async (companyName: string) => {
  if (companyName === CORE_EMPLOYER_PROFILE.companyName) {
    const user = await prisma.user.findUnique({
      where: { email: CORE_EMPLOYER.email.toLowerCase() },
      select: { id: true },
    });

    if (!user) {
      throw new Error('Core employer user not found. Run seed:user first.');
    }

    const profile = await prisma.employerProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    return {
      userId: user.id,
      employerProfileId: profile?.id ?? null,
    };
  }

  const sanitized = companyName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = `owner.${sanitized}@example.com`;

  const owner = await ensureUserWithPassword({
    name: `${companyName} Owner`,
    email,
    password: 'employer1234',
    picture: '',
  });

  await setUserRole(owner.id, 'employer');

  const profile = await prisma.employerProfile.upsert({
    where: { userId: owner.id },
    update: {
      companyName,
      companyLogo: '',
      industry: 'Technology',
      website: `https://${sanitized || 'company'}.example.com`,
      headquartersLocation: 'India',
      companyDescription: `${companyName} hiring team profile`,
      contactEmail: `hr.${sanitized || 'company'}@example.com`,
      contactPhone: '+91 9000000000',
    },
    create: {
      userId: owner.id,
      companyName,
      companyLogo: '',
      industry: 'Technology',
      website: `https://${sanitized || 'company'}.example.com`,
      headquartersLocation: 'India',
      companyDescription: `${companyName} hiring team profile`,
      contactEmail: `hr.${sanitized || 'company'}@example.com`,
      contactPhone: '+91 9000000000',
    },
  });

  return {
    userId: owner.id,
    employerProfileId: profile.id,
  };
};

const main = async () => {
  for (const seed of JOB_LISTING_SEEDS) {
    const owner = await ensureEmployerOwner(seed.companyName);

    const existing = await prisma.job.findFirst({
      where: {
        title: seed.title,
        companyName: seed.companyName,
      },
      select: { id: true },
    });

    const job = existing
      ? await prisma.job.update({
          where: { id: existing.id },
          data: {
            postedByUserId: owner.userId,
            employerProfileId: owner.employerProfileId,
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
        })
      : await prisma.job.create({
          data: {
            postedByUserId: owner.userId,
            employerProfileId: owner.employerProfileId,
            title: seed.title,
            companyName: seed.companyName,
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

  console.log('seedJobs complete:', { count: JOB_LISTING_SEEDS.length });
};

main()
  .catch((error) => {
    console.error('seedJobs failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });
