const API_URL = 'http://localhost:3000/api'

async function loadProperties() {
  try {
    const response = await fetch(`${API_URL}/properties`)
    const data = await response.json()
    
    const container = document.getElementById('properties-list')
    container.innerHTML = ''
    
    if (data.properties) {
      data.properties.forEach(property => {
        const card = document.createElement('div')
        card.className = 'property-card'
        card.innerHTML = `
          <h4>${property.title}</h4>
          <p>${property.description}</p>
          <strong>R$ ${property.price}</strong>
        `
        container.appendChild(card)
      })
    }
  } catch (error) {
    console.error('Erro ao carregar imóveis:', error)
  }
}

document.addEventListener('DOMContentLoaded', loadProperties)
