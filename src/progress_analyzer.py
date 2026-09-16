def analyze_progress(completed, total):
    """
    Analyze daily mission performance.

    Returns:
    - completion percentage
    - performance status
    - short feedback message
    """

    if total <= 0:
        return {
            "percentage": 0,
            "status": "No Data",
            "message": "No missions are available to analyze."
        }

    percentage = round((completed / total) * 100)

    if percentage == 100:
        status = "Excellent"
        message = "Amazing work! You completed all of today's missions."

    elif percentage >= 75:
        status = "Very Good"
        message = "Strong progress. You are very close to completing today's plan."

    elif percentage >= 50:
        status = "Good"
        message = "Good progress. Complete one more mission to improve today's result."

    elif percentage > 0:
        status = "Needs Improvement"
        message = "You started well. Try reducing distractions and finish the next priority mission."

    else:
        status = "Not Started"
        message = "Your missions are ready. Start with the easiest important task."

    return {
        "percentage": percentage,
        "status": status,
        "message": message
    }