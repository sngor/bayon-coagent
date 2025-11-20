
import { InvestmentOpportunityIdentificationForm } from '@/components/investment-opportunity-identification/investment-opportunity-identification-form';
import { PageHeader } from '@/components/page-header';

export default function InvestmentOpportunityIdentificationPage() {
  return (
    <div>
      <PageHeader
        title="Investment Opportunity Identification"
        description="Identify potential investment properties for your clients."
      />
      <InvestmentOpportunityIdentificationForm />
    </div>
  );
}
