import express from "express";
import { createRoom, joinRoom } from "../controllers/roomController";

const router = express.Router();

router.post("/room", createRoom);
router.post("/room/join", joinRoom);

export default router;
