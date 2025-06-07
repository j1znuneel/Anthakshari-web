import express from "express";
import { createRoom, joinRoom, startRoom } from "../controllers/roomController";

const router = express.Router();

router.post("/room", createRoom);
router.post("/room/join", joinRoom);
router.post("/room/start", startRoom);

export default router;
