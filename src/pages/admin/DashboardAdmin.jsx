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
      const [contracts, users, validations, types] = await Promise.all([
        api.get("/contrats"),
        api.get("/utilisateurs"),
        api.get("/validations"),
        api.get("/types-contrat/actifs"),
      ]);
      setData({
        contracts: contracts.data || [],
        users: users.data || [],
        validations: validations.data || [],
        types: types.data || [],
      });
    } catch {
      setError(
        "Impossible de charger les indicateurs. Vérifiez que le serveur est disponible.",
      );
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
