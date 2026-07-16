import { Su, SuInfer } from '@/lib/validator';

export const MarkReadBodySchema = Su.object({
  ids: Su.array(Su.string().uuid()),
});
export type MarkReadBody = SuInfer<typeof MarkReadBodySchema>;

export const NotificationsQuerySchema = Su.object({
  cursor: Su.optional(Su.string().isoDate()),
  limit: Su.optional(Su.number().min(1).max(50)),
});
export type NotificationsQuery = SuInfer<typeof NotificationsQuerySchema>;
