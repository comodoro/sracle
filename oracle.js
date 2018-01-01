var repl = require('repl');
var sracle = (new require('./Sracle'));


function command(input) {
  //readline.cursorTo(process.stdout, 0);
  ui.log.write(`Received: ${input}`);
  // rl.prompt(true);
}


function tick() {
  ui.log.write('tick');
}

inquirer.prompt({
  message: '> ',
  name: 'command'
}).then(answer => {
  command(answer);
});
// rl.question('Enter something...:', userInput => {
//   command('You typed ' + userInput);
//   rl.close();
// });

// rl.on('line', (input) => {
//   command(input);
// });

setInterval(tick, 1000);
// sracle.deploy()
// .then(function(result, error){
//   return result.setUp();
// })
// .then(function(result, error){
  
// });
