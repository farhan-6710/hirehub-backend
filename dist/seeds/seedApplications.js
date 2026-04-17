"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const seedData_1 = require("./seedData");
const helpers_1 = require("./helpers");
const main = async () => {
    const employer = await db_1.prisma.user.findUnique({
        where: { email: seedData_1.CORE_EMPLOYER.email.toLowerCase() },
        select: { id: true },
    });
    if (!employer) {
        throw new Error('Core employer user not found. Run seed:user first.');
    }
    for (const seed of seedData_1.APPLICATION_SEEDS) {
        const applicant = await (0, helpers_1.ensureUserWithPassword)({
            name: seed.applicantName,
            email: seed.applicantEmail,
            password: 'candidate1234',
            picture: '',
        });
        await (0, helpers_1.setUserRole)(applicant.id, 'candidate');
        const job = await db_1.prisma.job.findFirst({
            where: {
                title: seed.jobTitle,
                postedByUserId: employer.id,
            },
            select: { id: true },
        });
        if (!job) {
            console.warn(`Skipping application for missing employer job: ${seed.jobTitle}`);
            continue;
        }
        await db_1.prisma.application.upsert({
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
        await db_1.prisma.job.update({
            where: { id: job.id },
            data: {
                peopleApplied: await db_1.prisma.application.count({
                    where: { jobId: job.id },
                }),
            },
        });
    }
    console.log('seedApplications complete:', {
        count: seedData_1.APPLICATION_SEEDS.length,
    });
};
main()
    .catch((error) => {
    console.error('seedApplications failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await (0, db_1.disconnectDB)();
});
