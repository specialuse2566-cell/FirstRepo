import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [role, setRole] = useState(localStorage.getItem('role'));

    useEffect(() => {
        if (token) {
            setUser({ email: localStorage.getItem('email'), role });
        }
    }, [token]);

    const login = (email, userRole, userToken) => {
        localStorage.setItem('token', userToken);
        localStorage.setItem('email', email);
        localStorage.setItem('role', userRole);
        setToken(userToken);
        setRole(userRole);
        setUser({ email, role: userRole });
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('email');
        localStorage.removeItem('role');
        setToken(null);
        setRole(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, role, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);