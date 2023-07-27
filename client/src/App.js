import "./App.css";
import { Route, Routes } from "react-router-dom";
import Lobby from "./Screens/Lobby";
import RoomPage from "./Screens/Room";
function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Lobby />} />
        <Route path="/room/:roomId" element={<RoomPage />} />
      </Routes>
    </div>
  );
}

export default App;
