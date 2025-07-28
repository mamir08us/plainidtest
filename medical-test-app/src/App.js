import React, { useState, createContext, useContext, useEffect } from 'react';

// --- Auth Context Setup ---
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Stores authenticated user info
  const [isAuthReady, setIsAuthReady] = useState(false); // Indicates if auth state has been checked

  useEffect(() => {
    // Simulate initial authentication check (e.g., checking for existing session/token)
    // In a real app, this would involve checking localStorage for a token, or verifying with Plain ID/Forgerock
    console.log('Simulating initial authentication check...');
    setTimeout(() => {
      // Here, you'd check for a session/token from Plain ID/Forgerock
      // If a token exists and is valid, set the user.
      // For now, we start unauthenticated.
      setIsAuthReady(true);
    }, 500);
  }, []);

  const login = async (username, password) => {
    // --- FORGEROCK / PLAIN ID INTEGRATION POINT ---
    // Instead of local validation, this is where you would integrate with Forgerock/Plain ID's authentication APIs.
    // Common flows include:
    // 1. OAuth 2.0 Authorization Code Flow: Redirect user to Forgerock/Plain ID's login page.
    //    Upon successful login, they redirect back to your app with an authorization code.
    //    Your backend (or client, securely) exchanges this code for an Access Token and ID Token.
    // 2. Resource Owner Password Credentials Grant (less recommended for public clients):
    //    Directly send username/password to Forgerock/Plain ID's token endpoint.
    //    Requires careful security considerations.

    console.log(`Attempting login for: ${username}`);
    // Simulate API call to Forgerock/Plain ID
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (username === 'testuser' && password === 'password') {
          const authUser = { id: 'user123', username: 'testuser' };
          setUser(authUser);
          console.log('Login successful!');
          // In a real scenario, you'd store the received access token securely (e.g., in localStorage, http-only cookie)
          resolve(authUser);
        } else {
          console.error('Login failed: Invalid credentials');
          reject(new Error('Invalid username or password'));
        }
      }, 1000);
    });
  };

  const logout = () => {
    // --- FORGEROCK / PLAIN ID INTEGRATION POINT ---
    // This is where you'd initiate a logout process with Forgerock/Plain ID.
    // This might involve revoking tokens or redirecting to their logout endpoint.
    setUser(null);
    console.log('Logged out.');
    // Clear any stored tokens
  };

  if (!isAuthReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-xl font-semibold text-gray-700">Loading authentication state...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --- Custom Hook to use Auth Context ---
const useAuth = () => useContext(AuthContext);

// --- Login Page Component ---
const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 p-4">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Login to Medical App</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="username">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition duration-200"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="password">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition duration-200"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-600 text-sm text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105 flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              'Login'
            )}
          </button>
        </form>
        <p className="text-center text-gray-600 text-sm mt-6">
          Use username: <span className="font-semibold">testuser</span>, password: <span className="font-semibold">password</span>
        </p>
      </div>
    </div>
  );
};

// --- Dummy Data ---
const DUMMY_USERS = [
  { id: 'u1', name: 'Alice Smith', email: 'alice.s@example.com', role: 'Doctor' },
  { id: 'u2', name: 'Bob Johnson', email: 'bob.j@example.com', role: 'Nurse' },
  { id: 'u3', name: 'Charlie Brown', email: 'charlie.b@example.com', role: 'Patient' },
  { id: 'u4', name: 'Diana Prince', email: 'diana.p@example.com', role: 'Admin' },
  { id: 'u5', name: 'Eve Adams', email: 'eve.a@example.com', role: 'Doctor' },
];

const DUMMY_PRESCRIPTIONS = [
  { id: 'p1', patient: 'Charlie Brown', medication: 'Amoxicillin', dosage: '500mg', instructions: 'Take twice daily for 7 days' },
  { id: 'p2', patient: 'Alice Smith', medication: 'Ibuprofen', dosage: '200mg', instructions: 'Take as needed for pain' },
  { id: 'p3', patient: 'Bob Johnson', medication: 'Lisinopril', dosage: '10mg', instructions: 'Take once daily' },
  { id: 'p4', patient: 'Diana Prince', medication: 'Metformin', dosage: '500mg', instructions: 'Take with meals' },
  { id: 'p5', patient: 'Eve Adams', medication: 'Atorvastatin', dosage: '20mg', instructions: 'Take once daily at bedtime' },
];

