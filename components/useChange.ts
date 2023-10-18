import { useRef } from "react";


const NONE = {};
export const useChange = (value: any, callback: any) => {
    const ref = useRef(NONE);
    if (ref.current !== value) {
        if (ref.current !== NONE) {
            callback(ref.current, value);
        }
        ref.current = value;
    } 
};


