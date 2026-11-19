import { useCallback, useEffect, useState } from "react";
import api from "../../services/api.js";
import EngagementDashboard from "./EngagementDashboard.jsx";

const asArray = (value) => (Array.isArray(value) ? value : []);

export default function DashboardJuridique() {
  const [data, setData] = useState({ contracts: [], types: [], validations: [], users: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const results = await Promise.allSettled([
      api.get("/contrats"),
      api.get("/types-contrat"),
      api.get("/validations"),
      api.get("/utilisateurs"),
    ]);
    setData({
      contracts: results[0].status === "fulfilled" ? asArray(results[0].value.data) : [],
      types: results[1].status === "fulfilled" ? asArray(results[1].value.data) : [],
      validations: results[2].status === "fulfilled" ? asArray(results[2].value.data) : [],
      users: results[3].status === "fulfilled" ? asArray(results[3].value.data) : [],
    });
    if (results.some((result) => result.status === "rejected")) {
      setError("Certaines données du tableau de bord n’ont pas pu être chargées.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <EngagementDashboard
      role="JURIDIQUE"
      contracts={data.contracts}
      types={data.types}
      validations={data.validations}
      users={data.users}
      loading={loading}
      error={error}
      onRefresh={load}
    />
  );
}
