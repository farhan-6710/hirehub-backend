"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const seedData_1 = require("./seedData");
const helpers_1 = require("./helpers");
const main = async () => {
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
    if (!profile) {
        throw new Error('Employer profile not found. Run seed:employer-profile first.');
    }
    for (const seed of seedData_1.MY_JOB_SEEDS) {
        const existing = await db_1.prisma.job.findFirst({
            where: {
                title: seed.title,
                companyName: seed.companyName,
                postedByUserId: user.id,
            },
            select: { id: true },
        });
        const job = existing
            ? await db_1.prisma.job.update({
                where: { id: existing.id },
                data: {
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
            : await db_1.prisma.job.create({
                data: {
                    postedByUserId: user.id,
                    employerProfileId: profile.id,
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
    console.log('seedMyJobs complete:', { count: seedData_1.MY_JOB_SEEDS.length });
};
main()
    .catch((error) => {
    console.error('seedMyJobs failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await (0, db_1.disconnectDB)();
});
