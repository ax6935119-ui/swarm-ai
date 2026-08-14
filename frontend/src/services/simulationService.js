import API from "./api";

export const startSimulation = async () => {
  const response = await API.post("/simulation/start");
  return response.data;
};