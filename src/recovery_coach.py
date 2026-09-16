def get_available_minutes(daily_time):
    """
    Convert the selected daily-time value into minutes.
    """

    time_map = {
        "30 minutes": 30,
        "1 hour": 60,
        "2 hours": 120,
        "3 or more hours": 180
    }

    return time_map.get(
        daily_time,
        30
    )


def generate_recovery_plan(
    goal,
    goal_risk,
    daily_time
):
    """
    Generate a small recovery plan based on
    the user's current goal-risk result.
    """

    available_minutes = get_available_minutes(
        daily_time
    )

    if not isinstance(
        goal_risk,
        dict
    ):

        return {
            "active": False,
            "mode": "Unavailable",
            "message":
                "The recovery coach needs a valid risk analysis.",
            "actions": []
        }

    status = goal_risk.get(
        "status",
        "On Track"
    )

    risk_score = goal_risk.get(
        "risk_score",
        0
    )

    reasons = goal_risk.get(
        "reasons",
        []
    )

    if not isinstance(
        reasons,
        list
    ):
        reasons = []

    # ==================================================
    # ON TRACK
    # ==================================================

    if status == "On Track":

        return {
            "active": False,
            "mode": "No Recovery Needed",
            "risk_status": status,
            "risk_score": risk_score,
            "message":
                "Your goal is currently on track. "
                "Continue following your daily missions.",
            "actions": []
        }

    # ==================================================
    # CHOOSE RECOVERY MODE
    # ==================================================

    if status == "At Risk":

        mode = "Priority Rescue"

        message = (
            "Your goal needs a focused recovery session. "
            "The coach has reduced everything to a few "
            "important actions you can complete today."
        )

        action_count = 3

    else:

        mode = "Progress Reset"

        message = (
            "A small adjustment can bring your goal "
            "back on track. Complete these focused "
            "recovery actions today."
        )

        action_count = 2

    minutes_per_action = max(
        available_minutes // action_count,
        5
    )

    recovery_actions = []

    # ==================================================
    # CREATE ACTIONS FROM RISK REASONS
    # ==================================================

    if any(
        "deadline" in reason.lower()
        for reason in reasons
    ):

        recovery_actions.append({
            "title":
                "Review the deadline and choose the most urgent milestone.",
            "duration":
                minutes_per_action,
            "purpose":
                "Protect the goal from deadline pressure."
        })

    if any(
        "action plan" in reason.lower()
        for reason in reasons
    ):

        recovery_actions.append({
            "title":
                "Complete the smallest unfinished action-plan step.",
            "duration":
                minutes_per_action,
            "purpose":
                "Create immediate visible progress."
        })

    if any(
        (
            "mission" in reason.lower() or
            "consistency" in reason.lower()
        )
        for reason in reasons
    ):

        recovery_actions.append({
            "title":
                "Complete the easiest important daily mission without interruption.",
            "duration":
                minutes_per_action,
            "purpose":
                "Rebuild daily consistency."
        })

    # ==================================================
    # ADD BACKUP ACTIONS WHEN REQUIRED
    # ==================================================

    backup_actions = [
        {
            "title":
                "Remove one distraction before beginning your next task.",
            "duration":
                minutes_per_action,
            "purpose":
                "Create a focused working environment."
        },
        {
            "title":
                f"Write the next clear action for your goal: {goal}",
            "duration":
                minutes_per_action,
            "purpose":
                "Remove uncertainty about what to do next."
        },
        {
            "title":
                "Review today's progress and prepare tomorrow's first task.",
            "duration":
                minutes_per_action,
            "purpose":
                "Prevent another delayed start."
        }
    ]

    for backup_action in backup_actions:

        if len(recovery_actions) >= action_count:
            break

        recovery_actions.append(
            backup_action
        )

    recovery_actions = recovery_actions[
        :action_count
    ]

    # ==================================================
    # CORRECT TOTAL DURATION
    # ==================================================

    used_minutes = sum(
        action["duration"]
        for action in recovery_actions
    )

    remaining_minutes = (
        available_minutes -
        used_minutes
    )

    if (
        recovery_actions and
        remaining_minutes > 0
    ):

        recovery_actions[-1]["duration"] += (
            remaining_minutes
        )

    return {
        "active": True,
        "mode": mode,
        "risk_status": status,
        "risk_score": risk_score,
        "available_minutes": available_minutes,
        "message": message,
        "actions": recovery_actions
    }