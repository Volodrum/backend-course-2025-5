const http = require('http');
const fsSync = require('fs');
const { readFile, writeFile, unlink } = require('fs').promises;
const path = require('path');
const { program } = require('commander');

// Налаштування аргументів командного рядка
program
  .version('1.0.1')
  .description('Простий веб-сервер з кешуванням')
  .requiredOption('-h, --host <type>', "Адреса сервера (обов'язково)")
  .requiredOption('-p, --port <number>', "Порт сервера (обов'язково)")
  .requiredOption('-c, --cache <type>', "Шлях до директорії кешу (обов'язково)");

program.parse(process.argv);
const options = program.opts();

// Створення директорії кешу
const cachePath = path.resolve(options.cache);

try {
  fsSync.mkdirSync(cachePath, { recursive: true });
  console.log(`[Cache] Директорія кешу готова: ${cachePath}`);
} catch (error) {
  console.error(`[Error] Не вдалося створити директорію кешу: ${error.message}`);
  process.exit(1); // Вихід з процесу, якщо кеш створити неможливо
}

function getBody(req) {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      req.on('data', chunk => chunks.push(chunk));
      req.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    } catch (error) {
      reject(error);
    }
  });
}

const getFilePath = (url) => {
  const code = url.substring(1);
  return path.join(cachePath, `${code}.jpeg`);
};

// Запуск веб-сервера
const server = http.createServer(async (req, res) => {
    const filePath = getFilePath(req.url);

    try {
        // Обробка GET (Читання з кешу)
        if (req.method === 'GET') {
            try {
                const data = await readFile(filePath);
                // Успіх: 200 (OK) + картинка
                res.writeHead(200, { 'Content-Type': 'image/jpeg' });
                res.end(data);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // Не знайдено: 404
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('404: Картинку не знайдено в кеші.');
                } else {
                    throw error; // Передаємо інші помилки (напр. права доступу)
                }
            }
        }
        // Обробка PUT (Запис в кеш)
        else if (req.method === 'PUT') {
            const body = await getBody(req);
            await writeFile(filePath, body);
            // Успіх: 201 (Created)
            res.writeHead(201, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('201: Створено (або оновлено) в кеші.');
        }
        // Обробка DELETE (Видалення з кешу)
        else if (req.method === 'DELETE') {
            try {
                await unlink(filePath);
                // Успіх: 200 (OK)
                res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                res.end('200: Видалено з кешу.');
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // Не знайдено: 404 (аналогічно до GET)
                    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end('404: Картинку не знайдено в кеші.');
                } else {
                    throw error;
                }
            }
        }
        // Інші методи
        else {
            // 405 (Method Not Allowed)
            res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('405: Method Not Allowed');
        }
    } catch (serverError) {
    // Загальна обробка помилок сервера (500)
    console.error(`[Error 500] ${serverError.message}`);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500: Internal Server Error');
  }
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[Error] Порт ${options.port} вже використовується.`);
  } else {
    console.error(`[Error] Помилка сервера: ${err.message}`);
  }
  process.exit(1);
});

server.listen(options.port, options.host, () => {
  console.log(`[Server] Сервер успішно запущено на http://${options.host}:${options.port}`);
});