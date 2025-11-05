const http = require('http');
const fs = require('fs');
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
  // { recursive: true } дозволяє створювати вкладені директорії
  // і не видає помилку, якщо директорія вже існує
  fs.mkdirSync(cachePath, { recursive: true });
  console.log(`[Cache] Директорія кешу готова: ${cachePath}`);
} catch (error) {
  console.error(`[Error] Не вдалося створити директорію кешу: ${error.message}`);
  process.exit(1); // Вихід з процесу, якщо кеш створити неможливо
}

// Запуск веб-сервера
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end(`Сервер запущено на ${options.host}:${options.port}\n`);
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