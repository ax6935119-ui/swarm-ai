import {
    FaUsers,
    FaExclamationTriangle,
    FaAmbulance,
    FaRobot,
} from "react-icons/fa";
import { motion } from "framer-motion";

export default function KPISection({ data }) {
    const kpis = [
        {
            title: "Victims",
            value: data?.disaster?.victims ?? "--",
            icon: <FaUsers />,
            color: "border-red-500",
        },
        {
            title: "Severity",
            value: data?.disaster?.severity ?? "--",
            icon: <FaExclamationTriangle />,
            color: "border-orange-500",
        },
        {
            title: "Ambulances",
            value:
                data?.map?.ambulances?.length > 0
                    ? data.map.ambulances.length
                    : "--",
            icon: <FaAmbulance />,
            color: "border-blue-500",
        },
        {
            title: "AI Agents",
            value:
                data?.agents &&
                    Object.values(data.agents).some(
                        (agent) => agent.response
                    )
                    ? Object.keys(data.agents).length
                    : "--",
            icon: <FaRobot />,
            color: "border-green-500",
        },
    ];

    return (
        // <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        //     {kpis.map((item) => (
        //         <motion.div
        //             key={item.title}
        //             initial={{ opacity: 0, y: 20 }}
        //             animate={{ opacity: 1, y: 0 }}
        //             transition={{
        //                 duration: 0.4,
        //             }}
        //             className={`
        //                     bg-white
        //                     border-l-4
        //                     ${item.color}
        //                     rounded-2xl p-5 shadow-md hover:shadow-xl transition-all duration-300`
        //                 }
        //         >
        //             <div className="flex justify-between items-center">
        //                 <div>
        //                     <p className="text-sm text-slate-500">
        //                         {item.title}
        //                     </p>

        //                     <h3 className="text-4xl font-bold mt-2 text-slate-700">
        //                         {item.value}
        //                     </h3>
        //                 </div>

        //                 <div className="text-4xl text-slate-500">
        //                     {item.icon}
        //                 </div>
        //             </div>
        //         </motion.div>
        //     ))}
        // </div>
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {kpis.map((item) => (
        <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            transition={{ duration: 0.4 }}
            className={`
                group relative overflow-hidden

                rounded-2xl p-5

                bg-white/70
                backdrop-blur-xl

                border border-white/60
                border-l-4 ${item.color}

                shadow-lg shadow-slate-200/50
                hover:shadow-xl hover:-translate-y-1 hover:shadow-slate-300/50

                transition-all duration-300
            `}
        >
            {/* Glass reflection */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/20 to-transparent pointer-events-none" />

            {/* Glow */}
            <div className="absolute -top-10 -right-10 h-24 w-24 rounded-full bg-slate-100 blur-2xl opacity-70 group-hover:opacity-100 transition-all duration-300" />

            <div className="relative flex items-center justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {item.title}
                    </p>

                    <h3 className="mt-2 text-4xl font-bold tracking-tight text-slate-800">
                        {item.value}
                    </h3>
                </div>

                <div
                    className="
                        flex h-12 w-12 items-center justify-center
                        rounded-xl
                        bg-white/80
                        border border-slate-200
                        text-2xl text-slate-600

                        group-hover:scale-105
                        group-hover:text-slate-800

                        transition-all duration-300
                    "
                >
                    {item.icon}
                </div>
            </div>

            {/* Bottom shine */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent" />
        </motion.div>
    ))}
</div>
    );
}