import axios from "axios";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function ForgotPass() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const apiUrl = import.meta.env.VITE_API_URL;

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .post(
        `${apiUrl}/forgot-password`,
        { email },
        { withCredentials: true } 
      )
      .then((res) => {
        if (res.data.Status === "Success") {
          navigate("/login");
        }
      })
      .catch((err) => {
        console.error(err);
        alert("Something went wrong. Please try again.");
      });
  };

  return (
    <div className="d-flex justify-content-center align-items-center bg-secondary vh-100">
      <div className="bg-white p-3 rounded w-25">
        <h2 className="text-center mb-2 user-select-none">Forgot Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
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

          <button
            type="submit"
            className="btn btn-primary w-100 rounded-0 user-select-none"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPass;
