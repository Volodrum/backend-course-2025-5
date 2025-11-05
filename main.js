const { program } = require('commander');


program
  .version('1.0.0')
  .description('Простий CLI-додаток для демонстрації commander.js');

  
// Додаємо опцію -m або --message, яка приймає рядок (<type>)
program
  .option('-m, --message <type>', 'Повідомлення для виводу в консоль');

// Розпарсимо аргументи, передані при запуску
program.parse(process.argv);

// Отримуємо значення опцій
const options = program.opts();

// Використовуємо аргумент
if (options.message) {
  console.log(`Ваше повідомлення: ${options.message}`);
} else {
  console.log('Повідомлення не вказано. Спробуйте --help для довідки.');
}