import json
import os
import secrets
import sqlite3
from functools import wraps
from pathlib import Path

from flask import (
    Flask,
    abort,
    flash,
    g,
    jsonify,
    redirect,
    render_template,
    request,
    session,
    url_for,
)
from werkzeug.security import check_password_hash, generate_password_hash

from src.action_planner import generate_action_plan
from src.goal_risk_predictor import predict_goal_risk
from src.mission_engine import generate_daily_missions
from src.pattern_detector import detect_patterns
from src.progress_analyzer import analyze_progress
from src.recovery_coach import generate_recovery_plan
from src.reflection_engine import generate_daily_reflection
from src.weekly_report import generate_weekly_report


BASE_DIR = Path(__file__).resolve().parent
DATABASE_PATH = BASE_DIR / "ai_action_assistant.db"

app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get(
        "FLASK_SECRET_KEY",
        "ai-action-assistant-local-development-key-change-before-deployment",
    ),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
)


def get_db():
    """Open one SQLite connection for the current request."""
    if "db" not in g:
        g.db = sqlite3.connect(DATABASE_PATH)
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(error=None):
    """Close the request database connection."""
    database = g.pop("db", None)
    if database is not None:
        database.close()


def initialize_database():
    """Create the users table automatically on first run."""
    database = sqlite3.connect(DATABASE_PATH)
    try:
        database.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        database.execute(
            """
            CREATE TABLE IF NOT EXISTS user_data (
                user_id INTEGER PRIMARY KEY,
                data_json TEXT NOT NULL DEFAULT '{}',
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
            """
        )
        database.commit()
    finally:
        database.close()


initialize_database()


def login_required(view):
    """Require a signed-in user for pages and API routes."""
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if session.get("user_id") is None:
            if request.is_json or request.path != "/":
                return jsonify({
                    "success": False,
                    "message": "Your session expired. Please sign in again.",
                }), 401
            return redirect(url_for("login"))
        return view(*args, **kwargs)

    return wrapped_view


def csrf_token():
    """Return the current session's anti-forgery token."""
    token = session.get("csrf_token")
    if not token:
        token = secrets.token_urlsafe(32)
        session["csrf_token"] = token
    return token


def require_valid_csrf():
    """Reject a forged or stale HTML form submission."""
    expected = session.get("csrf_token", "")
    submitted = request.form.get("csrf_token", "")
    if not expected or not submitted or not secrets.compare_digest(expected, submitted):
        abort(400, description="The security token is invalid. Refresh the page and try again.")


