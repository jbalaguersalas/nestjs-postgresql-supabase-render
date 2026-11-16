import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Pool } from 'pg';
import { Book, BookPage, BookRow, toBook } from './book';
import { BooksContract } from './books.contract';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { ListBooksQueryDto } from './dto/list-books-query.dto';

const COLUMNS = 'id, title, author, pages, stock, created_at';

@Injectable()
export class BooksService implements BooksContract {
  constructor(private readonly pool: Pool) {}

  async findAll(author?: string): Promise<Book[]> {
    if (!author) {
      const result = await this.pool.query<BookRow>(
        `SELECT ${COLUMNS} FROM books ORDER BY id`,
      );
      return result.rows.map(toBook);
    }

    const result = await this.pool.query<BookRow>(
      `SELECT ${COLUMNS}
       FROM books
       WHERE author ILIKE '%' || $1 || '%'
       ORDER BY id`,
      [author],
    );
    return result.rows.map(toBook);
  }

  // v2: una página de libros, ordenada
  async findPage(query: ListBooksQueryDto): Promise<BookPage> {
    const { page, limit, sort, order } = query;
    const author = query.author ?? null; // null = sin filtro

    // ORDER BY no admite $1: el nombre de la columna va en el texto del SQL.
    // Es seguro porque el DTO solo deja pasar 'id', 'title' o 'pages'.
    const direction = order === 'desc' ? 'DESC' : 'ASC';
    const offset = (page - 1) * limit;

    const result = await this.pool.query<BookRow>(
      `SELECT ${COLUMNS} FROM books
       WHERE ($1::text IS NULL OR author ILIKE '%' || $1 || '%')
       ORDER BY ${sort} ${direction}, id
       LIMIT $2 OFFSET $3`,
      [author, limit, offset],
    );

    // Cuántos hay en total con el mismo filtro (sin LIMIT)
    const count = await this.pool.query<{ total: number }>(
      `SELECT COUNT(*)::int AS total FROM books
       WHERE ($1::text IS NULL OR author ILIKE '%' || $1 || '%')`,
      [author],
    );
    const total = count.rows[0].total;

    return {
      data: result.rows.map(toBook),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: number): Promise<Book> {
    const result = await this.pool.query<BookRow>(
      `SELECT ${COLUMNS} FROM books WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      throw new NotFoundException('Libro no encontrado');
    }
    return toBook(result.rows[0]);
  }

  async create(dto: CreateBookDto): Promise<Book> {
    const result = await this.pool.query<BookRow>(
      `INSERT INTO books (title, author, pages, stock)
       VALUES ($1, $2, $3, $4)
       RETURNING ${COLUMNS}`,
      [dto.title, dto.author, dto.pages, dto.stock ?? 0],
    );
    return toBook(result.rows[0]);
  }

  async update(id: number, dto: UpdateBookDto): Promise<Book> {
    if (
      dto.title === undefined &&
      dto.author === undefined &&
      dto.pages === undefined
    ) {
      throw new BadRequestException('Envía al menos un campo');
    }
    const book = await this.findOne(id); // 404 si no existe

    const result = await this.pool.query<BookRow>(
      `UPDATE books
       SET title = $1, author = $2, pages = $3, stock = $5
       WHERE id = $4
       RETURNING ${COLUMNS}`,
      [
        dto.title ?? book.title,
        dto.author ?? book.author,
        dto.pages ?? book.pages,
        id,
        dto.stock ?? book.stock,
      ],
    );
    return toBook(result.rows[0]);
  }

  async remove(id: number): Promise<Book> {
    const book = await this.findOne(id); // 404 si no existe
    await this.pool.query('DELETE FROM books WHERE id = $1', [id]);
    return book;
  }
}
