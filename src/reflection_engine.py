def generate_daily_reflection(
    goal,
    takeaways,
    completed_missions,
    total_missions
):
    """
    Generate a personalized end-of-day reflection
    from the user's mission progress and takeaways.
    """

    clean_takeaways = [
        takeaway.strip()
        for takeaway in takeaways
        if isinstance(takeaway, str)
        and takeaway.strip()
    ]

    if total_missions <= 0:
        completion_percentage = 0
    else:
        completion_percentage = round(
            (completed_missions / total_missions) * 100
        )

    if completion_percentage == 100:
        performance_message = (
            "You completed every mission today. "
            "Your consistency is moving you closer to your goal."
        )
        next_focus = (
            "Tomorrow, build on today's learning with "
            "one slightly more challenging mission."
        )

    elif completion_percentage >= 67:
        performance_message = (
            "You completed most of today's missions "
            "and made strong progress."
        )
        next_focus = (
            "Tomorrow, finish the remaining priority "
            "and continue your strongest learning area."
        )

    elif completion_percentage > 0:
        performance_message = (
            "You made a useful start today. "
            "Small progress still moves your goal forward."
        )
        next_focus = (
            "Tomorrow, begin with the easiest important "
            "mission to build momentum."
        )

    else:
        performance_message = (
            "No missions were completed today, "
            "but tomorrow gives you a fresh opportunity."
        )
        next_focus = (
            "Choose one short mission tomorrow "
            "and complete it before anything else."
        )

    if clean_takeaways:
        learning_summary = " ".join(clean_takeaways)
    else:
        learning_summary = (
            "No learning notes were added today. "
            "Add a short takeaway after each future mission."
        )

    return {
        "goal": goal,
        "completion_percentage": completion_percentage,
        "performance_message": performance_message,
        "learning_summary": learning_summary,
        "next_focus": next_focus,
        "motivation": (
            "Keep going—consistent daily action "
            "turns ambitious goals into real results."
        )
    }