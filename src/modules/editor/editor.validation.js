const { z } = require('zod');

const uuid = z.string().uuid();
const ALERT_TYPES = ['CRITICAL', 'HIGH', 'MEDIUM'];
const REPORT_TYPES = ['MONTHLY', 'CHAPTER', 'ALERT'];
const REPORT_STATUS = ['DRAFT', 'PENDING_REVIEW', 'APPROVED'];
const PROPOSAL_TYPES = ['RECOVERY', 'NEW_SERIES', 'PUBLISH_CHAPTER', 'SCHEDULE_CHANGE', 'DEADLINE_REMINDER'];
const PROPOSAL_STATUS = ['PENDING', 'APPROVED', 'REJECTED'];
const TEAM_ROLES = ['Mangaka', 'Assistant'];
const TEAM_STATUS = ['ACTIVE', 'WARNING', 'AT_RISK', 'LATE', 'IDLE'];

const listAlertsSchema = z.object({
  query: z.object({
    type: z.enum(ALERT_TYPES).optional(),
  }),
});

const alertIdParamSchema = z.object({ params: z.object({ alert_id: z.string() }) });

const listReportsSchema = z.object({
  query: z.object({
    status: z.enum(REPORT_STATUS).optional(),
  }),
});

const createReportSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    type: z.enum(REPORT_TYPES),
    content: z.string().min(1),
  }),
});

const updateReportSchema = z.object({
  params: z.object({ report_id: uuid }),
  body: z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    status: z.enum(REPORT_STATUS).optional(),
  }),
});

const submitReportSchema = z.object({ params: z.object({ report_id: uuid }) });

const listProposalsSchema = z.object({
  query: z.object({
    type: z.enum(PROPOSAL_TYPES).optional(),
  }),
});

const recoveryMetadataSchema = z.object({
  target_rank: z.string().min(1),
  reason: z.string().min(1),
  plan: z.string().min(1),
});

const newSeriesMetadataSchema = z.object({
  author: z.string().min(1),
  genre: z.string().min(1),
  synopsis: z.string().min(1),
  target_audience: z.string().min(1),
});

const publishChapterMetadataSchema = z.object({
  chapter: z.string().min(1),
  pages: z.number().int().positive(),
  publish_date: z.string().min(1),
});

const scheduleChangeMetadataSchema = z.object({
  current_schedule: z.string().min(1),
  proposed_schedule: z.string().min(1),
  reason: z.string().min(1),
});

const createProposalSchema = z.object({
  body: z.discriminatedUnion('type', [
    z.object({
      type: z.literal('RECOVERY'),
      series_title: z.string().min(1),
      details: z.string().min(1),
      metadata: recoveryMetadataSchema,
    }),
    z.object({
      type: z.literal('NEW_SERIES'),
      series_title: z.string().min(1),
      details: z.string().min(1),
      metadata: newSeriesMetadataSchema,
    }),
    z.object({
      type: z.literal('PUBLISH_CHAPTER'),
      series_title: z.string().min(1),
      details: z.string().min(1),
      metadata: publishChapterMetadataSchema,
    }),
    z.object({
      type: z.literal('SCHEDULE_CHANGE'),
      series_title: z.string().min(1),
      details: z.string().min(1),
      metadata: scheduleChangeMetadataSchema,
    }),
    z.object({
      type: z.literal('DEADLINE_REMINDER'),
      series_title: z.string().min(1),
      details: z.string().min(1),
      metadata: z.any().optional(),
    }),
  ]),
});

const listTeamSchema = z.object({
  query: z.object({
    role: z.enum(TEAM_ROLES).optional(),
  }),
});

const createTeamMemberSchema = z.object({
  body: z.object({
    user_id: uuid.optional(),
    name: z.string().min(1),
    role: z.enum(TEAM_ROLES),
    series_id: uuid,
    workload: z.number().min(0).max(100),
    next_deadline: z.string().min(1),
  }),
});

const updateTeamMemberSchema = z.object({
  params: z.object({ user_id: uuid }),
  body: z.object({
    role: z.enum(TEAM_ROLES).optional(),
    series_id: uuid.optional(),
    status: z.enum(TEAM_STATUS).optional(),
    workload: z.number().min(0).max(100).optional(),
    next_deadline: z.string().min(1).optional(),
  }),
});

const teamUserIdParamSchema = z.object({ params: z.object({ user_id: uuid }) });

const createMeetingSchema = z.object({
  body: z.object({
    user_id: uuid,
    meeting_date: z.string().min(1),
    meeting_time: z.string().min(1),
    notes: z.string().optional(),
  }),
});

module.exports = {
  listAlertsSchema,
  alertIdParamSchema,
  listReportsSchema,
  createReportSchema,
  updateReportSchema,
  submitReportSchema,
  listProposalsSchema,
  createProposalSchema,
  listTeamSchema,
  createTeamMemberSchema,
  updateTeamMemberSchema,
  teamUserIdParamSchema,
  createMeetingSchema,
};
