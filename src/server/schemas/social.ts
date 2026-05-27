import { Su, SuInfer } from '@/lib/validator';

export const SocialListQuerySchema = Su.object({
  page: Su.optional(Su.number().min(1)),
  pageSize: Su.optional(Su.number().min(1).max(50)),
});

export type SocialListQuery = SuInfer<typeof SocialListQuerySchema>;

export const REPORT_REASONS = ['fake_account', 'spam', 'harassment'] as const;

export const ReportBodySchema = Su.object({
  reason: Su.literal(REPORT_REASONS),
});

export type ReportBody = SuInfer<typeof ReportBodySchema>;
