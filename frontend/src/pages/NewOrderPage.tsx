import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Redirect to unified Sales & Orders module
const NewOrderPage = () => {
  const navigate = useNavigate();
  useEffect(() => { navigate("/sales", { replace: true }); }, [navigate]);
  return null;
};

export default NewOrderPage;
