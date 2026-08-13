import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export function PasswordPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Password management is handled by Google Auth only
    navigate("/account");
  }, [navigate]);

  return null;
}
