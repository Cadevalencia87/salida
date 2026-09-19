/* ============================================================
   ASUNTO PENDIENTE — lógica de la página
   Todo el flujo vive en un único objeto de estado; cada paso
   se dibuja como una función que devuelve el HTML del paso y
   engancha sus propios listeners.
   ============================================================ */

/* ------------------------------------------------------------
   Las respuestas se guardan en tu propio backend (Flask + SQLite).
   Las consultas después desde /admin — no hay nada que configurar
   aquí, el endpoint ya apunta al mismo servidor que sirve la página.
   ------------------------------------------------------------ */
const ENDPOINT_REGISTRO = "/api/registrar";

/* ------------------------------------------------------------
   ESTADO
   ------------------------------------------------------------ */
const estado = {
  paso: "intro",
  datos: {
    confirmacion: null,   // "si" | "no"
    fecha: null,           // "AAAA-MM-DD"
    disponibilidad: null,  // valor + etiqueta
    organizacion: null,    // valor + etiqueta
    restricciones: ""
  },
  intentosNo: 0
};

const MENSAJES_NO = [
  "¿Segura?",
  "Piénsalo otra vez...",
  "Ese botón no está disponible actualmente.",
  "Error 404: ganas de salir no encontradas.",
  "Creo que te equivocaste de botón.",
  "Bueno, técnicamente puedes decir que no... pero este botón tiene otros planes."
];

const DISPONIBILIDAD = [
  { valor: "ratito", etiqueta: "Un ratito", respuesta: "Operación salida express. Entendido." },
  { valor: "2h", etiqueta: "Unas 2 horas", respuesta: "Tiempo suficiente para una misión de duración razonable." },
  { valor: "3-4h", etiqueta: "3–4 horas", respuesta: "Ok, esto ya empieza a ponerse interesante." },
  { valor: "todo-el-dia", etiqueta: "Prácticamente todo el día 👀", respuesta: "Ah. Tenemos presupuesto temporal ilimitado." },
  { valor: "no-se", etiqueta: "No sé todavía", respuesta: "Respuesta diplomática. La respeto." }
];

const ORGANIZACION = [
  { valor: "tiene-idea", etiqueta: "Ya tengo una idea 👀", respuesta: "Anotado. Procederemos a escuchar a la autoridad competente." },
  { valor: "sorpresa", etiqueta: "Me dejo sorprender", respuesta: "Ah, excelente. Acabas de transferir oficialmente la responsabilidad." },
  { valor: "ese-dia", etiqueta: "Lo decidimos ese día", respuesta: "Clásico. Improvisación controlada." },
  { valor: "confio", etiqueta: "Confío en tu capacidad de improvisación", respuesta: "Grave error. Pero agradezco la confianza." }
];

/* Mapa de progreso por paso: porcentaje + texto */
const PROGRESO = {
  confirm:       { pct: 12,  texto: "Nivel de compromiso con esta salida: 12%" },
  date:          { pct: 30,  texto: "Nivel de compromiso con esta salida: 30%" },
  availability:  { pct: 52,  texto: "Nivel de compromiso con esta salida: 52%" },
  plan:          { pct: 74,  texto: "Nivel de compromiso con esta salida: 74%" },
  extra:         { pct: 90,  texto: "Nivel de compromiso con esta salida: 90%" },
  summary:       { pct: 96,  texto: "Nivel de compromiso con esta salida: 96%" },
  final:         { pct: 100, texto: "Nivel de burocracia completado: 100%" }
};

/* ------------------------------------------------------------
   REFERENCIAS AL DOM
   ------------------------------------------------------------ */
const $contenido = document.getElementById("contenido");
const $progreso = document.getElementById("progreso");
const $progresoRelleno = document.getElementById("progresoRelleno");
const $progresoTexto = document.getElementById("progresoTexto");
const $avisoPaciencia = document.getElementById("avisoPaciencia");
const $anuncioAccesible = document.getElementById("anuncioAccesible");
const $botonReiniciar = document.getElementById("botonReiniciar");

let temporizadorPaciencia = null;

/* ------------------------------------------------------------
   UTILIDADES
   ------------------------------------------------------------ */

