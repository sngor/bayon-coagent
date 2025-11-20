
import { ListingDescriptionGeneratorForm } from '@/components/listing-description-generator/listing-description-generator-form';
import { StandardPageLayout } from '@/components/standard';

export default function ListingDescriptionGeneratorPage() {
  return (
    <StandardPageLayout
      title="Listing Description Generator"
      description="Generate compelling real estate listing descriptions from property data."
      spacing="default"
    >
      <ListingDescriptionGeneratorForm />
    </StandardPageLayout>
  );
}
