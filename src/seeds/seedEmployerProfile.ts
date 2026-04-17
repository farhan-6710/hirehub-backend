import { disconnectDB, prisma } from '../config/db';
import { CORE_EMPLOYER, CORE_EMPLOYER_PROFILE } from './seedData';

const main = async () => {
  const user = await prisma.user.findUnique({
    where: { email: CORE_EMPLOYER.email.toLowerCase() },
    select: { id: true },
  });

  if (!user) {
    throw new Error('Core employer user not found. Run seed:user first.');
  }

  const profile = await prisma.employerProfile.upsert({
    where: { userId: user.id },
    update: {
      companyName: CORE_EMPLOYER_PROFILE.companyName,
      companyLogo: CORE_EMPLOYER_PROFILE.companyLogo,
      industry: CORE_EMPLOYER_PROFILE.industry,
      website: CORE_EMPLOYER_PROFILE.website,
      headquartersLocation: CORE_EMPLOYER_PROFILE.headquartersLocation,
      companyDescription: CORE_EMPLOYER_PROFILE.companyDescription,
      contactEmail: CORE_EMPLOYER_PROFILE.contactEmail.toLowerCase(),
      contactPhone: CORE_EMPLOYER_PROFILE.contactPhone,
    },
    create: {
      userId: user.id,
      companyName: CORE_EMPLOYER_PROFILE.companyName,
      companyLogo: CORE_EMPLOYER_PROFILE.companyLogo,
      industry: CORE_EMPLOYER_PROFILE.industry,
      website: CORE_EMPLOYER_PROFILE.website,
      headquartersLocation: CORE_EMPLOYER_PROFILE.headquartersLocation,
      companyDescription: CORE_EMPLOYER_PROFILE.companyDescription,
      contactEmail: CORE_EMPLOYER_PROFILE.contactEmail.toLowerCase(),
      contactPhone: CORE_EMPLOYER_PROFILE.contactPhone,
    },
  });

  console.log('seedEmployerProfile complete:', {
    id: profile.id,
    userId: profile.userId,
    companyName: profile.companyName,
  });
};

main()
  .catch((error) => {
    console.error('seedEmployerProfile failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });
