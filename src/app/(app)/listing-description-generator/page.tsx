
import { ListingDescriptionGeneratorForm } from '@/components/listing-description-generator/listing-description-generator-form';
import { PageHeader } from '@/components/page-header';

export default function ListingDescriptionGeneratorPage() {
  return (
    <div>
      <PageHeader
        title="Listing Description Generator"
        description="Generate compelling real estate listing descriptions from property data."
      />
      <ListingDescriptionGeneratorForm />
    </div>
  );
}
