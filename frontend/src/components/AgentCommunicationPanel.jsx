export default function AgentCommunicationPanel({ data }) {
  const communications = data?.communications || [];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-5">
        📡 Agent Communication Panel
      </h2>

      <div className="space-y-4">
        {communications.length > 0 ? (
          communications.map((item, index) => (
            <div
              key={index}
              className="border rounded-xl p-4 bg-slate-50"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="font-bold text-blue-600">
                  {item.from}
                </span>

                <span className="text-slate-400">→</span>

                <span className="font-bold text-red-600">
                  {item.to}
                </span>
              </div>

              <p className="text-slate-600 text-sm">
                {item.message}
              </p>
            </div>
          ))
        ) : (
          <p className="text-slate-500">
            No agent communication available.
          </p>
        )}
      </div>
    </div>
  );
}