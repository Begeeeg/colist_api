import express from "express";
import { protectRoutes } from "../../../../common/protectRoutes";
import {
    getUserController,
    updatePasswordController,
    updateUsernameController,
} from "./user.controller";
import { UpdateUsernameSchema } from "./dto/update.data.dto";
import { validate } from "../../../../common/validatorDataDto";
import { UpdatePasswordSchema } from "./dto/updatePassword.data.dto";

const router = express.Router();

router.get("/me", protectRoutes, getUserController);
router.patch(
    "/:id",
    protectRoutes,
    validate(UpdateUsernameSchema),
    updateUsernameController
);
router.patch(
    "/password/:id",
    protectRoutes,
    validate(UpdatePasswordSchema),
    updatePasswordController
);

export default router;
