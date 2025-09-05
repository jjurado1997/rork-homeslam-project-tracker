import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { projectsDb } from "../../../db/projects";

const createExpenseSchema = z.object({
  projectId: z.string(),
  category: z.enum(['materials', 'contractors', 'labor', 'landscaping', 'other']),
  subcategory: z.string(),
  amount: z.number(),
  description: z.string()
});

export default publicProcedure
  .input(createExpenseSchema)
  .mutation(({ input }) => {
    const expense = {
      id: Date.now().toString(),
      date: new Date(),
      category: input.category as any,
      subcategory: input.subcategory,
      amount: input.amount,
      description: input.description
    };
    
    return projectsDb.addExpense(input.projectId, expense);
  });