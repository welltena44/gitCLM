import { useCallback, useEffect, useState } from "react";
import api from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import EngagementDashboard from "../EngagementDashboard.jsx";

export default function DashboardAdmin() {
  const { user } = useAuth();
  const [data, setData] = useState({
    contracts: [],
    users: [],
    validations: [],
    types: [],
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const results = await Promise.allSettled([
        api.get("/contrats"),
        api.get("/utilisateurs"),
        api.get("/validations"),
        api.get("/types-contrat/actifs"),
      ]);
      const getData = (result) =>
        result.status === "fulfilled" ? result.value.data || [] : [];
      setData({
        contracts: getData(results[0]),
        users: getData(results[1]),
        validations: getData(results[2]),
        types: getData(results[3]),
      });
      if (results.some((result) => result.status === "rejected")) {
      setError(
        "Impossible de charger les indicateurs. Vérifiez que le serveur est disponible.",
      );
      }
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  return (
    <EngagementDashboard
      role={user?.role || "ADMIN"}
      {...data}
      loading={loading}
      error={error}
      onRefresh={load}
    />
  );
}
