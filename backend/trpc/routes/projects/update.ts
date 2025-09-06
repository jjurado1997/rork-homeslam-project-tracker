import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { projectsDb } from "../../../db/projects";
import { Project } from "../../../../types/project";

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
    completedAt: z.union([
      z.string().transform(str => new Date(str)), 
      z.null()
    ]).optional()
  })
});

export default publicProcedure
  .input(updateProjectSchema)
  .mutation(({ input }) => {
    const { completedAt, ...otherUpdates } = input.updates;
    
    // Create properly typed updates object
    const updates: Partial<Project> = {
      ...otherUpdates
    };
    
    // Handle completedAt field separately to avoid type issues
    if (completedAt !== undefined) {
      updates.completedAt = completedAt === null ? undefined : completedAt;
    }
    
    return projectsDb.update(input.id, updates);
  });