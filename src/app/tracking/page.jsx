import { Suspense } from 'react';
import TrackingPage from '../../views/TrackingPage';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TrackingPage />
    </Suspense>
  );
}