// Cambia de paso con una pequeña animación de salida/entrada.
function irAPaso(nombrePaso) {
  limpiarAvisoPaciencia();
  $contenido.classList.remove("entrando");
  $contenido.classList.add("saliendo");

  window.setTimeout(() => {
    estado.paso = nombrePaso;
    dibujarPaso(nombrePaso);
    $contenido.classList.remove("saliendo");
    $contenido.classList.add("entrando");
    actualizarProgreso(nombrePaso);
    programarAvisoPaciencia();
  }, 190);
}

function actualizarProgreso(nombrePaso) {
  const info = PROGRESO[nombrePaso];
  if (!info) {
    $progreso.hidden = true;
    return;
  }
  $progreso.hidden = false;
  $progresoRelleno.style.width = info.pct + "%";
  $progresoTexto.textContent = info.texto;
}

// Pequeño mensaje de paciencia si alguien se tarda en un paso.
function programarAvisoPaciencia() {
  limpiarAvisoPaciencia();
  const frases = [
    "Tómate tu tiempo, no estamos lanzando un cohete.",
    "El departamento de decisiones puede esperar.",
    "Sin presión. Bueno, un poquito de presión burocrática."
  ];
  temporizadorPaciencia = window.setTimeout(() => {
    $avisoPaciencia.textContent = frases[Math.floor(Math.random() * frases.length)];
    $avisoPaciencia.classList.add("visible");
  }, 16000);
}

function limpiarAvisoPaciencia() {
  window.clearTimeout(temporizadorPaciencia);
  $avisoPaciencia.classList.remove("visible");
  $avisoPaciencia.textContent = "";
}

// Toast breve tipo "Respuesta registrada."
let temporizadorToast = null;
function mostrarToast(texto) {
  let $toast = document.querySelector(".toast-registro");
  if (!$toast) {
    $toast = document.createElement("div");
    $toast.className = "toast-registro";
    document.body.appendChild($toast);
  }
  $toast.textContent = texto;
  $toast.classList.add("visible");
  window.clearTimeout(temporizadorToast);
  temporizadorToast = window.setTimeout(() => {
    $toast.classList.remove("visible");
  }, 1800);

  $anuncioAccesible.textContent = texto;
}

// Formatea "AAAA-MM-DD" a algo como "viernes 25 de septiembre".
function formatearFecha(iso) {
  if (!iso) return "—";
  const [anio, mes, dia] = iso.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);
  const texto = fecha.toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function hoyISO() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/* ------------------------------------------------------------
   DIBUJO DE CADA PASO
   ------------------------------------------------------------ */
function dibujarPaso(nombrePaso) {
  const dibujantes = {
    intro: dibujarIntro,
    confirm: dibujarConfirmacion,
    date: dibujarFecha,
    availability: dibujarDisponibilidad,
    plan: dibujarOrganizacion,
    extra: dibujarExtra,
    summary: dibujarResumen,
    final: dibujarFinal
  };
  dibujantes[nombrePaso]();
}

function dibujarIntro() {
  $contenido.innerHTML = `
    <h1 class="titulo-paso">Ok, tenemos un asunto importante que resolver...</h1>
    <p class="subtitulo-paso">Se ha detectado una próxima salida pendiente.</p>
    <div class="fila-botones">
      <button type="button" class="boton boton-primario" id="btnComenzar">Resolver asunto</button>
    </div>
    <p class="nota-paso">Tranquila, no es un examen. Probablemente.</p>
  `;
  document.getElementById("btnComenzar").addEventListener("click", () => irAPaso("confirm"));
}

function dibujarConfirmacion() {
  estado.intentosNo = 0;
  $contenido.innerHTML = `
    <h2 class="titulo-paso">Entonces... ¿sí vamos a salir?</h2>
    <div class="fila-botones">
      <button type="button" class="boton boton-primario" id="btnSi">Sí 😌</button>
      <button type="button" class="boton boton-esquivo" id="btnNo">No</button>
    </div>
    <div class="celebracion" id="celebracion" aria-hidden="true"></div>
  `;

  document.getElementById("btnSi").addEventListener("click", () => {
    estado.datos.confirmacion = "si";
    lanzarCelebracion();
    mostrarToast("Respuesta registrada. El departamento de decisiones está satisfecho.");
    window.setTimeout(() => irAPaso("date"), 700);
  });

  document.getElementById("btnNo").addEventListener("click", manejarClicEnNo);
}

