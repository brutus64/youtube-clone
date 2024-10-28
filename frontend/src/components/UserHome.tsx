//requires a logout button for our own testing purposes
//may require other components like a modularized component with media player
import Videolist from "./Videolist";
import { useState,useEffect } from "react";
import { Link } from "react-router-dom";

const UserHome = () => {
    const {auth,user} = useAuth();
    
    return auth ? (
        <div id="home-page">
            <h1>Hello {user!.username}</h1>
            <Videolist />
        </div>
    )
    : (
        <div id='home-page'>
            <h1>Welcome! Please sign in</h1>
            <Link to="login">Login</Link>
            <br />
            <Link to="signup">Sign up</Link>
        </div>
    );
}

export default UserHome;