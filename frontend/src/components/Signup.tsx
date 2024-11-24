import axios from 'axios';
import { useState } from "react";
import { Link } from "react-router-dom";

const Signup = () => {
    const [signupInputs, setSignupInputs] = useState({
        username: '',
        password: '',
        email: ''
    });
    const [bottomMsg, setBottomMsg] = useState("");
    const handleChange = (e: any) => {
        const { name, value } = e.target;
        setSignupInputs({
            ...signupInputs,
            [name]: value,
        });
    }
    const submitSignup = (e: any) => {
        e.preventDefault();
        e.stopPropagation();
        axios.post(`http://thewang.cse356.compas.cs.stonybrook.edu/api/adduser`,signupInputs)
            .then((res: any) => {
                console.log(res)
                console.log("Response: " + res.data.message);
                if (res.data.error)
                    setBottomMsg(res.data.message);
                else
                    setBottomMsg("VERIFY YOUR EMAIL");
                
            })
            .catch(err => {
                console.error("Error adding user", err);
                setBottomMsg("SERVER ERROR");
            });
        
    }
    return (
        <div id="signup-form" className='flex flex-row justify-center'>
            <form className='flex flex-col gap-3 items-center mt-12 p-6 bg-slate-200 rounded-xl'>
                <div>
                    <label htmlFor="username"><h1 className='mb-5 text-xl'>Username</h1></label>
                    <input 
                        type="text" 
                        id="signup-user" 
                        name="username" 
                        onChange={handleChange}
                        value={signupInputs.username}
                        maxLength={50}
                    />
                </div>
                <div>
                    <label htmlFor="password"><h1 className='mb-5 text-xl'>Password</h1></label>
                    <input 
                        type="password" 
                        id="signup-password" 
                        name="password" 
                        onChange={handleChange}
                        value={signupInputs.password}
                    />
                </div>
                <div>
                    <label htmlFor="email"><h1 className='mb-5 text-xl'>Email</h1></label>
                    <input 
                        type="email" 
                        id="signup-email" 
                        name="email" 
                        onChange={handleChange}
                        value={signupInputs.email}
                    />
                </div>
                <div>
                    <button className="hover:opacity-90 active:opacity-90" onClick={submitSignup}>Sign up</button>
                </div>
                <div>
                    <Link to="/" className='text-red-600 text-xl hover:underline'>I have an account already</Link>
                </div>
                <div>
                    {bottomMsg}
                </div>
            </form>
        </div>
    )
}

export default Signup;