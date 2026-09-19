import os
import sqlite3
from datetime import datetime
from functools import wraps

from flask import Flask, request, jsonify, render_template, g

app = Flask(__name__)

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "salida.db")

# Usuario y contraseña del panel /admin.
# En local usan estos valores por defecto; en Render los defines como
# variables de entorno ADMIN_USER y ADMIN_PASS (ver README).
ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "cambia-esta-clave")


def get_db():
    if "db" not in g:
        g.db = sqlite3.connect(DB_PATH)
        g.db.row_factory = sqlite3.Row
    return g.db


@app.teardown_appcontext
def cerrar_db(exception):
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_db():
    db = sqlite3.connect(DB_PATH)
    db.execute(
        """
        CREATE TABLE IF NOT EXISTS respuestas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fecha_hora_registro TEXT NOT NULL,
            confirmacion TEXT,
            fecha_elegida TEXT,
            disponibilidad TEXT,
            organizacion TEXT,
            restricciones TEXT
        )
        """
    )
    db.commit()
    db.close()


def requiere_auth(f):
    @wraps(f)
    def decorada(*args, **kwargs):
        auth = request.authorization
        if not auth or auth.username != ADMIN_USER or auth.password != ADMIN_PASS:
            return (
                "Acceso restringido.",
                401,
                {"WWW-Authenticate": 'Basic realm="Panel de administración"'},
            )
        return f(*args, **kwargs)

    return decorada


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/registrar", methods=["POST"])
def registrar():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"ok": False, "error": "No se recibieron datos."}), 400

    confirmacion = (data.get("confirmacion") or "").strip()
    if confirmacion not in ("si", "no"):
        return jsonify({"ok": False, "error": "Confirmación inválida."}), 400

    def limpiar(campo, limite=500):
        v = data.get(campo, "")
        if not isinstance(v, str):
            v = str(v)
        return v.strip()[:limite]

    fecha_hora_registro = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    db = get_db()
    db.execute(
        """
        INSERT INTO respuestas
            (fecha_hora_registro, confirmacion, fecha_elegida, disponibilidad, organizacion, restricciones)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            fecha_hora_registro,
            confirmacion,
            limpiar("fecha", 20),
            limpiar("disponibilidad"),
            limpiar("organizacion"),
            limpiar("restricciones", 2000),
        ),
    )
    db.commit()

    return jsonify({"ok": True, "fecha_hora": fecha_hora_registro})


@app.route("/admin")
@requiere_auth
def admin():
    db = get_db()
    filas = db.execute(
        "SELECT * FROM respuestas ORDER BY id DESC"
    ).fetchall()

    total = len(filas)
    confirmadas = sum(1 for f in filas if f["confirmacion"] == "si")

    def contar_por(campo):
        conteo = {}
        for f in filas:
            valor = f[campo] or "—"
            conteo[valor] = conteo.get(valor, 0) + 1
        return sorted(conteo.items(), key=lambda x: x[1], reverse=True)

    stats = {
        "total": total,
        "confirmadas": confirmadas,
        "disponibilidad": contar_por("disponibilidad"),
        "organizacion": contar_por("organizacion"),
    }

    return render_template("admin.html", filas=filas, stats=stats)


init_db()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
