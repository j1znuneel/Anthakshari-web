import express from "express";
import { createRoom, getRoom, joinRoom, startRoom, submitSong } from "../controllers/roomController";

const router = express.Router();

router.post("/room", createRoom);
router.post("/room/join", joinRoom);
router.post("/room/start", startRoom);
router.get("/room/:code", getRoom);
router.post("/room/submit", submitSong);

export default router;
