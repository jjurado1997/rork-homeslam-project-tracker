import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { projectsDb } from "../../../db/projects";

const updateProjectSchema = z.object({
  id: z.string(),
  updates: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    client: z.string().optional(),
    totalRevenue: z.number().optional(),
    projectStartDate: z.string().transform(str => new Date(str)).optional(),
    notes: z.string().optional(),
    isCompleted: z.boolean().optional(),
    completedAt: z.string().transform(str => new Date(str)).optional().nullable()
  })
});

export default publicProcedure
  .input(updateProjectSchema)
  .mutation(({ input }) => {
    return projectsDb.update(input.id, input.updates);
  });