-- Limpar dados existentes (opcional)
DELETE FROM agendamentos;
DELETE FROM imoveis;
DELETE FROM usuarios;

-- Resetar AUTO_INCREMENT (se necessário)
-- ALTER TABLE agendamentos AUTO_INCREMENT = 1;
-- ALTER TABLE imoveis AUTO_INCREMENT = 1;
-- ALTER TABLE usuarios AUTO_INCREMENT = 1;

-- Inserir Usuários (Proprietários e Corretores)
INSERT INTO usuarios (id, nome, email, password_hash, role) VALUES
(UUID(), 'Paulo Kapitia', 'paulo@maisonhuambo.ao', '$2b$10$exemplo.hash.paulo', 'proprietario'),
(UUID(), 'Flora Francisco', 'flora@maisonhuambo.ao', '$2b$10$exemplo.hash.flora', 'corretor'),
(UUID(), 'Ernesto Tchiokola', 'ernesto@maisonhuambo.ao', '$2b$10$exemplo.hash.ernesto', 'corretor'),
(UUID(), 'Victor Luemba', 'victor@maisonhuambo.ao', '$2b$10$exemplo.hash.victor', 'corretor'),
(UUID(), 'Admin Principal', 'admin@maisonhuambo.ao', '$2b$10$exemplo.hash.admin', 'admin');

-- Inserir Imóveis
INSERT INTO imoveis (id, titulo, descricao, preco, quartos, localizacao, imagem_url, status, corretor_id) VALUES
(UUID(), 'Vivenda T4 de Luxo', 'Magnífica vivenda com acabamentos modernos, quintal amplo, garagem para 2 carros e suíte master.', 850000.00, 4, 'Cidade Alta', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80', 'Disponível', (SELECT id FROM usuarios WHERE nome = 'Paulo Kapitia' LIMIT 1)),
(UUID(), 'Apartamento T2 Central', 'Apartamento recém-remodelado no centro do Huambo. Cozinha equipada, varanda com vista para a cidade.', 250000.00, 2, 'Centro', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80', 'Disponível', (SELECT id FROM usuarios WHERE nome = 'Flora Francisco' LIMIT 1)),
(UUID(), 'Terreno Bem Localizado', 'Lote de terreno murado com 20x30m, localizado em zona de expansão pacífica.', 120000.00, 0, 'Benfica', 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80', 'Disponível', (SELECT id FROM usuarios WHERE nome = 'Ernesto Tchiokola' LIMIT 1)),
(UUID(), 'Vivenda T3 Aconchegante', 'Vivenda rústica mas conservada, com anexo e tanque de água de 10.000L.', 450000.00, 3, 'São João', 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80', 'Disponível', (SELECT id FROM usuarios WHERE nome = 'Victor Luemba' LIMIT 1)),
(UUID(), 'Apartamento T3 Moderno', 'Espaçoso T3 no 2º andar, condomínio fechado com piscina e área de lazer.', 550000.00, 3, 'Cidade Alta', 'https://images.unsplash.com/photo-1502672260266-1c1e5250ad99?auto=format&fit=crop&w=800&q=80', 'Vendido', (SELECT id FROM usuarios WHERE nome = 'Paulo Kapitia' LIMIT 1)),
(UUID(), 'Vivenda T5 Espaçosa', 'Propriedade de alto padrão com dois pisos, jardim de inverno, churrasqueira.', 120000000.00, 5, 'Centro', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80', 'Disponível', (SELECT id FROM usuarios WHERE nome = 'Paulo Kapitia' LIMIT 1));

-- Inserir Agendamentos
INSERT INTO agendamentos (id, cliente_nome, cliente_email, cliente_telefone, data_visita, status, imovel_id) VALUES
(UUID(), 'João Silva', 'joao@email.com', '923 456 789', '2026-04-10 10:00:00', 'Pendente', (SELECT id FROM imoveis WHERE titulo = 'Vivenda T4 de Luxo' LIMIT 1)),
(UUID(), 'Maria Costa', 'maria@email.com', '912 345 678', '2026-04-12 14:30:00', 'Pendente', (SELECT id FROM imoveis WHERE titulo = 'Apartamento T2 Central' LIMIT 1)),
(UUID(), 'Carlos Pinto', 'carlos@email.com', '999 123 456', '2026-04-05 09:00:00', 'Confirmado', (SELECT id FROM imoveis WHERE titulo = 'Apartamento T3 Moderno' LIMIT 1));

-- Verificar dados inseridos
SELECT 'Usuários:' AS Tabela;
SELECT nome, email, role FROM usuarios;

SELECT 'Imóveis:' AS Tabela;
SELECT titulo, preco, localizacao, status FROM imoveis;

SELECT 'Agendamentos:' AS Tabela;
SELECT cliente_nome, data_visita, status FROM agendamentos;
