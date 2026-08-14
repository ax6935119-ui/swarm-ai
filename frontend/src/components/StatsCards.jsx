
export default function StatsCards({

  data

}) {

  const stats =
    data?.stats || {};

  const cards = [

    {
      title: "Severity",
      value: stats.severity
    },

    {
      title: "Victims",
      value: stats.victims
    },

    {
      title: "Traffic",
      value: stats.traffic
    },

    {
      title: "Active Agents",
      value: stats.activeAgents
    }
  ];

  return (

    <div className="
      grid
      grid-cols-1
      md:grid-cols-2
      xl:grid-cols-4
      gap-5
    ">

      {

        cards.map(

          (card, index) => (

            <div

              key={index}

              className="
                bg-white
                rounded-2xl
                shadow-lg
                p-6
              "
            >

              <p className="
                text-slate-500
                text-sm
                mb-2
              ">

                {card.title}

              </p>

              <h2 className="
                text-3xl
                font-bold
                text-slate-800
              ">

                {card.value}

              </h2>

            </div>
          )
        )
      }

    </div>
  );
}

