"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const seedData_1 = require("./seedData");
const helpers_1 = require("./helpers");
const main = async () => {
    const user = await (0, helpers_1.ensureUserWithPassword)({
        name: seedData_1.CORE_EMPLOYER.name,
        email: seedData_1.CORE_EMPLOYER.email,
        password: seedData_1.CORE_EMPLOYER.password,
        picture: '',
    });
    await (0, helpers_1.setUserRole)(user.id, 'employer');
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
    await (0, db_1.disconnectDB)();
});
