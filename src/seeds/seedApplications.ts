import { disconnectDB, prisma } from '../config/db';
import { APPLICATION_SEEDS, CORE_EMPLOYER } from './seedData';
import { setUserRole, ensureUserWithPassword } from './helpers';

const main = async () => {
  const employer = await prisma.user.findUnique({
    where: { email: CORE_EMPLOYER.email.toLowerCase() },
    select: { id: true },
  });

  if (!employer) {
    throw new Error('Core employer user not found. Run seed:user first.');
  }

  for (const seed of APPLICATION_SEEDS) {
    const applicant = await ensureUserWithPassword({
      name: seed.applicantName,
      email: seed.applicantEmail,
      password: 'candidate1234',
      picture: '',
    });

    await setUserRole(applicant.id, 'candidate');

    const job = await prisma.job.findFirst({
      where: {
        title: seed.jobTitle,
        postedByUserId: employer.id,
      },
      select: { id: true },
    });

    if (!job) {
      console.warn(
        `Skipping application for missing employer job: ${seed.jobTitle}`,
      );
      continue;
    }

    await prisma.application.upsert({
      where: {
        jobId_applicantUserId: {
          jobId: job.id,
          applicantUserId: applicant.id,
        },
      },
      update: {
        status: seed.status,
        resumeUrl: seed.resumeUrl,
        coverLetter: seed.coverLetter,
      },
      create: {
        jobId: job.id,
        applicantUserId: applicant.id,
        status: seed.status,
        resumeUrl: seed.resumeUrl,
        coverLetter: seed.coverLetter,
      },
    });

    await prisma.job.update({
      where: { id: job.id },
      data: {
        peopleApplied: await prisma.application.count({
          where: { jobId: job.id },
        }),
      },
    });
  }

  console.log('seedApplications complete:', {
    count: APPLICATION_SEEDS.length,
  });
};

main()
  .catch((error) => {
    console.error('seedApplications failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });
