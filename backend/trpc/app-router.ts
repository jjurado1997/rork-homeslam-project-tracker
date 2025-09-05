import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import getAllProjects from "./routes/projects/get-all";
import createProject from "./routes/projects/create";
import updateProject from "./routes/projects/update";
import deleteProject from "./routes/projects/delete";
import createExpense from "./routes/expenses/create";
import updateExpense from "./routes/expenses/update";
import deleteExpense from "./routes/expenses/delete";
import createChangeOrder from "./routes/change-orders/create";
import updateChangeOrder from "./routes/change-orders/update";
import deleteChangeOrder from "./routes/change-orders/delete";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  projects: createTRPCRouter({
    getAll: getAllProjects,
    create: createProject,
    update: updateProject,
    delete: deleteProject,
  }),
  expenses: createTRPCRouter({
    create: createExpense,
    update: updateExpense,
    delete: deleteExpense,
  }),
  changeOrders: createTRPCRouter({
    create: createChangeOrder,
    update: updateChangeOrder,
    delete: deleteChangeOrder,
  }),
});

export type AppRouter = typeof appRouter;