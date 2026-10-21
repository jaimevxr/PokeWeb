// --- 1. REFERENCIAS DEL DOM ---
const grid = document.getElementById('pokedex-grid');
const cargando = document.getElementById('cargando');
const modal = document.getElementById('pokemon-modal');
const closeModal = document.getElementById('close-modal');
const modalBody = document.getElementById('modal-body');

const buscadorInput = document.getElementById('buscador');
const tipo1Select = document.getElementById('filtro-tipo-1');
const tipo2Select = document.getElementById('filtro-tipo-2');
const btnFiltrar = document.getElementById('btn-filtrar');
const btnToggleFiltros = document.getElementById('btn-toggle-filtros');
const panelFiltros = document.getElementById('panel-filtros');

// --- 2. VARIABLES DE CONTROL ---
let offset = 0; 
const limit = 20; 
let isLoading = false; 

let todosLosPokemon = []; 
let pokemonFiltrados = []; 
let listaTiposActual = []; // NUEVA: Guardará la base según el tipo seleccionado


const coloresTipos = {
    normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
    grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
    ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
    rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
    steel: '#B7B7CE', fairy: '#D685AD'
};

// --- 3. LÓGICA DE CARGA Y FILTRADO ---

async function inicializarPokedex() {
    try {
        const respuesta = await fetch('https://pokeapi.co/api/v2/pokemon?limit=10000');
        const datos = await respuesta.json();
        todosLosPokemon = datos.results;
        listaTiposActual = [...todosLosPokemon]; // Al inicio, la base son todos
        pokemonFiltrados = [...todosLosPokemon]; 
        cargarPokemon(); 
    } catch (error) {
        console.error("Error al inicializar la Pokédex:", error);
    }
}

async function cargarPokemon() {
    if (isLoading) return; 
    isLoading = true;

    try {
        const trozo = pokemonFiltrados.slice(offset, offset + limit);
        
        if (trozo.length === 0) {
            cargando.style.display = 'none';
            isLoading = false;
            return;
        } else {
            cargando.style.display = 'block';
        }

        const promesasPokemon = trozo.map(async (p) => {
            // Ahora la URL siempre viene limpia gracias a la normalización
            const resDetalles = await fetch(p.url);
            return await resDetalles.json();
        });

        const listaDetalles = await Promise.all(promesasPokemon);

        listaDetalles.forEach(pokemon => {
            crearTarjetaPokemon(pokemon);
        });

        offset += limit;
    } catch (error) {
        console.error("Error cargando los detalles:", error);
    } finally {
        isLoading = false;
    }
}

// --- 4. EVENTOS DE BÚSQUEDA Y FILTRADO ---

// NUEVA FUNCIÓN MAESTRA: Aplica el texto sobre la lista de tipos actual
function aplicarFiltrosCombinados() {
    const textoBusqueda = buscadorInput.value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    // Filtramos cruzando la lista de TIPOS con el TEXTO
    pokemonFiltrados = listaTiposActual.filter(p => p.name.includes(textoBusqueda));
    
    reiniciarGrid();
}

// 1. Escribir en el buscador (Ya no borra los tipos, solo complementa)
buscadorInput.addEventListener('input', () => {
    aplicarFiltrosCombinados();
});

// Mostrar/Ocultar el panel de filtros avanzados
btnToggleFiltros.addEventListener('click', () => {
    panelFiltros.classList.toggle('abierto');
});

// 2. Activar/Desactivar el segundo desplegable
tipo1Select.addEventListener('change', (e) => {
    if (e.target.value === 'todos') {
        tipo2Select.value = 'ninguno';
        tipo2Select.disabled = true;
    } else {
        tipo2Select.disabled = false;
    }
});

// 3. Botón de Filtrar Tipos (Calcula los tipos y luego aplica el texto)
btnFiltrar.addEventListener('click', async () => {
    const tipo1 = tipo1Select.value;
    const tipo2 = tipo2Select.value;

    if (tipo1 === 'todos') {
        listaTiposActual = [...todosLosPokemon];
        aplicarFiltrosCombinados(); // Aplicamos el texto actual a todos
        return;
    }

    cargando.style.display = 'block';
    grid.innerHTML = '';
    isLoading = true; 

    try {
        const res1 = await fetch(`https://pokeapi.co/api/v2/type/${tipo1}`);
        const data1 = await res1.json();
        let lista1 = data1.pokemon.map(p => p.pokemon);

        if (tipo2 === 'ninguno' || tipo2 === tipo1) {
            listaTiposActual = lista1;
        } else {
            const res2 = await fetch(`https://pokeapi.co/api/v2/type/${tipo2}`);
            const data2 = await res2.json();
            const lista2 = data2.pokemon.map(p => p.pokemon);

            const nombresLista2 = new Set(lista2.map(p => p.name));
            listaTiposActual = lista1.filter(p => nombresLista2.has(p.name));
        }

        isLoading = false;
        aplicarFiltrosCombinados(); // Aplicamos el texto a la nueva lista de tipos

    } catch (error) {
        console.error("Error al filtrar por tipos:", error);
        isLoading = false;
    }
});

