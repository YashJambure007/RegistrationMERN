import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IoEyeOutline } from "react-icons/io5";
import { FaRegEyeSlash } from "react-icons/fa";

function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  axios.defaults.withCredentials = true;

  const handleSubmit = (e) => {
    e.preventDefault();
    const apiUrl = import.meta.env.VITE_API_URL; // Update here

    axios
      .post(`${apiUrl}/register`, { name, email, password })
      .then((result) => {
        console.log(result);
        navigate("/login");
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
      <div className="bg-white p-3 rounded w-25">
        <h2 className="text-center mb-2 user-select-none">Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="Input mb-3">
            <label htmlFor="name">
              <strong className="user-select-none">Name</strong>
            </label>
            <input
              type="text"
              placeholder="Enter Name Here"
              autoComplete="off"
              name="name"
              className="form-control rounded-0"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
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
              style={{ cursor: "pointer" }}
              onClick={handleShowPassword}
            >
              {showPassword ? <IoEyeOutline /> : <FaRegEyeSlash />}
            </div>
          </div>
          <button type="submit" className="btn btn-primary w-100 rounded-0">
            Register
          </button>
        </form>
        <p className="mt-2 text-center user-select-none">
          Already Have an Account?
          <Link to={"/login"} className="text-decoration-none ms-2 fw-bold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
