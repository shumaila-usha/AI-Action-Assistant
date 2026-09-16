from datetime import date, datetime


def predict_goal_risk(
    deadline,
    completed_steps=0,
    total_steps=0,
    action_dna=None
):
    """
    Predict whether a user's goal is:
    - On Track
    - Needs Attention
    - At Risk
    """

    today = date.today()

    # ---------------------------------------------
    # READ DEADLINE
    # ---------------------------------------------

    try:
        deadline_date = datetime.strptime(
            deadline,
            "%Y-%m-%d"
        ).date()

        days_remaining = (
            deadline_date - today
        ).days

    except (ValueError, TypeError):
        deadline_date = None
        days_remaining = None

    # ---------------------------------------------
    # CALCULATE PLAN PROGRESS
    # ---------------------------------------------

    if total_steps > 0:
        plan_progress = round(
            (completed_steps / total_steps) * 100
        )
    else:
        plan_progress = 0

    # ---------------------------------------------
    # READ ACTION DNA
    # ---------------------------------------------

    average_completion = 0
    has_action_dna = False

    if (
        isinstance(action_dna, dict)
        and "average_completion" in action_dna
    ):
        average_completion = action_dna.get(
            "average_completion",
            0
        )

        has_action_dna = True

    # Make sure the percentage is valid
    try:
        average_completion = float(
            average_completion
        )
    except (ValueError, TypeError):
        average_completion = 0

    average_completion = max(
        0,
        min(average_completion, 100)
    )

    # ---------------------------------------------
    # CALCULATE BASE RISK SCORE
    # ---------------------------------------------

    risk_score = 0
    reasons = []

    # ---------------------------------------------
    # DEADLINE RISK
    # ---------------------------------------------

    if days_remaining is not None:

        if days_remaining < 0:
            risk_score += 100

            reasons.append(
                "The target deadline has passed."
            )

        elif days_remaining <= 7:
            risk_score += 40

            reasons.append(
                "The deadline is very close."
            )

        elif days_remaining <= 30:
            risk_score += 20

            reasons.append(
                "Less than one month remains."
            )

    # ---------------------------------------------
    # ACTION PLAN RISK
    # ---------------------------------------------

    if plan_progress < 25:
        risk_score += 25

        reasons.append(
            "Only a small part of the action plan is complete."
        )

    elif plan_progress < 60:
        risk_score += 10

        reasons.append(
            "The action plan needs more progress."
        )

    # ---------------------------------------------
    # ACTION DNA PROGRESS CREDIT
    # Completing missions reduces goal risk
    # ---------------------------------------------

    if has_action_dna:
        progress_credit = round(
            average_completion * 0.20
        )

        risk_score -= progress_credit

        if average_completion < 40:
            reasons.append(
                "Daily mission progress has started, "
                "but more consistency is needed."
            )

        elif average_completion < 70:
            reasons.append(
                "Daily mission consistency is improving."
            )

    # Keep risk score between 0 and 100
    risk_score = max(
        0,
        min(round(risk_score), 100)
    )

    # ---------------------------------------------
    # CHOOSE RISK STATUS
    # ---------------------------------------------

    if risk_score >= 60:
        status = "At Risk"

        message = (
            "Your goal needs immediate attention. "
            "Reduce distractions and complete the next "
            "important mission today."
        )

    elif risk_score >= 30:
        status = "Needs Attention"

        message = (
            "Your goal is still achievable, but your "
            "progress or consistency needs improvement."
        )

    else:
        status = "On Track"

        if has_action_dna:
            message = (
                "Your current progress pattern is healthy. "
                "Continue completing your daily missions."
            )

        else:
            message = (
                "Your goal has enough time available. "
                "Complete your first daily missions so the "
                "assistant can begin learning your progress pattern."
            )

    # ---------------------------------------------
    # RETURN RESULT
    # ---------------------------------------------

    return {
        "status": status,
        "risk_score": risk_score,
        "message": message,
        "days_remaining": days_remaining,
        "plan_progress": plan_progress,
        "average_completion": round(
            average_completion
        ),
        "has_action_dna": has_action_dna,
        "reasons": reasons
    }