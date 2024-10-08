document.addEventListener("DOMContentLoaded", () => {
    // Configuración inicial
    const TIEMPO_INICIAL = 30;
    let move = new Audio('play.mp3');
    let wind_zone = new Audio('win_zone.mp3');
    wind_zone.volume = 0.5;
    let tiempoRestante = TIEMPO_INICIAL;
    let temporizador;

    // Elementos del DOM
    const tableroDivs = document.querySelectorAll(".micro-tablero");
    const jugadorActualSpan = document.getElementById("jugador-actual");
    const reiniciarBtn = document.getElementById("reiniciar");
    const modalVictoria = document.getElementById("modal-victoria");
    const mensajeVictoria = document.getElementById("mensaje-victoria");
    const btnReiniciarModal = document.getElementById("close-modal");
    const timerElement = document.getElementById("timer");

    // Estado del juego
    let tableroBase = {
        'a': Array(9).fill(''),
        'b': Array(9).fill(''),
        'c': Array(9).fill(''),
        'd': Array(9).fill(''),
        'e': Array(9).fill(''),
        'f': Array(9).fill(''),
        'g': Array(9).fill(''),
        'h': Array(9).fill(''),
        'i': Array(9).fill('')
    };

    let tablerosGanados = {
        'a': '', 'b': '', 'c': '', 'd': '', 'e': '', 'f': '', 'g': '', 'h': '', 'i': ''
    };

    let jugadorActual = "X";
    let siguienteMicroTablero = null;

    // Funciones de Temporizador
    function actualizarTiempoUI() {
        timerElement.textContent = tiempoRestante;

        if (tiempoRestante <= 10) {
            timerElement.classList.add('danger');
            timerElement.classList.remove('warning');
        } else if (tiempoRestante <= 20) {
            timerElement.classList.add('warning');
            timerElement.classList.remove('danger');
        } else {
            timerElement.classList.remove('warning', 'danger');
        }
    }

    function reiniciarTemporizador() {
        clearInterval(temporizador);
        tiempoRestante = TIEMPO_INICIAL;
        actualizarTiempoUI();
        temporizador = setInterval(() => {
            tiempoRestante--;
            actualizarTiempoUI();
            if (tiempoRestante <= 0) {
                clearInterval(temporizador);
                realizarJugadaAleatoria();
            }
        }, 1000);
    }

    // Función de Jugada Aleatoria
    function realizarJugadaAleatoria() {
        let posiblesMicroTableros = siguienteMicroTablero === null
            ? Object.keys(tableroBase).filter(id => tablerosGanados[id] === '' && hayMovimientosDisponibles(id))
            : [siguienteMicroTablero];

        if (posiblesMicroTableros.length === 0) {
            return;
        }

        let microTableroSeleccionado = posiblesMicroTableros[Math.floor(Math.random() * posiblesMicroTableros.length)];
        let posiblesCasillas = tableroBase[microTableroSeleccionado].map((valor, index) => valor === '' ? index : null).filter(index => index !== null);

        if (posiblesCasillas.length > 0) {
            let casillaSeleccionada = posiblesCasillas[Math.floor(Math.random() * posiblesCasillas.length)];
            realizarJugada(microTableroSeleccionado, casillaSeleccionada);
        }
    }

    // Funciones de Juego
    function manejarJugada(microTablero, index) {
        if (tablerosGanados[microTablero] !== '' || (siguienteMicroTablero !== null && siguienteMicroTablero !== microTablero)) {
            return;
        }

        if (tableroBase[microTablero][index] === '') {
            realizarJugada(microTablero, index);
        }
    }

    function realizarJugada(microTablero, index) {
        tableroBase[microTablero][index] = jugadorActual;
        move.play();
        actualizarUI();

        if (verificarVictoria(tableroBase[microTablero])) {
            marcarVictoria(microTablero);
            if (verificarVictoriaGlobal()) {
                mostrarModalVictoria(jugadorActual);
                return;
            }
        } else if (verificarEmpate(tableroBase[microTablero])) {
            marcarEmpate(microTablero);
        }

        if (verificarEmpateGlobal()) {
            mostrarModalVictoria(null, true);
            return;
        }

        siguienteMicroTablero = determinarSiguienteMicroTablero(index);
        if (tablerosGanados[siguienteMicroTablero] !== '' || !hayMovimientosDisponibles(siguienteMicroTablero)) {
            siguienteMicroTablero = null;
        }
        jugadorActual = jugadorActual === "X" ? "O" : "X";
        jugadorActualSpan.textContent = jugadorActual;
        actualizarEstadoCursor();
        reiniciarTemporizador();
    }

    function actualizarUI() {
        tableroDivs.forEach(tableroDiv => {
            const microTableroId = tableroDiv.id;
            const microTablero = tableroBase[microTableroId];

            tableroDiv.innerHTML = '';

            if (tablerosGanados[microTableroId] !== '') {
                tableroDiv.innerHTML = `<div class="ganador ${tablerosGanados[microTableroId]}">${tablerosGanados[microTableroId]}</div>`;
            } else {
                for (let i = 0; i < 9; i++) {
                    const casilla = document.createElement("div");
                    casilla.textContent = microTablero[i];
                    casilla.className = microTablero[i] === 'X' ? 'ficha-x' : (microTablero[i] === 'O' ? 'ficha-o' : '');
                    casilla.dataset.index = i;
                    casilla.addEventListener("click", () => manejarJugada(microTableroId, i));
                    tableroDiv.appendChild(casilla);
                }
            }
        });
    }

    function actualizarEstadoCursor() {
        tableroDivs.forEach(tableroDiv => {
            if (siguienteMicroTablero === null) {
                tableroDiv.classList.toggle("bloqueado", tablerosGanados[tableroDiv.id] !== '');
            } else {
                tableroDiv.classList.toggle("bloqueado", tableroDiv.id !== siguienteMicroTablero || tablerosGanados[tableroDiv.id] !== '');
            }
        });
    }

    function determinarSiguienteMicroTablero(index) {
        const microTableros = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
        return microTableros[index];
    }

    function verificarVictoria(microTablero) {
        const combinacionesGanadoras = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        return combinacionesGanadoras.some(combinacion => 
            microTablero[combinacion[0]] !== '' &&
            microTablero[combinacion[0]] === microTablero[combinacion[1]] &&
            microTablero[combinacion[1]] === microTablero[combinacion[2]]
        );
    }

    function verificarEmpate(microTablero) {
        return microTablero.every(casilla => casilla !== '');
    }

    function marcarVictoria(microTableroId) {
        tablerosGanados[microTableroId] = jugadorActual;
        wind_zone.play();
        actualizarUI();
    }

    function marcarEmpate(microTableroId) {
        tablerosGanados[microTableroId] = '-';
        actualizarUI();
    }

    function verificarVictoriaGlobal() {
        const combinacionesGanadoras = [
            ['a', 'b', 'c'], ['d', 'e', 'f'], ['g', 'h', 'i'],
            ['a', 'd', 'g'], ['b', 'e', 'h'], ['c', 'f', 'i'],
            ['a', 'e', 'i'], ['c', 'e', 'g']
        ];

        return combinacionesGanadoras.some(combinacion => 
            tablerosGanados[combinacion[0]] !== '' &&
            tablerosGanados[combinacion[0]] !== '-' &&
            tablerosGanados[combinacion[0]] === tablerosGanados[combinacion[1]] &&
            tablerosGanados[combinacion[1]] === tablerosGanados[combinacion[2]]
        );
    }

    function verificarEmpateGlobal() {
        return Object.values(tablerosGanados).every(tablero => tablero !== '');
    }

    function hayMovimientosDisponibles(microTableroId) {
        if (microTableroId === null) return true;
        return tableroBase[microTableroId].some(casilla => casilla === '');
    }

    function mostrarModalVictoria(jugador, empate = false) {
        // Mostrar mensaje de victoria o empate
        if (empate) {
            mensajeVictoria.textContent = "¡Es un empate!";
        } else {
            mensajeVictoria.textContent = `¡${jugador} ha ganado la Arena Central!`;
        }
    
        // Mostrar el modal (solo una vez)
        modalVictoria.style.display = "flex"; // O utiliza "block" si es necesario, pero no ambos
    
        // Detener el temporizador
        clearInterval(temporizador);
    }
    

    function reiniciarJuego() {
        // Reiniciar el tablero base
        tableroBase = {
            'a': Array(9).fill(''),
            'b': Array(9).fill(''),
            'c': Array(9).fill(''),
            'd': Array(9).fill(''),
            'e': Array(9).fill(''),
            'f': Array(9).fill(''),
            'g': Array(9).fill(''),
            'h': Array(9).fill(''),
            'i': Array(9).fill('')
        };
    
        // Reiniciar los tableros ganados
        tablerosGanados = {
            'a': '', 'b': '', 'c': '', 'd': '', 'e': '', 'f': '', 'g': '', 'h': '', 'i': ''
        };
    
        // Reiniciar variables de control
        siguienteMicroTablero = null;
        jugadorActual = "X";
        jugadorActualSpan.textContent = jugadorActual;
    
        // Actualizar la UI
        actualizarUI();
    
        // Reiniciar el estado del cursor
        actualizarEstadoCursor();
    
        // Reiniciar el temporizador
        reiniciarTemporizador();
    
        // Ocultar el modal de victoria
        modalVictoria.style.display = "none";
    
        // Remover clases de advertencia y peligro del temporizador
        timerElement.classList.remove('warning', 'danger');
    
        // Desbloquear todos los micro-tableros
        tableroDivs.forEach(tableroDiv => {
            tableroDiv.classList.remove("bloqueado");
        });
    }

    // Eventos
    reiniciarBtn.addEventListener("click", reiniciarJuego);
    btnReiniciarModal.addEventListener("click", reiniciarJuego);

    // Inicialización
    reiniciarJuego();
});
