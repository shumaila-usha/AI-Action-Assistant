from src.mission_engine import generate_daily_missions


def run_test(name, average_completion, history_days):
    print("\n" + "=" * 60)
    print(f"TEST: {name}")
    print("=" * 60)

    action_dna = {
        "average_completion": average_completion,
        "best_day": {
            "date": "2026-09-01",
            "percentage": 100
        },
        "weakest_day": {
            "date": "2026-09-02",
            "percentage": average_completion
        },
        "insights": []
    }

    result = generate_daily_missions(
        goal="i want to get job in us company",
        daily_time="30 minutes",
        experience_level="Beginner",
        action_dna=action_dna,
        history_days=history_days
    )

    print("Average Completion:", average_completion, "%")
    print("History Days:", history_days)
    print("Adaptive Mode:", result["adaptation_mode"])
    print("Message:", result["adaptation_message"])
    print("Mission Count:", result["mission_count"])
    print("Total Time:", result["total_time"], "minutes")

    print("\nGenerated Missions:")

    for mission in result["missions"]:
        print(
            f'{mission["id"]}. '
            f'{mission["title"]} '
            f'({mission["duration"]} min)'
        )


print("\n")
print("🧬 ADAPTIVE MISSION ENGINE TEST")
print("=" * 60)


# --------------------------------------------------
# TEST 1
# BUILDING DNA
# Less than 3 history days
# --------------------------------------------------

run_test(
    name="BUILDING DNA TEST",
    average_completion=100,
    history_days=1
)


# --------------------------------------------------
# TEST 2
# RECOVERY MODE
# Average below 40%
# --------------------------------------------------

run_test(
    name="RECOVERY MODE TEST",
    average_completion=30,
    history_days=3
)


# --------------------------------------------------
# TEST 3
# CONSISTENCY MODE
# Average between 40% and 74%
# --------------------------------------------------

run_test(
    name="CONSISTENCY MODE TEST",
    average_completion=60,
    history_days=3
)


# --------------------------------------------------
# TEST 4
# GROWTH MODE
# Average between 75% and 89%
# --------------------------------------------------

run_test(
    name="GROWTH MODE TEST",
    average_completion=82,
    history_days=3
)


# --------------------------------------------------
# TEST 5
# CHALLENGE MODE
# Average 90% or higher
# --------------------------------------------------

run_test(
    name="CHALLENGE MODE TEST",
    average_completion=95,
    history_days=3
)


print("\n" + "=" * 60)
print("✅ ADAPTIVE MISSION TEST COMPLETE")
print("=" * 60)