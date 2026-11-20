# API de libros con NestJS y PostgreSQL

Práctica del bootcamp de Full Stack de The Bridge.

Es una API para una tienda de libros. El punto de partida lo hice en clase con el profesor: un CRUD de libros con NestJS que guarda los datos en PostgreSQL, preparado para subirlo a Render con la base de datos en Supabase. El código de partida ya traía el stock de cada libro, dos versiones de la API (`/api/v2/books` devuelve los libros por páginas) y las tablas de pedidos. Sobre eso he hecho yo los ejercicios del apunte 07.

## Qué he añadido yo

- **Colecciones de Postman** para probar los ejercicios 1 a 6: stock, versiones y paginación.
- **Cabeceras de seguridad** con helmet en todas las respuestas.
- **Límite de peticiones**: 20 por minuto en toda la API y solo 3 por minuto para crear pedidos. Si te pasas, la API contesta 429.
- **Pedidos**: el módulo con sus dos rutas. Un pedido tiene varias líneas (libro y cantidad) y al crearlo resta el stock de cada libro.
- **Errores con la misma forma**: un filtro hace que todos los errores salgan con `statusCode`, `message`, `path` y `timestamp`.
- **Logs**: una línea en la consola por cada petición, con su código y lo que ha tardado.

## Rutas

Todas empiezan por `/api`. Si la ruta no dice versión, es la v1.

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/v1/health` | Devuelve `true` si la API está viva |
| GET | `/api/v1/books` | Todos los libros. Con `?author=garcia` filtra por autor |
| GET | `/api/v2/books` | Libros por páginas: `?page=2&limit=5&sort=pages&order=desc&author=...` |
| GET | `/api/v1/books/:id` | Un libro |
| POST | `/api/v1/books` | Crea un libro |
| PATCH | `/api/v1/books/:id` | Cambia un libro |
| DELETE | `/api/v1/books/:id` | Borra un libro y lo devuelve |
| GET | `/api/v1/orders/:id` | Un pedido con sus líneas y el título de cada libro |
| POST | `/api/v1/orders` | Crea un pedido: `{ "items": [{ "bookId": 1, "quantity": 2 }] }` |

En la v2, `limit` va de 1 a 50 y solo se puede ordenar por `id`, `title` o `pages`. Cualquier otra cosa da 400.

En la carpeta [`postman/`](postman) están las colecciones con todas las peticiones de los ejercicios, numeradas.

## Cómo arrancarlo en mi ordenador

Con el `compose.yaml` del repo:

```bash
docker compose up -d     # PostgreSQL 17 en el puerto 5432, carga database/schema.sql la primera vez
npm install
cp .env.example .env
npm run start:dev        # http://localhost:3000/api/v1/books
```

El `.env` solo necesita `DATABASE_URL`. El `schema.sql` crea las tablas `books`, `orders` y `order_items` y mete 12 libros de prueba.

En [`web/index.html`](web/index.html) hay una página sencilla que pide los libros a la API desplegada en Render y los pinta en una tabla.

## He aprendido

**Qué es una transacción.** Si un pedido tiene tres libros y el tercero no tiene stock, no puedo dejar restados los dos primeros. Abro la transacción con `BEGIN`, y si algo falla hago `ROLLBACK` y se deshace todo. Además tiene que ir todo por la misma conexión, así que pido una al Pool y la devuelvo al final pase lo que pase.

**A restar el stock en una sola consulta.** `UPDATE books SET stock = stock - $1 WHERE id = $2 AND stock >= $1`. Si no cambia ninguna fila, o el libro no existe o no hay ejemplares, y devuelvo 409.

**A dar a todos los errores la misma forma.** Antes un 404 y un 500 salían distintos. Con el filtro, el cliente siempre recibe los mismos campos, y el detalle de los 500 se queda en mi consola.

**Que detrás de Render hay un proxy.** Sin `trust proxy`, el límite de peticiones veía la misma IP para todo el mundo.

## Tecnologías

- **NestJS** con TypeScript
- **PostgreSQL** con la librería `pg` y SQL a mano
- **class-validator** y **class-transformer** para validar lo que llega
- **helmet** y **@nestjs/throttler** para la seguridad
- **Docker** para la base de datos en local
- **Render** y **Supabase** para el despliegue
- **Postman** para probar

---

## Apuntes de clase

Esto es lo que venía en el README del código de partida.

### 03b · NestJS + PostgreSQL

Estado al terminar los apuntes `03b_nestjs_postgresql.md`: la API de la 03a, con el servicio guardando los libros en PostgreSQL (`pg`, SQL a mano con `$1`, `$2`...). Incluye `toBook` (fila → libro de la API) y el contrato opcional `BooksContract`.

```bash
npm install
cp .env.example .env
docker exec -i postgres-sql psql -U alumno -d academia -c "CREATE DATABASE bootcamp_api;"
docker exec -i postgres-sql psql -U alumno -d bootcamp_api < database/schema.sql
npm run start:dev
```

Necesita el contenedor `postgres-sql` de la clase de SQL. El `.env` se lee con `process.loadEnvFile()` (Node 20.12 o superior), solo si existe: en Render no hay `.env` y las variables las pone Render.

### Desplegar en Render

Paso a paso en los apuntes `06_despliegue_render.md`. Resumen:

| Campo de Render | Valor |
|---|---|
| Root Directory | `03b-nestjs-postgresql` (si el proyecto está en una subcarpeta) |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start:prod` |
| Variables | `DATABASE_URL` (la del *Session pooler* de Supabase, terminada en `?sslmode=no-verify`) |

Para `04` y `05`, lo mismo con su carpeta y una variable más: `JWT_SECRET`.
