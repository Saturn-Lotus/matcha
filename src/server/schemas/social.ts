import { Su, SuInfer } from '@/lib/validator';

export const SocialListQuerySchema = Su.object({
  page: Su.optional(Su.number().min(1)),
  pageSize: Su.optional(Su.number().min(1).max(50)),
});

export type SocialListQuery = SuInfer<typeof SocialListQuerySchema>;
