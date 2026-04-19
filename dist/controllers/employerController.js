"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getJobApplicationsForEmployer = exports.deleteEmployerJob = exports.getEmployerJobs = exports.getEmployerProfile = exports.getEmployerDashboard = void 0;
const db_1 = require("../config/db");
const normalizeLegacyStatus = (status) => {
    if (status === 'review' || status === 'interview')
        return 'reviewed';
    if (status === 'hired')
        return 'accepted';
    if (status === 'pending' ||
        status === 'reviewed' ||
        status === 'accepted' ||
        status === 'rejected') {
        return status;
    }
    return 'pending';
};
const ensureEmployerRole = async (userId) => {
    const user = await db_1.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
    });
    return user?.role === 'employer';
};
const getEmployerDashboard = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const isEmployer = await ensureEmployerRole(userId);
        if (!isEmployer) {
            return res
                .status(403)
                .json({ error: 'Only employer accounts can access this route' });
        }
        const [activeJobs, totalApplicants, recentApplications] = await Promise.all([
            db_1.prisma.job.count({
                where: {
                    postedByUserId: userId,
                    status: 'open',
                },
            }),
            db_1.prisma.application.count({
                where: {
                    job: {
                        postedByUserId: userId,
                    },
                },
            }),
            db_1.prisma.application.findMany({
                where: {
                    job: {
                        postedByUserId: userId,
                    },
                },
                include: {
                    applicant: {
                        select: {
                            name: true,
                        },
                    },
                    job: {
                        select: {
                            title: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
                take: 8,
            }),
        ]);
        const [reviewedApplications, acceptedCandidates] = await Promise.all([
            db_1.prisma.application.count({
                where: {
                    job: {
                        postedByUserId: userId,
                    },
                    status: 'reviewed',
                },
            }),
            db_1.prisma.application.count({
                where: {
                    job: {
                        postedByUserId: userId,
                    },
                    status: 'accepted',
                },
            }),
        ]);
        return res.status(200).json({
            status: 'success',
            dashboardStats: {
                activeJobs,
                totalApplicants,
                reviewedApplications,
                acceptedCandidates,
            },
            recentApplications: recentApplications.map((entry) => ({
                id: entry.id,
                candidateName: entry.applicant.name,
                jobTitle: entry.job.title,
                status: normalizeLegacyStatus(entry.status),
                appliedDate: entry.createdAt.toISOString().slice(0, 10),
            })),
        });
    }
    catch (error) {
        console.error('Error in getEmployerDashboard:', error);
        return res.status(500).json({ error: 'internal server error' });
    }
};
exports.getEmployerDashboard = getEmployerDashboard;
const getEmployerProfile = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const isEmployer = await ensureEmployerRole(userId);
        if (!isEmployer) {
            return res
                .status(403)
                .json({ error: 'Only employer accounts can access this route' });
        }
        const profile = await db_1.prisma.employerProfile.findUnique({
            where: { userId },
        });
        if (!profile) {
            return res.status(404).json({ error: 'Employer profile not found' });
        }
        return res.status(200).json({
            status: 'success',
            employerProfile: {
                companyName: profile.companyName,
                companyLogo: profile.companyLogo,
                industry: profile.industry,
                headquartersLocation: profile.headquartersLocation,
                website: profile.website,
                companyDescription: profile.companyDescription,
                contactEmail: profile.contactEmail,
                contactPhone: profile.contactPhone,
            },
        });
    }
    catch (error) {
        console.error('Error in getEmployerProfile:', error);
        return res.status(500).json({ error: 'internal server error' });
    }
};
exports.getEmployerProfile = getEmployerProfile;
const getEmployerJobs = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const isEmployer = await ensureEmployerRole(userId);
        if (!isEmployer) {
            return res
                .status(403)
                .json({ error: 'Only employer accounts can access this route' });
        }
        const jobs = await db_1.prisma.job.findMany({
            where: {
                postedByUserId: userId,
            },
            include: {
                jobSkills: {
                    include: {
                        skill: true,
                    },
                },
                _count: {
                    select: {
                        applications: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return res.status(200).json({
            status: 'success',
            count: jobs.length,
            jobs: jobs.map((job) => ({
                ...job,
                peopleApplied: job._count.applications,
                skills: job.jobSkills.map((jobSkill) => jobSkill.skill.name),
            })),
        });
    }
    catch (error) {
        console.error('Error in getEmployerJobs:', error);
        return res.status(500).json({ error: 'internal server error' });
    }
};
exports.getEmployerJobs = getEmployerJobs;
const deleteEmployerJob = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const isEmployer = await ensureEmployerRole(userId);
        if (!isEmployer) {
            return res
                .status(403)
                .json({ error: 'Only employer accounts can access this route' });
        }
        const jobId = Number(req.params.jobId);
        if (!Number.isFinite(jobId)) {
            return res.status(400).json({ error: 'jobId must be a valid number' });
        }
        const deleted = await db_1.prisma.job.deleteMany({
            where: {
                id: jobId,
                postedByUserId: userId,
            },
        });
        if (deleted.count === 0) {
            return res.status(404).json({ error: 'Job not found for this employer' });
        }
        return res.status(200).json({
            status: 'success',
            message: 'Job deleted successfully',
        });
    }
    catch (error) {
        console.error('Error in deleteEmployerJob:', error);
        return res.status(500).json({ error: 'internal server error' });
    }
};
exports.deleteEmployerJob = deleteEmployerJob;
const getJobApplicationsForEmployer = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const isEmployer = await ensureEmployerRole(userId);
        if (!isEmployer) {
            return res
                .status(403)
                .json({ error: 'Only employer accounts can access this route' });
        }
        const jobId = Number(req.params.jobId);
        if (!Number.isFinite(jobId)) {
            return res.status(400).json({ error: 'jobId must be a valid number' });
        }
        const job = await db_1.prisma.job.findFirst({
            where: {
                id: jobId,
                postedByUserId: userId,
            },
            select: {
                id: true,
                title: true,
            },
        });
        if (!job) {
            return res.status(404).json({ error: 'Job not found for this employer' });
        }
        const applications = await db_1.prisma.application.findMany({
            where: {
                jobId: job.id,
            },
            include: {
                applicant: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return res.status(200).json({
            status: 'success',
            job,
            count: applications.length,
            applications: applications.map((entry) => ({
                id: entry.id,
                jobId: entry.jobId,
                applicantId: entry.applicant.id,
                applicantName: entry.applicant.name,
                applicantEmail: entry.applicant.email,
                status: normalizeLegacyStatus(entry.status),
                coverLetter: entry.coverLetter,
                resumeUrl: entry.resumeUrl,
                appliedDate: entry.createdAt,
            })),
        });
    }
    catch (error) {
        console.error('Error in getJobApplicationsForEmployer:', error);
        return res.status(500).json({ error: 'internal server error' });
    }
};
exports.getJobApplicationsForEmployer = getJobApplicationsForEmployer;
const updateApplicationStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const isEmployer = await ensureEmployerRole(userId);
        if (!isEmployer) {
            return res
                .status(403)
                .json({ error: 'Only employer accounts can access this route' });
        }
        const applicationId = Number(req.params.applicationId);
        if (!Number.isFinite(applicationId)) {
            return res
                .status(400)
                .json({ error: 'applicationId must be a valid number' });
        }
        const rawStatus = String(req.body.status ?? '')
            .trim()
            .toLowerCase();
        const normalizedIncomingStatus = rawStatus === 'review' || rawStatus === 'interview'
            ? 'reviewed'
            : rawStatus === 'hired'
                ? 'accepted'
                : rawStatus;
        const allowedStatuses = [
            'pending',
            'reviewed',
            'accepted',
            'rejected',
        ];
        if (!allowedStatuses.includes(normalizedIncomingStatus)) {
            return res.status(400).json({
                error: 'status must be one of pending, reviewed, accepted, rejected',
            });
        }
        const existing = await db_1.prisma.application.findFirst({
            where: {
                id: applicationId,
                job: {
                    postedByUserId: userId,
                },
            },
            select: { id: true },
        });
        if (!existing) {
            return res
                .status(404)
                .json({ error: 'Application not found for this employer' });
        }
        const updated = await db_1.prisma.application.update({
            where: { id: applicationId },
            data: {
                status: normalizedIncomingStatus,
            },
        });
        return res.status(200).json({
            status: 'success',
            application: {
                ...updated,
                status: normalizeLegacyStatus(updated.status),
            },
        });
    }
    catch (error) {
        console.error('Error in updateApplicationStatus:', error);
        return res.status(500).json({ error: 'internal server error' });
    }
};
exports.updateApplicationStatus = updateApplicationStatus;
