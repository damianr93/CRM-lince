import { Provider } from "react-redux"
import { AppRouter } from "./router/AppRouter"
import { store } from "./store/sotre"



function App() {
  return (
    <Provider store={store}>
      <div className="gaming-dashboard-bg">
      {/* Elementos decorativos del fondo */}
      <div className="ambient-light-1"></div>
      <div className="ambient-light-2"></div>
      <div className="connection-line-1"></div>
      <div className="connection-line-2"></div>
      <div className="hex-decoration-1"></div>
      <div className="hex-decoration-2"></div>
      <div className="hex-decoration-3"></div>


      <div className="dashboard-content">
        <AppRouter/>
      </div>
    </div>
    </Provider>
    
  )
}

export default App