// El botón "No" cambia de mensaje y se desplaza un poco en cada intento.
// Tras agotar los mensajes, un intento más SÍ se toma como una respuesta
// real — siempre debe existir una forma genuina de decir que no.
function manejarClicEnNo() {
  const $btnNo = document.getElementById("btnNo");

  if (estado.intentosNo < MENSAJES_NO.length) {
    $btnNo.textContent = MENSAJES_NO[estado.intentosNo];
    estado.intentosNo += 1;

    const desplazamientoX = (Math.random() * 26 - 13).toFixed(1);
    const desplazamientoY = (Math.random() * 10 - 5).toFixed(1);
    $btnNo.style.transform = `translate(${desplazamientoX}px, ${desplazamientoY}px)`;
    return;
  }

  // Se agotaron los mensajes: esta vez sí se respeta como un "no" real.
  estado.datos.confirmacion = "no";
  $contenido.innerHTML = `
    <h2 class="titulo-paso">Está bien.</h2>
    <p class="subtitulo-paso">No hay ningún problema, de verdad. Aquí seguimos, sin prisa.</p>
    <div class="fila-botones">
      <button type="button" class="boton boton-secundario" id="btnVolverAIntentar">Volver a pensarlo</button>
    </div>
  `;
  document.getElementById("btnVolverAIntentar").addEventListener("click", () => irAPaso("confirm"));
}

function lanzarCelebracion() {
  const $cont = document.getElementById("celebracion");
  if (!$cont) return;
  const chispas = ["✨", "🎉", "🔥", "✨"];
  chispas.forEach((emoji, i) => {
    const $chispa = document.createElement("span");
    $chispa.className = "chispa";
    $chispa.textContent = emoji;
    $chispa.style.left = `${38 + i * 10}%`;
    $chispa.style.animationDelay = `${i * 80}ms`;
    $cont.appendChild($chispa);
  });
  window.setTimeout(() => { $cont.innerHTML = ""; }, 1000);
}

function dibujarFecha() {
  $contenido.innerHTML = `
    <p class="eyebrow-paso">Perfecto. Ahora la parte complicada...</p>
    <h2 class="titulo-paso">¿Qué día te queda bien?</h2>
    <div class="envoltorio-fecha">
      <label class="etiqueta-campo" for="inputFecha">Día de la salida</label>
      <input type="date" id="inputFecha" class="input-fecha" min="${hoyISO()}" value="${estado.datos.fecha || ""}">
    </div>
    <p class="nota-paso">Prometo no hacer preguntas existenciales sobre por qué elegiste ese día.</p>
    <div class="nav-pasos">
      <button type="button" class="enlace-atras" id="btnAtras">← Atrás</button>
      <button type="button" class="boton boton-primario" id="btnSiguiente">Siguiente</button>
    </div>
  `;

  document.getElementById("btnAtras").addEventListener("click", () => irAPaso("confirm"));

  document.getElementById("btnSiguiente").addEventListener("click", () => {
    const valor = document.getElementById("inputFecha").value;
    if (!valor) {
      document.getElementById("inputFecha").focus();
      return;
    }
    estado.datos.fecha = valor;
    mostrarToast("Respuesta registrada. El departamento de decisiones está satisfecho.");
    irAPaso("availability");
  });
}

