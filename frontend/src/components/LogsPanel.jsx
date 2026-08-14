export default function LogsPanel({

  data

}) {

  const logs =
    data?.logs || [];

  return (

    <div className="
      bg-white
      rounded-2xl
      shadow-lg
      p-5
      h-full
    ">

      <h2 className="
        text-xl
        font-bold
        text-slate-800
        mb-4
      ">

        Live Activity

      </h2>

      <div className="
        space-y-3
        max-h-[450px]
        overflow-y-auto
      ">

        {

          logs.length > 0

            ? logs.map(

                (log, index) => (

                  <div

                    key={index}

                    className="
                      p-3
                      rounded-xl
                      bg-slate-100
                      text-sm
                      text-slate-700
                    "
                  >

                    {log}

                  </div>
                )
              )

            : (

              <p className="
                text-slate-500
              ">

                No live activity yet.

              </p>
            )
        }

      </div>

    </div>
  );
}