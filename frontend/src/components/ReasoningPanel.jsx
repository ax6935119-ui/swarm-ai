
export default function ReasoningPanel({

  agents

}) {

  if (!agents)
    return null;

  return (

    <div className="
      bg-white
      rounded-2xl
      shadow-lg
      p-6
    ">

      <h2 className="
        text-2xl
        font-bold
        mb-6
        text-slate-800
      ">

        🧠 AI Agent Reasoning

      </h2>

      <div className="
        grid
        grid-cols-1
        md:grid-cols-2
        gap-5
      ">

        {

          Object.entries(
            agents
          ).map(

            ([key, agent]) => (

              <div

                key={key}

                className="
                  border
                  rounded-xl
                  p-4
                  bg-slate-50
                "
              >

                <div className="
                  flex
                  justify-between
                  items-center
                  mb-3
                ">

                  <h3 className="
                    text-lg
                    font-bold
                    text-slate-800
                  ">

                    {agent.agent}

                  </h3>

                  <span className="
                    text-sm
                    bg-green-100
                    text-green-700
                    px-2
                    py-1
                    rounded-lg
                  ">

                    {agent.status}

                  </span>

                </div>

                <p className="
                  text-slate-600
                  text-sm
                  leading-relaxed
                  whitespace-pre-line
                ">

                  {agent.reasoning}

                </p>

              </div>
            )
          )
        }

      </div>

    </div>
  );
}

