import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { AuthRequest } from '../middlewares/authMiddleware';
import { JobType, WorkplaceType, ExperienceLevel } from '@prisma/client';

interface CreateJobBody {
  title?: string;
  workplaceType?: WorkplaceType;
  jobType?: JobType;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  experienceLevel?: ExperienceLevel;
  description?: string;
  requirements?: string[];
  responsibilities?: string[];
  skills?: string[];
  applicationDeadline?: string;
}

interface ApplyForJobBody {
  coverLetter?: string;
}

const getAllOpenJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'open',
      },
      select: {
        id: true,
        title: true,
        companyName: true,
        location: true,
        workplaceType: true,
        jobType: true,
        minSalary: true,
        maxSalary: true,
        currency: true,
        experienceLevel: true,
        description: true,
        peopleApplied: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      status: 'success',
      count: jobs.length,
      jobs,
    });
  } catch (error) {
    console.error('Error in getAllOpenJobs:', error);
    return res.status(500).json({
      error: 'internal server error',
    });
  }
};

const getJobById = async (req: Request, res: Response) => {
  try {
    const jobId = Number(req.params.jobId);

    if (!Number.isFinite(jobId)) {
      return res.status(400).json({ error: 'jobId must be a valid number' });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        postedByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        jobSkills: {
          include: {
            skill: true,
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    return res.status(200).json({
      status: 'success',
      job: {
        ...job,
        skills: job.jobSkills.map((jobSkill) => jobSkill.skill.name),
      },
    });
  } catch (error) {
    console.error('Error in getJobById:', error);
    return res.status(500).json({
      error: 'internal server error',
    });
  }
};

const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        error: 'Unauthorized',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'employer') {
      return res.status(403).json({
        error: 'Only employer accounts can create jobs',
      });
    }

    const {
      title,
      workplaceType,
      jobType,
      minSalary,
      maxSalary,
      currency,
      experienceLevel,
      description,
      requirements,
      responsibilities,
      skills,
      applicationDeadline,
    } = req.body as CreateJobBody;

    if (
      !title ||
      !workplaceType ||
      !jobType ||
      minSalary === undefined ||
      maxSalary === undefined ||
      !currency ||
      !experienceLevel ||
      !description ||
      !requirements ||
      !responsibilities ||
      !skills ||
      !applicationDeadline
    ) {
      return res.status(400).json({
        error:
          'title, workplaceType, jobType, minSalary, maxSalary, currency, experienceLevel, description, requirements, responsibilities, skills and applicationDeadline are required',
      });
    }

    if (!Array.isArray(requirements) || requirements.length === 0) {
      return res.status(400).json({
        error: 'requirements must be a non-empty array of strings',
      });
    }

    if (!Array.isArray(responsibilities) || responsibilities.length === 0) {
      return res.status(400).json({
        error: 'responsibilities must be a non-empty array of strings',
      });
    }

    if (!Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({
        error: 'skills must be a non-empty array of strings',
      });
    }

    if (Number(maxSalary) < Number(minSalary)) {
      return res.status(400).json({
        error: 'maxSalary must be greater than or equal to minSalary',
      });
    }

    const parsedDeadline = new Date(applicationDeadline);
    if (Number.isNaN(parsedDeadline.getTime())) {
      return res.status(400).json({
        error: 'applicationDeadline must be a valid date',
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const deadlineDateOnly = new Date(parsedDeadline);
    deadlineDateOnly.setHours(0, 0, 0, 0);

    if (deadlineDateOnly < today) {
      return res.status(400).json({
        error: 'applicationDeadline must be today or later',
      });
    }

    const createdJob = await prisma.$transaction(async (tx) => {
      const employerProfile = await tx.employerProfile.findUnique({
        where: { userId },
        select: { id: true, companyName: true, headquartersLocation: true },
      });

      if (
        !employerProfile?.companyName ||
        !employerProfile?.headquartersLocation
      ) {
        throw new Error('EMPLOYER_PROFILE_INCOMPLETE');
      }

      const job = await tx.job.create({
        data: {
          postedByUserId: userId,
          employerProfileId: employerProfile?.id,
          title,
          companyName: employerProfile.companyName,
          location: employerProfile.headquartersLocation,
          workplaceType,
          jobType,
          minSalary: Number(minSalary),
          maxSalary: Number(maxSalary),
          currency,
          experienceLevel,
          description,
          requirements,
          responsibilities,
          applicationDeadline: parsedDeadline,
        },
      });

      const normalizedSkillNames = [
        ...new Set(
          skills
            .map((skill) => skill.trim())
            .filter((skill) => skill.length > 0)
            .map((skill) => skill.toLowerCase()),
        ),
      ];

      for (const skillName of normalizedSkillNames) {
        const skill = await tx.skill.upsert({
          where: { name: skillName },
          create: { name: skillName },
          update: {},
        });

        await tx.jobSkill.create({
          data: {
            jobId: job.id,
            skillId: skill.id,
          },
        });
      }

      const jobWithRelations = await tx.job.findUnique({
        where: { id: job.id },
        include: {
          postedByUser: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          jobSkills: {
            include: {
              skill: true,
            },
          },
        },
      });

      return jobWithRelations;
    });

    return res.status(201).json({
      status: 'success',
      job: {
        ...createdJob,
        skills:
          createdJob?.jobSkills.map((jobSkill) => jobSkill.skill.name) ?? [],
      },
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === 'EMPLOYER_PROFILE_INCOMPLETE'
    ) {
      return res.status(400).json({
        error:
          'Please complete your employer profile with company name and headquarters location before posting a job',
      });
    }

    console.error('Error in createJob:', error);
    return res.status(500).json({
      error: 'internal server error',
    });
  }
};

const applyForJob = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user || user.role !== 'candidate') {
      return res.status(403).json({
        error: 'Only candidate accounts can apply for jobs',
      });
    }

    const jobId = Number(req.params.jobId);
    if (!Number.isFinite(jobId)) {
      return res.status(400).json({ error: 'jobId must be a valid number' });
    }

    const { coverLetter } = req.body as ApplyForJobBody;

    if (!coverLetter || coverLetter.trim().length === 0) {
      return res.status(400).json({ error: 'coverLetter is required' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'resumeFile is required' });
    }

    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        postedByUserId: true,
        status: true,
      },
    });

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'open') {
      return res
        .status(400)
        .json({ error: 'This job is not open for applications' });
    }

    if (job.postedByUserId === userId) {
      console.warn(
        `User ${userId} attempted to apply for their own job ${job.postedByUserId}`,
      );
      return res
        .status(400)
        .json({ error: 'You cannot apply to your own job' });
    }

    const existing = await prisma.application.findUnique({
      where: {
        jobId_applicantUserId: {
          jobId,
          applicantUserId: userId,
        },
      },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: 'You have already applied for this job' });
    }

    const resumeUrl = `/uploads/resumes/${req.file.filename}`;

    const application = await prisma.application.create({
      data: {
        jobId,
        applicantUserId: userId,
        coverLetter: coverLetter.trim(),
        resumeUrl,
      },
    });

    const peopleApplied = await prisma.application.count({
      where: { jobId },
    });

    await prisma.job.update({
      where: { id: jobId },
      data: { peopleApplied },
    });

    return res.status(201).json({
      status: 'success',
      message: 'Application submitted successfully',
      application,
    });
  } catch (error) {
    console.error('Error in applyForJob:', error);
    return res.status(500).json({ error: 'internal server error' });
  }
};

export { getAllOpenJobs, getJobById, createJob, applyForJob };