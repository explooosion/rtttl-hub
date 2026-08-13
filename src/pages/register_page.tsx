import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function RegisterPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Registration is handled through Google Auth login
    navigate("/login");
  }, [navigate]);

  return null;
}
