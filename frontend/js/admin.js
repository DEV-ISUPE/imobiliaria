const API_URL = 'http://localhost:3000/api'

const form = document.getElementById('property-form')

form.addEventListener('submit', async (e) => {
  e.preventDefault()
  
  const property = {
    title: document.getElementById('title').value,
    price: document.getElementById('price').value,
    description: document.getElementById('description').value
  }
  
  try {
    const response = await fetch(`${API_URL}/properties`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(property)
    })
    
    if (response.ok) {
      alert('Imóvel cadastrado com sucesso!')
      form.reset()
      loadProperties()
    }
  } catch (error) {
    console.error('Erro ao cadastrar:', error)
  }
})

async function loadProperties() {
  try {
    const response = await fetch(`${API_URL}/properties`)
    const data = await response.json()
    
    const container = document.getElementById('properties-admin')
    container.innerHTML = ''
    
    if (data.properties) {
      data.properties.forEach(property => {
        const card = document.createElement('div')
        card.className = 'property-card'
        card.innerHTML = `
          <h4>${property.title}</h4>
          <p>${property.description}</p>
          <strong>R$ ${property.price}</strong>
          <button class="delete-btn" onclick="deleteProperty(${property.id})">Excluir</button>
        `
        container.appendChild(card)
      })
    }
  } catch (error) {
    console.error('Erro ao carregar:', error)
  }
}

async function deleteProperty(id) {
  if (!confirm('Deseja excluir este imóvel?')) return
  
  try {
    await fetch(`${API_URL}/properties/${id}`, { method: 'DELETE' })
    loadProperties()
  } catch (error) {
    console.error('Erro ao excluir:', error)
  }
}

document.addEventListener('DOMContentLoaded', loadProperties)
