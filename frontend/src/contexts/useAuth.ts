import { useContext } from "react";
import { AuthContext } from "./AuthContext";
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context){
        console.log("there's not context");
        throw new Error("useAuth does not work.");
    }
    return context;
}