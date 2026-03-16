import { Navigate } from 'react-router-dom';

// Index redirects to dashboard (handled by App.tsx routing)
const Index = () => <Navigate to="/" replace />;
export default Index;
