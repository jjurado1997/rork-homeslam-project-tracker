import { publicProcedure } from "../../create-context";
import { projectsDb } from "../../../db/projects";

export default publicProcedure
  .query(() => {
    return projectsDb.getAll();
  });