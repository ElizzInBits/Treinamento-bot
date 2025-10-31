# 📋 Documentação: Campos Cargo e Setor

## 📌 Visão Geral

Os campos **cargo** e **setor** foram adicionados à tabela `usuarios` para permitir melhor organização e segmentação dos funcionários cadastrados no sistema de treinamentos.

---

## 🗄️ Estrutura no Banco de Dados

### Tabela: `usuarios`

```sql
cargo VARCHAR(100) NULL COMMENT 'Cargo do funcionário'
setor VARCHAR(100) NULL COMMENT 'Setor do funcionário'
```

**Características:**
- ✅ Campos opcionais (podem ser NULL)
- ✅ Máximo de 100 caracteres cada
- ✅ Tipo VARCHAR para texto livre
- ✅ Indexáveis para consultas rápidas

---

## 💻 Implementação no Código

### 1. Modelo Sequelize (`usuario.js`)

```javascript
cargo: {
  type: DataTypes.STRING(100),
  allowNull: true,
  comment: 'Cargo do funcionário'
},
setor: {
  type: DataTypes.STRING(100),
  allowNull: true,
  comment: 'Setor do funcionário'
}
```

### 2. Formulário HTML (`cadastro-index.html`)

```html
<!-- Campo Cargo -->
<div class="form-group">
  <label for="cargo">💼 Cargo</label>
  <input
    type="text"
    id="cargo"
    name="cargo"
    placeholder="Ex: Operador de Máquinas"
  />
</div>

<!-- Campo Setor -->
<div class="form-group">
  <label for="setor">🏭 Setor</label>
  <input
    type="text"
    id="setor"
    name="setor"
    placeholder="Ex: Produção"
  />
</div>
```

### 3. JavaScript Frontend (`cadastro-script.js`)

```javascript
// Captura dos valores
const cargo = document.getElementById('cargo').value.trim();
const setor = document.getElementById('setor').value.trim();

// Envio para API
const novoUsuario = {
  nome: nomeCompleto,
  cpf: cpf.replace(/\D/g, ''),
  email: email,
  telefone: telefoneCompleto,
  cargo: cargo || null,  // Envia null se vazio
  setor: setor || null,  // Envia null se vazio
  empresaId: parseInt(empresaId)
};
```

### 4. API Backend (`contatos.js`)

#### POST - Criar Usuário
```javascript
const { nome, telefone, cpf, empresaId, email, cargo, setor } = req.body;

const novoContato = await Usuario.create({
  nome: nome.trim(),
  telefone: telefoneLimpo,
  cpf: cpfLimpo,
  empresaId: empresaId ? parseInt(empresaId, 10) : 1,
  email: email.trim(),
  cargo: cargo ? cargo.trim() : null,  // Salva null se não fornecido
  setor: setor ? setor.trim() : null,  // Salva null se não fornecido
  statusTreinamento: 'não iniciado'
});
```

#### PUT - Atualizar Usuário
```javascript
const { cargo, setor } = req.body;

if (cargo !== undefined) {
  camposParaAtualizar.cargo = cargo ? cargo.trim() : null;
}
if (setor !== undefined) {
  camposParaAtualizar.setor = setor ? setor.trim() : null;
}

await contato.update(camposParaAtualizar);
```

---

## 🎯 Casos de Uso

### 1. Segmentação de Treinamentos
```javascript
// Buscar todos os operadores de máquinas
const operadores = await Usuario.findAll({
  where: { cargo: 'Operador de Máquinas' }
});

// Buscar todos do setor de produção
const producao = await Usuario.findAll({
  where: { setor: 'Produção' }
});
```

### 2. Relatórios por Cargo/Setor
```javascript
// Contar funcionários por cargo
const porCargo = await Usuario.findAll({
  attributes: [
    'cargo',
    [sequelize.fn('COUNT', sequelize.col('id')), 'total']
  ],
  group: ['cargo']
});

// Contar funcionários por setor
const porSetor = await Usuario.findAll({
  attributes: [
    'setor',
    [sequelize.fn('COUNT', sequelize.col('id')), 'total']
  ],
  group: ['setor']
});
```

