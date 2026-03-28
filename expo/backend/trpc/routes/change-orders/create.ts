import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { projectsDb } from "../../../db/projects";

const createChangeOrderSchema = z.object({
  projectId: z.string(),
  description: z.string(),
  amount: z.number(),
  approved: z.boolean()
});

export default publicProcedure
  .input(createChangeOrderSchema)
  .mutation(({ input }) => {
    const changeOrder = {
      id: Date.now().toString(),
      date: new Date(),
      description: input.description,
      amount: input.amount,
      approved: input.approved
    };
    
    return projectsDb.addChangeOrder(input.projectId, changeOrder);
  });