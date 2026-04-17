"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachSkillsToJob = exports.setUserRole = exports.ensureUserWithPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const ensureUserWithPassword = async (params) => {
    const normalizedEmail = params.email.toLowerCase();
    const hashedPassword = await bcryptjs_1.default.hash(params.password, 10);
    return db_1.prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
            name: params.name,
            password: hashedPassword,
            picture: params.picture ?? '',
        },
        create: {
            name: params.name,
            email: normalizedEmail,
            password: hashedPassword,
            picture: params.picture ?? '',
        },
    });
};
exports.ensureUserWithPassword = ensureUserWithPassword;
const setUserRole = async (userId, role) => {
    await db_1.prisma.user.update({
        where: { id: userId },
        data: { role },
    });
};
exports.setUserRole = setUserRole;
const attachSkillsToJob = async (jobId, skills) => {
    await db_1.prisma.jobSkill.deleteMany({
        where: { jobId },
    });
    for (const rawSkillName of skills) {
        const skillName = rawSkillName.trim().toLowerCase();
        if (!skillName)
            continue;
        const skill = await db_1.prisma.skill.upsert({
            where: { name: skillName },
            update: {},
            create: { name: skillName },
        });
        await db_1.prisma.jobSkill.upsert({
            where: {
                jobId_skillId: {
                    jobId,
                    skillId: skill.id,
                },
            },
            update: {},
            create: {
                jobId,
                skillId: skill.id,
            },
        });
    }
};
exports.attachSkillsToJob = attachSkillsToJob;
