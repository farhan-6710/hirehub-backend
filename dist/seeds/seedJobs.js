"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const helpers_1 = require("./helpers");
const seedData_1 = require("./seedData");
const ensureEmployerOwner = async (companyName) => {
    if (companyName === seedData_1.CORE_EMPLOYER_PROFILE.companyName) {
        const user = await db_1.prisma.user.findUnique({
            where: { email: seedData_1.CORE_EMPLOYER.email.toLowerCase() },
            select: { id: true },
        });
        if (!user) {
            throw new Error('Core employer user not found. Run seed:user first.');
        }
        const profile = await db_1.prisma.employerProfile.findUnique({
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
    const owner = await (0, helpers_1.ensureUserWithPassword)({
        name: `${companyName} Owner`,
        email,
        password: 'employer1234',
        picture: '',
    });
    await (0, helpers_1.setUserRole)(owner.id, 'employer');
    const profile = await db_1.prisma.employerProfile.upsert({
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
    for (const seed of seedData_1.JOB_LISTING_SEEDS) {
        const owner = await ensureEmployerOwner(seed.companyName);
        const existing = await db_1.prisma.job.findFirst({
            where: {
                title: seed.title,
                companyName: seed.companyName,
            },
            select: { id: true },
        });
        const job = existing
            ? await db_1.prisma.job.update({
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
            : await db_1.prisma.job.create({
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
        await (0, helpers_1.attachSkillsToJob)(job.id, seed.skills);
    }
    console.log('seedJobs complete:', { count: seedData_1.JOB_LISTING_SEEDS.length });
};
main()
    .catch((error) => {
    console.error('seedJobs failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await (0, db_1.disconnectDB)();
});
