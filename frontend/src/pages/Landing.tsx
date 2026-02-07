import React from 'react';
import { Link } from 'react-router-dom';
import {
    LayoutDashboard,
    Shield,
    CheckCircle2,
    Users,
    Cloud,
    Activity,
    ArrowRight
} from 'lucide-react';
import { Button } from '@/components/common/Button';

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

                                                        </div>
                                                        </main>
                                                        </div>
  );
};
