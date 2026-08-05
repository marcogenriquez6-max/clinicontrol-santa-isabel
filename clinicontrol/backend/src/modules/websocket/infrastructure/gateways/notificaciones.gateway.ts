import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../../../auth/domain/ports/token-service.port';

@WebSocketGateway({
  namespace: '/notificaciones',
  cors: { origin: '*', credentials: true },
})
export class NotificacionesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificacionesGateway.name);
  private userSockets = new Map<number, Set<string>>();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const token =
        client.handshake.auth?.token ||
        (client.handshake.query?.token as string);
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      const userId = payload.sub;

      client.data.userId = userId;
      client.data.email = payload.email;
      client.data.rol = payload.rol;

      client.join(`user:${userId}`);

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`WS connected: user ${userId} (socket ${client.id})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = client.data?.userId as number | undefined;
    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(client.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`WS disconnected: socket ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    client.emit('pong', { timestamp: Date.now() });
  }

  sendToUser(userId: number, event: string, data: any): void {
    this.server?.to(`user:${userId}`).emit(event, data);
  }

  sendToRole(rol: string, event: string, data: any): void {
    this.server?.to(`role:${rol}`).emit(event, data);
  }

  broadcast(event: string, data: any): void {
    this.server?.emit(event, data);
  }

  getConnectedUserIds(): number[] {
    return Array.from(this.userSockets.keys());
  }

  isUserConnected(userId: number): boolean {
    const sockets = this.userSockets.get(userId);
    return !!sockets && sockets.size > 0;
  }
}
