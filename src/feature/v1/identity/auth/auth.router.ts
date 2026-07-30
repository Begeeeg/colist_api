import express from "express";
import { validate } from "../../../../common/validatorDataDto";
import { RegisterUserSchema } from "./dto/register.data.dto";
import { logInController, registerController } from "./auth.controller";
import { LoginSchema } from "./dto/login.data.dto";

const router = express.Router();

router.post("/register", validate(RegisterUserSchema), registerController);
router.post("/login", validate(LoginSchema), logInController);

export default router;
