import { Routes, Route } from "react-router-dom";
import UserHome from "../components/UserHome";
import Login from "../components/Login";
import Signup from "../components/Signup";
import PlayerList from "../components/PlayerList"
// REQUIREMENTS: GET GET  "/"
// Display a list of videos with their corresponding thumbnails
// Clicking on a video should link to that video, at /play/:id , with the ability to infinitely scroll.
const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<UserHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/play/:id" element={<PlayerList />} />
        </Routes>
    )
}

export default AppRoutes;