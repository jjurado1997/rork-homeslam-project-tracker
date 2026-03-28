import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { projectsDb } from "../../../db/projects";

export default publicProcedure
  .input(z.object({ 
    projectId: z.string(),
    expenseId: z.string() 
  }))
  .mutation(({ input }) => {
    return projectsDb.deleteExpense(input.projectId, input.expenseId);
  });