import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import RoomDetail from './pages/RoomDetail';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import UnitTypeDetail from './pages/UnitTypeDetail';
import PublicShowSuite from './pages/PublicShowSuite';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

function Protected({ page }) {
  return (
    <ProtectedRoute>
      <Layout>{page}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/s/:slug" element={<PublicShowSuite />} />
      <Route path="/" element={<Protected page={<Dashboard />} />} />
      <Route path="/clients" element={<Protected page={<Clients />} />} />
      <Route path="/jobs" element={<Protected page={<Jobs />} />} />
      <Route path="/jobs/:jobId" element={<Protected page={<JobDetail />} />} />
      <Route path="/rooms/:roomId" element={<Protected page={<RoomDetail />} />} />
      <Route path="/projects" element={<Protected page={<Projects />} />} />
      <Route path="/projects/:projectId" element={<Protected page={<ProjectDetail />} />} />
      <Route path="/unit-types/:unitTypeId" element={<Protected page={<UnitTypeDetail />} />} />
    </Routes>
  );
}
