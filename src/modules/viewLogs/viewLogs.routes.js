const express = require("express");
const router = express.Router();
const { validate } = require("../../middlewares/validate.middleware");
const { optionalAuthenticateToken } = require("../../middlewares/auth.middleware");
const v = require("./viewLogs.validation");
const controller = require("./viewLogs.controller");

router.post("/", optionalAuthenticateToken, validate(v.createViewLogSchema), controller.createViewLog);

module.exports = router;
