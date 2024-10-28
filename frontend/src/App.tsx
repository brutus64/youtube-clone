import { BrowserRouter } from "react-router-dom"
import AppRoutes from "./routes/AppRoutes"

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
