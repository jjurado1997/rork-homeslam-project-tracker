import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { projectsDb } from "../../../db/projects";

const updateChangeOrderSchema = z.object({
  projectId: z.string(),
  changeOrderId: z.string(),
  updates: z.object({
    description: z.string().optional(),
    amount: z.number().optional(),
    approved: z.boolean().optional()
  })
});

export default publicProcedure
  .input(updateChangeOrderSchema)
  .mutation(({ input }) => {
    return projectsDb.updateChangeOrder(input.projectId, input.changeOrderId, input.updates);
  });