### 3. Filtros Avançados
```javascript
// Buscar por cargo E setor
const usuarios = await Usuario.findAll({
  where: {
    cargo: 'Supervisor',
    setor: 'Manutenção'
  }
});

// Buscar múltiplos cargos
const { Op } = require('sequelize');
const usuarios = await Usuario.findAll({
  where: {
    cargo: {
      [Op.in]: ['Operador', 'Técnico', 'Supervisor']
    }
  }
});
```

---

## 📊 Exemplos de Dados

### Cargos Comuns
- Operador de Máquinas
- Técnico de Segurança
- Supervisor de Produção
- Auxiliar de Produção
- Gerente de Operações
- Analista de Qualidade
- Mecânico Industrial
- Eletricista

### Setores Comuns
- Produção
- Manutenção
- Qualidade
- Logística
- Administrativo
- Segurança do Trabalho
- Recursos Humanos
- Tecnologia

---

## 🔍 Consultas SQL Úteis

### Listar todos os cargos únicos
```sql
SELECT DISTINCT cargo 
FROM usuarios 
WHERE cargo IS NOT NULL 
ORDER BY cargo;
```

### Listar todos os setores únicos
```sql
SELECT DISTINCT setor 
FROM usuarios 
WHERE setor IS NOT NULL 
ORDER BY setor;
```

### Contar funcionários por cargo
```sql
SELECT cargo, COUNT(*) as total 
FROM usuarios 
WHERE cargo IS NOT NULL 
GROUP BY cargo 
ORDER BY total DESC;
```

### Contar funcionários por setor
```sql
SELECT setor, COUNT(*) as total 
FROM usuarios 
WHERE setor IS NOT NULL 
GROUP BY setor 
ORDER BY total DESC;
```

### Buscar funcionários sem cargo/setor definido
```sql
SELECT id, nome, email 
FROM usuarios 
WHERE cargo IS NULL OR setor IS NULL;
```

---

## ✅ Validações

### Frontend
- ✅ Campos opcionais (não obrigatórios)
- ✅ Máximo 100 caracteres
- ✅ Aceita texto livre
- ✅ Trim automático (remove espaços)

### Backend
- ✅ Validação de tamanho (máx 100 chars)
- ✅ Conversão para NULL se vazio
- ✅ Trim automático
- ✅ Sanitização de entrada

---

## 🚀 Benefícios

1. **Organização**: Melhor categorização dos funcionários
2. **Segmentação**: Treinamentos específicos por cargo/setor
3. **Relatórios**: Análises detalhadas por área
4. **Compliance**: Rastreabilidade de treinamentos por função
5. **Gestão**: Identificação rápida de gaps de treinamento

---

## 📝 Notas Importantes

- Os campos são **opcionais** - não quebram cadastros antigos
- Valores NULL são aceitos e tratados corretamente
- Não há lista pré-definida - aceita texto livre
- Recomenda-se padronização dos valores para facilitar consultas
- Campos podem ser atualizados a qualquer momento

---

## 🔄 Migração de Dados Antigos

Usuários cadastrados antes da implementação terão `cargo` e `setor` como NULL. Para atualizar:

```sql
-- Atualizar cargo de um usuário específico
UPDATE usuarios 
SET cargo = 'Operador de Máquinas' 
WHERE id = 123;

-- Atualizar setor de múltiplos usuários
UPDATE usuarios 
SET setor = 'Produção' 
WHERE empresaId = 3;
```

---

## 📞 Suporte

Para dúvidas ou sugestões sobre os campos cargo e setor, consulte a equipe de desenvolvimento.

**Última atualização:** 31/10/2025
**Versão:** 1.0
