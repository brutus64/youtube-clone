import { Routes, Route } from "react-router-dom";

// REQUIREMENTS: GET GET  "/"
// Display a list of videos with their corresponding thumbnails
// Clicking on a video should link to that video, at /play/:id , with the ability to infinitely scroll.
const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/login" element={<Login />}>
        </Routes>
    )
}

export default AppRoutes;