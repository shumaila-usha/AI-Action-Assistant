import os
from datetime import date

from dotenv import load_dotenv
from google import genai
from google.genai import types
from pydantic import BaseModel


load_dotenv()


class ActionPlanResponse(BaseModel):
    steps: list[str]


def create_fallback_plan(
    goal,
    deadline,
    experience_level,
    daily_time
):
    """
    Create a basic plan when Gemini is unavailable.
    """

    return [
        f"Clearly define the final result for this goal: {goal}",
        f"Use {deadline} as your target completion date.",
        (
            f"Create a daily routine for a "
            f"{experience_level.lower()} with "
            f"{daily_time} available."
        ),
        "Break the main goal into small weekly milestones.",
        "Choose the most important task and begin today.",
        (
            "Prepare the resources and skills needed "
            "for each milestone."
        ),
        (
            "Review your progress every week and "
            "solve any difficulties."
        ),
        f"Complete the remaining tasks before {deadline}."
    ]


def generate_action_plan(
    goal,
    deadline,
    experience_level,
    daily_time
):
    """
    Generate a personalized action plan using Gemini AI.
    """

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        return create_fallback_plan(
            goal,
            deadline,
            experience_level,
            daily_time
        )

    today = date.today().isoformat()

    prompt = f"""
You are an expert goal-planning assistant.

Create exactly 8 clear, realistic, and personalized
action steps.

User details:
Goal: {goal}
Current date: {today}
Target deadline: {deadline}
Experience level: {experience_level}
Available daily time: {daily_time}

Timeline rules:
- Treat {today} as the current date.
- Treat {deadline} as the final deadline.
- Never create a milestone before {today}.
- Never create a milestone after {deadline}.
- Every date must fall between {today} and {deadline}.
- Use only the correct years shown in this goal period.
- Never invent a past year.
- If mentioning a month, make sure it belongs to the
  correct year within the goal period.

Planning requirements:
- Adapt every step to the user's exact goal.
- Keep every step practical and specific.
- Arrange all steps in the correct chronological order.
- Respect the experience level and available daily time.
- Include useful milestones and progress reviews.
- Prepare the user for the final deadline.
- Each step must contain one or two concise sentences.
- Return exactly 8 steps.
"""

    try:
        client = genai.Client(api_key=api_key)

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ActionPlanResponse
            )
        )

        result = ActionPlanResponse.model_validate_json(
            response.text
        )

        if len(result.steps) != 8:
            raise ValueError(
                "Gemini did not return exactly 8 steps."
            )

        return result.steps

    except Exception as error:
        print(f"Gemini API error: {error}")

        return create_fallback_plan(
            goal,
            deadline,
            experience_level,
            daily_time
        )