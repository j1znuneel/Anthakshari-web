import { prisma } from "../utils/prisma";
import { Request, Response } from "express";

export const createRoom = async (req: Request, res: Response) => {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  const room = await prisma.room.create({ data: { code } });
  res.status(201).json(room);
};
