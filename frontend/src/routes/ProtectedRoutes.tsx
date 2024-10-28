import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

const ProtectedRoutes = () => {
    const { isAuth } = useAuth();
    return isAuth ? <Outlet /> : <Navigate to ="/login"/>;
}

export default ProtectedRoutes;