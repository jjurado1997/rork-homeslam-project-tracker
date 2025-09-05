import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { projectsDb } from "../../../db/projects";

const updateExpenseSchema = z.object({
  projectId: z.string(),
  expenseId: z.string(),
  updates: z.object({
    category: z.enum(['materials', 'contractors', 'labor', 'landscaping', 'other']).optional(),
    subcategory: z.string().optional(),
    amount: z.number().optional(),
    description: z.string().optional()
  })
});

export default publicProcedure
  .input(updateExpenseSchema)
  .mutation(({ input }) => {
    return projectsDb.updateExpense(input.projectId, input.expenseId, input.updates);
  });