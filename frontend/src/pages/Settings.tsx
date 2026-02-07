import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { User, Bell, Shield, Palette } from 'lucide-react';
import { Button } from '@/components/common/Button';

export const SettingsPage: React.FC = () => {
    return (
        <DashboardLayout>
        <div className= "mb-8" >
        <h1 className="text-2xl font-bold text-gray-900" > Settings </h1>
            < p className = "text-gray-500 mt-1" > Manage your account preferences and application settings.</p>
                </div>

                < div className = "bg-white rounded-xl shadow-sm border border-gray-100 max-w-2xl" >
                    <div className="p-6 border-b border-gray-50" >
                        <h3 className="text-lg font-bold text-gray-900" > My Account </h3>
                            </div>

                            < div className = "p-6 space-y-6" >
                                <div className="flex items-start gap-4" >
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-500" >
                                        <User size={ 20 } />
                                            </div>
                                            < div className = "flex-1" >
                                                <h4 className="text-sm font-medium text-gray-900 mb-1" > Profile Information </h4>
                                                    < p className = "text-sm text-gray-500 mb-3" > Update your photo and personal details.</p>
                                                        < Button size = "sm" variant = "outline" > Update Profile </Button>
                                                            </div>
                                                            </div>

                                                            < div className = "flex items-start gap-4" >
                                                                <div className="p-3 bg-gray-50 rounded-lg text-gray-500" >
                                                                    <Bell size={ 20 } />
                                                                        </div>
                                                                        < div className = "flex-1" >
                                                                            <h4 className="text-sm font-medium text-gray-900 mb-1" > Notifications </h4>
                                                                                < p className = "text-sm text-gray-500 mb-3" > Configure how you receive alerts and updates.</p>
                                                                                    < Button size = "sm" variant = "outline" > Configure </Button>
                                                                                        </div>
                                                                                        </div>

                                                                                        < div className = "flex items-start gap-4" >
                                                                                            <div className="p-3 bg-gray-50 rounded-lg text-gray-500" >
                                                                                                <Shield size={ 20 } />
                                                                                                    </div>
                                                                                                    < div className = "flex-1" >
                                                                                                        <h4 className="text-sm font-medium text-gray-900 mb-1" > Security </h4>
                                                                                                            < p className = "text-sm text-gray-500 mb-3" > Change password and 2FA settings.</p>
                                                                                                                < Button size = "sm" variant = "outline" > Manage Security </Button>
                                                                                                                    </div>
                                                                                                                    </div>
                                                                                                                    </div>
                                                                                                                    </div>
                                                                                                                    </DashboardLayout>
    );
};
