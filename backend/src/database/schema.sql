DROP DATABASE IF EXISTS maison_huambo;
CREATE DATABASE maison_huambo;
USE maison_huambo;

CREATE TABLE usuarios (
  id VARCHAR(36) PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'corretor',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE imoveis (
  id VARCHAR(36) PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  preco DECIMAL(10,2) NOT NULL,
  quartos INT,
  localizacao VARCHAR(200),
  imagem_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'disponivel',
  corretor_id VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (corretor_id) REFERENCES usuarios(id)
);

CREATE TABLE agendamentos (
  id VARCHAR(36) PRIMARY KEY,
  cliente_nome VARCHAR(100) NOT NULL,
  cliente_email VARCHAR(100),
  cliente_telefone VARCHAR(20),
  data_visita DATETIME NOT NULL,
  status VARCHAR(20) DEFAULT 'pendente',
  imovel_id VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (imovel_id) REFERENCES imoveis(id)
);
