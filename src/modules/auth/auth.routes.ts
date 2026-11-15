import { Router } from "express";

import { authController } from "./auth.controller.js";
import { authenticate } from "../../middlewares/authenticate.js";
import { authorize } from "../../middlewares/authorize.js";

const router = Router();

// Login
router.post("/login", authController.login);

// Get authenticated user information
router.get("/me", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Authenticated user information retrieved successfully",
    data: {
      user: req.user,
    },
  });
});

// Administrator-only test route
router.get(
  "/admin-test",
  authenticate,
  authorize("admin"),
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "Welcome, Administrator! You have permission.",
      data: {
        user: req.user,
      },
    });
  }
);

export default router;