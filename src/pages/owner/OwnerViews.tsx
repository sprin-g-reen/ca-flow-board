import React from 'react';
import { ViewsPageNew } from '@/components/views/ViewsPageNew';

const OwnerViews: React.FC = () => {
  return (
    <div className="p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Views</h1>
        <p className="text-muted-foreground">Build, save, and share viewpoints across clients, tasks, and invoices.</p>
      </div>
      <ViewsPageNew />
    </div>
  );
};

export default OwnerViews;