// --- Search Users Component ---
const UserSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Simulate API call to fetch users
    // --- FORGEROCK / PLAIN ID INTEGRATION POINT ---
    // If user data is managed by Forgerock/Plain ID, you might use their SCIM API or custom APIs
    // to search for users. This API call would be authenticated with the access token
    // obtained during login.
    const filtered = DUMMY_USERS.filter(user =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setResults(filtered);
  }, [searchTerm]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Search Users</h3>
      <input
        type="text"
        placeholder="Search by name or email..."
        className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:ring-blue-400 focus:border-blue-400 outline-none"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="overflow-x-auto">
        {results.length > 0 ? (
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Email</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Role</th>
              </tr>
            </thead>
            <tbody>
              {results.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">{user.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{user.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600 text-center py-4">No users found.</p>
        )}
      </div>
    </div>
  );
};

// --- Search Prescriptions Component ---
const PrescriptionSearch = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    // Simulate API call to fetch prescriptions
    // --- FORGEROCK / PLAIN ID INTEGRATION POINT ---
    // This feature would likely call your own backend API.
    // That backend API would then validate the access token from the client
    // (obtained via Forgerock/Plain ID) to ensure the user is authorized to
    // access prescription data. This is crucial for protecting sensitive medical information.
    const filtered = DUMMY_PRESCRIPTIONS.filter(prescription =>
      prescription.patient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prescription.medication.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setResults(filtered);
  }, [searchTerm]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-2xl font-bold text-gray-800 mb-4">Search Prescriptions</h3>
      <input
        type="text"
        placeholder="Search by patient or medication..."
        className="w-full px-4 py-2 border border-gray-300 rounded-md mb-4 focus:ring-blue-400 focus:border-blue-400 outline-none"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="overflow-x-auto">
        {results.length > 0 ? (
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-100 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Patient</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Medication</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Dosage</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Instructions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((prescription) => (
                <tr key={prescription.id} className="border-b border-gray-200 last:border-b-0 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">{prescription.patient}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{prescription.medication}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{prescription.dosage}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">{prescription.instructions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-gray-600 text-center py-4">No prescriptions found.</p>
        )}
      </div>
    </div>
  );
};

// --- Dashboard Page Component ---
const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-inter">
      <header className="flex justify-between items-center py-4 px-6 bg-white shadow-md rounded-lg mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Medical App Dashboard</h1>
        <div className="flex items-center space-x-4">
          {user && (
            <span className="text-lg text-gray-700">Welcome, <span className="font-semibold">{user.username}</span>!</span>
          )}
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-md shadow-md transition duration-300 ease-in-out transform hover:scale-105"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="container mx-auto">
        <UserSearch />
        <PrescriptionSearch />
      </main>
    </div>
  );
};

// --- Main App Component ---
function App() {
  const { user } = useAuth(); // Access user state from AuthContext

  return (
    <div className="App">
      {/*
        The Tailwind CSS CDN and Inter font link are now in public/index.html
        as is standard for React projects, so they are removed from here.
      */}
      <style>
        {`
        body {
          font-family: 'Inter', sans-serif;
        }
        /* Custom styles for consistency if needed */
        .rounded-md {
            border-radius: 0.375rem; /* Equivalent to Tailwind's rounded-md */
        }
        .shadow-md {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .shadow-2xl {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        .transition {
            transition-property: all;
            transition-duration: 150ms;
            transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
        }
        .transform {
            transform: var(--tw-transform);
        }
        .hover\\:scale-105:hover {
            --tw-scale-x: 1.05;
            --tw-scale-y: 1.05;
            transform: var(--tw-transform);
        }
        .focus\\:ring-2:focus {
            box-shadow: var(--tw-ring-inset) 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color);
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        `}
      </style>
      {user ? <DashboardPage /> : <LoginPage />}
    </div>
  );
}

export default App;
