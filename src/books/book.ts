// Así llega un libro desde PostgreSQL (una fila de la tabla)
export interface BookRow {
  id: number;
  title: string;
  author: string;
  pages: number;
  created_at: Date;
  stock: number;
}

// Así lo devuelve nuestra API
export interface Book {
  id: number;
  title: string;
  author: string;
  pages: number;
  createdAt: Date;
  stock: number;
}

// Una página de libros (lo que devuelve la v2 de GET /books)
export interface BookPage {
  data: Book[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function toBook(row: BookRow): Book {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    pages: row.pages,
    createdAt: row.created_at,
    stock: row.stock,
  };
}
