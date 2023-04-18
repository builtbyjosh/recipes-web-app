import { useState } from "react";
import FirebaseAuthService from "../FirebaseAuthService";

const LoginForm = ({ existingUser }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await FirebaseAuthService.loginUser(username, password);
      setUsername("");
      setPassword("");
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = () => {
    FirebaseAuthService.logoutUser();
  };

  const handleSendResetPasswordEmail = async () => {
    if (!username) {
      alert("Missing username!");
      return;
    }
    try {
      await FirebaseAuthService.sendPasswordResetEmail(username);
      alert("Email password email sent");
    } catch (error) {
      alert(error.message);
    }
  };

  //   const handleLoginWithGoogle = async () => {
  //     try {
  //       await FirebaseAuthService.loginWithGoogle();
  //     } catch (error) {
  //       alert(error.message);
  //     }
  //   };

  return (
    <div className="login-form-container">
      {existingUser ? (
        <div className="row">
          <h3>Welcom, {existingUser.email}</h3>
          <button
            type="button"
            className="primary-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="" className="input-label login-label">
            Username (email):
            <input
              type="email"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="input-text"
            />
          </label>
          <label htmlFor="" className="input-label login-label">
            Password:
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-text"
            />
          </label>
          <div className="button-box">
            <button className="primary-button" type="submit">
              Login
            </button>
            <button
              className="primary-button"
              type="button"
              onClick={handleSendResetPasswordEmail}
            >
              Reset Password
            </button>
            {/* <button
              type="button"
              onClick={handleLoginWithGoogle}
              className="primary-button"
            >
              Login with Google
            </button> */}
          </div>
        </form>
      )}
    </div>
  );
};

export default LoginForm;