function dibujarDisponibilidad() {
  $contenido.innerHTML = `
    <h2 class="titulo-paso">Y ese día... ¿cuánto tiempo tienes disponible?</h2>
    <div class="lista-opciones" id="listaDisponibilidad">
      ${DISPONIBILIDAD.map(op => `
        <button type="button" class="opcion" data-valor="${op.valor}">${op.etiqueta}</button>
      `).join("")}
    </div>
    <p class="nota-paso" id="respuestaDisponibilidad" aria-live="polite"></p>
    <div class="nav-pasos">
      <button type="button" class="enlace-atras" id="btnAtras">← Atrás</button>
    </div>
  `;

  document.getElementById("btnAtras").addEventListener("click", () => irAPaso("date"));

  document.getElementById("listaDisponibilidad").addEventListener("click", (ev) => {
    const boton = ev.target.closest(".opcion");
    if (!boton) return;

    const opcion = DISPONIBILIDAD.find(op => op.valor === boton.dataset.valor);
    estado.datos.disponibilidad = opcion;

    document.querySelectorAll("#listaDisponibilidad .opcion").forEach(b => b.classList.remove("seleccionada"));
    boton.classList.add("seleccionada");

    document.getElementById("respuestaDisponibilidad").textContent = opcion.respuesta;
    mostrarToast("Respuesta registrada. El departamento de decisiones está satisfecho.");

    window.setTimeout(() => irAPaso("plan"), 650);
  });
}

function dibujarOrganizacion() {
  $contenido.innerHTML = `
    <p class="eyebrow-paso">Y una última cosa...</p>
    <h2 class="titulo-paso">¿Tú ya tienes alguna idea de qué te gustaría hacer, o me toca improvisar?</h2>
    <div class="lista-opciones" id="listaOrganizacion">
      ${ORGANIZACION.map(op => `
        <button type="button" class="opcion" data-valor="${op.valor}">${op.etiqueta}</button>
      `).join("")}
    </div>
    <p class="nota-paso" id="respuestaOrganizacion" aria-live="polite"></p>
    <div class="nav-pasos">
      <button type="button" class="enlace-atras" id="btnAtras">← Atrás</button>
    </div>
  `;

  document.getElementById("btnAtras").addEventListener("click", () => irAPaso("availability"));

  document.getElementById("listaOrganizacion").addEventListener("click", (ev) => {
    const boton = ev.target.closest(".opcion");
    if (!boton) return;

    const opcion = ORGANIZACION.find(op => op.valor === boton.dataset.valor);
    estado.datos.organizacion = opcion;

    document.querySelectorAll("#listaOrganizacion .opcion").forEach(b => b.classList.remove("seleccionada"));
    boton.classList.add("seleccionada");

    document.getElementById("respuestaOrganizacion").textContent = opcion.respuesta;
    mostrarToast("Respuesta registrada. El departamento de decisiones está satisfecho.");

    window.setTimeout(() => irAPaso("extra"), 650);
  });
}

function dibujarExtra() {
  $contenido.innerHTML = `
    <h2 class="titulo-paso">¿Hay algo que definitivamente NO quieras hacer ese día?</h2>
    <label class="etiqueta-campo" for="inputExtra">Opcional</label>
    <textarea id="inputExtra" class="textarea-campo" placeholder="Prometo no juzgar tus respuestas.">${estado.datos.restricciones}</textarea>
    <div class="nav-pasos">
      <button type="button" class="enlace-atras" id="btnAtras">← Atrás</button>
      <button type="button" class="boton boton-primario" id="btnSiguiente">Siguiente</button>
    </div>
  `;

  document.getElementById("btnAtras").addEventListener("click", () => irAPaso("plan"));

  document.getElementById("btnSiguiente").addEventListener("click", () => {
    estado.datos.restricciones = document.getElementById("inputExtra").value.trim();
    mostrarToast("Respuesta registrada. El departamento de decisiones está satisfecho.");
    irAPaso("summary");
  });
}

