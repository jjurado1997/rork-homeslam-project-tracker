import { z } from "zod";
import { publicProcedure } from "../../create-context";
import { projectsDb } from "../../../db/projects";

export default publicProcedure
  .input(z.object({ id: z.string() }))
  .mutation(({ input }) => {
    return projectsDb.delete(input.id);
  });