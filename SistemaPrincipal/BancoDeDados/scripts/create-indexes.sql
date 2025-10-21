-- Índices otimizados para performance

-- Usuários - consultas frequentes por telefone
CREATE INDEX idx_usuarios_telefone ON usuarios(telefone);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_status_treinamento ON usuarios(statusTreinamento);
CREATE INDEX idx_usuarios_empresa_id ON usuarios(empresaId);

-- Interações - consultas por telefone e data
CREATE INDEX idx_interacoes_telefone ON interacoes(telefone);
CREATE INDEX idx_interacoes_created_at ON interacoes(createdAt);
CREATE INDEX idx_interacoes_telefone_created ON interacoes(telefone, createdAt);
CREATE INDEX idx_interacoes_tipo ON interacoes(tipo);

-- Empresas - consultas por nome e status
CREATE INDEX idx_empresas_nome ON empresas(nome);
CREATE INDEX idx_empresas_ativa ON empresas(ativa);

-- Treinamentos - consultas por status
CREATE INDEX idx_treinamentos_ativo ON treinamentos(ativo);

-- Sessões de treinamento
CREATE INDEX idx_sessoes_usuario_id ON sessoestreinamento(usuarioId);
CREATE INDEX idx_sessoes_treinamento_id ON sessoestreinamento(treinamentoId);
CREATE INDEX idx_sessoes_status ON sessoestreinamento(status);
CREATE INDEX idx_sessoes_created_at ON sessoestreinamento(createdAt);

-- Assinaturas de certificado
CREATE INDEX idx_assinaturas_token ON assinaturascertificado(token);
CREATE INDEX idx_assinaturas_usuario_id ON assinaturascertificado(usuarioId);
CREATE INDEX idx_assinaturas_expires_at ON assinaturascertificado(expiresAt);

-- Links curtos
CREATE INDEX idx_links_codigo ON links_curtos(codigo);
CREATE INDEX idx_links_expires_at ON links_curtos(expiresAt);

-- Índices compostos para consultas complexas
CREATE INDEX idx_usuarios_empresa_status ON usuarios(empresaId, statusTreinamento);
CREATE INDEX idx_interacoes_telefone_tipo_data ON interacoes(telefone, tipo, createdAt);

-- Otimização para consultas de relatórios
CREATE INDEX idx_usuarios_created_empresa ON usuarios(createdAt, empresaId);
CREATE INDEX idx_sessoes_status_data ON sessoestreinamento(status, createdAt);