# Maison Huambo — Plataforma de Gestão Imobiliária

## Requisitos

- **Node.js** 18+ ([nodejs.org](https://nodejs.org))
- **XAMPP** com MySQL ativo ([apachefriends.org](https://www.apachefriends.org))

## Setup rápido (para apresentação na sala)

```bash
# 1. Copiar a pasta para o computador da escola (pendrive)
# 2. Iniciar o MySQL no XAMPP
# 3. Instalar dependências
npm install

# 4. Iniciar o servidor (cria DB, tabelas e dados automaticamente)
npm run dev
```

O servidor cria automaticamente a base de dados `maison_huambo`, as tabelas e insere dados de demonstração.

Abra o browser em: **http://localhost:3000/login.html**

## Credenciais de teste

| Papel       | Email                          | Senha   |
|-------------|--------------------------------|---------|
| Admin       | admin@maisonhuambo.ao          | admin123|
| Proprietário| paulo@maisonhuambo.ao          | 123456  |
| Corretor    | flora@maisonhuambo.ao          | 123456  |

## Estrutura do projeto

```
maison-huambo/
├── backend/           # API Express + JWT + MySQL
│   ├── src/
│   │   ├── config/    # Conexão MySQL + init automático
│   │   ├── controllers/
│   │   ├── database/  # schema.sql + seed.sql
│   │   ├── middlewares/
│   │   ├── models/
│   │   └── routes/
│   ├── server.js
│   └── package.json
├── frontend/          # HTML + JS + Tailwind CDN
│   ├── index.html
│   ├── login.html
│   ├── admin.html
│   ├── proprietario.html
│   └── corretor.html
└── package.json       # Script raiz para npm install/dev
```
