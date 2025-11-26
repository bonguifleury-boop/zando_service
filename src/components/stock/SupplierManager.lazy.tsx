import React, { lazy, Suspense } from 'react';

const SupplierManager = lazy(() => import('./SupplierManager'));

export default (props: any) => (
  <Suspense fallback={<div>Chargement...</div>}>
    <SupplierManager {...props} />
  </Suspense>
);
