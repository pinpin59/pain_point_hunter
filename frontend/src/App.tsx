import { Routes, Route } from "react-router-dom";
import "./App.css";
import { LoginPage } from "./pages/login";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
    </Routes>
  );
}

export default App;
