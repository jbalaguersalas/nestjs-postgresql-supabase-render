import { Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { Order, OrderRow, toOrder } from './order';

@Injectable()
export class OrdersService {
  constructor(private readonly pool: Pool) {}

  async findOne(id: number): Promise<Order> {
    // JOIN: el pedido + sus líneas + el título de cada libro
    const result = await this.pool.query<OrderRow>(
      `SELECT o.id, o.created_at, i.book_id, b.title, i.quantity
       FROM orders o
       JOIN order_items i ON i.order_id = o.id
       JOIN books b ON b.id = i.book_id
       WHERE o.id = $1
       ORDER BY i.id`,
      [id],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Pedido no encontrado');
    }
    return toOrder(result.rows);
  }
}
