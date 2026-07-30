import express from "express";
import { validate } from "../../../../common/validatorDataDto";
import { RegisterUserSchema } from "./dto/register.data.dto";
import {
    logInController,
    logOutController,
    registerController,
} from "./auth.controller";
import { LoginSchema } from "./dto/login.data.dto";
import { protectRoutes } from "./../../../../common/protectRoutes";

const router = express.Router();

router.post("/register", validate(RegisterUserSchema), registerController);
router.post("/login", validate(LoginSchema), logInController);
router.post("/logout", protectRoutes, logOutController);

export default router;
