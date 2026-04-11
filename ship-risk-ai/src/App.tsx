import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "./contexts/AuthContext";
import { ShipmentProvider } from "./contexts/ShipmentContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { NotificationToast } from "./components/Common/NotificationToast";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { ErrorBoundary } from "./components/Common/ErrorBoundary";
import { DashboardLayout } from "./components/Layout/DashboardLayout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import "./styles/globals.css";

// Lazy load routes for code splitting
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })),
);
const Shipments = lazy(() =>
  import("./pages/Shipments").then((m) => ({ default: m.Shipments })),
);
const ShipmentDetails = lazy(() =>
  import("./pages/ShipmentDetails").then((m) => ({
    default: m.ShipmentDetails,
  })),
);
const Alerts = lazy(() =>
  import("./pages/Alerts").then((m) => ({ default: m.Alerts })),
);
const Recommendations = lazy(() =>
  import("./pages/Recommendations").then((m) => ({
    default: m.Recommendations,
  })),
);
const Analytics = lazy(() =>
  import("./pages/Analytics").then((m) => ({ default: m.Analytics })),
);
const AddShipment = lazy(() =>
  import("./pages/AddShipment").then((m) => ({ default: m.AddShipment })),
);
const LiveTracking = lazy(() =>
  import("./pages/LiveTracking").then((m) => ({ default: m.LiveTracking })),
);
const NotFound = lazy(() =>
  import("./pages/NotFound").then((m) => ({ default: m.NotFound })),
);
const ResetPassword = lazy(() =>
  import("./pages/ResetPassword").then((m) => ({ default: m.ResetPassword })),
);

// Loading fallback component
const LoadingFallback = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-darkBg">
    <div className="flex flex-col items-center space-y-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      <p className="text-light">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <BrowserRouter>
          <NotificationProvider>
            <AuthProvider>
              <ShipmentProvider>
                <NotificationToast />
                <Suspense fallback={<LoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/signup" element={<Signup />} />
                    <Route path="/auth/action" element={<ResetPassword />} />

                    <Route
                      element={
                        <ProtectedRoute>
                          <DashboardLayout />
                        </ProtectedRoute>
                      }
                    >
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/shipments" element={<Shipments />} />
                      <Route
                        path="/shipments/:id"
                        element={<ShipmentDetails />}
                      />
                      <Route path="/alerts" element={<Alerts />} />
                      <Route
                        path="/recommendations"
                        element={<Recommendations />}
                      />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/live-tracking" element={<LiveTracking />} />
                      <Route path="/add-shipment" element={<AddShipment />} />
                    </Route>

                    <Route path="/404" element={<NotFound />} />
                    <Route path="*" element={<Navigate to="/404" replace />} />
                  </Routes>
                </Suspense>
              </ShipmentProvider>
            </AuthProvider>
          </NotificationProvider>
        </BrowserRouter>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
