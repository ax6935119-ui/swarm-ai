import { createContext, useContext, useState } from "react";

const DashboardContext = createContext();

export function DashboardProvider({ children }) {
  const [connectionStatus, setConnectionStatus] =
    useState("disconnected");

  const [dashboardData, setDashboardData] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  return (
    <DashboardContext.Provider
      value={{
        connectionStatus,
        setConnectionStatus,

        dashboardData,
        setDashboardData,

        loading,
        setLoading,

        error,
        setError,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  return useContext(DashboardContext);
}