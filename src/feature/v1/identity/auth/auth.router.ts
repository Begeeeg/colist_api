import express from "express";
import { validate } from "../../../../common/validatorDataDto";
import { RegisterUserSchema } from "./dto/register.data.dto";
import { registerController } from "./auth.controller";

const router = express.Router();

router.post("/register", validate(RegisterUserSchema), registerController);

export default router;
