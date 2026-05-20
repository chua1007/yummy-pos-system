import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { OrderService } from '../services/order.service';
import { CreateOrderDto, UpdateOrderStatusDto } from '../dto/order.dto';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-branch-id') branchId: string,
    @Body() dto: CreateOrderDto,
  ) {
    const order = await this.orderService.create(tenantId, branchId, dto);
    return { success: true, data: order };
  }

  @Get()
  async findAll(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-branch-id') branchId: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status?: string,
  ) {
    const result = await this.orderService.findAll(tenantId, branchId, {
      page: Number(page),
      limit: Number(limit),
      status,
    });
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
  ) {
    const order = await this.orderService.findOne(tenantId, id);
    return { success: true, data: order };
  }

  @Patch(':id/status')
  async updateStatus(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    const order = await this.orderService.updateStatus(tenantId, id, dto);
    return { success: true, data: order };
  }
}
