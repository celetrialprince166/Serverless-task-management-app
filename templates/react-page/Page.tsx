import React from 'react';
import { MainLayout } from '@/components/Layout';

interface { { PageName } }Props {
    // Define props here
}

export const {{ PageName }}: React.FC < {{ PageName }}Props > = (props) => {
    return (
        <MainLayout title= "{{PageTitle}}" >
        <div className="container mx-auto px-4 py-8" >
            <h1 className="text-2xl font-bold mb-6" > {{ PageTitle }
}</h1>

{/* Page Content */ }
<div className="bg-white rounded-lg shadow p-6" >
    <p>Content goes here </p>
        </div>
        </div>
        </MainLayout>
  );
};
