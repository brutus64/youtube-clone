import { Routes, Route } from "react-router-dom";
import UserHome from "../components/UserHome";
import Login from "../components/Login";
import Signup from "../components/Signup";
import PlayerList from "../components/PlayerList"
import { useAuth } from "../contexts/useAuth";
import { useEffect } from "react";
// import ProtectedRoutes from "./ProtectedRoutes";
// REQUIREMENTS: GET GET  "/"
// Display a list of videos with their corresponding thumbnails
// Clicking on a video should link to that video, at /play/:id , with the ability to infinitely scroll.
const AppRoutes = () => {
    const { isAuth, checkAuth } = useAuth();
    useEffect(() => {                        //<-- THIS IS DONE IN PROTECTED ROUTES
        checkAuth();
    }, [checkAuth]);
    return (
        <Routes>
            {/* THIS 1 LINER BELOW WORKS BUT IM EXPERIMENTING RIGHT NOW */}
            <Route path="/" element={isAuth ? <UserHome /> : <Login />} />
            {/* <Route path="/login" element={<Login />} /> */}
            {/* <Route element={<ProtectedRoutes />}> */}
            <Route path="/play/:id" element={<PlayerList />} />
            {/* <Route path="/" element={<UserHome />} /> */}
            {/* </Route> */}
            {/* <Route path="/" element={<Login />} /> */}
            <Route path="/signup" element={<Signup />} />

        </Routes>
    )
}

export default AppRoutes;