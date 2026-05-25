// ================================================================
// MÓDULO: API - Interface de Comunicação com o Backend
// ================================================================
// Descrição: Este objeto centraliza todas as chamadas ao servidor
// backend da Maison Huambo. Ele lida com autenticação (JWT),
// requisições HTTP (GET, POST, PUT, PATCH, DELETE), upload de
// imagens e gestão de sessão do utilizador.
//
// Como usar: importar via <script src="js/api.js"></script>
// e chamar API.metodo(). Ex: API.login(email, senha)
// ================================================================

const API = {

  // =============================================================
  // URL base do servidor backend
  // Todas as requisições serão feitas para /api/...
  // O servidor backend (Express) está configurado para responder
  // neste prefixo.
  base: '/api',

  // =============================================================
  // getToken()
  // Descrição: Recupera o token JWT armazenado no navegador.
  // Retorno: String com o token ou null se não existir.
  // -------------------------------------------
  // O token JWT é um "cartão de identificação" que o servidor
  // nos dá após o login. Ele é guardado no localStorage (uma
  // espécie de baú de dados do navegador que persiste mesmo
  // após fechar a página). Todas as próximas requisições
  // devem enviar este token para provar quem somos.
  getToken() {
    return localStorage.getItem('token')
  },

  // =============================================================
  // getUser()
  // Descrição: Recupera os dados do utilizador logado.
  // Retorno: Objeto com { id, nome, email, role } ou null.
  // -------------------------------------------
  // O utilizador foi guardado como string JSON no localStorage.
  // Precisamos fazer JSON.parse() para transformar essa string
  // de volta num objeto JavaScript que podemos usar.
  getUser() {
    try {
      return JSON.parse(localStorage.getItem('user'))
    } catch {
      return null
    }
  },

  // =============================================================
  // setAuth(token, user)
  // Descrição: Guarda o token e os dados do utilizador no navegador.
  // Parâmetros: token (string JWT), user (objeto com dados)
  // -------------------------------------------
  // Chamada após login ou registo bem-sucedido. Armazenamos
  // estas informações para que, mesmo que o utilizador recarregue
  // a página, continue autenticado.
  setAuth(token, user) {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  },

  // =============================================================
  // logout()
  // Descrição: Remove os dados de autenticação e redireciona
  // para a página de login.
  // -------------------------------------------
  // Limpa o localStorage (como se estivéssemos a deitar fora
  // o cartão de identificação) e leva o utilizador de volta
  // ao ecrã de login.
  logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = 'login.html'
  },

  // =============================================================
  // headers(includeAuth)
  // Descrição: Prepara os cabeçalhos HTTP para as requisições.
  // Parâmetros: includeAuth (boolean) - se deve incluir o token
  // Retorno: Objeto com Content-Type e opcionalmente Authorization
  // -------------------------------------------
  // Todas as requisições para o backend enviam JSON, por isso
  // definimos 'Content-Type: application/json'. Se o utilizador
  // estiver logado, adicionamos o header 'Authorization: Bearer <token>'
  // que é a forma padrão de enviar tokens JWT.
  headers(includeAuth = true) {
    const h = { 'Content-Type': 'application/json' }
    if (includeAuth) {
      const token = this.getToken()
      if (token) h['Authorization'] = 'Bearer ' + token
    }
    return h
  },

  // =============================================================
  // request(method, path, body, auth)
  // Descrição: Função genérica que faz qualquer requisição HTTP.
  // Parâmetros:
  //   method - String: 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'
  //   path   - String: caminho relativo (ex: '/properties')
  //   body   - Object ou null: dados a enviar no corpo
  //   auth   - Boolean: se deve incluir token de autenticação
  // Retorno: Objeto JSON com a resposta do servidor
  // -------------------------------------------
  // Este é o motor principal do módulo. As outras funções (get,
  // post, etc.) são atalhos que chamam esta função.
  //
  // Funcionamento:
  // 1. Monta as opções da requisição (método, cabeçalhos)
  // 2. Se houver body, converte para JSON
  // 3. Usa fetch() para enviar ao servidor
  // 4. Converte a resposta para JSON
  // 5. Se o servidor devolveu erro (status 4xx ou 5xx), lança exceção
  // 6. Devolve os dados recebidos
  async request(method, path, body = null, auth = true) {
    const opts = { method, headers: this.headers(auth) }
    if (body) opts.body = JSON.stringify(body)
    const res = await fetch(this.base + path, opts)
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro de conexão')
    return data
  },

  // =============================================================
  // Métodos de atalho (Conveniência)
  // -------------------------------------------
  // Estes métodos simplificam as chamadas. Em vez de escrever
  // API.request('GET', '/properties'), podemos escrever
  // API.get('/properties'). Cada um define o método HTTP e
  // passa os parâmetros para request().
  //
  // get   → Ler dados
  // post  → Criar novos dados
  // put   → Substituir dados existentes
  // patch → Atualizar parcialmente
  // del   → Apagar dados
  get(path, auth = true) { return this.request('GET', path, null, auth) },
  post(path, body, auth = true) { return this.request('POST', path, body, auth) },
  put(path, body, auth = true) { return this.request('PUT', path, body, auth) },
  patch(path, body, auth = true) { return this.request('PATCH', path, body, auth) },
  del(path, auth = true) { return this.request('DELETE', path, null, auth) },

  // =============================================================
  // login(email, password)
  // Descrição: Autentica o utilizador no sistema.
  // Parâmetros: email (string), password (string)
  // Retorno: Objeto com { token, user }
  // -------------------------------------------
  // 1. Envia email e senha para /api/auth/login (sem auth,
  //    pois ainda não temos token)
  // 2. O servidor verifica as credenciais e devolve um token JWT
  // 3. Guardamos token e dados do utilizador localmente
  // 4. Devolvemos os dados (a página que chamou decide para
  //    onde redirecionar baseado no role)
  async login(email, password) {
    const data = await this.post('/auth/login', { email, password }, false)
    this.setAuth(data.token, data.user)
    return data
  },

  // =============================================================
  // register(nome, email, password, role, telefone)
  // Descrição: Regista um novo utilizador na plataforma.
  // Parâmetros: nome, email, password, role, telefone
  // Retorno: Dados do utilizador criado
  // -------------------------------------------
  // Envia os dados para /api/auth/register. Note que auth=false
  // porque o utilizador ainda não está logado (está a criar
  // a conta). O servidor valida se o email já existe e cria
  // o novo registo.
  async register(nome, email, password, role, telefone) {
    return await this.post('/auth/register', { nome, email, password, role, telefone }, false)
  },

  // =============================================================
  // fetchProperties()
  // Descrição: Obtém a lista de imóveis do servidor.
  // Retorno: Array de objetos (imóveis)
  // -------------------------------------------
  // Se o utilizador estiver logado (tem token), envia o token
  // para que o servidor filtre apenas os imóveis do utilizador.
  // Se não estiver logado (página pública), busca todos os imóveis
  // disponíveis.
  async fetchProperties() {
    const data = await this.get('/properties', !!this.getToken())
    return data.properties
  },

  // =============================================================
  // createProperty(property)
  // Descrição: Cria um novo imóvel no sistema.
  // Parâmetros: property (objeto com dados do imóvel)
  async createProperty(property) {
    return await this.post('/properties', property)
  },

  // =============================================================
  // updateProperty(id, property)
  // Descrição: Atualiza os dados de um imóvel existente.
  // Parâmetros: id (string), property (objeto com dados novos)
  async updateProperty(id, property) {
    return await this.put('/properties/' + id, property)
  },

  // =============================================================
  // deleteProperty(id)
  // Descrição: Remove um imóvel do sistema.
  async deleteProperty(id) {
    return await this.del('/properties/' + id)
  },

  // =============================================================
  // fetchAppointments()
  // Descrição: Obtém a lista de agendamentos/visitas.
  // Retorno: Array de objetos (agendamentos)
  async fetchAppointments() {
    const data = await this.get('/appointments')
    return data.appointments
  },

  // =============================================================
  // createAppointment(data)
  // Descrição: Cria um novo pedido de visita.
  // Parâmetros: data com cliente_nome, cliente_telefone,
  //             data_visita, imovel_id
  // -------------------------------------------
  // auth=false porque qualquer pessoa (mesmo sem login) pode
  // solicitar uma visita a um imóvel.
  async createAppointment(data) {
    return await this.post('/appointments', data, false)
  },

  // =============================================================
  // updateAppointmentStatus(id, status)
  // Descrição: Atualiza o estado de um agendamento.
  // Parâmetros: id, status ('pendente', 'confirmado', 'cancelado')
  // -------------------------------------------
  // Usa PATCH (atualização parcial) em vez de PUT (substituição
  // completa) porque só estamos a mudar o status.
  async updateAppointmentStatus(id, status) {
    return await this.patch('/appointments/' + id + '/status', { status })
  },

  // =============================================================
  // deleteAppointment(id)
  // Descrição: Remove um agendamento.
  async deleteAppointment(id) {
    return await this.del('/appointments/' + id)
  },

  // =============================================================
  // fetchUsers()
  // Descrição: Obtém a lista de utilizadores (apenas admin).
  async fetchUsers() {
    const data = await this.get('/users')
    return data.users
  },

  // =============================================================
  // updateUser(id, data)
  // Descrição: Atualiza dados de um utilizador.
  async updateUser(id, data) {
    return await this.put('/users/' + id, data)
  },

  // =============================================================
  // uploadImages(files)
  // Descrição: Envia imagens para o servidor.
  // Parâmetros: files (FileList ou Array de File objects)
  // Retorno: Array de URLs das imagens hospedadas
  // -------------------------------------------
  // Diferente das outras funções, esta NÃO envia JSON.
  // Em vez disso, usa FormData (formulário multipart) que é
  // o formato padrão para enviar ficheiros binários.
  //
  // Passo a passo:
  // 1. Cria um FormData e anexa cada ficheiro com o nome 'images'
  // 2. Faz fetch para /api/upload com método POST
  // 3. Envia o token JWT no header (se existir)
  // 4. O servidor processa e guarda as imagens
  // 5. Devolve os URLs das imagens hospedadas
  //
  // Nota: Não definimos Content-Type aqui porque o fetch
  // define automaticamente 'multipart/form-data' com a boundary
  // correta quando o corpo é FormData.
  async uploadImages(files) {
    const formData = new FormData()
    for (const f of files) formData.append('images', f)
    const token = this.getToken()
    const res = await fetch(this.base + '/upload', {
      method: 'POST',
      headers: token ? { 'Authorization': 'Bearer ' + token } : {},
      body: formData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erro ao enviar imagens')
    return data.urls
  }
}
