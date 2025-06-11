import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import roomRoutes from "./routes/roomRoutes";
import { registerRoomHandlers } from "./sockets/roomHandlers";

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

// Express middleware
app.use(cors());
app.use(express.json());
app.use("/api", roomRoutes);

app.get("/", (_, res) => {
  res.send("API running");
});
// WebSocket handlers
io.on("connection", (socket) => {
  console.log("Client connected:", socket.id);
  registerRoomHandlers(io, socket);
});

// Start server
httpServer.listen(3000, () => {
  console.log("Server running on port 3000");
});
