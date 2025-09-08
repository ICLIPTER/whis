import { createTRPCRouter } from '../init';
import { messagesRoutes } from '@/modules/messages/server/procedures';

export const appRouter = createTRPCRouter({
  messages: messagesRoutes,
  
});
// export type definition of API
export type AppRouter = typeof appRouter;