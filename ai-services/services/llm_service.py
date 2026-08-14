from groq import Groq

from config.settings import GROQ_API_KEY

client = Groq(
    api_key=GROQ_API_KEY
)


def generate_reasoning(

    agent_name,

    decision,

    context
):

    try:

        disaster = context.get(
            "disaster",
            "Unknown"
        )

        severity = context.get(
            "severity",
            0
        )

        victims = context.get(
            "victims",
            0
        )

        agent_type = context.get(
            "agent_type",
            "general"
        )

        prompt = f"""

You are {agent_name} in an AI disaster management platform.

Disaster Type:
{disaster}

Severity:
{severity}/10

Victims:
{victims}

Decision:
{decision}

Generate professional emergency reasoning.

Format EXACTLY like this:

🚨 Situation:
...

🧠 Decision:
...

⚡ Action:
...

Keep it concise and realistic.
"""

        response = client.chat.completions.create(

            model="llama-3.3-70b-versatile",

            messages=[

                {
                    "role": "system",

                    "content":
                        "You are an advanced disaster response AI."
                },

                {
                    "role": "user",

                    "content":
                        prompt
                }
            ],

            temperature=0.7,

            max_tokens=250
        )

        return response.choices[0].message.content

    except Exception as e:

        print(
            "❌ LLM ERROR:",
            e
        )

        return f"""

🚨 Situation:
A {disaster} situation has been detected requiring emergency coordination.

🧠 Decision:
{decision}

⚡ Action:
Emergency protocols activated for affected civilians.
"""