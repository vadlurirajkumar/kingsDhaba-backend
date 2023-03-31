const express = require("express");
const router = express.Router();
const {
  signupUser,
  verifyForSignup,
  login,
  resendOtp,
  updateLocation,
  editProfile,
  getSingleUser,
  verifyForLogin,
  checkLocationForDelivery,
  searchProducts,
} = require("../controllers/userController");
const isOtpAuth = require("../middleware/otpAuth");

// routes
router.post("/signup", signupUser);
router.post("/signup-verify", isOtpAuth, verifyForSignup);
router.post("/login", login);
router.post("/login-verify", isOtpAuth, verifyForLogin);
router.post("/resendotp", resendOtp);
router.patch("/location", isOtpAuth, updateLocation);
router.post("/check-location", isOtpAuth, checkLocationForDelivery);
router.patch("/update", isOtpAuth, editProfile);
router.get("/getuser", isOtpAuth, getSingleUser);
router.post("/search", searchProducts);

module.exports = router;
