-- Script SQL para otimizar banco de dados
-- Execute este script no MySQL do seu servidor

USE listadecontatos;

-- Verificar índices existentes
SHOW INDEX FROM contatos;

-- Criar índices otimizados (se não existirem)
CREATE INDEX IF NOT EXISTS idx_contatos_telefone ON contatos (telefone);
CREATE INDEX IF NOT EXISTS idx_contatos_status ON contatos (statusTreinamento);
CREATE INDEX IF NOT EXISTS idx_contatos_telefone_status ON contatos (telefone, statusTreinamento);
CREATE INDEX IF NOT EXISTS idx_contatos_empresa ON contatos (empresaId);

-- Otimizar tabela interações
CREATE INDEX IF NOT EXISTS idx_interacoes_telefone_data ON interacoes (telefone, createdAt DESC);

-- Otimizar tabelas
OPTIMIZE TABLE contatos;
OPTIMIZE TABLE interacoes;

-- Verificar estatísticas
SELECT 
    COUNT(*) as total_contatos,
    COUNT(DISTINCT telefone) as telefones_unicos,
    COUNT(CASE WHEN statusTreinamento = 'em andamento' THEN 1 END) as em_andamento,
    COUNT(CASE WHEN statusTreinamento = 'não iniciado' THEN 1 END) as nao_iniciado,
    COUNT(CASE WHEN statusTreinamento = 'concluído' THEN 1 END) as concluido
FROM contatos;

-- Mostrar índices criados
SHOW INDEX FROM contatos WHERE Key_name LIKE 'idx_%';

SELECT 'Otimização concluída!' as status;