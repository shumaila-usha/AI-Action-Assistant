def detect_patterns(history):
    """
    Analyze multiple days of mission history
    and return useful performance patterns.
    """

    # =========================
    # NO HISTORY
    # =========================

    if not history:
        return {
            "average_completion": 0,
            "best_day": None,
            "weakest_day": None,
            "insights": [
                "Not enough progress data yet."
            ]
        }


    # =========================
    # COMPLETION PERCENTAGES
    # =========================

    percentages = [
        record.get("percentage", 0)
        for record in history
    ]

    average_completion = round(
        sum(percentages) / len(percentages)
    )


    # =========================
    # BEST AND WEAKEST DAYS
    # =========================

    best_day = max(
        history,
        key=lambda record: record.get(
            "percentage",
            0
        )
    )

    weakest_day = min(
        history,
        key=lambda record: record.get(
            "percentage",
            0
        )
    )


    insights = []


    # =========================
    # GENERAL PERFORMANCE
    # =========================

    if average_completion >= 85:

        insights.append(
            "Your overall mission consistency is excellent."
        )

    elif average_completion >= 65:

        insights.append(
            "Your overall progress is good, but there is room to improve consistency."
        )

    elif average_completion >= 40:

        insights.append(
            "Your progress is developing, but several missions are still being left incomplete."
        )

    else:

        insights.append(
            "Your current mission completion rate is low. Smaller daily workloads may help."
        )


    # =========================
    # PERFECT DAYS
    # =========================

    perfect_days = [
        record
        for record in history
        if record.get("percentage", 0) == 100
    ]

    if perfect_days:

        insights.append(
            f"You have completed all missions on {len(perfect_days)} day(s)."
        )


    # =========================
    # LOW PERFORMANCE DAYS
    # =========================

    low_days = [
        record
        for record in history
        if record.get("percentage", 0) < 50
    ]

    if low_days:

        insights.append(
            f"You had {len(low_days)} day(s) below 50% completion."
        )


    # =========================
    # WORKLOAD PATTERN
    # =========================

    small_workload = [
        record
        for record in history
        if record.get("total", 0) <= 3
    ]

    large_workload = [
        record
        for record in history
        if record.get("total", 0) > 3
    ]


    if small_workload and large_workload:

        small_average = round(
            sum(
                record.get(
                    "percentage",
                    0
                )
                for record in small_workload
            ) / len(small_workload)
        )


        large_average = round(
            sum(
                record.get(
                    "percentage",
                    0
                )
                for record in large_workload
            ) / len(large_workload)
        )


        if small_average > large_average + 10:

            insights.append(
                "You perform better when your daily mission load is 3 tasks or fewer."
            )

        elif large_average > small_average + 10:

            insights.append(
                "You are handling larger mission workloads surprisingly well."
            )


    # =========================
    # RECENT TREND
    # =========================

    if len(history) >= 3:

        recent = history[-3:]


        first_recent = recent[0].get(
            "percentage",
            0
        )


        last_recent = recent[-1].get(
            "percentage",
            0
        )


        if last_recent > first_recent:

            insights.append(
                "Your recent performance trend is improving."
            )

        elif last_recent < first_recent:

            insights.append(
                "Your recent completion rate has declined. Your next plan may need a lighter workload."
            )

        else:

            insights.append(
                "Your recent performance is stable."
            )


    # =========================
    # FINAL RESULT
    # =========================

    return {
        "average_completion":
            average_completion,

        "best_day": {
            "date": best_day.get("date"),
            "percentage": best_day.get(
                "percentage",
                0
            )
        },

        "weakest_day": {
            "date": weakest_day.get("date"),
            "percentage": weakest_day.get(
                "percentage",
                0
            )
        },

        "insights":
            insights
    }