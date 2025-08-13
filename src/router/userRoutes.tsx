import { Route, Routes } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Dashboard from "../views/Analisis";
import ClientsViewer from "@/views/Clients";
import SatisfactionDashboard from "@/views/satisfactions";

export const UserRoutes = () => {
  return (
    <>
      <Sidebar />
      {/* Contenedor que deja espacio para el sidebar de 16rem (w-64) en pantallas md+ */}
      <div className="ml-0 md:ml-64">
        <Routes>
          <Route path="home" element={<Dashboard />} />
          <Route path="clientes" element={<ClientsViewer />} />
          <Route path="satisfaccion" element={<SatisfactionDashboard />} />
        </Routes>
      </div>
    </>
  );
};