'use client';

import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Link from "next/link";

interface Invitation {
    _id: string;
    email: string;
    role: string;
    status: string;
    createdAt: string;
}

export default function InstructorsPage() {
    const { user } = useUser();
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [invitations, setInvitations] = useState<Invitation[]>([]);

    const fetchInvitations = async () => {
        if (!user) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/invitations/tenant/${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setInvitations(data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (user) {
            fetchInvitations();
        }
    }, [user]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/invitations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    inviterClerkId: user?.id,
                    email,
                    role: 'instructor'
                })
            });

            if (res.ok) {
                setEmail("");
                fetchInvitations();
                alert("Invitation sent!"); // Better UI needed later
            } else {
                alert("Failed to send invitation");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
             <nav className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard" className="text-xl font-bold hover:underline">← Dashboard</Link>
                    <span className="text-slate-400">/</span>
                    <h1 className="text-xl font-bold">Manage Instructors</h1>
                </div>
            </nav>

            <main className="container mx-auto p-8 max-w-4xl">
                <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm mb-8">
                    <h2 className="text-lg font-bold mb-4">Invite New Instructor</h2>
                    <form onSubmit={handleInvite} className="flex gap-4">
                        <input 
                            type="email" 
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="instructor@example.com"
                            className="flex-1 p-2 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                            required
                        />
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? "Sending..." : "Send Invite"}
                        </button>
                    </form>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
                    <h2 className="text-lg font-bold mb-4">Pending & Past Invitations</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-slate-100 dark:border-slate-800">
                                <tr>
                                    <th className="pb-2">Email</th>
                                    <th className="pb-2">Status</th>
                                    <th className="pb-2">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invitations.map((inv) => (
                                    <tr key={inv._id} className="border-b border-slate-50 dark:border-slate-900 last:border-0">
                                        <td className="py-3">{inv.email}</td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                inv.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {inv.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-3 text-slate-500 text-sm">
                                            {new Date(inv.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {invitations.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-4 text-center text-slate-500">No invitations found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
