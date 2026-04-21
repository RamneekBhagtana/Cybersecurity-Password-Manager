import Generator from "../components/Generator";
import { Link } from "react-router-dom";

export default function GeneratorPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">Secure Generator</h1>
        <p className="text-gray-500">Create strong passwords or passphrases instantly.</p>
      </div>
      
      <Generator />
      
      <Link to="/dashboard" className="mt-8 text-sm font-medium text-[var(--primary)] hover:underline">
        ← Back to Dashboard
      </Link>
    </div>
  );
}