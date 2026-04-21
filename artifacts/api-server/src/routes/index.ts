import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import servicesRouter from "./services";
import budgetsRouter from "./budgets";
import appointmentsRouter from "./appointments";
import ordersRouter from "./orders";
import clientsRouter from "./clients";
import exportsRouter from "./exports";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(servicesRouter);
router.use(budgetsRouter);
router.use(appointmentsRouter);
router.use(ordersRouter);
router.use(clientsRouter);
router.use(exportsRouter);

export default router;
