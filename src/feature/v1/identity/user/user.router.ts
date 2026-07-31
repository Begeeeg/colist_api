import express from "express";
import { protectRoutes } from "../../../../common/protectRoutes";
import { getUserController } from "./user.controller";

const router = express.Router();

router.get("/me", protectRoutes, getUserController);

export default router;
