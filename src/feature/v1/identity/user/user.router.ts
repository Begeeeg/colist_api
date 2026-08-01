import express from "express";
import { protectRoutes } from "../../../../common/protectRoutes";
import {
    getUserController,
    updatePasswordController,
    updateUsernameController,
} from "./user.controller";
import { UpdateUsernameSchema } from "./dto/updateUsername.data.dto";
import { validate } from "../../../../common/validatorDataDto";
import { UpdatePasswordSchema } from "./dto/updatePassword.data.dto";

const router = express.Router();

router.get("/me", protectRoutes, getUserController);
router.patch(
    "/username",
    protectRoutes,
    validate(UpdateUsernameSchema),
    updateUsernameController
);
router.patch(
    "/password",
    protectRoutes,
    validate(UpdatePasswordSchema),
    updatePasswordController
);

export default router;
