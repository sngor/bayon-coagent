
import { ListingDescriptionGeneratorForm } from '@/components/listing-description-generator/listing-description-generator-form';
import { StandardPageLayout } from '@/components/standard';

export default function ListingDescriptionGeneratorPage() {
  return (
    <StandardPageLayout
      spacing="default"
    >
      <ListingDescriptionGeneratorForm />
    </StandardPageLayout>
  );
}
