import express from "express";
import { protectRoutes } from "../../../../common/protectRoutes";
import { getUserController, updateUsernameController } from "./user.controller";
import { UpdateUsernameSchema } from "./dto/update.data.dto";
import { validate } from "../../../../common/validatorDataDto";

const router = express.Router();

router.get("/me", protectRoutes, getUserController);
router.patch(
    "/:id",
    protectRoutes,
    validate(UpdateUsernameSchema),
    updateUsernameController
);

export default router;
