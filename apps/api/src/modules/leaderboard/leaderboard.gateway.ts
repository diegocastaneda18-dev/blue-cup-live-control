import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";

type CatchEventPayload = { type: "catch_submitted"; catchId: string };

@WebSocketGateway({
  cors: { origin: "*" },
  namespace: "/live"
})
export class LeaderboardGateway {
  @WebSocketServer()
  server!: Server;

  async broadcastLeaderboardRefresh(tournamentId: string) {
    this.server.emit("leaderboard.refresh", { tournamentId });
  }

  async broadcastCatchEvent(tournamentId: string, payload: CatchEventPayload) {
    this.server.emit("catch.event", { tournamentId, ...payload });
  }
}

