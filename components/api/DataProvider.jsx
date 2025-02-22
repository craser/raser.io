import React, { useMemo } from 'react';
import PostDao from "@/model/PostDao";

const dataContext = React.createContext({
    getPostDao: () => null,
});

export function useDataContext() {
    return React.useContext(dataContext);
}

export default function DataProvider({ children }) {
    const postDao = useMemo(() => PostDao.getCachingPostDao(), []);

    const getPostDao = () => {
        return postDao;
    };

    return (
        <dataContext.Provider value={{ getPostDao }}>
            {children}
        </dataContext.Provider>
    );
}