@app.context_processor
def inject_template_helpers():
    user = None
    user_id = session.get("user_id")
    if user_id is not None:
        user = get_db().execute(
            "SELECT id, name, email FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()
    return {"current_user": user, "csrf_token": csrf_token}


@app.route("/register", methods=["GET", "POST"])
def register():
    if session.get("user_id") is not None:
        return redirect(url_for("home"))

    if request.method == "POST":
        require_valid_csrf()
        name = request.form.get("name", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        confirm_password = request.form.get("confirm_password", "")

        error = None
        if len(name) < 2:
            error = "Please enter your full name."
        elif "@" not in email or "." not in email.rsplit("@", 1)[-1]:
            error = "Please enter a valid email address."
        elif len(password) < 8:
            error = "Password must contain at least 8 characters."
        elif password != confirm_password:
            error = "The passwords do not match."

        if error is None:
            database = get_db()
            try:
                cursor = database.execute(
                    "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
                    (name, email, generate_password_hash(password)),
                )
                database.commit()
                session.clear()
                session["user_id"] = cursor.lastrowid
                flash("Your account was created successfully.", "success")
                return redirect(url_for("home"))
            except sqlite3.IntegrityError:
                error = "An account with this email already exists."

        flash(error, "error")

    return render_template("register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if session.get("user_id") is not None:
        return redirect(url_for("home"))

    if request.method == "POST":
        require_valid_csrf()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        user = get_db().execute(
            "SELECT * FROM users WHERE email = ?",
            (email,),
        ).fetchone()

        if user is None or not check_password_hash(user["password_hash"], password):
            flash("Incorrect email address or password.", "error")
        else:
            session.clear()
            session["user_id"] = user["id"]
            flash("Welcome back, " + user["name"] + "!", "success")
            return redirect(url_for("home"))

    return render_template("login.html")


@app.route("/logout", methods=["POST"])
@login_required
def logout():
    require_valid_csrf()
    session.clear()
    flash("You have been logged out safely.", "success")
    return redirect(url_for("login"))


@app.route("/account", methods=["GET"])
@login_required
def account():
    return render_template("account.html")


@app.route("/account/profile", methods=["POST"])
@login_required
def update_profile():
    require_valid_csrf()
    name = request.form.get("name", "").strip()

    if len(name) < 2 or len(name) > 80:
        flash("Your name must contain between 2 and 80 characters.", "error")
        return redirect(url_for("account"))

    database = get_db()
    database.execute(
        "UPDATE users SET name = ? WHERE id = ?",
        (name, session["user_id"]),
    )
    database.commit()
    flash("Your profile name was updated successfully.", "success")
    return redirect(url_for("account"))


@app.route("/account/password", methods=["POST"])
@login_required
def change_password():
    require_valid_csrf()
    current_password = request.form.get("current_password", "")
    new_password = request.form.get("new_password", "")
    confirm_password = request.form.get("confirm_password", "")

    user = get_db().execute(
        "SELECT password_hash FROM users WHERE id = ?",
        (session["user_id"],),
    ).fetchone()

    if user is None or not check_password_hash(user["password_hash"], current_password):
        flash("Your current password is incorrect.", "error")
    elif len(new_password) < 8:
        flash("Your new password must contain at least 8 characters.", "error")
    elif new_password == current_password:
        flash("Choose a new password that is different from your current password.", "error")
    elif new_password != confirm_password:
        flash("The new passwords do not match.", "error")
    else:
        database = get_db()
        database.execute(
            "UPDATE users SET password_hash = ? WHERE id = ?",
            (generate_password_hash(new_password), session["user_id"]),
        )
        database.commit()
        flash("Your password was changed successfully.", "success")

    return redirect(url_for("account"))


@app.route("/account/delete", methods=["POST"])
@login_required
def delete_account():
    require_valid_csrf()
    password = request.form.get("password", "")
    confirmation = request.form.get("confirmation", "").strip()

    database = get_db()
    user = database.execute(
        "SELECT password_hash FROM users WHERE id = ?",
        (session["user_id"],),
    ).fetchone()

    if user is None or not check_password_hash(user["password_hash"], password):
        flash("Your password is incorrect. Your account was not deleted.", "error")
        return redirect(url_for("account"))
    if confirmation != "DELETE":
        flash('Type DELETE exactly to confirm permanent account deletion.', "error")
        return redirect(url_for("account"))

    user_id = session["user_id"]
    database.execute("DELETE FROM user_data WHERE user_id = ?", (user_id,))
    database.execute("DELETE FROM users WHERE id = ?", (user_id,))
    database.commit()
    session.clear()
    return render_template("account_deleted.html")


@app.route("/api/user-data", methods=["GET"])
@login_required
def get_user_data():
    """Return only the signed-in user's synchronized application data."""
    record = get_db().execute(
        "SELECT data_json, updated_at FROM user_data WHERE user_id = ?",
        (session["user_id"],),
    ).fetchone()

    if record is None:
        return jsonify({
            "success": True,
            "has_data": False,
            "data": {},
            "updated_at": None,
        })

    try:
        saved_data = json.loads(record["data_json"])
    except (json.JSONDecodeError, TypeError):
        saved_data = {}

    if not isinstance(saved_data, dict):
        saved_data = {}

    return jsonify({
        "success": True,
        "has_data": True,
        "data": saved_data,
        "updated_at": record["updated_at"],
    })


@app.route("/api/user-data", methods=["PUT"])
@login_required
def save_user_data():
    """Store a validated browser snapshot for only the signed-in user."""
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({
            "success": False,
            "message": "Invalid synchronization data.",
        }), 400

    saved_data = payload.get("data")
    if not isinstance(saved_data, dict):
        return jsonify({
            "success": False,
            "message": "Synchronized data must be an object.",
        }), 400

    clean_data = {}
    for key, value in saved_data.items():
        if not isinstance(key, str) or len(key) > 300:
            continue
        if value is None:
            clean_data[key] = None
        elif isinstance(value, str):
            clean_data[key] = value

    encoded_data = json.dumps(clean_data, ensure_ascii=False)
    if len(encoded_data.encode("utf-8")) > 2_000_000:
        return jsonify({
            "success": False,
            "message": "The synchronized data is too large.",
        }), 413

    database = get_db()
    database.execute(
        """
        INSERT INTO user_data (user_id, data_json, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            data_json = excluded.data_json,
            updated_at = CURRENT_TIMESTAMP
        """,
        (session["user_id"], encoded_data),
    )
    database.commit()

    return jsonify({
        "success": True,
        "message": "Your account data was synchronized.",
    })


# ==================================================
# HOME PAGE
# ==================================================

@app.route("/", methods=["GET", "POST"])
@login_required
def home():

    goal = ""
    deadline = ""
    experience_level = ""
    daily_time = ""

    action_plan = []
    daily_missions = None
    progress_analysis = None
    action_dna = None
    history_days = 0
    goal_risk = None
    recovery_plan = None

    if request.method == "POST":

        goal = request.form.get(
            "goal",
            ""
        ).strip()

        deadline = request.form.get(
            "deadline",
            ""
        )

        experience_level = request.form.get(
            "experience_level",
            ""
        )

        daily_time = request.form.get(
            "daily_time",
            ""
        )

        history_json = request.form.get(
            "performance_history",
            "[]"
        )

        saved_action_plan_json = request.form.get(
            "saved_action_plan",
            "[]"
        )

        try:
            history = json.loads(history_json)

            if not isinstance(history, list):
                history = []

        except (json.JSONDecodeError, TypeError):
            history = []

        history = [
            record
            for record in history
            if isinstance(record, dict)
        ]

        history_days = len(history)

        try:
            saved_action_plan = json.loads(saved_action_plan_json)
        except (json.JSONDecodeError, TypeError):
            saved_action_plan = []

        if not isinstance(saved_action_plan, list):
            saved_action_plan = []

        saved_action_plan = [
            step.strip()[:1000]
            for step in saved_action_plan[:20]
            if isinstance(step, str) and step.strip()
        ]

        if history:
            action_dna = detect_patterns(history)

        if goal:

            if saved_action_plan:
                action_plan = saved_action_plan
            else:
                action_plan = generate_action_plan(
                    goal,
                    deadline,
                    experience_level,
                    daily_time
                )

            daily_missions = generate_daily_missions(
                goal,
                daily_time,
                experience_level,
                action_dna=action_dna,
                history_days=history_days
            )

            progress_analysis = analyze_progress(
                completed=0,
                total=len(daily_missions["missions"])
            )

            goal_risk = predict_goal_risk(
                deadline=deadline,
                completed_steps=0,
                total_steps=len(action_plan),
                action_dna=action_dna
            )

            recovery_plan = generate_recovery_plan(
                goal=goal,
                goal_risk=goal_risk,
                daily_time=daily_time
            )

    return render_template(
        "index.html",
        goal=goal,
        deadline=deadline,
        experience_level=experience_level,
        daily_time=daily_time,
        action_plan=action_plan,
        daily_missions=daily_missions,
        progress_analysis=progress_analysis,
        action_dna=action_dna,
        history_days=history_days,
        goal_risk=goal_risk,
        recovery_plan=recovery_plan
    )


# ==================================================
# ACTION DNA API
# ==================================================

@app.route("/analyze-action-dna", methods=["POST"])
@login_required
def analyze_action_dna():

    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "No data received."
            }), 400

        history = data.get(
            "history",
            []
        )

        if not isinstance(history, list):
            return jsonify({
                "success": False,
                "message": "History must be a list."
            }), 400

        history = [
            record
            for record in history
            if isinstance(record, dict)
        ]

        action_dna = detect_patterns(history)

        return jsonify({
            "success": True,
            "action_dna": action_dna,
            "history_days": len(history)
        })

    except Exception as error:
        print(
            "Action DNA Error:",
            error
        )

        return jsonify({
            "success": False,
            "message": "Could not analyze Action DNA."
        }), 500


# ==================================================
# LIVE GOAL RISK AND RECOVERY API
# ==================================================

@app.route("/predict-goal-risk", methods=["POST"])
@login_required
def predict_goal_risk_api():

    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": "No data received."
            }), 400

        goal = data.get(
            "goal",
            ""
        )

        deadline = data.get(
            "deadline",
            ""
        )

        daily_time = data.get(
            "daily_time",
            "30 minutes"
        )

        completed_steps = data.get(
            "completed_steps",
            0
        )

        total_steps = data.get(
            "total_steps",
            0
        )

        history = data.get(
            "history",
            []
        )

        if not isinstance(history, list):
            history = []

        history = [
            record
            for record in history
            if isinstance(record, dict)
        ]

        try:
            completed_steps = int(
                completed_steps
            )

        except (ValueError, TypeError):
            completed_steps = 0

        try:
            total_steps = int(
                total_steps
            )

        except (ValueError, TypeError):
            total_steps = 0

        completed_steps = max(
            completed_steps,
            0
        )

        total_steps = max(
            total_steps,
            0
        )

        action_dna = None

        if history:
            action_dna = detect_patterns(
                history
            )

        risk_result = predict_goal_risk(
            deadline=deadline,
            completed_steps=completed_steps,
            total_steps=total_steps,
            action_dna=action_dna
        )

        recovery_plan = generate_recovery_plan(
            goal=goal,
            goal_risk=risk_result,
            daily_time=daily_time
        )

        return jsonify({
            "success": True,
            "goal_risk": risk_result,
            "recovery_plan": recovery_plan
        })

    except Exception as error:
        print(
            "Goal Risk and Recovery Error:",
            error
        )

        return jsonify({
            "success": False,
            "message": (
                "Could not calculate goal risk "
                "and recovery plan."
            )
        }), 500


