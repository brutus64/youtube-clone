import { createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
interface AuthInterface { 
    isAuth: boolean;
    user: string | null;
    checkAuth: () => void;
    // login: (email:string)=>Promise<void>;
    // logout: ()=> void;
}

interface AuthContextProps {
    children: ReactNode;
}
const AuthContext = createContext<AuthInterface | null>(null);

export const AuthProvider = ({ children }: AuthContextProps) => {
    const [isAuth, setAuth] = useState<boolean>(false);
    const [user, setUser] = useState<string | null>(null);
    const checkAuth = async() => {
        try {
            const res = await axios.post('http://thewang.cse356.compas.cs.stonybrook.edu/api/check-auth', {withCredentials: true});
            if (res.data.isLoggedIn == true) {
                setAuth(true);
                setUser(res.data.userId);
            }
            else{ //loggedin is false
                setAuth(false);
                setUser(null);
            }
        } catch(err) {
            setAuth(false);
            setUser(null);
            console.log(err);
        }
    }

    useEffect(() => {
        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ isAuth, user, checkAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export { AuthContext }