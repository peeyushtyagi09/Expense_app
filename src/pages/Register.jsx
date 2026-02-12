import { useState } from "react";
import axios from "axios";
import { serverEndpoint } from "../config/appConfig";
import { useNavigate, Link } from "react-router-dom";

function Register() {
    const [formData, setFormData] = useState({ name: "", email: "", password: "" });
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Using your existing serverEndpoint config
            await axios.post(`${serverEndpoint}/auth/register`, formData);
            alert("Success! You can now log in.");
            navigate("/login");
        } catch (err) {
            alert(err.response?.data?.message || "Registration failed");
        }
    };

    return (
        <div className="container py-5 d-flex justify-content-center">
            <div className="card shadow-sm border-0 rounded-4 p-4" style={{maxWidth: "400px", width: "100%"}}>
                <h3 className="fw-bold mb-4 text-center text-primary">Create Account</h3>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label small fw-bold">Full Name</label>
                        <input type="text" className="form-control rounded-pill" placeholder="John Doe"
                            onChange={(e) => setFormData({...formData, name: e.target.value})} required />
                    </div>
                    <div className="mb-3">
                        <label className="form-label small fw-bold">Email</label>
                        <input type="email" className="form-control rounded-pill" placeholder="name@example.com"
                            onChange={(e) => setFormData({...formData, email: e.target.value})} required />
                    </div>
                    <div className="mb-4">
                        <label className="form-label small fw-bold">Password</label>
                        <input type="password" className="form-control rounded-pill" placeholder="••••••••"
                            onChange={(e) => setFormData({...formData, password: e.target.value})} required />
                    </div>
                    <button type="submit" className="btn btn-primary w-100 rounded-pill py-2 fw-bold shadow-sm">
                        Register
                    </button>
                    <p className="text-center mt-3 small text-muted">
                        Already have an account? <Link to="/login" className="text-decoration-none">Login</Link>
                    </p>
                </form>
            </div>
        </div>
    );
}

export default Register;