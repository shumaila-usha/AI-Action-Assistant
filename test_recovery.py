from src.recovery_coach import generate_recovery_plan


def show_recovery_result(
    test_name,
    result
):
    print("\n" + "=" * 60)
    print(f"TEST: {test_name}")
    print("=" * 60)

    print(
        "Recovery Active:",
        result["active"]
    )

    print(
        "Recovery Mode:",
        result["mode"]
    )

    print(
        "Message:",
        result["message"]
    )

    actions = result.get(
        "actions",
        []
    )

    print(
        "Action Count:",
        len(actions)
    )

    if actions:

        total_time = sum(
            action["duration"]
            for action in actions
        )

        print(
            "Total Recovery Time:",
            total_time,
            "minutes"
        )

        print("\nRecovery Actions:")

        for index, action in enumerate(
            actions,
            start=1
        ):

            print(
                f"{index}. {action['title']} "
                f"({action['duration']} min)"
            )

            print(
                "   Purpose:",
                action["purpose"]
            )

    else:

        print(
            "Recovery Actions: "
            "No recovery actions required."
        )


print("\n🛟 SMART RECOVERY COACH TEST")


# ==================================================
# TEST 1: ON TRACK
# ==================================================

on_track_risk = {
    "status": "On Track",
    "risk_score": 10,
    "reasons": [
        "The action plan needs more progress."
    ]
}

on_track_result = generate_recovery_plan(
    goal=
        "Get an AI job in a US company",
    goal_risk=
        on_track_risk,
    daily_time=
        "30 minutes"
)

show_recovery_result(
    "ON TRACK",
    on_track_result
)


# ==================================================
# TEST 2: NEEDS ATTENTION
# ==================================================

attention_risk = {
    "status": "Needs Attention",
    "risk_score": 45,
    "reasons": [
        "Less than one month remains.",
        "The action plan needs more progress.",
        "Daily mission consistency can improve."
    ]
}

attention_result = generate_recovery_plan(
    goal=
        "Get an AI job in a US company",
    goal_risk=
        attention_risk,
    daily_time=
        "1 hour"
)

show_recovery_result(
    "NEEDS ATTENTION",
    attention_result
)


# ==================================================
# TEST 3: AT RISK
# ==================================================

at_risk = {
    "status": "At Risk",
    "risk_score": 85,
    "reasons": [
        "The deadline is very close.",
        "Only a small part of the action plan is complete.",
        "Recent daily mission completion is low."
    ]
}

at_risk_result = generate_recovery_plan(
    goal=
        "Get an AI job in a US company",
    goal_risk=
        at_risk,
    daily_time=
        "30 minutes"
)

show_recovery_result(
    "AT RISK",
    at_risk_result
)


print("\n" + "=" * 60)
print("✅ SMART RECOVERY COACH TEST COMPLETE")
print("=" * 60)