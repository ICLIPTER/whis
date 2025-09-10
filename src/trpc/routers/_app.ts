import { projectsRoutes } from '@/modules/projects/server/procedures';
import { createTRPCRouter } from '../init';
import { messagesRoutes } from '@/modules/messages/server/procedures';

export const appRouter = createTRPCRouter({
  messages: messagesRoutes,
  projects: projectsRoutes,
  
});
// export type definition of API
export type AppRouter = typeof appRouter;