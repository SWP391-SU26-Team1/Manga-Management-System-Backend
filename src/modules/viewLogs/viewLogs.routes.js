const express = require("express");
const router = express.Router();
const { validate } = require("../../middlewares/validate.middleware");
const v = require("./viewLogs.validation");
const controller = require("./viewLogs.controller");

router.post("/", validate(v.createViewLogSchema), controller.createViewLog);

module.exports = router;
