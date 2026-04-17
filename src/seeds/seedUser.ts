import { prisma, disconnectDB } from '../config/db';
import { CORE_EMPLOYER } from './seedData';
import { setUserRole, ensureUserWithPassword } from './helpers';

const main = async () => {
  const user = await ensureUserWithPassword({
    name: CORE_EMPLOYER.name,
    email: CORE_EMPLOYER.email,
    password: CORE_EMPLOYER.password,
    picture: '',
  });

  await setUserRole(user.id, 'employer');

  console.log('seedUser complete:', {
    id: user.id,
    email: user.email,
    role: 'employer',
  });
};

main()
  .catch((error) => {
    console.error('seedUser failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await disconnectDB();
  });
