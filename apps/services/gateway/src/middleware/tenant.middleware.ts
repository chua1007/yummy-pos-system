import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // Extract tenant context from JWT or header
    const tenantId = req.headers['x-tenant-id'] as string;

    if (tenantId) {
      (req as any).tenantId = tenantId;
    }

    // In production, this would be extracted from the JWT token
    // after Cognito validation
    next();
  }
}
