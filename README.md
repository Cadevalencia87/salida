# Asunto pendiente

Página estática (HTML + CSS + JS, sin backend) para que Less confirme el
día y disponibilidad de una salida, con tono divertido y sin revelar
el plan.

## Archivos

```
/index.html   → estructura de la página
/style.css    → todo el diseño visual
/script.js    → la lógica: pasos, animaciones, botón "No" travieso
/README.md    → este archivo
```

No hay build ni dependencias que instalar. Es HTML/CSS/JS plano.

## Probarlo en tu computadora

No necesitas nada especial. Dos opciones:

1. **La más simple**: doble clic en `index.html` y se abre en tu navegador.
2. Si prefieres verlo como si ya estuviera en internet (recomendado,
   porque algunos detalles de fuentes cargan mejor así): instala la
   extensión "Live Server" en VS Code, clic derecho sobre `index.html`
   → "Open with Live Server".

## a) Crear un repositorio en GitHub

1. Entra a [github.com](https://github.com) y da clic en **"New repository"**.
2. Ponle un nombre (puede ser privado si prefieres que nadie más lo vea
   antes de tiempo, por ejemplo `asunto-pendiente`).
3. Déjalo vacío, sin README ni .gitignore automáticos (para no chocar
   con los archivos que ya tienes).
4. Da clic en **"Create repository"**.

## b) Subir los archivos

**Sin usar terminal (más fácil):**

1. En la página de tu repo recién creado, clic en **"uploading an
   existing file"** (o "Add file" → "Upload files").
2. Arrastra los 4 archivos (`index.html`, `style.css`, `script.js`,
   `README.md`).
3. Escribe un mensaje como "primera versión" y clic en **"Commit
   changes"**.

**Con git en terminal:**

```bash
cd asunto-pendiente
git init
git add .
git commit -m "primera versión"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPO.git
git push -u origin main
```

## c) Desplegar en Render como Static Site

1. Entra a [render.com](https://render.com) y crea una cuenta gratis
   (puedes entrar directo con GitHub).
2. Clic en **"New +"** → **"Static Site"** (no "Web Service" — esta
   página no necesita servidor).
3. Conecta tu repositorio `asunto-pendiente`.

## d) Configuración exacta en Render

| Campo | Valor |
|---|---|
| **Name** | el que quieras, ej. `asunto-pendiente` (define tu URL) |
| **Branch** | `main` |
| **Root Directory** | vacío (los archivos están en la raíz del repo) |
| **Build Command** | vacío — no hace falta, no hay nada que compilar |
| **Publish Directory** | `.` (un punto, significa "esta misma carpeta") |

Clic en **"Create Static Site"**. En 1-2 minutos te da un link tipo
`https://asunto-pendiente.onrender.com` — ese es el que le mandas.

A diferencia de un "Web Service", un Static Site en el plan gratis de
Render **no se duerme** por inactividad — carga rápido siempre.

## e) Cómo modificar los textos después

Todo el texto que ella ve está en `script.js`, dentro de funciones que
empiezan con `dibujar` (por ejemplo `dibujarIntro()`, `dibujarFecha()`).
Busca el texto entre comillas o backticks y cámbialo directamente.

Ejemplos rápidos:

- Frase de la pantalla inicial → dentro de `dibujarIntro()`, la línea
  con `"Ok, tenemos un asunto importante..."`.
- Mensajes del botón "No" → arriba del archivo, en la lista
  `MENSAJES_NO`.
- Opciones y respuestas de disponibilidad → en la lista
  `DISPONIBILIDAD`.
- Opciones y respuestas sobre organización → en la lista
  `ORGANIZACION`.

Después de editar, vuelve a subir el archivo a GitHub (mismo proceso
del paso b) y Render actualiza la página sola en 1-2 minutos.

## Conectar el envío de respuestas (opcional)

Ahora mismo las respuestas se recopilan solo en la página, y ella ve
el resumen, pero a ti no te llegan a ningún lado. Si quieres que te
lleguen por correo automáticamente, sin programar un backend:

1. Entra a [web3forms.com](https://web3forms.com) (gratis, sin
   backend) y crea un "Access Key" con tu correo.
2. Abre `script.js` y busca estas tres líneas, casi al principio del
   archivo:

   ```js
   const ENVIO_ACTIVADO = false;
   const ENVIO_ENDPOINT = "";
   const ENVIO_LLAVE_PUBLICA = "";
   ```

3. Cámbialas por:

   ```js
   const ENVIO_ACTIVADO = true;
   const ENVIO_ENDPOINT = "https://api.web3forms.com/submit";
   const ENVIO_LLAVE_PUBLICA = "tu-access-key-aquí";
   ```

4. Sube el archivo actualizado a GitHub.

Esa "access key" de Web3Forms es pública por diseño — está hecha para
vivir en el código del navegador, no expone tu cuenta ni tu correo.
No es una contraseña ni una llave privada, así que es seguro subirla
al repositorio tal cual.

Si prefieres Formspree o EmailJS en vez de Web3Forms, la idea es la
misma: la función `enviarRespuestas()` al final de `script.js` es el
único lugar que necesitas ajustar — cambia la URL y el formato del
cuerpo del mensaje según la documentación del servicio que elijas.

## Notas de diseño

- Paleta oscura cálida (negro-café, rojo brasa, acento dorado),
  pensada para sentirse como algo hecho a la medida, no como una
  plantilla.
- El botón "No" siempre tiene una salida real: tras varios intentos
  graciosos, el siguiente clic se respeta como una respuesta
  genuina — nunca la deja atrapada sin poder decir que no.
- Funciona con teclado (tab + enter) y respeta la preferencia de
  "reducir movimiento" del sistema operativo si está activada.
- El botón ↺ discreto, abajo a la derecha, reinicia todo el trámite
  por si se quieren probar las respuestas de nuevo antes de mandarlo.
