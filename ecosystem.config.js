module.exports = {
  apps: [
    {
      name: "BOT",
      cwd: "./SistemaPrincipal/TemplatesMensagens/conexao",
      script: "wppConnectTemplate.js",
      interpreter: "node"
    },
    {
      name: "front-end",
      cwd: "./SistemaPrincipal/front-end",
      script: "server-front.js",
      interpreter: "node"
    }
  ]
}
