"use client";

import { useState, useEffect } from 'react';
import { Shield, Plus, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Case = {
  id: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
};

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCase, setNewCase] = useState({ title: '', description: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const { data: cases, error } = await supabase
        .from('cases')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(cases || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const createCase = async () => {
    if (!newCase.title.trim()) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('cases')
        .insert([
          {
            title: newCase.title,
            description: newCase.description,
            user_id: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setCases([data, ...cases]);
      setNewCase({ title: '', description: '' });
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating case:', error);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-600 text-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="w-8 h-8" />
            <span className="text-xl font-bold">IoT Log Vault</span>
          </div>
          <Button
            variant="ghost"
            className="text-white hover:text-indigo-200"
            onClick={() => supabase.auth.signOut()}
          >
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">My Cases</h1>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create New Case
            </Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Case</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Enter case title"
                    value={newCase.title}
                    onChange={(e) => setNewCase({ ...newCase, title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    placeholder="Enter case description"
                    value={newCase.description}
                    onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                  />
                </div>
                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                  onClick={createCase}
                  disabled={isCreating}
                >
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Case
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : cases.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500 mb-4">No cases found</p>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Case
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cases.map((case_) => (
              <Card key={case_.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{case_.title}</CardTitle>
                  <CardDescription>
                    Created on {new Date(case_.created_at).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {case_.description || 'No description provided'}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 rounded-full text-sm ${
                      case_.status === 'open'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {case_.status}
                    </span>
                    <Button variant="outline" onClick={() => router.push(`/cases/${case_.id}`)}>
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