# ==================================================
# END-OF-DAY REFLECTION API
# ==================================================

@app.route("/generate-daily-reflection", methods=["POST"])
@login_required
def generate_daily_reflection_api():

    try:
        data = request.get_json(silent=True)

        if not data:
            return jsonify({
                "success": False,
                "message": (
                    "No reflection data was received."
                )
            }), 400

        goal = str(
            data.get("goal", "")
        ).strip()

        takeaways = data.get(
            "takeaways",
            []
        )

        if not isinstance(takeaways, list):
            takeaways = []

        completed_missions = int(
            data.get(
                "completed_missions",
                0
            )
        )

        total_missions = int(
            data.get(
                "total_missions",
                0
            )
        )

        reflection = generate_daily_reflection(
            goal=goal,
            takeaways=takeaways,
            completed_missions=completed_missions,
            total_missions=total_missions
        )

        return jsonify({
            "success": True,
            "reflection": reflection
        })

    except (TypeError, ValueError):
        return jsonify({
            "success": False,
            "message": "Invalid reflection data."
        }), 400

    except Exception as error:
        print(
            "Daily Reflection Error:",
            error
        )

        return jsonify({
            "success": False,
            "message": (
                "Could not generate your "
                "daily reflection."
            )
        }), 500


# ==================================================
# WEEKLY PROGRESS REPORT API
# ==================================================

@app.route("/generate-weekly-report", methods=["POST"])
@login_required
def generate_weekly_report_api():

    try:
        data = request.get_json(silent=True)

        if data is None:
            return jsonify({
                "success": False,
                "message": (
                    "No weekly progress data "
                    "was received."
                )
            }), 400

        performance_history = data.get(
            "performance_history",
            []
        )

        reflection_history = data.get(
            "reflection_history",
            []
        )

        if not isinstance(
            performance_history,
            list
        ):
            performance_history = []

        if not isinstance(
            reflection_history,
            list
        ):
            reflection_history = []

        performance_history = [
            record
            for record in performance_history
            if isinstance(record, dict)
        ]

        reflection_history = [
            record
            for record in reflection_history
            if isinstance(record, dict)
        ]

        weekly_report = generate_weekly_report(
            performance_history=
                performance_history,
            reflection_history=
                reflection_history
        )

        return jsonify({
            "success": True,
            "weekly_report": weekly_report
        })

    except Exception as error:
        print(
            "Weekly Report Error:",
            error
        )

        return jsonify({
            "success": False,
            "message": (
                "Could not generate the "
                "weekly progress report."
            )
        }), 500


# ==================================================
# RUN FLASK
# ==================================================

if __name__ == "__main__":
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")

