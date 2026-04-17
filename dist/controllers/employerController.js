"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateApplicationStatus = exports.getJobApplicationsForEmployer = exports.getEmployerJobs = exports.getEmployerProfile = exports.getEmployerDashboard = void 0;
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
const resolveStatusForDatabase = async (requestedStatus) => {
    const enumRows = await db_1.prisma.$queryRaw `
    SELECT e.enumlabel
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'ApplicationStatus'
  `;
    const available = new Set(enumRows.map((row) => row.enumlabel));
    if (available.has(requestedStatus)) {
        return requestedStatus;
    }
    if (requestedStatus === 'reviewed') {
        if (available.has('review'))
            return 'review';
        if (available.has('interview'))
            return 'interview';
    }
    if (requestedStatus === 'accepted' && available.has('hired')) {
        return 'hired';
    }
    return null;
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
        const [reviewedCountRows, acceptedCountRows] = await Promise.all([
            db_1.prisma.$queryRaw `
        SELECT COUNT(*)::int AS count
        FROM applications a
        INNER JOIN jobs j ON j.id = a.job_id
        WHERE j.posted_by_user_id = ${userId}
          AND a.status::text IN ('reviewed', 'review', 'interview')
      `,
            db_1.prisma.$queryRaw `
        SELECT COUNT(*)::int AS count
        FROM applications a
        INNER JOIN jobs j ON j.id = a.job_id
        WHERE j.posted_by_user_id = ${userId}
          AND a.status::text IN ('accepted', 'hired')
      `,
        ]);
        const reviewedApplications = Number(reviewedCountRows[0]?.count ?? 0);
        const acceptedCandidates = Number(acceptedCountRows[0]?.count ?? 0);
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
        const { status } = req.body;
        const allowedStatuses = [
            'pending',
            'reviewed',
            'accepted',
            'rejected',
        ];
        if (!status || !allowedStatuses.includes(status)) {
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
        });
        if (!existing) {
            return res
                .status(404)
                .json({ error: 'Application not found for this employer' });
        }
        const statusToPersist = await resolveStatusForDatabase(status);
        if (!statusToPersist) {
            return res.status(400).json({
                error: 'Requested status is not supported by current database enum',
            });
        }
        await db_1.prisma.$executeRaw `
      UPDATE applications
      SET status = ${statusToPersist}::text::"ApplicationStatus",
          updated_at = NOW()
      WHERE id = ${applicationId}
    `;
        const updated = await db_1.prisma.application.findUnique({
            where: { id: applicationId },
        });
        if (!updated) {
            return res
                .status(404)
                .json({ error: 'Application not found after update' });
        }
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
