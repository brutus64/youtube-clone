//requires a logout button for our own testing purposes
//may require other components like a modularized component with media player
import Videolist from "./Videolist";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/useAuth";

const UserHome = () => {
    const { isAuth, user, checkAuth } = useAuth();
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);
    
    return isAuth ? (
        <div id="home-page">
            <h1>Hello {user!}</h1>
            <Videolist />
        </div>
    )
    : (
        <div id='home-page'>
            <h1>Welcome! Please sign in</h1>
            <Link to="login" className="Link">Login</Link>
            <br />
            <Link to="signup" className="Link">Sign up</Link>
        </div>
    );
}

export default UserHome;