function reiniciarGrid() {
    isLoading = true;
    grid.innerHTML = '';
    offset = 0;
    setTimeout(() => {
        isLoading = false;
        cargarPokemon();
    }, 100); 
}

// --- 5. CREACIÓN DE INTERFAZ (Tu código intacto) ---

// --- 5. CREACIÓN DE INTERFAZ ---
function crearTarjetaPokemon(pokemon) {
    const tarjeta = document.createElement('a'); // Ahora es un enlace
    tarjeta.classList.add('pokemon-card');
    tarjeta.href = `?pokemon=${pokemon.name}`; // Parámetro URL para nueva pestaña
    tarjeta.style.textDecoration = 'none'; 
    tarjeta.style.color = 'inherit';

    const imgPorDefecto = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';

    // Para usar los modelos 3D en HD (Pokémon HOME):
    // Prioridad 1: Dibujo Oficial HD. Prioridad 2: GIF animado (Showdown).
    const sprite = pokemon.sprites?.versions['generation-v']['black-white']?.animated?.front_default || 
                   pokemon.sprites?.versions['generation-v']['black-white']?.front_default || 
                   pokemon.sprites?.front_default || 
                   imgPorDefecto;
                   
    const numeroStr = pokemon.id.toString().padStart(3, '0');
    const tipos = pokemon.types.map(tipoInfo => tipoInfo.type.name);
    const colorPrincipal = coloresTipos[tipos[0]];
    
    tarjeta.style.backgroundColor = colorPrincipal;

    const tiposHTML = tipos.map(tipo => `<span class="type-badge">${tipo}</span>`).join('');

    tarjeta.innerHTML = `
        <div class="numero">#${numeroStr}</div>
        <img src="${sprite}" alt="${pokemon.name}">
        <h3>${pokemon.name}</h3>
        <div class="tipos">${tiposHTML}</div>
    `;

    tarjeta.addEventListener('click', (e) => {
        // Permitir abrir en nueva pestaña con Ctrl+Click o rueda del ratón
        if (e.ctrlKey || e.metaKey || e.button === 1) return;
        
        e.preventDefault();
        abrirModal(pokemon, sprite, colorPrincipal);
        window.history.pushState({}, '', `?pokemon=${pokemon.name}`); // Actualiza URL visualmente
    });
    
    grid.appendChild(tarjeta);
}
// --- 6. MODAL Y EVENTOS EXTRA (Tu código intacto) ---

// --- 6. MODAL Y EVENTOS EXTRA ---

// Función para montar y mostrar el Modal (Ahora es asíncrona para descargar el Lore)
// Función para montar y mostrar el Modal (Inglés + Evoluciones + Moves)

// --- 6. MODAL Y EVENTOS EXTRA ---

// Caché global para no volver a descargar los tipos de ataques repetidos
const moveCache = {};

