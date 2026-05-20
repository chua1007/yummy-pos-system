import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, branchId: string, dto: CreateOrderDto) {
    const orderNumber = await this.generateOrderNumber(branchId);

    const order = await this.prisma.order.create({
      data: {
        id: randomUUID(),
        tenantId,
        branchId,
        orderNumber,
        type: dto.type,
        status: 'pending',
        tableId: dto.tableId,
        customerId: dto.customerId,
        notes: dto.notes,
        subtotal: 0, // Calculated from items
        taxAmount: 0,
        discountAmount: 0,
        total: 0,
        currency: 'MYR',
        placedAt: new Date(),
        items: {
          create: dto.items.map((item) => ({
            id: randomUUID(),
            menuItemId: item.menuItemId,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: 0, // Fetched from menu service
            subtotal: 0,
            notes: item.notes,
            status: 'queued',
            modifiers: item.modifiers || [],
          })),
        },
      },
      include: { items: true },
    });

    this.logger.log(`Order created: ${order.orderNumber}`, { tenantId, branchId });

    // TODO: Publish order.placed event to Kafka
    // TODO: Calculate totals from menu service prices

    return order;
  }

  async findAll(
    tenantId: string,
    branchId: string,
    params: { page: number; limit: number; status?: string },
  ) {
    const { page, limit, status } = params;
    const skip = (page - 1) * limit;

    const where = {
      tenantId,
      branchId,
      ...(status && { status }),
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order ${id} not found`);
    }

    return order;
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateOrderStatusDto) {
    const order = await this.findOne(tenantId, id);

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: dto.status,
        ...(dto.status === 'completed' && { completedAt: new Date() }),
      },
      include: { items: true },
    });

    this.logger.log(`Order ${order.orderNumber} status: ${dto.status}`, { tenantId });

    // TODO: Publish order.status_changed event

    return updated;
  }

  private async generateOrderNumber(branchId: string): Promise<string> {
    // Simple sequential numbering per branch per day
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.order.count({
      where: {
        branchId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });
    return `${today}-${String(count + 1).padStart(4, '0')}`;
  }
}
