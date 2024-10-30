import { useEffect, useRef } from "react";
import { debounce } from "./debounce";

export const useVisible = (id) => {
    const elementRef = useRef(null);
    const handleURLUpdate = () => {
        window.history.replaceState(null, "Utwob", `/play/${id}`);
    }
    
    const debouncedHandleURLUpdate = debounce(handleURLUpdate, 1500);

    const IOCallback = (entries) => {
        const [ entry ] = entries;
        if (entry.isIntersecting) {
            console.log(`Changing url: ${id}`);
            debouncedHandleURLUpdate();
        }
    }

    const options = {
        root:null,
        rootMargin: "0px",
        threshold:0.5 //trigger callback when element takes up more than 50% of screen
    }

    useEffect(() => {
        const observer = new IntersectionObserver(IOCallback,options);
        if (elementRef.current)
            observer.observe(elementRef.current);
        return () => {
            if (elementRef.current)
                observer.unobserve(elementRef.current);
        }
    }, [elementRef,id])

    return [elementRef];
}   