// Función para montar y mostrar el Modal (Inglés + Evoluciones Ramificadas + Moves Async)
async function abrirModal(pokemon, spriteNormal, colorFondo) {
const imgPorDefecto = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/poke-ball.png';
    
    const spriteShiny = pokemon.sprites?.versions['generation-v']['black-white']?.animated?.front_shiny || 
                        pokemon.sprites?.versions['generation-v']['black-white']?.front_shiny || 
                        pokemon.sprites?.front_shiny || 
                        imgPorDefecto;

// Extraer Habilidades (Inglés + Tooltips)
    const habilidadesHtml = pokemon.abilities.map(a => 
        `<span class="ability-badge" id="ability-${a.ability.name}" data-tooltip="Loading effect...">${a.ability.name.replace('-', ' ')}</span>`
    ).join('');

    // Extraer Estadísticas Base (Inglés)
    const nombresStats = {
        'hp': 'HP', 'attack': 'Attack', 'defense': 'Defense',
        'special-attack': 'Sp. Atk', 'special-defense': 'Sp. Def', 'speed': 'Speed'
    };

    let htmlStats = '<div class="stats-container">';
    pokemon.stats.forEach(stat => {
        const nombreStat = nombresStats[stat.stat.name] || stat.stat.name;
        const valor = stat.base_stat;
        const porcentaje = Math.min((valor / 255) * 100, 100); 

        htmlStats += `
            <div class="stat-row">
                <span class="stat-name">${nombreStat}</span>
                <span class="stat-value">${valor}</span>
                <div class="stat-bar-bg">
                    <div class="stat-bar-fill" style="width: ${porcentaje}%; background-color: ${colorFondo};"></div>
                </div>
            </div>
        `;
    });
    htmlStats += '</div>';

    // Construcción inicial de la cuadrícula
    modalBody.innerHTML = `
        <div class="modal-body-layout">
            <!-- COLUMNA IZQUIERDA -->
            <div class="modal-left">
                <img id="modal-img" src="${spriteNormal}" alt="${pokemon.name}">
                <button id="btn-shiny" class="btn-toggle">✨ View Shiny</button>
                <h2>${pokemon.name}</h2>
                <div class="tipos" style="margin-bottom: 10px;">
                    ${pokemon.types.map(t => `<span class="type-badge" style="background-color: ${coloresTipos[t.type.name]}">${t.type.name}</span>`).join('')}
                </div>
                <div id="modal-lore-container" style="width: 100%;">
                    <p class="lore-text" style="border-left-color: ${colorFondo}; color: #999;">Loading Pokédex entry...</p>
                </div>
            </div>

            <!-- COLUMNA DERECHA -->
            <div class="modal-right">
                <div class="modal-section">
                    <h4>Info & Abilities</h4>
                    <div class="info-grid">
                        <p><strong>Height:</strong> ${pokemon.height / 10} m</p>
                        <p><strong>Weight:</strong> ${pokemon.weight / 10} kg</p>
                    </div>
                    <div class="habilidades-contenedor">
                        ${habilidadesHtml}
                    </div>
                </div>

                <div class="modal-section">
                    <h4>Base Stats</h4>
                    ${htmlStats}
                </div>
                
                <div class="modal-section" id="modal-evo-container">
                    <h4>Evolution Chain</h4>
                    <p style="font-size: 0.85em; color: #666;">Loading evolutions...</p>
                </div>

                <div class="modal-section">
                    <h4>Moves</h4>
                    <input type="text" id="modal-move-search" class="move-search-input" placeholder="Search a move (e.g., tackle)...">
                    <div class="moves-container" id="modal-moves-container">
                        <p style="font-size: 0.85em; color: #666;">Loading moves and types...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.querySelector('.modal-content').style.borderTop = `10px solid ${colorFondo}`;
    modal.classList.remove('hidden');

    // Botón Shiny (Lógica)
    const btnShiny = document.getElementById('btn-shiny');
    const imgModal = document.getElementById('modal-img');
    let mostrandoShiny = false;
    
    btnShiny.addEventListener('click', () => {
        mostrandoShiny = !mostrandoShiny; 
        if (mostrandoShiny) {
            imgModal.src = spriteShiny;
            btnShiny.innerHTML = '🔄 View Normal';
            btnShiny.classList.add('shiny-active');
        } else {
            imgModal.src = spriteNormal;
            btnShiny.innerHTML = '✨ View Shiny';
            btnShiny.classList.remove('shiny-active');
        }
    });

    // --- LLAMADAS ASÍNCRONAS PARA EL RESTO DE DATOS ---
    try {
        // 1. Cargar Lore y Evoluciones
        const resSpecies = await fetch(pokemon.species.url);
        const dataSpecies = await resSpecies.json();
        
        let loreText = "No Pokédex entry available.";
        const flavorEntry = dataSpecies.flavor_text_entries.find(entry => entry.language.name === 'en');
        if (flavorEntry) {
            loreText = flavorEntry.flavor_text.replace(/[\n\f\r]/g, ' '); 
        }
        document.getElementById('modal-lore-container').innerHTML = `
            <p class="lore-text" style="border-left-color: ${colorFondo};">"${loreText}"</p>
        `;

        if (dataSpecies.evolution_chain) {
            const resEvo = await fetch(dataSpecies.evolution_chain.url);
            const dataEvo = await resEvo.json();
            
            // Función para agrupar evoluciones por fases (Tiers)
            let evoTiers = [];
            function extraerFases(nodo, tier = 0) {
                if (!evoTiers[tier]) evoTiers[tier] = [];
                
                const idMatch = nodo.species.url.match(/\/(\d+)\//);
                if (idMatch) {
                    evoTiers[tier].push({
                        name: nodo.species.name,
                        img: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${idMatch[1]}.png`
                    });
                }
                nodo.evolves_to.forEach(child => extraerFases(child, tier + 1));
            }
            
            extraerFases(dataEvo.chain);

            // Renderizar las fases evolutivas agrupadas
            let evoHtml = '';
            evoTiers.forEach((tierGroup, index) => {
                let tierHtml = '<div class="evo-tier">';
                tierGroup.forEach(evo => {
                    tierHtml += `
                        <div class="evo-item">
                            <img src="${evo.img}" alt="${evo.name}">
                            <span>${evo.name}</span>
                        </div>
                    `;
                });
                tierHtml += '</div>';
                
                evoHtml += tierHtml;
                if (index < evoTiers.length - 1) {
                    evoHtml += '<span style="color: #ccc; margin: 0 10px;">➔</span>';
                }
            });

            document.getElementById('modal-evo-container').innerHTML = `
                <h4>Evolution Chain</h4>
                <div class="evolutions-container">${evoHtml}</div>
            `;

            // Cargar descripciones de Habilidades (Tooltips)
        pokemon.abilities.forEach(async (a) => {
            try {
                const resAb = await fetch(a.ability.url);
                const dataAb = await resAb.json();
                const entry = dataAb.effect_entries.find(e => e.language.name === 'en');
                const effectText = entry ? entry.short_effect : 'No description available.';
                document.getElementById(`ability-${a.ability.name}`).setAttribute('data-tooltip', effectText);
            } catch (err) {
                console.error("Error loading ability", err);
            }
        });
        }

        // 2. Cargar Ataques (Moves) con Tipos y Buscador
        // Usamos Promise.all para descargar todos los tipos de ataques a la vez (apoyándonos en la caché)
        const movePromises = pokemon.moves.map(async (m) => {
            const moveName = m.move.name;
            if (moveCache[moveName]) {
                return { name: moveName, type: moveCache[moveName] };
            }
            try {
                const res = await fetch(m.move.url);
                const data = await res.json();
                moveCache[moveName] = data.type.name; // Guardamos en caché
                return { name: moveName, type: data.type.name };
            } catch (err) {
                return { name: moveName, type: 'normal' }; // Fallback
            }
        });

        const movesData = await Promise.all(movePromises);
        
        // Función interna para renderizar los ataques filtrados
        const renderMoves = (filtroTexto = '') => {
            const filtrados = movesData.filter(m => m.name.includes(filtroTexto.toLowerCase()));
            const html = filtrados.map(m => 
                `<span class="move-badge" style="background-color: ${coloresTipos[m.type] || '#A8A77A'};">${m.name.replace('-', ' ')}</span>`
            ).join('');
            document.getElementById('modal-moves-container').innerHTML = html;
        };

        // Renderizamos inicialmente todos los ataques
        renderMoves();

        // Escuchamos el buscador de ataques
        document.getElementById('modal-move-search').addEventListener('input', (e) => {
            renderMoves(e.target.value);
        });

    } catch (error) {
        console.error("Error loading extra data:", error);
    }
}

closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
    window.history.pushState({}, '', window.location.pathname);
});

window.addEventListener('click', (evento) => {
    if (evento.target === modal) {
        modal.classList.add('hidden');
        window.history.pushState({}, '', window.location.pathname);
    }
});

const observer = new IntersectionObserver((entradas) => {
    if (entradas[0].isIntersecting) {
        cargarPokemon(); 
    }
}, {
    rootMargin: "200px" 
});

observer.observe(cargando);

// --- LÓGICA DEL MENÚ LATERAL (SIDEBAR) ---
const btnMenuPrincipal = document.getElementById('btn-menu-principal');
const menuPrincipal = document.getElementById('menu-principal');
const overlaySidebar = document.getElementById('sidebar-overlay');
const btnCloseSidebar = document.getElementById('close-sidebar');

// Función que abre y cierra el menú y el overlay
function toggleSidebar() {
    menuPrincipal.classList.toggle('activo');
    overlaySidebar.classList.toggle('activo');
}

// Eventos
btnMenuPrincipal.addEventListener('click', toggleSidebar);
btnCloseSidebar.addEventListener('click', toggleSidebar);

// Si el usuario hace clic en lo oscuro, también se cierra
overlaySidebar.addEventListener('click', toggleSidebar);

// --- 7. ARRANQUE DE LA APLICACIÓN ---
async function iniciarApp() {
    await inicializarPokedex();

    // Comprobar si hay un Pokémon en la URL para abrir su modal automáticamente
    const urlParams = new URLSearchParams(window.location.search);
    const pokeParam = urlParams.get('pokemon');
    
    if (pokeParam) {
        try {
            const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokeParam.toLowerCase()}`);
            const pokemon = await res.json();
            
            const tipos = pokemon.types.map(t => t.type.name);
            const colorPrincipal = coloresTipos[tipos[0]];
            const sprite = pokemon.sprites?.versions['generation-v']['black-white']?.animated?.front_default || 
                        pokemon.sprites?.versions['generation-v']['black-white']?.front_default || 
                        pokemon.sprites?.front_default || 
                        imgPorDefecto;
                           
            abrirModal(pokemon, sprite, colorPrincipal);
        } catch (error) {
            console.error("Pokémon de la URL no encontrado:", error);
        }
    }
}

iniciarApp();