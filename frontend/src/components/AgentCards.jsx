export default function AgentCards({

  data

}) {

  const agents =
    data?.agents || {};

  return (

    <div className="
      grid
      grid-cols-1
      md:grid-cols-2
      xl:grid-cols-4
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
                bg-white
                rounded-2xl
                shadow-lg
                p-5
                border
                border-slate-200
              "
            >

              <div className="
                flex
                items-center
                justify-between
                mb-4
              ">

                <h2 className="
                  text-lg
                  font-bold
                  text-slate-800
                ">

                  {key}

                </h2>

                <span className="
                  px-3
                  py-1
                  rounded-lg
                  text-xs
                  font-semibold
                  bg-green-100
                  text-green-700
                ">

                  {agent.status}

                </span>

              </div>

              <div className="
                space-y-2
                text-sm
                text-slate-700
              ">

                <p>

                  <span className="font-semibold">
                    Confidence:
                  </span>

                  {" "}
                  {agent.confidence}

                </p>

                <p>

                  <span className="font-semibold">
                    Execution:
                  </span>

                  {" "}
                  {agent.execution_time}

                </p>

                {

                  agent.decision && (

                    <p>

                      <span className="font-semibold">
                        Decision:
                      </span>

                      {" "}
                      {agent.decision}

                    </p>
                  )
                }

                {

                  agent.traffic_response && (

                    <p>

                      <span className="font-semibold">
                        Route:
                      </span>

                      {" "}
                      {
                        agent
                          .traffic_response
                          .route_status
                      }

                    </p>
                  )
                }

              </div>

            </div>
          )
        )
      }

    </div>
  );
}