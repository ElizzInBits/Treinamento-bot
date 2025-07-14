const { spawn } = require('child_process');
const fs = require('fs');

function run(name, command, args, cwd) {
  if (!fs.existsSync(cwd)) {
    console.error(`❌ Diretório não encontrado: ${cwd}`);
    process.exit(1);
  }

  const proc = spawn(command, args, {
    cwd,
    stdio: 'inherit',
  });

  proc.on('error', (err) => {
    console.error(`❌ ${name} falhou ao iniciar:`, err);
    process.exit(1);
  });

  proc.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ ${name} saiu com código ${code}`);
      process.exit(code);
    }
  });

  return proc;
}

// 👇 Corrigido o caminho:
const proc1 = run('SistemaCadastro', 'npm', ['start'], 'SistemaPrincipal/front-end-cadastro');
const proc2 = run('wppconnect-server', 'npm', ['run', 'dev'], 'wppconnect-server');

process.on('SIGINT', () => {
  proc1.kill('SIGINT');
  proc2.kill('SIGINT');
  process.exit();
});
