import { motion } from "framer-motion";
export default function SummaryPanel({
  data,
}) {
  if (!data?.summary) {
    return (
      <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full"
>

       <h2 className="text-xl font-semibold text-slate-800">
          AI Command Summary
        </h2>

        <div className="bg-slate-50 rounded-xl p-4">

          <p className="text-slate-500">
            No summary available.
          </p>

          <p className="text-xs text-slate-400 mt-2">
            AI-generated operational summaries will appear here after simulation execution.
          </p>

        </div>

      </motion.div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">

      <h2 className="font-semibold text-lg mb-5">
        AI Command Summary
      </h2>

      <div className="bg-slate-50 rounded-xl p-4">
        {data.summary}
      </div>

    </div>
  );
}