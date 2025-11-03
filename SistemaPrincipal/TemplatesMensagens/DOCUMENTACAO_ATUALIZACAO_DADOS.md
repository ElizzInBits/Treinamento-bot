# Documentação: Atualização de Dados do Usuário

## Problema Identificado

Quando um usuário corrige seus dados (nome e email) durante o processo de emissão de certificado, o sistema estava gerando o certificado com os dados corrigidos, mas **não atualizava o banco de dados**. Isso causava inconsistência: o certificado tinha os dados novos, mas o sistema continuava com os dados antigos.

## Solução Implementada

Foi criado um utilitário centralizado que atualiza os dados do usuário no banco de dados **antes** de gerar o certificado.

### Arquivo Criado

**Localização**: `/SistemaPrincipal/TemplatesMensagens/utils/atualizarDadosUsuario.js`

```javascript
const { atualizarDadosUsuario } = require('../../utils/atualizarDadosUsuario');
```

### Função

```javascript
atualizarDadosUsuario(telefone, nome, email)
```

**Parâmetros**:
- `telefone` (string): Telefone do usuário (com ou sem @c.us, com ou sem código do país)
- `nome` (string): Novo nome completo do usuário
- `email` (string): Novo email do usuário

**Retorno**: 
- `Promise<boolean>`: true se atualizado com sucesso, false caso contrário

**Funcionalidade**:
- Busca o usuário no banco usando diferentes formatos de telefone
- Atualiza os campos `nome`, `nomeCompleto` e `email`
- Registra logs detalhados da operação

## Como Aplicar em Outros Treinamentos

### Passo 1: Importar o Utilitário

No início do arquivo do treinamento, adicione:

```javascript
const { atualizarDadosUsuario } = require('../../utils/atualizarDadosUsuario');
```

### Passo 2: Chamar Antes de Gerar Certificado

Quando o usuário fornecer dados corrigidos, **antes** de chamar a função de gerar certificado, chame:

```javascript
// Atualizar banco de dados antes de gerar certificado
await atualizarDadosUsuario(sender, nome, email);

// Agora gerar o certificado
await gerarEEnviarCertificado(nome, email, sender, sendMessage);
```

### Exemplo Completo

```javascript
async function processarConfirmacaoDados(sender, text, sendMessage) {
    const linhas = text.trim().split('\n').filter(linha => linha.trim());
    
    if (linhas.length >= 2) {
        const nome = linhas[0].trim();
        const email = linhas[1].trim();
        
        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            await sendMessage(sender, 'send-message', {
                message: '❌ E-mail inválido. Por favor, envie novamente.'
            });
            return true;
        }
        
        // ⭐ ATUALIZAR BANCO DE DADOS ANTES DE GERAR CERTIFICADO
        await atualizarDadosUsuario(sender, nome, email);
        
        // Agora gerar certificado com dados atualizados
        await gerarEEnviarCertificado(nome, email, sender, sendMessage);
    }
}
```

## Treinamentos que Precisam Dessa Correção

### ✅ Já Implementado
- [x] **Treinamento de Apresentação** (`treinamentoApresentacao.js`)

### ⚠️ Pendente de Implementação
- [ ] **Treinamento EPC/EPI** (`epc_epi.js`)
- [ ] **Treinamento SSMA** (`treinamentoSSMA.js`)
- [ ] **Outros treinamentos futuros**

## Fluxo Correto

### Antes (❌ Problema)
1. Usuário vê dados cadastrados
2. Usuário escolhe "2 - Corrigir"
3. Usuário envia novos dados
4. Sistema gera certificado com dados novos
5. ❌ **Banco continua com dados antigos**
6. Próxima vez que gerar certificado, volta a mostrar dados antigos

### Depois (✅ Solução)
1. Usuário vê dados cadastrados
2. Usuário escolhe "2 - Corrigir"
3. Usuário envia novos dados
4. ✅ **Sistema atualiza banco de dados**
5. Sistema gera certificado com dados novos
6. ✅ **Banco e certificado ficam sincronizados**
7. Próxima vez que gerar certificado, mostra dados corretos

## Logs de Depuração

A função gera logs detalhados para facilitar depuração:

```
✅ [ATUALIZAR_DADOS] Dados atualizados com sucesso:
   📞 Telefone: 553399595511
   👤 Nome: João Silva Santos
   📧 Email: joao@email.com
```

Ou em caso de erro:

```
⚠️ [ATUALIZAR_DADOS] Usuário não encontrado para telefone: 553399595511
```

## Benefícios

1. **Consistência**: Banco e certificados sempre sincronizados
2. **Reutilizável**: Função centralizada para todos os treinamentos
3. **Robusto**: Tenta múltiplos formatos de telefone
4. **Rastreável**: Logs detalhados de todas as operações
5. **Simples**: Apenas uma linha de código para usar

## Manutenção

Se precisar modificar a lógica de atualização de dados:
- Edite apenas o arquivo `/utils/atualizarDadosUsuario.js`
- Todos os treinamentos que usam a função serão atualizados automaticamente

## Testes Recomendados

Após implementar em um treinamento, teste:

1. ✅ Usuário confirma dados corretos (opção 1)
2. ✅ Usuário corrige dados (opção 2)
3. ✅ Certificado gerado com dados corretos
4. ✅ Próximo certificado mostra dados atualizados
5. ✅ Página de assinatura mostra dados atualizados
