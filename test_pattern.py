from src.pattern_detector import detect_patterns


# Sample history data
history = [
    {
        "date": "2026-09-01",
        "completed": 2,
        "total": 2,
        "percentage": 100,
        "status": "Excellent"
    },
    {
        "date": "2026-09-02",
        "completed": 1,
        "total": 2,
        "percentage": 50,
        "status": "Good"
    },
    {
        "date": "2026-09-03",
        "completed": 2,
        "total": 2,
        "percentage": 100,
        "status": "Excellent"
    }
]


result = detect_patterns(history)


print("\n========== ACTION DNA PATTERN TEST ==========\n")

print(
    "Average Completion:",
    result["average_completion"],
    "%"
)

print(
    "Best Day:",
    result["best_day"]
)

print(
    "Weakest Day:",
    result["weakest_day"]
)

print("\nDetected Insights:")

for insight in result["insights"]:
    print("•", insight)

print("\n=============================================\n")