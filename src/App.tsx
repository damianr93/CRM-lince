import { Provider } from "react-redux"
import { AppRouter } from "./router/AppRouter"
import { store } from "./store/sotre"
import { NotificationProvider } from "./components/NotificationSystem"
import { ErrorBoundary } from "./components/ErrorBoundary"
import { ThemeProvider } from "./context/ThemeContext"



function App() {
  return (
    <ThemeProvider>
      <Provider store={store}>
        <ErrorBoundary>
          <NotificationProvider>
            <div className="gaming-dashboard-bg">
              <div className="dashboard-content">
                <AppRouter/>
              </div>
            </div>
          </NotificationProvider>
        </ErrorBoundary>
      </Provider>
    </ThemeProvider>
  )
}

export default App