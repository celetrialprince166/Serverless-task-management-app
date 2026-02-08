import React from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Shield,
    CheckCircle2,
    Users,
    Cloud,
    Activity,
    ArrowRight,
    Server,
    Database,
    Lock,
    Zap
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import diagramImg from '@/assets/diagram.png';

export const LandingPage: React.FC = () => {
    return (
        <div className= "min-h-screen bg-gray-50 flex flex-col" >
        {/* Navbar / Header - Minimal */ }
        < header className = "py-6 px-4 md:px-8 flex justify-center" >
            <div className="flex items-center gap-2 text-primary-600" >
                <LayoutDashboard size={ 24 } />
                    < span className = "text-xl font-bold text-gray-900" > TaskFlow </span>
                        </div>
                        </header>

                        < main className = "flex-grow flex flex-col items-center justify-center px-4 md:px-8 py-12 md:py-20" >
                            <div className="max-w-4xl mx-auto text-center space-y-8" >

                                {/* Badge */ }
                                < div className = "inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-4 py-1.5 rounded-full text-sm font-medium border border-orange-100 mb-4 animate-fade-in" >
                                    <Shield size={ 14 } />
                                        < span > Enterprise - Grade Security </span>
                                            </div>

    {/* Hero Headline */ }
    <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-gray-900 leading-tight" >
        Serverless Task < br />
            <span className="text-primary-600" > Management </span>
                </h1>

    {/* Subheadline */ }
    <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed" >
        Streamline your team's workflow with a production-grade serverless solution. 
            Built on AWS with enterprise security and scalability.
          </p>

    {/* CTA Buttons */ }
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4" >
        <Link to="/login" >
            <Button size="lg" className = "min-w-[180px] gap-2" >
                Get Started < ArrowRight size = { 18} />
                    </Button>
                    </Link>
                    < Button variant = "outline" size = "lg" className = "min-w-[180px]" >
                        View Demo
                            </Button>
                            </div>

    {/* Feature Checks */ }
    <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-12 text-sm text-gray-600" >
    {
        [
        "AWS Cognito Authentication",
        "Role-Based Access Control",
        "Real-time Notifications",
        "Serverless Architecture"
        ].map((feature) => (
            <div key= { feature } className = "flex items-center gap-2" >
            <CheckCircle2 size={ 16} className = "text-green-500" />
            <span>{ feature } </span>
            </div>
        ))
    }
        </div>

    {/* Stats / Trust Grid */ }
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-16 pt-16 border-t border-gray-200 mt-16" >
        <div className="flex flex-col items-center gap-2" >
            <h3 className="text-3xl font-bold text-gray-900" > 99.9 % </h3>
                < div className = "flex items-center gap-1.5 text-gray-500 text-sm" >
                    <Activity size={ 16 } />
                        < span > Uptime SLA </span>
                            </div>
                            </div>
                            < div className = "flex flex-col items-center gap-2" >
                                <Users size={ 32 } className = "text-primary-500 mb-1" />
                                    <span className="text-gray-500 text-sm" > Team Collaboration </span>
                                        </div>
                                        < div className = "flex flex-col items-center gap-2" >
                                            <div className="flex flex-col items-center" >
                                                <h3 className="text-2xl font-bold text-gray-900" > AWS </h3>
                                                    < span className = "text-xs font-semibold text-gray-900" > Cloud Native </span>
                                                        </div>
                                                        </div>
                                                        </div>

    {/* Architecture Diagram Section */ }
    <section className="w-full max-w-6xl mx-auto pt-20 md:pt-28 scroll-mt-8" id="architecture">
        <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                System Architecture
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
                A serverless, event-driven design built entirely on AWS. Every component scales automatically and pays only for what you use.
            </p>
        </div>

        <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-2xl ring-1 ring-gray-200/60 bg-white p-4 md:p-6">
                <img
                    src={diagramImg}
                    alt="Serverless Task Management System - AWS Architecture"
                    className="w-full h-auto object-contain rounded-lg"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                <div className="flex gap-4 p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Cloud className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Frontend & CDN</h3>
                        <p className="text-sm text-gray-600 mt-1">React + Vite hosted on Amplify with CloudFront for global, low-latency delivery.</p>
                    </div>
                </div>
                <div className="flex gap-4 p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Server className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Compute & API</h3>
                        <p className="text-sm text-gray-600 mt-1">15+ Lambda functions behind API Gateway. JWT auth via Cognito.</p>
                    </div>
                </div>
                <div className="flex gap-4 p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Database className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Data Layer</h3>
                        <p className="text-sm text-gray-600 mt-1">DynamoDB single-table design. Tasks, users, assignments—encrypted at rest.</p>
                    </div>
                </div>
                <div className="flex gap-4 p-5 rounded-xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                        <Zap className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Event-Driven</h3>
                        <p className="text-sm text-gray-600 mt-1">DynamoDB Streams → SNS → SES. Real-time email notifications on task events.</p>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 text-primary-700 text-sm font-medium border border-primary-100">
                    <Lock size={14} />
                    RBAC · Admin & Member roles
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                    Terraform · 100% IaC
                </span>
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 text-gray-700 text-sm font-medium">
                    CI/CD · GitHub Actions + Amplify
                </span>
            </div>
        </div>
    </section>

                                                        </div>
                                                        </main>
                                                        </div>
  );
};
