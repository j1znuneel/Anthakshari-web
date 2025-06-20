import { prisma } from "../utils/prisma";
import { Request, Response } from "express";

export const createRoom = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("Received createRoom request");
    console.log("Request body:", req.body);

    const { name, turnTime = 30 } = req.body;

    if (!name) {
      console.warn("Validation failed: Name is missing");
      res.status(400).json({ error: "Name is required to create room." });
      return;
    }

    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    console.log("Generated room code:", code);

    const room = await prisma.room.create({
      data: { code, turnTime, started: false },
    });
    console.log("Room created:", room);

    const player = await prisma.player.create({
      data: { name, roomId: room.id },
    });
    console.log("Player created:", player);

    const updatedRoom = await prisma.room.update({
      where: { id: room.id },
      data: { currentTurn: player.id },
      include: { players: true },
    });
    console.log("Room updated with currentTurn:", updatedRoom);

    res.status(201).json({
      code: updatedRoom.code,
      playerId: player.id,
    });
  } catch (err: any) {
    console.error("CreateRoom error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
};

export const joinRoom = async (req: Request, res: Response): Promise<void> => {
  const { code, name } = req.body;

  if (!code || !name) {
    res.status(400).json({ error: "Room code and name are required." });
    return;
  }

  const room = await prisma.room.findUnique({
    where: { code },
    include: { players: true },
  });

  if (!room) {
    res.status(404).json({ error: "Room not found." });
    return;
  }

  const existingPlayer = room.players.find(
    (player) => player.name.toLowerCase() === name.toLowerCase()
  );

  if (existingPlayer) {
    res.status(409).json({ error: "Player name already exists in this room." });
    return;
  }

  const player=await prisma.player.create({
    data: {
      name,
      roomId: room.id,
    },
  });

  const updatedRoom = await prisma.room.findUnique({
    where: { code },
    include: { players: true },
  });

  res.status(201).json({ players: updatedRoom?.players ,code:room.code,playerId:player.id});
};
export const startRoom = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ error: "Room code is required." });
    return;
  }

  const room = await prisma.room.findUnique({
    where: { code },
    include: { players: { orderBy: { joinedAt: "asc" } } },
  });

  if (!room) {
    res.status(404).json({ error: "Room not found." });
    return;
  }

  if (room.players.length < 2) {
    res
      .status(400)
      .json({ error: "At least 2 players are required to start the game." });
    return;
  }

  const firstPlayer = room.players[0];

  const updatedRoom = await prisma.room.update({
    where: { code },
    data: {
      started: true,
      currentTurn: firstPlayer.id,
    },
    include: {
      players: true,
    },
  });

  res.status(200).json({
    message: "Game started",
    currentTurn: firstPlayer,
    players: updatedRoom.players,
  });
};

export const submitSong = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { code, playerId, letter } = req.body;

  if (!code || !playerId || !letter) {
    res.status(400).json({ error: "code, playerId and letter are required." });
    return;
  }

  const room = await prisma.room.findUnique({
    where: { code },
    include: { players: { orderBy: { joinedAt: "asc" } } },
  });

  if (!room) {
    res.status(404).json({ error: "Room not found." });
    return;
  }

  if (room.currentTurn !== playerId) {
    res.status(403).json({ error: "It's not your turn." });
    return;
  }

  const playerIndex = room.players.findIndex((p) => p.id === playerId);
  const nextIndex = (playerIndex + 1) % room.players.length;
  const nextPlayer = room.players[nextIndex];

  const updatedRoom = await prisma.room.update({
    where: { code },
    data: {
      lastLetter: letter,
      currentTurn: nextPlayer.id,
    },
    include: { players: true },
  });

  res.status(200).json({
    message: "Turn submitted",
    lastLetter: updatedRoom.lastLetter,
    currentTurn: nextPlayer,
  });
};

export const getRoom = async (req: Request, res: Response): Promise<void> => {
  const { code } = req.params;

  const room = await prisma.room.findUnique({
    where: { code },
    include: {
      players: { orderBy: { joinedAt: "asc" } },
    },
  });

  if (!room) {
    res.status(404).json({ error: "Room not found." });
    return;
  }

  res.status(200).json({
    code: room.code,
    players: room.players,
    currentTurn: room.currentTurn,
    lastLetter: room.lastLetter,
    started: room.started,
  });
};
