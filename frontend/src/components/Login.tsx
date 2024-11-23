import axios from 'axios';
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from '../contexts/useAuth';
const Login = () => {
    const { checkAuth } = useAuth();
    const navigate = useNavigate();
    const [loginInputs, setLoginInputs] = useState({
        username: '',
        password: '',
    });
    const [bottomMsg, setBottomMsg] = useState("");
    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setLoginInputs({
            ...loginInputs,
            [name]: value,
        });
    }

    const submitLogin = async (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        
        try {
            const res = await axios.post(`http://thewang.cse356.compas.cs.stonybrook.edu/api/login`,loginInputs, {withCredentials: true})
            console.log(res)
            console.log("Response: " + res.data.message);
            if (res.data.error)
                setBottomMsg(res.data.message);
            else {
                setBottomMsg("WELCOME");
                checkAuth();
                navigate("/");
            }
        }
        catch(err) {
            console.error("Error logging in", err);
            setBottomMsg("SERVER ERROR");
        }
        
    }
    return (
        <div id="login-form">
            <form onSubmit={submitLogin} className='flex flex-col gap-3 items-center mt-12'>
                <div>
                    <label htmlFor="username"><h1 className='mb-5 text-xl'>Username</h1></label>
                    <input 
                        type="text" 
                        id="login-user" 
                        name="username" 
                        maxLength={50}
                        onChange={handleChange}
                        value={loginInputs.username}
                    />
                </div>
                <div>
                    <label htmlFor="password"><h1 className='mb-5 text-xl'>Password</h1></label>
                    <input 
                        type="password" 
                        id="login-password" 
                        name="password" 
                        onChange={handleChange}
                        value={loginInputs.password}
                    />
                </div>
                <div>
                    <button className="hover:opacity-90 active:opacity-90" type='submit'>Login</button>
                </div>
                <div>
                    <Link to="/signup" className='text-red-600 text-xl hover:underline'>I don't have an account</Link>
                </div>
                <div>
                    {bottomMsg}
                </div>
            </form>
        </div>
    )
}

export default Login;