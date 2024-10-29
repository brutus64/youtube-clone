import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";
import { useEffect } from "react";

const ProtectedRoutes = () => {
    const { isAuth, checkAuth } = useAuth();
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);
    //outlet used to help render child elements without the need of prop drilling
    return isAuth ? <Outlet /> : <Navigate to ="/"/>;
}

export default ProtectedRoutes;