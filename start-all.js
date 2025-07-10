const { spawn } = require('child_process');

function run(name, command, args, cwd) {
  const proc = spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'inherit',
  });
  proc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`${name} exited with code ${code}`);
      process.exit(code);
    }
  });
  return proc;
}

const proc1 = run('SistemaPrincipal', 'npm', ['start'], 'SistemaPrincipal');
const proc2 = run('wppconnect-server', 'npm', ['run', 'dev'], 'wppconnect-server');

process.on('SIGINT', () => {
  proc1.kill('SIGINT');
  proc2.kill('SIGINT');
  process.exit();
});
