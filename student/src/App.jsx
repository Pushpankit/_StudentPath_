import { Routes, Route } from "react-router-dom";

// Public pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Onboarding from "./pages/Onboarding";
import GoogleCallback from "./pages/GoogleCallback";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword"
// Student pages
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import SkillGap from "./pages/SkillGap";
import Applications from "./pages/Applications";
import Careers from "./pages/Careers";
import CareerDetails from "./pages/CareerDetails";
import SavedJobs from "./pages/SavedJobs";
import ActionPlan from "./pages/ActionPlan";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";

// Company pages
import CompanyOnboarding from "./pages/CompanyOnboarding";
import CompanyDashboard from "./pages/CompanyDashboard";
import CompanyJobs from "./pages/CompanyJobs";
import CreateJob from "./pages/CreateJob";
import CompanyApplicants from "./pages/CompanyApplicants";
import CompanyProfile from "./pages/CompanyProfile";
import CompanyProfileEdit from "./pages/CompanyProfileEdit";

// Admin pages
import AdminDashboard from "./pages/AdminDashboard";

// Layout
import StudentLayout from "./components/StudentLayout";

function App() {
  return (
    <Routes>
      {/* =========================
          PUBLIC ROUTES
      ========================= */}
      <Route path="/" element={<Landing />} />

      <Route path="/login" element={<Login />} />

      <Route path="/signup" element={<Signup />} />

      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/google-callback"
        element={<GoogleCallback />}
      />
      <Route
        path="/verify-email"
        element={<VerifyEmail />}
      />
      <Route
        path="/forgot-password"
        element={<ForgotPassword />}
      />
      <Route
        path="/reset-password"
        element={<ResetPassword />}
      />
      {/* =========================
          STUDENT ROUTES
          All these pages use:
          Sidebar + TopNavbar
      ========================= */}
      <Route element={<StudentLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />

        <Route path="/jobs" element={<Jobs />} />

        <Route path="/jobs/:id" element={<JobDetails />} />

        <Route path="/skill-gap" element={<SkillGap />} />

        <Route
          path="/applications"
          element={<Applications />}
        />

        <Route path="/careers" element={<Careers />} />

        <Route
          path="/careers/:id"
          element={<CareerDetails />}
        />

        <Route path="/saved" element={<SavedJobs />} />

        <Route path="/action-plan" element={<ActionPlan />} />

        <Route path="/profile" element={<Profile />} />
        <Route path="/profile/edit" element={<EditProfile />} />
      </Route>


      {/* =========================
          COMPANY ROUTES
      ========================= */}
      <Route
        path="/company/onboarding"
        element={<CompanyOnboarding />}
      />

      <Route
        path="/company"
        element={<CompanyDashboard />}
      />

      <Route
        path="/company/jobs"
        element={<CompanyJobs />}
      />

      <Route
        path="/company/post-job"
        element={<CreateJob />}
      />

      <Route
        path="/company/applicants"
        element={<CompanyApplicants />}
      />

      <Route
        path="/company/profile"
        element={<CompanyProfile />}
      />

      <Route
        path="/company/profile/edit"
        element={<CompanyProfileEdit />}
      />
      {/* =========================
          ADMIN ROUTES
      ========================= */}
      <Route
        path="/admin/dashboard"
        element={<AdminDashboard />}
      />
    </Routes>
  );
}

export default App;