import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../../../create-context";

const hiMutation = publicProcedure
  .input(z.object({ name: z.string() }))
  .mutation(({ input }) => {
    console.log('👋 Hi mutation called with:', input.name);
    return {
      hello: input.name,
      date: new Date(),
    };
  });

const hiQuery = publicProcedure
  .query(() => {
    console.log('👋 Hi query called');
    return {
      message: 'Hello from backend!',
      timestamp: new Date(),
      status: 'Backend is working'
    };
  });

export default createTRPCRouter({
  query: hiQuery,
  mutate: hiMutation,
});