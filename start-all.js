const { spawn } = require('child_process');

function run(name, command, args, cwd) {
  const proc = spawn(command, args, { cwd, stdio: 'inherit', shell: true });
  proc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`${name} saiu com código ${code}`);
      process.exit(code);
    }
  });
  return proc;
}

const proc1 = run('sistema1', 'npm', ['start'], './SistemaPrincipal');
const proc2 = run('sistema2', 'npm', ['run', 'dev'], './wppconnect-server');

process.on('SIGINT', () => {
  proc1.kill('SIGINT');
  proc2.kill('SIGINT');
  process.exit();
});
