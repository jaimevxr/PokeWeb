const grid = document.getElementById('pokedex-grid');
const cargando = document.getElementById('cargando');
// Referencias del Modal
const modal = document.getElementById('pokemon-modal');
const closeModal = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');

let offset = 0; 
const limit = 20; 
let isLoading = false; 

// Diccionario de colores oficiales por tipo de Pokémon
const coloresTipos = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
    grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
    ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
    steel: '#B7B7CE', fairy: '#D685AD'
};

async function cargarPokemon() {
    if (isLoading) return; 
    isLoading = true;

    try {
        const respuesta = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=${offset}&limit=${limit}`);
        const datos = await respuesta.json();

        const promesasPokemon = datos.results.map(async (pokemon) => {
            const resDetalles = await fetch(pokemon.url);
            return await resDetalles.json();
        });

        const listaDetalles = await Promise.all(promesasPokemon);

        listaDetalles.forEach(pokemon => {
            crearTarjetaPokemon(pokemon);
        });

        offset += limit;
    } catch (error) {
        console.error("Error cargando los Pokémon:", error);
    } finally {
        isLoading = false;
    }
}

function crearTarjetaPokemon(pokemon) {
    const tarjeta = document.createElement('div');
    tarjeta.classList.add('pokemon-card');

// Cadena de repuesto: Animado -> Arte Oficial -> Sprite Clásico -> Pokéball de emergencia
    const imgPorDefecto = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';

    // SOLUCIÓN AL BUG: Optional Chaining (?.)
    // Si showdown no existe, no da error, simplemente salta al sprite normal.
const sprite = pokemon.sprites?.other?.showdown?.front_default || 
                   pokemon.sprites?.other?.['official-artwork']?.front_default ||
                   pokemon.sprites?.front_default || 
                   imgPorDefecto;    const numeroStr = pokemon.id.toString().padStart(3, '0');

    // Extraemos los tipos de la API
    const tipos = pokemon.types.map(tipoInfo => tipoInfo.type.name);
    
    // Obtenemos el color correspondiente al primer tipo del Pokémon
    const colorPrincipal = coloresTipos[tipos[0]];
    tarjeta.style.backgroundColor = colorPrincipal;

    // Creamos el HTML de las píldoras de tipo
    const tiposHTML = tipos.map(tipo => `<span class="type-badge">${tipo}</span>`).join('');

    tarjeta.innerHTML = `
        <div class="numero">#${numeroStr}</div>
        <img src="${sprite}" alt="${pokemon.name}">
        <h3>${pokemon.name}</h3>
        <div class="tipos">${tiposHTML}</div>
    `;
// Hacer la tarjeta clicable para abrir el Modal
    tarjeta.addEventListener('click', () => abrirModal(pokemon, sprite, colorPrincipal));
    grid.appendChild(tarjeta);
}

const observer = new IntersectionObserver((entradas) => {
    if (entradas[0].isIntersecting) {
        cargarPokemon(); 
    }
}, {
    rootMargin: "200px" // Aumentamos a 200px para que empiece a cargar antes de que llegues al final
});

observer.observe(cargando);

// Función para montar y mostrar el Modal
function abrirModal(pokemon, spriteUrl, colorFondo) {
    // 1. Limpiamos y preparamos el HTML interno
    modalBody.innerHTML = `
        <img src="${spriteUrl}" alt="${pokemon.name}">
        <h2>${pokemon.name}</h2>
        <div class="tipos" style="margin-bottom: 20px;">
            ${pokemon.types.map(t => `<span class="type-badge" style="background-color: ${coloresTipos[t.type.name]}">${t.type.name}</span>`).join('')}
        </div>
        <p><strong>Altura:</strong> ${pokemon.height / 10} m</p>
        <p><strong>Peso:</strong> ${pokemon.weight / 10} kg</p>
    `;

    // 2. Coloreamos el borde superior o el fondo según su tipo
    document.querySelector('.modal-content').style.borderTop = `10px solid ${colorFondo}`;

    // 3. Le quitamos la clase 'hidden' para que se muestre con la animación
    modal.classList.remove('hidden');
}

// Función para cerrar el Modal al pulsar la X
closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// Función extra: cerrar el Modal si hacemos clic fuera de la caja blanca
window.addEventListener('click', (evento) => {
    if (evento.target === modal) {
        modal.classList.add('hidden');
    }
});