module.exports = {
  apps: [
    {
      name: "wppconnect-server",
      cwd: "./Treinamento-bot/wppconnect-server",
      script: "npm",
      args: "run dev",
      interpreter: "none"
    },
    {
      name: "front-end-cadastro",
      cwd: "./Treinamento-bot/SistemaPrincipal/front-end-cadastro",
      script: "npm",
      args: "start",
      interpreter: "none"
    },
    {
      name: "template-mensagens",
      cwd: "./Treinamento-bot/SistemaPrincipal/TemplatesMensagens",
      script: "Template.js",
      interpreter: "node"
    }
  ]
}
