import { UserDomain } from '../user.domain';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  sub: number;
  email: string;
  rol: string;
  permissions: string[];
  tokenId?: string;
  type?: string;
}

export abstract class TokenServicePort {
  abstract generateTokenPair(user: UserDomain): TokenPair;
  abstract verifyAccessToken(token: string): JwtPayload;
  abstract verifyRefreshToken(token: string): JwtPayload;
  abstract generateMfaToken(userId: number, email: string): string;
  abstract verifyMfaToken(token: string): JwtPayload;
}
