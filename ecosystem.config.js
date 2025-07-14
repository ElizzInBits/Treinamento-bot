module.exports = {
  apps: [
    {
      name: "wppconnect-server",
      cwd: "./wppconnect-server",
      script: "npm",
      args: "run dev",
      interpreter: "none"
    },
    {
      name: "front-end-cadastro",
      cwd: ".SistemaPrincipal/front-end-cadastro",
      script: "npm",
      args: "start",
      interpreter: "none"
    },
    {
      name: "template-mensagens",
      cwd: "./SistemaPrincipal/TemplatesMensagens",
      script: "Template.js",
      interpreter: "node"
    }
  ]
}
