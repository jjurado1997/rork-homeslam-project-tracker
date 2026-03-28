import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { projectsDb } from "../../../db/projects";

export default publicProcedure
  .input(z.object({ 
    projectId: z.string(),
    changeOrderId: z.string() 
  }))
  .mutation(({ input }) => {
    return projectsDb.deleteChangeOrder(input.projectId, input.changeOrderId);
  });