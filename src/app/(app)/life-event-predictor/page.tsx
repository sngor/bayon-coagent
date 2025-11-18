
import { LifeEventPredictorForm } from '@/components/life-event-predictor/life-event-predictor-form';
import { PageHeader } from '@/components/page-header';

export default function LifeEventPredictorPage() {
  return (
    <div>
      <PageHeader
        title="Life Event Predictor"
        description="Analyze client data to predict their likelihood of moving."
      />
      <LifeEventPredictorForm />
    </div>
  );
}
