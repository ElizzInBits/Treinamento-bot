const { spawn } = require('child_process');

function runServer(path, name) {
  const proc = spawn('npm', ['run dev'], {
    cwd: path,  // diretório onde o comando será executado
    shell: true, // necessário no Windows pra rodar o npm
    stdio: 'inherit' // para mostrar a saída no terminal
  });

  proc.on('close', (code) => {
    console.log(`${name} finalizou com código ${code}`);
  });
}

// Caminhos dos servidores
const backendPath = 'C:\\Treinamento-bot\\wppconnect-server';
const frontendPath = 'C:\\Treinamento-bot\\wppconnect-server\\SistemaPrincipal\\front-end-cadastro';

// Rodar os dois servidores ao mesmo tempo
runServer(backendPath, 'Servidor Backend');
runServer(frontendPath, 'Servidor Frontend');
