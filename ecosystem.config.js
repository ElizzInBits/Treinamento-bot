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
      name: "front-end",
      cwd: "./SistemaPrincipal/front-end",
      script: "server-front.js",
      interpreter: "node"
    },
    {
      name: "template-mensagens",
      cwd: "./SistemaPrincipal/TemplatesMensagens",
      script: "Template.js",
      interpreter: "node"
    }
  ]
}
