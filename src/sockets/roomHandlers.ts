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

    io.to(roomCode).emit("room-data", room);
  });

  // Handle song submission and streaming
  socket.on(
    "submit-song",
    async ({ code, playerId, audioData, playerName }, callback: () => void) => {
      const room = await prisma.room.findUnique({
        where: { code },
        include: { players: { orderBy: { joinedAt: "asc" } } },
      });

      if (!room || room.currentTurn !== playerId) {
        socket.emit("error", "Invalid turn or room");
        return;
      }

      // Broadcast the song to all players in the room
      io.to(code).emit("song-data", {
        audioData,
        playerId,
        playerName
      });

      if (callback) callback();
    }
  );

  // Handle letter submission and turn change
  socket.on(
    "submit-letter",
    async ({ code, playerId, letter }, callback: () => void) => {
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

      if (callback) callback();
    }
  );

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
} 