# Asunto pendiente — con panel de administración

Versión con backend: la página se ve y se siente exactamente igual
que la estática, pero ahora cada vez que Less confirma, la respuesta
se guarda en una base de datos que tú consultas desde un panel
privado (`/admin`) con usuario y contraseña.

## Archivos

```
app.py                    → servidor Flask: sirve la página, guarda respuestas, panel /admin
requirements.txt          → dependencias
templates/index.html      → la página que ve Less (mismo diseño de siempre)
templates/admin.html      → el panel donde tú ves sus respuestas
static/style.css          → todo el diseño visual (sin cambios)
static/script.js          → la lógica de pasos + el envío al backend
salida.db                 → se crea sola al arrancar (no se sube a git)
```

## 1. Correrlo en tu PC

```bash
cd salida-less-app
python3 -m venv venv
source venv/bin/activate          # en Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 app.py
```

Abre `http://127.0.0.1:5000` — ahí ves la página tal cual la vería
Less. El panel está en `http://127.0.0.1:5000/admin` (usuario y
contraseña por defecto: `admin` / `cambia-esta-clave`, cámbialos
antes de desplegar — ver paso 3).

## 2. Subir a GitHub

1. Crea un repositorio nuevo en [github.com](https://github.com)
   (puede ser privado).
2. En la página del repo: **"Add file" → "Upload files"**, arrastra
   todo el contenido de esta carpeta (`app.py`, `requirements.txt`,
   `README.md`, y las carpetas `templates` y `static` completas).
3. Escribe un mensaje como "primera versión" y **"Commit changes"**.

## 3. Desplegar en Render

Esta vez el servicio debe ser **"Web Service"**, no "Static Site" —
porque ahora hay un backend corriendo.

1. Entra a [render.com](https://render.com), **"New +" → "Web
   Service"**, conecta tu repositorio.
2. Configura:

   | Campo | Valor |
   |---|---|
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `gunicorn app:app` |
   | **Instance Type** | `Free` |

3. Antes de crear el servicio, baja a **"Environment Variables"** y
   agrega:

   | Key | Value |
   |---|---|
   | `ADMIN_USER` | el usuario que tú quieras |
   | `ADMIN_PASS` | una contraseña que solo tú sepas |

4. **"Create Web Service"**. En unos minutos te da un link tipo
   `https://asunto-pendiente.onrender.com` — ese se lo mandas a Less.

**Nota sobre el plan gratis:** el servicio "duerme" tras ~15 minutos
sin uso; la primera visita después de eso tarda ~20-30 segundos en
despertar — no es un error, es normal.

**Sobre la base de datos:** en el plan gratis, `salida.db` puede
resetearse si Render reinicia el contenedor (nuevo despliegue, o
tras dormir mucho tiempo). Para una sola confirmación de una amiga,
normalmente no es problema porque el servicio no se reinicia solo
mientras está despierto — pero si quieres que quede 100% a prueba de
todo, se puede agregar un disco persistente gratuito de Render,
dímelo y lo dejamos configurado.

## 4. Ver las respuestas

Entra a `https://tu-link.onrender.com/admin`, mete el usuario y
contraseña que configuraste, y verás:

- Total de confirmaciones recibidas.
- Cuántas fueron "sí" (por diseño solo llegan las que sí confirmó,
  ya que un "no" real la regresa al inicio sin enviar nada).
- Un desglose de cuántas veces se eligió cada opción de
  disponibilidad y de organización.
- La tabla completa: fecha de registro, la fecha que ella eligió
  para salir, su disponibilidad, si dijo que ya tenía una idea o
  prefería sorprenderse, y lo que puso en "qué evitar".

## 5. Cómo modificar los textos después

Igual que antes: todo el texto que ella ve vive en
`static/script.js`, en las funciones que empiezan con `dibujar`.
Cambias el texto entre comillas, subes el archivo a GitHub, y Render
actualiza solo.

## Seguridad

- `/admin` exige usuario y contraseña (autenticación básica); sin
  eso, nadie ve las respuestas.
- El endpoint que recibe las respuestas valida que venga una
  confirmación válida y recorta cada campo a un límite razonable de
  caracteres, para evitar abusos.
- Las consultas a la base de datos usan parámetros (nunca se arma
  SQL a mano con lo que ella escribe), así que no hay riesgo de
  inyección SQL.
- Cambia `ADMIN_PASS` por algo que no sea el valor de ejemplo antes
  de desplegar.
