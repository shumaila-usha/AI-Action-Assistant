from datetime import date, datetime, timedelta


def parse_date(date_value):
    """
    Convert a YYYY-MM-DD string into a date object.
    """

    try:
        return datetime.strptime(
            str(date_value),
            "%Y-%m-%d"
        ).date()

    except (TypeError, ValueError):
        return None


def get_weekly_status(average_completion):
    """
    Return a weekly performance status.
    """

    if average_completion >= 85:
        return "Excellent"

    if average_completion >= 60:
        return "Good"

    if average_completion > 0:
        return "Needs Improvement"

    return "Not Started"


def get_next_week_focus(
    average_completion,
    weakest_day,
    reflection_history
):
    """
    Recommend the most useful focus for the next week.
    """

    if average_completion >= 85:
        return (
            "Maintain your strong consistency and add one "
            "slightly more challenging mission next week."
        )

    if average_completion >= 60:
        if weakest_day:
            return (
                "Improve consistency by completing one extra "
                f"mission on days similar to "
                f"{weakest_day['date']}."
            )

        return (
            "Complete one extra priority mission each day "
            "to improve weekly consistency."
        )

    if average_completion > 0:
        return (
            "Reduce distractions, begin with the easiest "
            "important mission, and keep the daily plan realistic."
        )

    if reflection_history:
        return (
            "Choose one small mission and complete it before "
            "adding more tasks."
        )

    return (
        "Start with one short mission today to begin building "
        "your weekly progress pattern."
    )


def collect_weekly_learning(
    reflection_history,
    start_date,
    end_date
):
    """
    Collect learning notes from reflections in the current week.
    """

    learning_notes = []

    if not isinstance(reflection_history, list):
        return learning_notes

    for reflection in reflection_history:
        if not isinstance(reflection, dict):
            continue

        reflection_date = parse_date(
            reflection.get("date")
        )

        if reflection_date is None:
            continue

        if not start_date <= reflection_date <= end_date:
            continue

        learning = str(
            reflection.get("learning", "")
        ).strip()

        if learning and learning not in learning_notes:
            learning_notes.append(learning)

    return learning_notes[:5]


def generate_weekly_report(
    performance_history,
    reflection_history=None
):
    """
    Generate a seven-day progress report.

    Parameters:
    - performance_history: daily mission history
    - reflection_history: saved daily reflections
    """

    if not isinstance(performance_history, list):
        performance_history = []

    if not isinstance(reflection_history, list):
        reflection_history = []

    end_date = date.today()
    start_date = end_date - timedelta(days=6)

    weekly_records = []

    for record in performance_history:
        if not isinstance(record, dict):
            continue

        record_date = parse_date(
            record.get("date")
        )

        if record_date is None:
            continue

        if not start_date <= record_date <= end_date:
            continue

        try:
            completed = int(
                record.get("completed", 0)
            )

            total = int(
                record.get("total", 0)
            )

            percentage = int(
                record.get("percentage", 0)
            )

        except (TypeError, ValueError):
            continue

        percentage = max(
            0,
            min(100, percentage)
        )

        weekly_records.append({
            "date": record_date.isoformat(),
            "completed": max(0, completed),
            "total": max(0, total),
            "percentage": percentage
        })

    weekly_records.sort(
        key=lambda item: item["date"]
    )

    if not weekly_records:
        return {
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "days_recorded": 0,
            "average_completion": 0,
            "completed_missions": 0,
            "total_missions": 0,
            "best_day": None,
            "weakest_day": None,
            "consistent_days": 0,
            "status": "Not Started",
            "learning_notes": [],
            "next_week_focus": (
                "Complete your first daily mission to begin "
                "building your weekly report."
            )
        }

    total_percentage = sum(
        record["percentage"]
        for record in weekly_records
    )

    average_completion = round(
        total_percentage / len(weekly_records)
    )

    completed_missions = sum(
        record["completed"]
        for record in weekly_records
    )

    total_missions = sum(
        record["total"]
        for record in weekly_records
    )

    best_day = max(
        weekly_records,
        key=lambda item: item["percentage"]
    )

    weakest_day = min(
        weekly_records,
        key=lambda item: item["percentage"]
    )

    consistent_days = sum(
        1
        for record in weekly_records
        if record["percentage"] >= 75
    )

    learning_notes = collect_weekly_learning(
        reflection_history,
        start_date,
        end_date
    )

    status = get_weekly_status(
        average_completion
    )

    next_week_focus = get_next_week_focus(
        average_completion,
        weakest_day,
        reflection_history
    )

    return {
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "days_recorded": len(weekly_records),
        "average_completion": average_completion,
        "completed_missions": completed_missions,
        "total_missions": total_missions,
        "best_day": best_day,
        "weakest_day": weakest_day,
        "consistent_days": consistent_days,
        "status": status,
        "learning_notes": learning_notes,
        "next_week_focus": next_week_focus
    }