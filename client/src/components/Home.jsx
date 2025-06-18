import React from 'react'
import { Link } from 'react-router-dom'

function Home() {
  return (
    <div>
      <h2>Home Component</h2>
      <Link
                to={"/login"}
                className="btn btn-default border w-100 bg-light rounded-0 text-decoration-none mt-3 user-select-none"
              >
                Logout
              </Link>
    </div>
  )
}

export default Home
