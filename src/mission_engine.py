from datetime import date


def generate_daily_missions(
    goal,
    daily_time,
    experience_level,
    action_dna=None,
    history_days=0
):
    """
    Create adaptive daily missions based on:

    - user's goal
    - available daily time
    - experience level
    - Action DNA performance
    - amount of history available
    """

    # ==================================================
    # AVAILABLE TIME
    # ==================================================

    time_map = {
        "30 minutes": 30,
        "1 hour": 60,
        "2 hours": 120,
        "3 or more hours": 180
    }

    total_minutes = time_map.get(
        daily_time,
        60
    )


    # ==================================================
    # BASE MISSION COUNT
    # ==================================================

    if total_minutes <= 30:
        base_mission_count = 2

    elif total_minutes <= 60:
        base_mission_count = 3

    elif total_minutes <= 120:
        base_mission_count = 4

    else:
        base_mission_count = 5


    mission_count = base_mission_count


    # ==================================================
    # EXPERIENCE LEVEL
    # ==================================================

    experience_lower = (
        experience_level or "Beginner"
    ).lower()


    if experience_lower == "advanced":

        difficulty = "Advanced"

    elif experience_lower == "intermediate":

        difficulty = "Intermediate"

    else:

        difficulty = "Beginner"


    # ==================================================
    # ACTION DNA ADAPTATION
    # ==================================================

    adaptation_mode = "Building DNA"

    adaptation_message = (
        "Complete more daily missions so the assistant "
        "can learn your working pattern."
    )


    # Only adapt after enough history exists.
    # This prevents one good or bad day from changing
    # the user's plan too aggressively.

    if (
        action_dna
        and history_days >= 3
    ):

        average_completion = action_dna.get(
            "average_completion",
            0
        )


        # ----------------------------------------------
        # LOW COMPLETION
        # ----------------------------------------------

        if average_completion < 40:

            adaptation_mode = "Recovery"

            mission_count = max(
                1,
                base_mission_count - 1
            )

            adaptation_message = (
                "Your recent completion rate is low, "
                "so today's workload has been reduced "
                "to help you rebuild consistency."
            )


        # ----------------------------------------------
        # MODERATE COMPLETION
        # ----------------------------------------------

        elif average_completion < 75:

            adaptation_mode = "Consistency"

            mission_count = base_mission_count

            adaptation_message = (
                "Your workload is staying balanced "
                "while you build stronger consistency."
            )


        # ----------------------------------------------
        # STRONG COMPLETION
        # ----------------------------------------------

        elif average_completion < 90:

            adaptation_mode = "Growth"

            mission_count = base_mission_count

            adaptation_message = (
                "Your recent performance is strong. "
                "Today's missions will keep you moving "
                "forward at a steady level."
            )


        # ----------------------------------------------
        # EXCELLENT COMPLETION
        # ----------------------------------------------

        else:

            adaptation_mode = "Challenge"

            mission_count = min(
                base_mission_count + 1,
                6
            )

            adaptation_message = (
                "Your Action DNA shows excellent "
                "consistency, so today's plan includes "
                "a slightly greater challenge."
            )


    # ==================================================
    # TIME PER MISSION
    # ==================================================

    time_per_mission = max(
        1,
        total_minutes // mission_count
    )


    goal_lower = goal.lower()


    # ==================================================
    # JOB / CAREER GOALS
    # ==================================================

    if any(
        word in goal_lower
        for word in [
            "job",
            "career",
            "company",
            "interview",
            "employment"
        ]
    ):

        mission_pool = [
            "Research 3 companies that match your target role",
            "Review one job description and identify required skills",
            "Improve one section of your resume",
            "Practice one common interview question",
            "Connect with one professional or recruiter",
            "Learn one skill commonly requested in your target jobs"
        ]


    # ==================================================
    # STUDY / LEARNING GOALS
    # ==================================================

    elif any(
        word in goal_lower
        for word in [
            "study",
            "learn",
            "course",
            "exam",
            "python",
            "coding",
            "programming"
        ]
    ):

        mission_pool = [
            "Study one important concept related to your goal",
            "Practice what you learned with a small exercise",
            "Review yesterday's learning",
            "Write short notes about today's topic",
            "Solve one practical problem",
            "Identify one topic you still need to improve"
        ]


    # ==================================================
    # BUSINESS GOALS
    # ==================================================

    elif any(
        word in goal_lower
        for word in [
            "business",
            "startup",
            "customer",
            "sales",
            "marketing"
        ]
    ):

        mission_pool = [
            "Research one competitor in your market",
            "Define one improvement for your product or service",
            "Identify one potential customer group",
            "Work on one marketing idea",
            "Review one business expense or opportunity",
            "Write one action that can increase future sales"
        ]


    # ==================================================
    # FITNESS / HEALTHY HABIT GOALS
    # ==================================================

    elif any(
        word in goal_lower
        for word in [
            "fitness",
            "exercise",
            "workout",
            "weight",
            "health"
        ]
    ):

        mission_pool = [
            "Complete a short exercise session",
            "Track today's activity",
            "Prepare one healthy meal choice",
            "Review your current progress",
            "Complete a stretching or mobility session",
            "Plan tomorrow's healthy activity"
        ]


    # ==================================================
    # GENERAL GOALS
    # ==================================================

    else:

        mission_pool = [
            f"Break '{goal}' into one smaller task",
            f"Complete one practical action toward '{goal}'",
            "Review your current progress",
            "Identify one obstacle slowing you down",
            "Choose your next most important action",
            "Write a short reflection on today's progress"
        ]


    # ==================================================
    # CREATE MISSIONS
    # ==================================================

    missions = []


    for i in range(mission_count):

        mission_title = mission_pool[
            i % len(mission_pool)
        ]


        # ----------------------------------------------
        # EXPERIENCE-BASED WORDING
        # ----------------------------------------------

        if difficulty == "Advanced":

            mission_title = (
                mission_title +
                " and document one measurable result"
            )

        elif difficulty == "Intermediate":

            mission_title = (
                mission_title +
                " and note one useful takeaway"
            )


        missions.append({
            "id": i + 1,
            "title": mission_title,
            "duration": time_per_mission,
            "completed": False
        })


    # ==================================================
    # RETURN DAILY MISSION DATA
    # ==================================================

    return {
        "date": str(date.today()),
        "goal": goal,
        "experience_level": experience_level,
        "difficulty": difficulty,
        "total_time": total_minutes,
        "mission_count": mission_count,
        "adaptation_mode": adaptation_mode,
        "adaptation_message": adaptation_message,
        "missions": missions
    }