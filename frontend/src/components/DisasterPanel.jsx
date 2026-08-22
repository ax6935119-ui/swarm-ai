export default function DisasterPanel({
    data,
}) {
    const disaster = data?.disaster;

    if (!disaster?.type) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">

                <h2 className="text-xl font-semibold text-slate-800">
                    Disaster Information
                </h2>

                <div className="flex flex-col items-center justify-center h-[250px] text-center">

                    <p className="text-slate-500">
                        No disaster data available
                    </p>

                    <p className="text-xs text-slate-400 mt-2 max-w-xs">
                        Disaster details will be displayed once the backend provides simulation data.
                    </p>

                </div>

            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300   h-full">

            <h2 className="text-lg font-semibold mb-6">
                Disaster Information
            </h2>

            <div className="space-y-4">

                <div>
                    <p className="text-sm text-slate-500">
                        Type
                    </p>

                    <p className="font-semibold">
                        {disaster.type}
                    </p>
                </div>

                <div>
                    <p className="text-sm text-slate-500">
                        Severity
                    </p>

                    <p className="font-semibold">
                        {disaster.severity}
                    </p>
                </div>

                <div>
                    <p className="text-sm text-slate-500">
                        Traffic Impact
                    </p>

                    <p className="font-semibold uppercase">
                        {disaster.traffic_impact || disaster.traffic || "Moderate"}
                    </p>
                </div>

            </div>

        </div>
    );
}