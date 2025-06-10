import { Server, Socket } from "socket.io";
import { prisma } from "../utils/prisma";

export function registerRoomHandlers(io: Server, socket: Socket) {
  socket.on("join-room", async (roomCode: string) => {
    socket.join(roomCode);
    const room = await prisma.room.findUnique({
      where: { code: roomCode },
      include: { players: { orderBy: { joinedAt: "asc" } } },
    });

    if (!room) {
      socket.emit("room-error", "Room not found");
      return;
    }

    socket.emit("room-data", room);
  });

  socket.on("submit-song", async ({ code, playerId, letter }) => {
    const room = await prisma.room.findUnique({
      where: { code },
      include: { players: { orderBy: { joinedAt: "asc" } } },
    });

    if (!room || room.currentTurn !== playerId) {
      socket.emit("error", "Invalid turn or room");
      return;
    }

    const playerIndex = room.players.findIndex((p) => p.id === playerId);
    const nextPlayer = room.players[(playerIndex + 1) % room.players.length];

    const updatedRoom = await prisma.room.update({
      where: { code },
      data: {
        lastLetter: letter,
        currentTurn: nextPlayer.id,
      },
      include: { players: true },
    });

    io.to(code).emit("room-data", updatedRoom);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
}
