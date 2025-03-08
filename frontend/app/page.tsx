"use client";

import { Shield, FileText, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen">
      <nav className="bg-indigo-600 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {/* <Shield className="w-8 h-8" /> */}
            <div className="flex items-center justify-center">
              <img src="/cidecode_logo.png" alt="Logo" className="h-10" />
            </div>
            <span className="text-xl font-bold">IoT Log Vault</span>
          </div>
          <div className="space-x-4">
            <Link href="/login" className="hover:text-indigo-200">
              Login
            </Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">
            Secure IoT Log Management System
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A trusted platform for law enforcement and investigators to store,
            access, and analyze encrypted IoT device logs.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-indigo-600 mb-4">
              <Shield className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Secure Storage</h3>
            <p className="text-gray-600">
              All logs are encrypted and securely stored with military-grade
              encryption.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-indigo-600 mb-4">
              <FileText className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Raw Log Access</h3>
            <p className="text-gray-600">
              Access and analyze raw log data with advanced search capabilities.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="text-indigo-600 mb-4">
              <BarChart3 className="w-12 h-12" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Visual Dashboard</h3>
            <p className="text-gray-600">
              Visualize log data through interactive charts and graphs.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
