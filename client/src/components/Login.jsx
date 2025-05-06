import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoEyeOutline } from "react-icons/io5";
import { FaRegEyeSlash } from "react-icons/fa";

function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const apiUrl = import.meta.env.VITE_API_URL;

    axios
      .post(`${apiUrl}/login`, { email, password }, { withCredentials: true }) // ✅ Added withCredentials
      .then((result) => {
        console.log(result);
        if (result.data.Status === "Success") {
          navigate("/home");
        }
      })
      .catch((err) => {
        console.log(err);
        setError("Invalid email or password. Please try again.");
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
      <div className="bg-white p-3 rounded w-25">
        <h2 className="text-center mb-2 user-select-none">Login</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="text-danger">{error}</p>}
          <div className="Input mb-3">
            <label htmlFor="email">
              <strong className="user-select-none">Email</strong>
            </label>
            <input
              type="email"
              placeholder="Enter Email Here"
              autoComplete="off"
              name="email"
              className="form-control rounded-0"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <label htmlFor="password">
            <strong className="user-select-none">Password</strong>
          </label>

          <div className="Input mb-3 position-relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter Password Here"
              autoComplete="off"
              name="password"
              className="form-control rounded-0"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div
              className="Icon position-absolute top-50 end-0 translate-middle-y pe-2"
              style={{ cursor: 'pointer' }}
              onClick={handleShowPassword}
            >
              {showPassword ? <IoEyeOutline /> : <FaRegEyeSlash />}
            </div>
          </div>
          <button
            type="submit"
            className="btn btn-primary w-100 rounded-0 user-select-none"
          >
            Login
          </button>
        </form>
        <Link to={"/forgotpassword"}>Forgot Password</Link>
        <Link
          to={"/"}
          className="btn btn-default border w-100 bg-light rounded-0 text-decoration-none mt-3 user-select-none"
        >
          Register
        </Link>
      </div>
    </div>
  );
}

export default Login;
