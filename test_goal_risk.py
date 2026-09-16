from datetime import date, timedelta

from src.goal_risk_predictor import predict_goal_risk


def show_result(test_name, result):
    print("\n" + "=" * 60)
    print(f"TEST: {test_name}")
    print("=" * 60)

    print("Status:", result["status"])
    print("Risk Score:", result["risk_score"])
    print("Days Remaining:", result["days_remaining"])
    print("Plan Progress:", result["plan_progress"], "%")
    print(
        "Average Mission Completion:",
        result["average_completion"],
        "%"
    )
    print("Message:", result["message"])

    print("\nRisk Reasons:")

    if result["reasons"]:
        for reason in result["reasons"]:
            print("•", reason)
    else:
        print("• No major risk detected.")


print("\n🎯 GOAL RISK PREDICTOR TEST")


# ==================================================
# TEST 1: ON TRACK
# ==================================================

on_track_deadline = (
    date.today() + timedelta(days=180)
).isoformat()

on_track_result = predict_goal_risk(
    deadline=on_track_deadline,
    completed_steps=8,
    total_steps=8,
    action_dna={
        "average_completion": 95
    }
)

show_result(
    "ON TRACK",
    on_track_result
)


# ==================================================
# TEST 2: NEEDS ATTENTION
# ==================================================

attention_deadline = (
    date.today() + timedelta(days=20)
).isoformat()

attention_result = predict_goal_risk(
    deadline=attention_deadline,
    completed_steps=3,
    total_steps=8,
    action_dna={
        "average_completion": 60
    }
)

show_result(
    "NEEDS ATTENTION",
    attention_result
)


# ==================================================
# TEST 3: AT RISK
# ==================================================

at_risk_deadline = (
    date.today() + timedelta(days=5)
).isoformat()

at_risk_result = predict_goal_risk(
    deadline=at_risk_deadline,
    completed_steps=0,
    total_steps=8,
    action_dna={
        "average_completion": 30
    }
)

show_result(
    "AT RISK",
    at_risk_result
)


print("\n" + "=" * 60)
print("✅ GOAL RISK PREDICTOR TEST COMPLETE")
print("=" * 60)