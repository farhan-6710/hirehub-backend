"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const seedData_1 = require("./seedData");
const main = async () => {
    const user = await db_1.prisma.user.findUnique({
        where: { email: seedData_1.CORE_EMPLOYER.email.toLowerCase() },
        select: { id: true },
    });
    if (!user) {
        throw new Error('Core employer user not found. Run seed:user first.');
    }
    const profile = await db_1.prisma.employerProfile.upsert({
        where: { userId: user.id },
        update: {
            companyName: seedData_1.CORE_EMPLOYER_PROFILE.companyName,
            companyLogo: seedData_1.CORE_EMPLOYER_PROFILE.companyLogo,
            industry: seedData_1.CORE_EMPLOYER_PROFILE.industry,
            website: seedData_1.CORE_EMPLOYER_PROFILE.website,
            headquartersLocation: seedData_1.CORE_EMPLOYER_PROFILE.headquartersLocation,
            companyDescription: seedData_1.CORE_EMPLOYER_PROFILE.companyDescription,
            contactEmail: seedData_1.CORE_EMPLOYER_PROFILE.contactEmail.toLowerCase(),
            contactPhone: seedData_1.CORE_EMPLOYER_PROFILE.contactPhone,
        },
        create: {
            userId: user.id,
            companyName: seedData_1.CORE_EMPLOYER_PROFILE.companyName,
            companyLogo: seedData_1.CORE_EMPLOYER_PROFILE.companyLogo,
            industry: seedData_1.CORE_EMPLOYER_PROFILE.industry,
            website: seedData_1.CORE_EMPLOYER_PROFILE.website,
            headquartersLocation: seedData_1.CORE_EMPLOYER_PROFILE.headquartersLocation,
            companyDescription: seedData_1.CORE_EMPLOYER_PROFILE.companyDescription,
            contactEmail: seedData_1.CORE_EMPLOYER_PROFILE.contactEmail.toLowerCase(),
            contactPhone: seedData_1.CORE_EMPLOYER_PROFILE.contactPhone,
        },
    });
    console.log('seedCompany complete:', {
        id: profile.id,
        userId: profile.userId,
        companyName: profile.companyName,
    });
};
main()
    .catch((error) => {
    console.error('seedCompany failed:', error);
    process.exit(1);
})
    .finally(async () => {
    await (0, db_1.disconnectDB)();
});