function dibujarResumen() {
  const d = estado.datos;
  $contenido.innerHTML = `
    <h2 class="titulo-paso">Perfecto.</h2>
    <p class="subtitulo-paso">Ya tenemos la información necesaria.</p>
    <div class="resumen">
      <div class="resumen-fila">
        <span class="resumen-etiqueta">Fecha</span>
        <span class="resumen-valor">${formatearFecha(d.fecha)}</span>
      </div>
      <div class="resumen-fila">
        <span class="resumen-etiqueta">Disponibilidad</span>
        <span class="resumen-valor">${d.disponibilidad ? d.disponibilidad.etiqueta : "—"}</span>
      </div>
      <div class="resumen-fila">
        <span class="resumen-etiqueta">Organización</span>
        <span class="resumen-valor">${d.organizacion ? d.organizacion.etiqueta : "—"}</span>
      </div>
      <div class="resumen-fila">
        <span class="resumen-etiqueta">Evitar</span>
        <span class="resumen-valor">${d.restricciones ? d.restricciones : "Nada en especial"}</span>
      </div>
    </div>
    <p class="subtitulo-paso">Ahora puedes olvidarte de esta página y continuar con tu vida.</p>
    <p class="nota-paso">Yo me encargo de la parte aburrida.</p>
    <div class="nav-pasos">
      <button type="button" class="enlace-atras" id="btnAtras">← Atrás</button>
      <button type="button" class="boton boton-primario" id="btnConfirmar">Confirmar salida ✓</button>
    </div>
    <p class="nota-paso" id="errorEnvio" style="color:var(--rojo)" aria-live="polite"></p>
  `;

  document.getElementById("btnAtras").addEventListener("click", () => irAPaso("extra"));
  document.getElementById("btnConfirmar").addEventListener("click", confirmarSalida);
}

async function confirmarSalida() {
  const $boton = document.getElementById("btnConfirmar");
  const $error = document.getElementById("errorEnvio");

  $boton.disabled = true;
  const textoOriginal = $boton.textContent;
  $boton.textContent = "Registrando...";
  if ($error) $error.textContent = "";

  try {
    await enviarRespuestas(estado.datos);
    irAPaso("final");
  } catch (error) {
    $boton.disabled = false;
    $boton.textContent = textoOriginal;
    if ($error) {
      $error.textContent = "No se pudo registrar. Revisa tu conexión e intenta de nuevo.";
    }
  }
}

function dibujarFinal() {
  $contenido.innerHTML = `
    <p class="icono-final" aria-hidden="true">✓</p>
    <h2 class="titulo-paso marca-final">Salida registrada correctamente.</h2>
    <p class="subtitulo-paso" style="text-align:center">Nos vemos pronto, entonces 😌</p>
    <p class="nota-paso" style="text-align:center">PD: No intentes averiguar qué está pasando. Eso arruina la experiencia.</p>
  `;
}

/* ------------------------------------------------------------
   ENVÍO OPCIONAL A UN SERVICIO EXTERNO (sin backend)
   Ver README para la configuración exacta.
   ------------------------------------------------------------ */
/* ------------------------------------------------------------
   ENVÍO AL BACKEND PROPIO
   Guarda la respuesta en la base de datos, para verla luego
   desde /admin con usuario y contraseña.
   ------------------------------------------------------------ */
async function enviarRespuestas(datos) {
  const cuerpo = {
    confirmacion: datos.confirmacion,
    fecha: datos.fecha,
    disponibilidad: datos.disponibilidad ? datos.disponibilidad.etiqueta : "",
    organizacion: datos.organizacion ? datos.organizacion.etiqueta : "",
    restricciones: datos.restricciones
  };

  const respuesta = await fetch(ENDPOINT_REGISTRO, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo)
  });

  if (!respuesta.ok) {
    throw new Error("El servidor rechazó el registro.");
  }
}

/* ------------------------------------------------------------
   REINICIO
   ------------------------------------------------------------ */
$botonReiniciar.addEventListener("click", () => {
  const confirmar = window.confirm("¿Reiniciar todo el trámite? Se perderán las respuestas.");
  if (!confirmar) return;

  estado.datos = {
    confirmacion: null,
    fecha: null,
    disponibilidad: null,
    organizacion: null,
    restricciones: ""
  };
  estado.intentosNo = 0;

  $botonReiniciar.classList.add("girando");
  window.setTimeout(() => $botonReiniciar.classList.remove("girando"), 400);

  irAPaso("intro");
});

/* ------------------------------------------------------------
   ARRANQUE
   ------------------------------------------------------------ */
dibujarPaso("intro");
$contenido.classList.add("entrando");
actualizarProgreso("intro");
programarAvisoPaciencia();
