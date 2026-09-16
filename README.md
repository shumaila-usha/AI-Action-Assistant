# AI Action Assistant

AI Action Assistant transforms ambitious goals into structured action plans, personalized daily missions, progress insights, and focused execution.

## Key Features

- AI-generated SMART action plans
- Multiple-goal management
- Adaptive daily missions
- Mission takeaway tracking
- Action-plan and mission progress persistence
- Goal-risk prediction and recovery coaching
- Focus timer and focus analytics
- Daily performance history
- Seven-day progress charts
- Streaks and achievements
- Action DNA and personalized insights
- End-of-day reflections
- Weekly progress reports
- Smart browser reminders
- Advanced text-report downloads
- JSON backup and restore
- Secure user registration and login
- Per-user synchronized data
- Profile and password management
- Privacy-safe account deletion

## Technology Stack

- Python
- Flask
- SQLite
- Google Gemini API
- HTML
- CSS
- JavaScript
- Gunicorn

## Project Structure

```text
AI_Action_Assistant/
|-- app.py
|-- requirements.txt
|-- .env.example
|-- src/
|   |-- action_planner.py
|   |-- goal_risk_predictor.py
|   |-- mission_engine.py
|   |-- pattern_detector.py
|   |-- progress_analyzer.py
|   |-- recovery_coach.py
|   |-- reflection_engine.py
|   `-- weekly_report.py
|-- static/
|   |-- auth.css
|   |-- style.css
|   `-- *.js
`-- templates/
    |-- index.html
    |-- login.html
    |-- register.html
    |-- account.html
    `-- account_deleted.html
```

## Local Installation

1. Clone the repository and enter the project directory.

```bash
git clone YOUR_REPOSITORY_URL
cd AI_Action_Assistant
```

2. Create a virtual environment.

```bash
python -m venv venv
```

3. Activate it on Windows.

```powershell
.\venv\Scripts\Activate.ps1
```

4. Install dependencies.

```bash
pip install -r requirements.txt
```

5. Copy `.env.example` to `.env` and add your own credentials.

```env
GEMINI_API_KEY=your-gemini-api-key
FLASK_SECRET_KEY=your-long-random-secret
```

6. Start the application.

```bash
python app.py
```

7. Open `http://127.0.0.1:5000` in a browser.

## Privacy and Security

- Passwords are securely hashed.
- User data is separated by account.
- API keys are loaded from environment variables.
- Local databases and `.env` files are excluded from Git.
- Sensitive account actions require password confirmation.
- Account deletion removes the selected user's synchronized data.

## Production

The application includes Gunicorn for deployment on a Linux hosting platform:

```bash
gunicorn app:app
```

Production deployments must define `GEMINI_API_KEY` and `FLASK_SECRET_KEY` as private environment variables.

## Future Improvements

- Email verification
- Password-reset email workflow
- PostgreSQL production database
- Automated testing and continuous integration
- Mobile application support

## Author

Developed by **Shumaila** as a practical AI productivity and goal-execution project.

## License

This project is intended for educational and portfolio use.
