import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { projectsDb } from "../../../db/projects";

const createProjectSchema = z.object({
  name: z.string(),
  address: z.string(),
  client: z.string(),
  totalRevenue: z.number(),
  projectStartDate: z.string().transform(str => new Date(str)),
  notes: z.string().optional().default('')
});

export default publicProcedure
  .input(createProjectSchema)
  .mutation(({ input }) => {
    const project = {
      ...input,
      id: Date.now().toString(),
      createdAt: new Date(),
      expenses: [],
      changeOrders: [],
      isCompleted: false,
    };
    
    return projectsDb.create(project);
  });